const PDFDocument = require('pdfkit');
const Quotation = require('./quotation.model');
const Lead = require('../leads/lead.model');
const AuditLog = require('../auditLogs/auditLog.model');
const { broadcast } = require('../../services/pusher');
const mongoose = require('mongoose');

/**
 * Compare a quotation's createdBy (which may be a populated User doc
 * or a raw ObjectId) against the current user's id. Returns true
 * when the caller's id is the creator.
 */
function isCreator(quotation, user) {
  const cb = quotation.createdBy;
  const cbId = cb && cb._id ? cb._id : cb;
  return String(cbId) === String(user._id);
}


/**
 * Map of (quotation status) -> (lead stage it implies). A quotation
 * becoming 'sent' implies the lead has moved into 'quotation_sent';
 * 'accepted' implies 'won'. We only push the lead forward on
 * forward transitions, never backward — a quotation moving back
 * to 'revised' or 'rejected' doesn't pull the lead stage back.
 */
const STATUS_TO_LEAD_STAGE = {
  sent: 'quotation_sent',
  accepted: 'won',
};

const FORWARD_STATUSES = new Set(['sent', 'accepted']);

/**
 * Generate the next sequential quotation number. We use a counter
 * document so concurrent POSTs don't both pick the same number
 * (the previous countDocuments+1 approach was racy and surfaced
 * as 409s on duplicate key).
 */
