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

describe('Lead Routes', () => {
  let user;
  let authUser;

  beforeAll(async () => {
    await connect();
    authUser = await User.create({
      clerkId: 'clerk_lead_route',
      name: 'Lead Router',
      email: 'leadroute@example.com',
      role: 'bda',
    });
    getAuth.mockReturnValue({ userId: 'clerk_lead_route' });
    user = authUser;
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await clearDatabase();
    authUser = await User.create({
      clerkId: 'clerk_lead_route',
      name: 'Lead Router',
      email: 'leadroute@example.com',
      role: 'bda',
    });
    user = authUser;
    getAuth.mockReturnValue({ userId: 'clerk_lead_route' });
  });

  describe('POST /api/leads', () => {
    it('should create a lead', async () => {
      const res = await request(app)
        .post('/api/leads')
        .send({ companyName: 'New Corp' });

      expect(res.status).toBe(201);
      expect(res.body.companyName).toBe('New Corp');
    });

    it('should require companyName', async () => {
      const res = await request(app)
        .post('/api/leads')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/leads', () => {
    it('should list leads assigned to BDA', async () => {
      await Lead.create({ companyName: 'Co A', createdBy: user._id, assignedTo: user._id });
      await Lead.create({ companyName: 'Co B', createdBy: user._id, assignedTo: user._id });

      const res = await request(app).get('/api/leads');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter by stage', async () => {
      await Lead.create({ companyName: 'New Co', createdBy: user._id, assignedTo: user._id });
      await Lead.create({
        companyName: 'Contacted Co',
        currentStage: 'contacted',
        createdBy: user._id,
        assignedTo: user._id,
      });

      const res = await request(app).get('/api/leads?stage=contacted');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].companyName).toBe('Contacted Co');
    });

    it('should restrict BDA to assigned leads', async () => {
      const otherUser = await User.create({
        clerkId: 'clerk_other',
        name: 'Other',
        email: 'other@example.com',
        role: 'bda',
      });
      await Lead.create({ companyName: 'Mine', createdBy: user._id, assignedTo: user._id });
      await Lead.create({ companyName: 'Not Mine', createdBy: otherUser._id, assignedTo: otherUser._id });

      const res = await request(app).get('/api/leads');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].companyName).toBe('Mine');
    });
  });

  describe('GET /api/leads/:id', () => {
    it('should get a lead by id', async () => {
      const lead = await Lead.create({ companyName: 'Specific Co', createdBy: user._id, assignedTo: user._id });

      const res = await request(app).get(`/api/leads/${lead._id}`);

      expect(res.status).toBe(200);
      expect(res.body.companyName).toBe('Specific Co');
    });

    it('should return 404 for unknown id', async () => {
      const res = await request(app).get(`/api/leads/${new mongoose.Types.ObjectId()}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/leads/:id', () => {
    it('should update a lead', async () => {
      const lead = await Lead.create({ companyName: 'Old Name', createdBy: user._id, assignedTo: user._id });

      const res = await request(app)
        .patch(`/api/leads/${lead._id}`)
        .send({ companyName: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.companyName).toBe('New Name');
    });

    it('should return 404 for unknown id', async () => {
      const res = await request(app)
        .patch(`/api/leads/${new mongoose.Types.ObjectId()}`)
        .send({ companyName: 'Nope' });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/leads/:id/stage', () => {
    it('should transition a lead stage', async () => {
      const lead = await Lead.create({ companyName: 'Stage Co', createdBy: user._id, assignedTo: user._id });

      const res = await request(app)
        .patch(`/api/leads/${lead._id}/stage`)
        .send({ stage: 'contacted' });

      expect(res.status).toBe(200);
      expect(res.body.currentStage).toBe('contacted');
    });

    it('should require stage in body', async () => {
      const lead = await Lead.create({ companyName: 'No Stage', createdBy: user._id, assignedTo: user._id });

      const res = await request(app)
        .patch(`/api/leads/${lead._id}/stage`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject invalid stage', async () => {
      const lead = await Lead.create({ companyName: 'Bad Stage', createdBy: user._id, assignedTo: user._id });

      const res = await request(app)
        .patch(`/api/leads/${lead._id}/stage`)
        .send({ stage: 'invalid' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/leads/:id', () => {
    it('should forbid BDA from deleting', async () => {
      const lead = await Lead.create({ companyName: 'Delete Co', createdBy: user._id, assignedTo: user._id });

      const res = await request(app).delete(`/api/leads/${lead._id}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to delete', async () => {
      const admin = await User.create({
        clerkId: 'clerk_admin',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
      });
      getAuth.mockReturnValue({ userId: 'clerk_admin' });

      const lead = await Lead.create({ companyName: 'Admin Delete', createdBy: admin._id, assignedTo: admin._id });

      const res = await request(app).delete(`/api/leads/${lead._id}`);

      expect(res.status).toBe(200);
    });
  });
});
