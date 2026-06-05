const mongoose = require('mongoose');
const request = require('supertest');
const { connect, disconnect, clearDatabase } = require('../helpers');
const app = require('../../src/app');
const User = require('../../src/modules/users/user.model');
const Lead = require('../../src/modules/leads/lead.model');
const Task = require('../../src/modules/tasks/task.model');
const Quotation = require('../../src/modules/quotations/quotation.model');

jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  getAuth: jest.fn(),
}));

const { getAuth } = require('@clerk/express');

describe('GET /api/users/:id/report', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  test('manager can fetch any BDA report', async () => {
    const mgr = await User.create({ clerkId: 'mgr_r', name: 'Mgr', email: 'mgr@x.com', role: 'manager' });
    const bda = await User.create({ clerkId: 'bda_r', name: 'BDA', email: 'bda@x.com', role: 'bda' });
    await Lead.create({ _id: new mongoose.Types.ObjectId(), companyName: 'L1', contactPerson: 'X', email: 'x@y.com', currentStage: 'won', expectedDealValue: 10000, assignedTo: bda._id, createdBy: mgr._id });
    await Task.create({ title: 'T1', assignedTo: bda._id, createdBy: mgr._id, status: 'completed', priority: 'medium' });
    await Quotation.create({
      _id: new mongoose.Types.ObjectId(),
      quotationNumber: 'Q-9',
      leadId: new mongoose.Types.ObjectId(),
      version: 1,
      items: [{ productName: 'X', quantity: 1, unitPrice: 100, totalPrice: 100 }],
      subtotal: 100,
      grandTotal: 100,
      status: 'draft',
      createdBy: bda._id,
    });

    getAuth.mockReturnValue({ userId: 'mgr_r' });
    const res = await request(app).get(`/api/users/${bda._id}/report`);

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('BDA');
    expect(res.body.totals.leads).toBe(1);
    expect(res.body.totals.won).toBe(1);
    expect(res.body.tasks.completed).toBe(1);
    expect(res.body.quotations.total).toBe(1);
    expect(res.body.pipeline).toHaveLength(6);
  });

  test('BDA can fetch their own report', async () => {
    const bda = await User.create({ clerkId: 'bda_self', name: 'BDA', email: 'bda@x.com', role: 'bda' });
    getAuth.mockReturnValue({ userId: 'bda_self' });
    const res = await request(app).get(`/api/users/${bda._id}/report`);
    expect(res.status).toBe(200);
    expect(res.body.user._id).toBe(String(bda._id));
  });

  test('BDA cannot fetch another user report', async () => {
    const bda1 = await User.create({ clerkId: 'bda_1', name: 'A', email: 'a@x.com', role: 'bda' });
    const bda2 = await User.create({ clerkId: 'bda_2', name: 'B', email: 'b@x.com', role: 'bda' });
    getAuth.mockReturnValue({ userId: 'bda_1' });
    const res = await request(app).get(`/api/users/${bda2._id}/report`);
    expect(res.status).toBe(403);
  });

  test('404 when user does not exist', async () => {
    const mgr = await User.create({ clerkId: 'mgr_x', name: 'Mgr', email: 'mgr@x.com', role: 'manager' });
    const fakeId = new mongoose.Types.ObjectId();
    getAuth.mockReturnValue({ userId: 'mgr_x' });
    const res = await request(app).get(`/api/users/${fakeId}/report`);
    expect(res.status).toBe(404);
  });

  test('400 on invalid id', async () => {
    const mgr = await User.create({ clerkId: 'mgr_y', name: 'Mgr', email: 'mgr@x.com', role: 'manager' });
    getAuth.mockReturnValue({ userId: 'mgr_y' });
    const res = await request(app).get('/api/users/not-an-id/report');
    expect(res.status).toBe(400);
  });
});
