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
});
