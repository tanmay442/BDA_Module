const PDFDocument = require('pdfkit');
const Quotation = require('./quotation.model');
const Lead = require('../leads/lead.model');
const AuditLog = require('../auditLogs/auditLog.model');
const Counter = require('../counters/counter.model');
const { broadcast } = require('../../services/pusher');
const asyncHandler = require('../../utils/asyncHandler');
const { isElevated, ownsResource, ensureCanRead, pick } = require('../../utils/permissions');

const QUOTATION_UPDATE_FIELDS = [
  'leadId',
  'items',
  'subtotal',
  'tax',
  'grandTotal',
  'status',
];

const generateQuotationNumber = async () => {
  const year = new Date().getFullYear();
  const counterId = `quotation-${year}`;
  const updated = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  const seq = String(updated.seq).padStart(4, '0');
  return `Q-${year}-${seq}`;
};

const applyQuotationLeadStageEffects = async ({ lead, stage, actorId, isFirstTransitionToStage }) => {
  if (!lead) return null;

  const oldStage = lead.currentStage;
  lead.currentStage = stage;
  await lead.save();

  await AuditLog.create({
    userId: actorId,
    action: 'lead_stage_changed',
    entityType: 'Lead',
    entityId: lead._id,
    oldValue: { currentStage: oldStage },
    newValue: { currentStage: stage },
    source: 'quotation_status',
  });

  if (stage === 'quotation_sent' && isFirstTransitionToStage) {
    await Quotation.updateMany(
      { leadId: lead._id, status: 'draft' },
      { status: 'sent', $inc: { version: 1 } }
    );
  }

  if (stage === 'won' && isFirstTransitionToStage) {
    const Client = require('../clients/client.model');
    await Client.findOneAndUpdate(
      { leadId: lead._id },
      {
        leadId: lead._id,
        companyName: lead.companyName,
        contactPerson: lead.contactPerson,
        email: lead.email,
        phone: lead.phone,
        accountManager: lead.assignedTo,
      },
      { upsert: true }
    );
  }

  broadcast('leads', 'lead:stage_changed', { id: lead._id, stage, oldStage });
  return { oldStage };
};

exports.list = asyncHandler(async (req, res) => {
  const { leadId, status } = req.query;
  const filter = {};

  if (leadId) filter.leadId = leadId;
  if (status) filter.status = status;
  if (req.user.role === 'bda') {
    filter.createdBy = req.user._id;
  }

  const quotations = await Quotation.find(filter)
    .populate('leadId', 'companyName contactPerson')
    .populate('createdBy', 'name email')
    .sort('-createdAt');

  res.json(quotations);
});

exports.getById = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('leadId', 'companyName contactPerson email phone')
    .populate('createdBy', 'name email');

  ensureCanRead(
    req.user,
    quotation ? { ...quotation.toObject(), assignedTo: quotation.createdBy } : null,
    'Quotation'
  );

  res.json(quotation);
});