async function generateQuotationNumber() {
  const Counter = mongoose.connection.collection('quotation_counters');
  // Year bucket — reset the counter at the start of each year so
  // numbers stay human-readable.
  const year = new Date().getFullYear();
  const _id = `Q-${year}`;
  const result = await Counter.findOneAndUpdate(
    { _id },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  const seq = String(result.seq).padStart(4, '0');
  return `Q-${year}-${seq}`;
}

const QUOTATION_UPDATE_FIELDS = [
  'items',
  'subtotal',
  'tax',
  'grandTotal',
  'status',
  'version',
];

exports.list = async (req, res, next) => {
  try {
    const { leadId, status, page, limit } = req.query;
    const filter = {};

    if (leadId) filter.leadId = leadId;
    if (status) filter.status = status;
    if (req.user.role === 'bda') {
      filter.createdBy = req.user._id;
    }

    // Pagination: clamp limit to [1, 100], default 50.
    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const pg = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pg - 1) * lim;

    const [quotations, total] = await Promise.all([
      Quotation.find(filter)
        .populate('leadId', 'companyName contactPerson')
        .populate('createdBy', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(lim),
      Quotation.countDocuments(filter),
    ]);

    res.set('X-Total-Count', String(total));
    res.json(quotations);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('leadId', 'companyName contactPerson email phone')
      .populate('createdBy', 'name email');

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    // BDA: only the creator can read a single quotation.
    if (
      req.user.role === 'bda'
      && !isCreator(quotation, req.user)
    ) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json(quotation);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    // BDA can only create quotations against leads they own.
    if (req.user.role === 'bda' && req.body.leadId) {
      const lead = await Lead.findById(req.body.leadId).select('assignedTo');
      if (!lead || lead.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to quote this lead' });
      }
    }

    const quotationNumber = await generateQuotationNumber();

    // Strip non-allowlisted fields before persisting.
    const body = { ...req.body };
    delete body.quotationNumber;
    delete body.createdBy;
    delete body.version;

    const quotation = await Quotation.create({
      ...body,
      quotationNumber,
      createdBy: req.user._id,
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'quotation_created',
      entityType: 'Quotation',
      entityId: quotation._id,
      newValue: { quotationNumber, status: quotation.status },
    });

    broadcast('quotations', 'quotation:created', { id: quotation._id });
    res.status(201).json(quotation);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await Quotation.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (
      req.user.role === 'bda'
      && !isCreator(existing, req.user)
    ) {
      return res.status(403).json({ message: 'Not authorized to edit this quotation' });
    }

    // Bump version only on a real status transition. We do not bump on
    // any other field edit, and we do not bump when the status didn't
    // change (e.g. user just edited a line item). This stops
    // "version = write counter" behavior.
    const statusChanged = req.body.status && req.body.status !== existing.status;
    if (statusChanged) {
      req.body.version = (existing.version || 1) + 1;
    }

    // Build an allowlisted update document so callers cannot overwrite
    // leadId, createdBy, quotationNumber, or other immutable fields.
    const update = {};
    for (const field of QUOTATION_UPDATE_FIELDS) {
      if (field in req.body) update[field] = req.body[field];
    }
    if (!statusChanged) delete update.version; // don't touch it on non-status edits

    const quotation = await Quotation.findByIdAndUpdate(req.params.id, update, {
      returnDocument: 'after',
      runValidators: true,
    });

    // Lead-stage cascade. Only fire on a real status change INTO one
    // of the forward statuses, and only if the lead isn't already
    // in the implied stage. This is the single direction of the
    // cascade — lead stage drives quotation display, not the other
    // way around.
    if (statusChanged && FORWARD_STATUSES.has(quotation.status)) {
      const impliedStage = STATUS_TO_LEAD_STAGE[quotation.status];
      const lead = await Lead.findById(quotation.leadId);
      if (lead && lead.currentStage !== impliedStage) {
        const oldStage = lead.currentStage;
        lead.currentStage = impliedStage;
        await lead.save();

        await AuditLog.create({
          userId: req.user._id,
          action: 'lead_stage_synced',
          entityType: 'Lead',
          entityId: lead._id,
          oldValue: { currentStage: oldStage, via: 'quotation' },
          newValue: { currentStage: impliedStage, via: 'quotation', quotationId: quotation._id },
        });

        broadcast('leads', 'lead:stage_changed', { id: lead._id, stage: impliedStage, oldStage });
      }
    }

    broadcast('quotations', 'quotation:updated', { id: quotation._id });
    res.json(quotation);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (
      req.user.role === 'bda'
      && !isCreator(quotation, req.user)
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this quotation' });
    }

    await Quotation.findByIdAndDelete(req.params.id);

    broadcast('quotations', 'quotation:deleted', { id: quotation._id });
    res.json({ message: 'Quotation deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * Sanitize a string for PDF rendering. Trim, cap length, replace
 * characters that PDFKit interprets as markup.
 */
function safePdfString(value, max = 200) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max);
}

exports.generatePdf = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('leadId', 'companyName contactPerson email phone address')
      .populate('createdBy', 'name');

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (
      req.user.role === 'bda'
      && !isCreator(quotation, req.user)
    ) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${quotation.quotationNumber}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text('QUOTATION', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Number: ${safePdfString(quotation.quotationNumber, 50)}`);
    doc.text(`Date: ${quotation.createdAt.toLocaleDateString()}`);
    doc.text(`Version: ${quotation.version}`);
    doc.moveDown();

    doc.fontSize(14).text('Client Details');
    doc.fontSize(10);
    doc.text(`Company: ${safePdfString(quotation.leadId?.companyName, 120)}`);
    doc.text(`Contact: ${safePdfString(quotation.leadId?.contactPerson, 120)}`);
    doc.text(`Email: ${safePdfString(quotation.leadId?.email, 120)}`);
    doc.text(`Phone: ${safePdfString(quotation.leadId?.phone, 60)}`);
    doc.moveDown();

    doc.fontSize(14).text('Items');
    doc.fontSize(10);
    quotation.items.forEach((item, idx) => {
      doc.text(
        `${idx + 1}. ${safePdfString(item.productName, 120)} — `
        + `Qty: ${item.quantity}, Unit: ${item.unitPrice}, Total: ${item.totalPrice}`
      );
    });
    doc.moveDown();

    doc.text(`Subtotal: ${quotation.subtotal}`);
    doc.text(`Tax: ${quotation.tax}`);
    doc.fontSize(12).text(`Grand Total: ${quotation.grandTotal}`, { align: 'right' });

    doc.end();
  } catch (error) {
    next(error);
  }
};
