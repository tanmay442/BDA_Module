const mongoose = require('mongoose');
const request = require('supertest');
const { connect, disconnect, clearDatabase } = require('../helpers');
const app = require('../../src/app');
const User = require('../../src/modules/users/user.model');
const Activity = require('../../src/modules/activities/activity.model');
const Lead = require('../../src/modules/leads/lead.model');

jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  getAuth: jest.fn(),
}));

const { getAuth } = require('@clerk/express');

describe('Activity Routes', () => {
  let user;
  let leadId;
  let lead;

  beforeAll(async () => {
    await connect();
    user = await User.create({
      clerkId: 'clerk_act_route',
      name: 'Act Router',
      email: 'actroute@example.com',
      role: 'bda',
    });
    lead = await Lead.create({ companyName: 'Act Lead', createdBy: user._id, assignedTo: user._id });
    leadId = lead._id;
    getAuth.mockReturnValue({ userId: 'clerk_act_route' });
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await clearDatabase();
    user = await User.create({
      clerkId: 'clerk_act_route',
      name: 'Act Router',
      email: 'actroute@example.com',
      role: 'bda',
    });
    lead = await Lead.create({ companyName: 'Act Lead', createdBy: user._id, assignedTo: user._id });
    leadId = lead._id;
    getAuth.mockReturnValue({ userId: 'clerk_act_route' });
  });

  describe('POST /api/activities', () => {
    it('should create an activity', async () => {
      const res = await request(app)
        .post('/api/activities')
        .send({ leadId, type: 'note', message: 'Called client' });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('note');
      expect(res.body.message).toBe('Called client');
    });

    it('should require leadId', async () => {
      const res = await request(app)
        .post('/api/activities')
        .send({ type: 'note', message: 'test' });
      expect(res.status).toBe(400);
    });

    it('should require type', async () => {
      const res = await request(app)
        .post('/api/activities')
        .send({ leadId, message: 'test' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/activities', () => {
    it('should list activities for a lead', async () => {
      await Activity.create({ leadId, userId: user._id, type: 'call', message: 'Call 1' });
      await Activity.create({ leadId, userId: user._id, type: 'note', message: 'Note 1' });

      const res = await request(app).get(`/api/activities?leadId=${leadId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should return empty array for lead with no activities', async () => {
      const res = await request(app).get(`/api/activities?leadId=${new mongoose.Types.ObjectId()}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