exports.create = asyncHandler(async (req, res) => {
  const safeBody = pick(req.body || {}, QUOTATION_UPDATE_FIELDS);

  if (req.user.role === 'bda' && safeBody.leadId) {
    const lead = await Lead.findById(safeBody.leadId);
    ensureCanRead(req.user, lead, 'Lead');
  }

  const quotationNumber = await generateQuotationNumber();

  const quotation = await Quotation.create({
    ...safeBody,
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
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await Quotation.findById(req.params.id);

  if (!existing) {
    return res.status(404).json({ message: 'Quotation not found' });
  }

  if (!isElevated(req.user) && !ownsResource(req.user, { ...existing.toObject(), assignedTo: existing.createdBy })) {
    return res.status(403).json({ message: 'Not authorized to edit this quotation' });
  }

  const safeBody = pick(req.body || {}, QUOTATION_UPDATE_FIELDS);
  if (Object.keys(safeBody).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  const statusChanged = safeBody.status && safeBody.status !== existing.status;
  if (statusChanged) {
    safeBody.version = (existing.version || 1) + 1;
  }

  const quotation = await Quotation.findByIdAndUpdate(req.params.id, safeBody, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (statusChanged && (quotation.status === 'sent' || quotation.status === 'accepted')) {
    const lead = await Lead.findById(quotation.leadId);
    if (lead) {
      const targetStage = quotation.status === 'accepted' ? 'won' : 'quotation_sent';
      const isFirstTransitionToStage = lead.currentStage !== targetStage;
      await applyQuotationLeadStageEffects({
        lead,
        stage: targetStage,
        actorId: req.user._id,
        isFirstTransitionToStage,
      });
    }
  }

  broadcast('quotations', 'quotation:updated', { id: quotation._id });
  res.json(quotation);
});

exports.remove = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    return res.status(404).json({ message: 'Quotation not found' });
  }

  if (!isElevated(req.user) && !ownsResource(req.user, { ...quotation.toObject(), assignedTo: quotation.createdBy })) {
    return res.status(403).json({ message: 'Not authorized to delete this quotation' });
  }

  await Quotation.findByIdAndDelete(req.params.id);

  broadcast('quotations', 'quotation:deleted', { id: quotation._id });
  res.json({ message: 'Quotation deleted' });
});

exports.generatePdf = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('leadId', 'companyName contactPerson email phone address')
    .populate('createdBy', 'name');

  if (!quotation) {
    return res.status(404).json({ message: 'Quotation not found' });
  }

  if (!isElevated(req.user) && !ownsResource(req.user, { ...quotation.toObject(), assignedTo: quotation.createdBy })) {
    return res.status(403).json({ message: 'Not authorized to access this quotation' });
  }

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${quotation.quotationNumber}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).text('QUOTATION', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Number: ${quotation.quotationNumber}`);
  doc.text(`Date: ${quotation.createdAt.toLocaleDateString()}`);
  doc.text(`Version: ${quotation.version}`);
  doc.moveDown();

  doc.fontSize(14).text('Client Details');
  doc.fontSize(10);
  doc.text(`Company: ${quotation.leadId?.companyName || 'N/A'}`);
  doc.text(`Contact: ${quotation.leadId?.contactPerson || 'N/A'}`);
  doc.moveDown();

  doc.fontSize(14).text('Items');
  doc.moveDown();

  const tableTop = doc.y;
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Product', 50, tableTop, { width: 150 });
  doc.text('Qty', 210, tableTop, { width: 40, align: 'right' });
  doc.text('Price', 260, tableTop, { width: 70, align: 'right' });
  doc.text('MOQ', 330, tableTop, { width: 50 });
  doc.text('Delivery', 380, tableTop, { width: 60 });
  doc.text('Total', 440, tableTop, { width: 80, align: 'right' });
  doc.moveDown();

  doc.font('Helvetica');
  const PAGE_BOTTOM = doc.page.height - doc.page.margins.bottom;
  const ROW_HEIGHT = 20;
  let y = doc.y;
  for (const item of quotation.items) {
    if (y + ROW_HEIGHT > PAGE_BOTTOM) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    doc.text(item.productName, 50, y, { width: 150 });
    doc.text(String(item.quantity), 210, y, { width: 40, align: 'right' });
    doc.text(`$${item.unitPrice.toFixed(2)}`, 260, y, { width: 70, align: 'right' });
    doc.text(item.moq ? `MOQ: ${item.moq}` : '', 330, y, { width: 50 });
    doc.text(item.deliveryEstimate || '', 380, y, { width: 60 });
    doc.text(`$${item.totalPrice.toFixed(2)}`, 440, y, { width: 80, align: 'right' });
    y += ROW_HEIGHT;
  }

  if (y + 80 > PAGE_BOTTOM) {
    doc.addPage();
    y = doc.page.margins.top;
  }
  doc.y = y;
  doc.moveDown(2);
  doc.text(`Subtotal: $${quotation.subtotal.toFixed(2)}`, { align: 'right' });
  doc.text(`Tax: $${quotation.tax.toFixed(2)}`, { align: 'right' });
  doc.font('Helvetica-Bold');
  doc.text(`Grand Total: $${quotation.grandTotal.toFixed(2)}`, { align: 'right' });

  doc.end();
});
