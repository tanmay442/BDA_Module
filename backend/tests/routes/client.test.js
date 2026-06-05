const mongoose = require('mongoose');
const request = require('supertest');
const { connect, disconnect, clearDatabase } = require('../helpers');
const app = require('../../src/app');
const User = require('../../src/modules/users/user.model');
const Client = require('../../src/modules/clients/client.model');

jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  getAuth: jest.fn(),
}));

const { getAuth } = require('@clerk/express');

describe('Client Routes', () => {
  let user;
  let leadId;

  beforeAll(async () => {
    await connect();
    user = await User.create({
      clerkId: 'clerk_client_route',
      name: 'Client Router',
      email: 'clientroute@example.com',
      role: 'bda',
    });
    leadId = new mongoose.Types.ObjectId();
    getAuth.mockReturnValue({ userId: 'clerk_client_route' });
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await clearDatabase();
    user = await User.create({
      clerkId: 'clerk_client_route',
      name: 'Client Router',
      email: 'clientroute@example.com',
      role: 'bda',
    });
    getAuth.mockReturnValue({ userId: 'clerk_client_route' });
  });

  describe('POST /api/clients', () => {
    it('should create a client as manager', async () => {
      user.role = 'manager';
      await user.save();
      const res = await request(app)
        .post('/api/clients')
        .send({ leadId, companyName: 'Test Client', accountManager: user._id });

      expect(res.status).toBe(201);
      expect(res.body.companyName).toBe('Test Client');
    });

    it('should forbid BDA from creating a client', async () => {
      const res = await request(app)
        .post('/api/clients')
        .send({ leadId, companyName: 'Test Client', accountManager: user._id });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/clients', () => {
    it('should list clients', async () => {
      await Client.create({ leadId, companyName: 'Client A', accountManager: user._id });
      await Client.create({
        leadId: new mongoose.Types.ObjectId(),
        companyName: 'Client B',
        accountManager: user._id,
      });

      const res = await request(app).get('/api/clients');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should get a client by id', async () => {
      const client = await Client.create({ leadId, companyName: 'Find Me', accountManager: user._id });

      const res = await request(app).get(`/api/clients/${client._id}`);

      expect(res.status).toBe(200);
      expect(res.body.companyName).toBe('Find Me');
    });
  });
});
