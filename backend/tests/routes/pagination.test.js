const mongoose = require('mongoose');
const request = require('supertest');
const { connect, disconnect, clearDatabase } = require('../helpers');
const app = require('../../src/app');
const User = require('../../src/modules/users/user.model');
const Lead = require('../../src/modules/leads/lead.model');

jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  getAuth: jest.fn(),
}));

const { getAuth } = require('@clerk/express');

describe('Pagination support across list endpoints', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();
    getAuth.mockReturnValue({ userId: 'clerk_pag' });
    await User.create({ clerkId: 'clerk_pag', name: 'P', email: 'p@x.com', role: 'admin' });
    const docs = Array.from({ length: 25 }, (_, i) => ({
      _id: new mongoose.Types.ObjectId(),
      companyName: `Lead ${i + 1}`,
      contactPerson: `C${i + 1}`,
      email: `l${i + 1}@x.com`,
      currentStage: 'new',
      assignedTo: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId(),
    }));
    await Lead.insertMany(docs);
  });

  test('returns flat array when no page/limit', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(25);
  });

  test('returns wrapped {data, pagination} when page/limit present', async () => {
    const res = await request(app).get('/api/leads?page=2&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    });
  });

  test('clamps limit at max', async () => {
    const res = await request(app).get('/api/leads?page=1&limit=500');
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(200);
  });

  test('falls back to defaults on garbage values', async () => {
    const res = await request(app).get('/api/leads?page=foo&limit=bar');
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(50);
  });

  test('works for tasks/quotations/activities/clients/users', async () => {
    for (const path of ['/tasks', '/quotations', '/activities', '/clients', '/users']) {
      const res = await request(app).get(`/api${path}?page=1&limit=5`);
      if (res.status !== 200) {
        console.error(`Got ${res.status} for /api${path}:`, res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.limit).toBe(5);
    }
  });
});
