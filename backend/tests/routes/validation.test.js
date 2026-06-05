const mongoose = require('mongoose');
const request = require('supertest');
const { connect, disconnect, clearDatabase } = require('../helpers');
const app = require('../../src/app');
const User = require('../../src/modules/users/user.model');

jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  getAuth: jest.fn(),
}));

const { getAuth } = require('@clerk/express');

describe('Zod DTO validation', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
    getAuth.mockReturnValue({ userId: 'clerk_val' });
    await User.create({ clerkId: 'clerk_val', name: 'V', email: 'v@x.com', role: 'admin' });
  });

  test('rejects lead create with missing companyName', async () => {
    const res = await request(app).post('/api/leads').send({ contactPerson: 'X' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors.some((e) => e.path === 'companyName')).toBe(true);
  });

  test('rejects unknown fields (strict mode)', async () => {
    const res = await request(app)
      .post('/api/leads')
      .send({ companyName: 'Acme', evilField: 'injection' });
    expect(res.status).toBe(400);
  });

  test('rejects invalid stage enum', async () => {
    const leadId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/leads/${leadId}/stage`)
      .send({ stage: 'invalid_stage' });
    expect(res.status).toBe(400);
  });

  test('rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/leads')
      .send({ companyName: 'Acme', email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  test('rejects task with no title', async () => {
    const res = await request(app).post('/api/tasks').send({ description: 'X' });
    expect(res.status).toBe(400);
  });

  test('rejects quotation with empty items', async () => {
    const res = await request(app)
      .post('/api/quotations')
      .send({ items: [], subtotal: 0, grandTotal: 0 });
    expect(res.status).toBe(400);
  });

  test('accepts well-formed lead create', async () => {
    const res = await request(app)
      .post('/api/leads')
      .send({ companyName: 'Acme', expectedDealValue: 100 });
    expect(res.status).toBe(201);
    expect(res.body.companyName).toBe('Acme');
  });

  test('rejects onboarding without company', async () => {
    const res = await request(app)
      .patch('/api/users/me/onboard')
      .send({ role: 'bda' });
    expect(res.status).toBe(400);
  });

  test('rejects onboarding with invalid role', async () => {
    const res = await request(app)
      .patch('/api/users/me/onboard')
      .send({ role: 'admin', company: 'X' });
    expect(res.status).toBe(400);
  });

  test('rejects role update with invalid role', async () => {
    const targetId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/users/${targetId}/role`)
      .send({ role: 'superadmin' });
    expect(res.status).toBe(400);
  });
});
