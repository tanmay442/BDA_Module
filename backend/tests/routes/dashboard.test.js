const mongoose = require('mongoose');
const request = require('supertest');
const { connect, disconnect, clearDatabase } = require('../helpers');
const app = require('../../src/app');
const User = require('../../src/modules/users/user.model');
const Lead = require('../../src/modules/leads/lead.model');
const Quotation = require('../../src/modules/quotations/quotation.model');

jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  getAuth: jest.fn(),
}));

const { getAuth } = require('@clerk/express');

const seedUsers = async () => {
  await User.create({ clerkId: 'clerk_dash_bda', name: 'Dash BDA', email: 'dashbda@example.com', role: 'bda' });
  await User.create({ clerkId: 'clerk_dash_mgr', name: 'Dash Manager', email: 'dashmgr@example.com', role: 'manager' });
};

const fetchUserIds = async () => {
  const bda = await User.findOne({ clerkId: 'clerk_dash_bda' });
  const mgr = await User.findOne({ clerkId: 'clerk_dash_mgr' });
  return { bdaId: bda._id, mgrId: mgr._id };
};

describe('GET /api/dashboard/summary', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
    await seedUsers();
  });

  test('returns aggregated data for a manager', async () => {
    getAuth.mockReturnValue({ userId: 'clerk_dash_mgr' });
    const { bdaId, mgrId } = await fetchUserIds();
    const leadId1 = new mongoose.Types.ObjectId();
    const leadId2 = new mongoose.Types.ObjectId();
    await Lead.create({ _id: leadId1, companyName: 'Acme', contactPerson: 'Bob', email: 'bob@x.com', currentStage: 'negotiation', expectedDealValue: 100000, assignedTo: bdaId, createdBy: mgrId });
    await Lead.create({ _id: leadId2, companyName: 'Beta', contactPerson: 'Eve', email: 'eve@y.com', currentStage: 'won', expectedDealValue: 50000, assignedTo: bdaId, createdBy: mgrId, createdAt: new Date() });
    await Quotation.create({
      _id: new mongoose.Types.ObjectId(),
      quotationNumber: 'Q-1',
      leadId: leadId1,
      version: 1,
      items: [{ productName: 'Item', quantity: 1, unitPrice: 1000, totalPrice: 1000 }],
      subtotal: 1000,
      grandTotal: 1000,
      total: 1000,
      status: 'draft',
      createdBy: mgrId,
    });

    const res = await request(app).get('/api/dashboard/summary');

    expect(res.status).toBe(200);
    expect(res.body.isManager).toBe(true);
    expect(res.body.totals.totalLeads).toBe(2);
    expect(res.body.totals.wonCount).toBe(1);
    expect(res.body.quotation.pendingApprovals).toBe(1);
    expect(res.body.leaderboard.length).toBeGreaterThan(0);
    expect(res.body.hotLeads.length).toBe(1);
    expect(res.body.recentWins.length).toBe(1);
  });

  test('scopes data to assigned leads for a BDA', async () => {
    getAuth.mockReturnValue({ userId: 'clerk_dash_bda' });
    const { bdaId, mgrId } = await fetchUserIds();
    const myLead = new mongoose.Types.ObjectId();
    const theirLead = new mongoose.Types.ObjectId();
    await Lead.create({ _id: myLead, companyName: 'Mine', contactPerson: 'A', email: 'a@x.com', currentStage: 'contacted', assignedTo: bdaId, createdBy: mgrId });
    await Lead.create({ _id: theirLead, companyName: 'Theirs', contactPerson: 'B', email: 'b@y.com', currentStage: 'contacted', assignedTo: mgrId, createdBy: mgrId });

    const res = await request(app).get('/api/dashboard/summary');

    expect(res.status).toBe(200);
    expect(res.body.isManager).toBe(false);
    expect(res.body.totals.totalLeads).toBe(1);
    expect(res.body.leaderboard).toEqual([]);
  });

  test('returns 401 without auth', async () => {
    getAuth.mockReturnValue({ userId: null });
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(401);
  });
});
