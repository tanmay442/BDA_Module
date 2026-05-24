const PDFDocument = require('pdfkit');
const Quotation = require('./quotation.model');
const Lead = require('../leads/lead.model');
const AuditLog = require('../auditLogs/auditLog.model');
const { broadcast } = require('../../services/pusher');

const generateQuotationNumber = async () => {
  const count = await Quotation.countDocuments();
  const seq = String(count + 1).padStart(4, '0');
  return `Q-${new Date().getFullYear()}-${seq}`;
};

exports.list = async (req, res, next) => {
  try {
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

    res.json(quotation);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const quotationNumber = await generateQuotationNumber();

    const quotation = await Quotation.create({
      ...req.body,
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

    if (req.user.role === 'bda' && existing.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this quotation' });
    }

    if (req.body.status && req.body.status !== existing.status) {
      req.body.version = (existing.version || 1) + 1;
    }

    const quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (quotation.status === 'sent') {
      await Lead.findByIdAndUpdate(quotation.leadId, { currentStage: 'quotation_sent' });
      broadcast('leads', 'lead:stage_changed', { id: quotation.leadId, stage: 'quotation_sent' });
    }

    if (quotation.status === 'accepted') {
      await Lead.findByIdAndUpdate(quotation.leadId, { currentStage: 'won' });
      broadcast('leads', 'lead:stage_changed', { id: quotation.leadId, stage: 'won' });
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

    if (req.user.role === 'bda' && quotation.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this quotation' });
    }

    await Quotation.findByIdAndDelete(req.params.id);

    broadcast('quotations', 'quotation:deleted', { id: quotation._id });
    res.json({ message: 'Quotation deleted' });
  } catch (error) {
    next(error);
  }
};

exports.generatePdf = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('leadId', 'companyName contactPerson email phone address')
      .populate('createdBy', 'name');

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    const doc = new PDFDocument({ margin: 50 });
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
    let y = doc.y;
    for (const item of quotation.items) {
      doc.text(item.productName, 50, y, { width: 150 });
      doc.text(String(item.quantity), 210, y, { width: 40, align: 'right' });
      doc.text(`$${item.unitPrice.toFixed(2)}`, 260, y, { width: 70, align: 'right' });
      doc.text(item.moq ? `MOQ: ${item.moq}` : '', 330, y, { width: 50 });
      doc.text(item.deliveryEstimate || '', 380, y, { width: 60 });
      doc.text(`$${item.totalPrice.toFixed(2)}`, 440, y, { width: 80, align: 'right' });
      y += 20;
    }

    doc.moveDown(2);
    doc.text(`Subtotal: $${quotation.subtotal.toFixed(2)}`, { align: 'right' });
    doc.text(`Tax: $${quotation.tax.toFixed(2)}`, { align: 'right' });
    doc.font('Helvetica-Bold');
    doc.text(`Grand Total: $${quotation.grandTotal.toFixed(2)}`, { align: 'right' });

    doc.end();
  } catch (error) {
    next(error);
  }
};
