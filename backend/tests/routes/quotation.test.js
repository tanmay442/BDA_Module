const mongoose = require('mongoose');
const request = require('supertest');
const { connect, disconnect, clearDatabase } = require('../helpers');
const app = require('../../src/app');
const User = require('../../src/modules/users/user.model');
const Quotation = require('../../src/modules/quotations/quotation.model');
const Lead = require('../../src/modules/leads/lead.model');

jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  getAuth: jest.fn(),
}));

const { getAuth } = require('@clerk/express');

describe('Quotation Routes', () => {
  let user;
  let leadId;
  let lead;

  beforeAll(async () => {
    await connect();
    user = await User.create({
      clerkId: 'clerk_quote_route',
      name: 'Quote Router',
      email: 'quoteroute@example.com',
      role: 'bda',
    });
    lead = await Lead.create({ companyName: 'Quote Lead', createdBy: user._id, assignedTo: user._id });
    leadId = lead._id;
    getAuth.mockReturnValue({ userId: 'clerk_quote_route' });
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await clearDatabase();
    user = await User.create({
      clerkId: 'clerk_quote_route',
      name: 'Quote Router',
      email: 'quoteroute@example.com',
      role: 'bda',
    });
    lead = await Lead.create({ companyName: 'Quote Lead', createdBy: user._id, assignedTo: user._id });
    leadId = lead._id;
    getAuth.mockReturnValue({ userId: 'clerk_quote_route' });
  });

  const validQuote = () => ({
    leadId,
    items: [{ productName: 'Widget', quantity: 2, unitPrice: 100, totalPrice: 200 }],
    subtotal: 200,
    tax: 18,
    grandTotal: 218,
  });

  describe('POST /api/quotations', () => {
    it('should create a quotation with auto-generated number', async () => {
      const res = await request(app)
        .post('/api/quotations')
        .send(validQuote());

      expect(res.status).toBe(201);
      expect(res.body.quotationNumber).toMatch(/^Q-\d{4}-\d{4}$/);
      expect(res.body.grandTotal).toBe(218);
      expect(res.body.status).toBe('draft');
    });

    it('should require leadId', async () => {
      const data = validQuote();
      delete data.leadId;
      const res = await request(app).post('/api/quotations').send(data);
      expect(res.status).toBe(400);
    });

    it('should require at least one item', async () => {
      const res = await request(app)
        .post('/api/quotations')
        .send({ ...validQuote(), items: [] });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/quotations', () => {
    it('should list quotations', async () => {
      await Quotation.create({
        ...validQuote(),
        quotationNumber: 'Q-2026-0001',
        createdBy: user._id,
      });
      await Quotation.create({
        ...validQuote(),
        quotationNumber: 'Q-2026-0002',
        createdBy: user._id,
      });

      const res = await request(app).get('/api/quotations');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter by leadId', async () => {
      const otherLead = new mongoose.Types.ObjectId();
      await Quotation.create({
        ...validQuote(),
        quotationNumber: 'Q-2026-0003',
        createdBy: user._id,
        leadId,
      });
      await Quotation.create({
        ...validQuote(),
        quotationNumber: 'Q-2026-0004',
        createdBy: user._id,
        leadId: otherLead,
      });

      const res = await request(app).get(`/api/quotations?leadId=${leadId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('GET /api/quotations/:id', () => {
    it('should get a quotation by id', async () => {
      const q = await Quotation.create({
        ...validQuote(),
        quotationNumber: 'Q-2026-0005',
        createdBy: user._id,
      });

      const res = await request(app).get(`/api/quotations/${q._id}`);

      expect(res.status).toBe(200);
      expect(res.body.quotationNumber).toBe('Q-2026-0005');
    });
  });

  describe('PATCH /api/quotations/:id', () => {
    it('should update a quotation', async () => {
      const q = await Quotation.create({
        ...validQuote(),
        quotationNumber: 'Q-2026-0006',
        createdBy: user._id,
      });

      const res = await request(app)
        .patch(`/api/quotations/${q._id}`)
        .send({ grandTotal: 300 });

      expect(res.status).toBe(200);
      expect(res.body.grandTotal).toBe(300);
    });

    it('should bump version on status change', async () => {
      const q = await Quotation.create({
        ...validQuote(),
        quotationNumber: 'Q-2026-0007',
        createdBy: user._id,
      });

      const res = await request(app)
        .patch(`/api/quotations/${q._id}`)
        .send({ status: 'sent' });

      expect(res.status).toBe(200);
      expect(res.body.version).toBe(2);
    });
  });

  describe('DELETE /api/quotations/:id', () => {
    it('should delete a quotation', async () => {
      const q = await Quotation.create({
        ...validQuote(),
        quotationNumber: 'Q-2026-0008',
        createdBy: user._id,
      });

      const res = await request(app).delete(`/api/quotations/${q._id}`);

      expect(res.status).toBe(200);
      expect(await Quotation.findById(q._id)).toBeNull();
    });
  });

  describe('GET /api/quotations/:id/pdf', () => {
    it('should generate a PDF', async () => {
      const q = await Quotation.create({
        ...validQuote(),
        quotationNumber: 'Q-2026-0009',
        createdBy: user._id,
      });

      const res = await request(app).get(`/api/quotations/${q._id}/pdf`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('Quotation ↔ Lead stage cascade', () => {
    it('PATCH status:sent should auto-push the lead into quotation_sent', async () => {
      const leadInReq = await Lead.create({
        companyName: 'Cascade Lead',
        createdBy: user._id,
        assignedTo: user._id,
        currentStage: 'requirement_gathered',
      });
      const q = await Quotation.create({
        leadId: leadInReq._id,
        items: [{ productName: 'X', quantity: 1, unitPrice: 100, totalPrice: 100 }],
        subtotal: 100, tax: 0, grandTotal: 100,
        quotationNumber: 'Q-CASCADE-0001',
        createdBy: user._id,
      });
      const res = await request(app)
        .patch(`/api/quotations/${q._id}`)
        .send({ status: 'sent' });
      expect(res.status).toBe(200);
      const updatedLead = await mongoose.model('Lead').findById(leadInReq._id);
      expect(updatedLead.currentStage).toBe('quotation_sent');
    });

    it('PATCH status:accepted should auto-push the lead into won', async () => {
      const wonLead = await Lead.create({
        companyName: 'Won Lead',
        createdBy: user._id,
        assignedTo: user._id,
        currentStage: 'negotiation',
      });
      const q = await Quotation.create({
        leadId: wonLead._id,
        items: [{ productName: 'Y', quantity: 1, unitPrice: 200, totalPrice: 200 }],
        subtotal: 200, tax: 0, grandTotal: 200,
        quotationNumber: 'Q-WON-0001',
        createdBy: user._id,
      });
      const res = await request(app)
        .patch(`/api/quotations/${q._id}`)
        .send({ status: 'accepted' });
      expect(res.status).toBe(200);
      const updatedLead = await mongoose.model('Lead').findById(wonLead._id);
      expect(updatedLead.currentStage).toBe('won');
    });

    it('PATCH on a non-status field should NOT bump the version', async () => {
      const q = await Quotation.create({
        leadId: lead._id,
        items: [{ productName: 'Z', quantity: 1, unitPrice: 50, totalPrice: 50 }],
        subtotal: 50, tax: 0, grandTotal: 50,
        quotationNumber: 'Q-VERSION-0001',
        createdBy: user._id,
        version: 1,
      });
      const res = await request(app)
        .patch(`/api/quotations/${q._id}`)
        .send({ grandTotal: 75 });
      expect(res.status).toBe(200);
      expect(res.body.version).toBe(1);
    });

    it('BDA cannot read a quotation they did not create', async () => {
      // Owner is the test user (clerk_quote_route); the requester
      // is a different BDA (clerk_other_quote), so the controller
      // must 404.
      const otherLead = await Lead.create({
        companyName: 'Other Lead',
        createdBy: user._id,
        assignedTo: user._id,
      });
      const q = await Quotation.create({
        leadId: otherLead._id,
        items: [{ productName: 'S', quantity: 1, unitPrice: 10, totalPrice: 10 }],
        subtotal: 10, tax: 0, grandTotal: 10,
        quotationNumber: 'Q-OTHER-0001',
        createdBy: user._id,
      });
      const otherUser = await User.create({
        clerkId: 'clerk_other_quote',
        name: 'Other Quote',
        email: 'otherquote@example.com',
        role: 'bda',
      });
      getAuth.mockReturnValue({ userId: 'clerk_other_quote' });
      const res = await request(app).get(`/api/quotations/${q._id}`);
      expect(res.status).toBe(404);
      getAuth.mockReturnValue({ userId: 'clerk_quote_route' });
    });
  });
});
