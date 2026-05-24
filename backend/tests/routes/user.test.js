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

describe('User Routes', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe('GET /api/users', () => {
    it('should allow admin to list users', async () => {
      const admin = await User.create({
        clerkId: 'clerk_admin_user',
        name: 'Admin User',
        email: 'adminuser@example.com',
        role: 'admin',
      });
      getAuth.mockReturnValue({ userId: 'clerk_admin_user' });

      await User.create({ clerkId: 'u1', name: 'User 1', email: 'u1@example.com' });

      const res = await request(app).get('/api/users');

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should forbid BDA from listing users', async () => {
      const bda = await User.create({
        clerkId: 'clerk_bda_user',
        name: 'BDA User',
        email: 'bdauser@example.com',
        role: 'bda',
      });
      getAuth.mockReturnValue({ userId: 'clerk_bda_user' });

      const res = await request(app).get('/api/users');

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get a user by id for admin', async () => {
      const admin = await User.create({
        clerkId: 'clerk_admin_get',
        name: 'Admin Get',
        email: 'adminget@example.com',
        role: 'admin',
      });
      getAuth.mockReturnValue({ userId: 'clerk_admin_get' });

      const res = await request(app).get(`/api/users/${admin._id}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Admin Get');
    });
  });

  describe('PATCH /api/users/:id/role', () => {
    it('should allow admin to change role', async () => {
      const admin = await User.create({
        clerkId: 'clerk_admin_role',
        name: 'Admin Role',
        email: 'adminrole@example.com',
        role: 'admin',
      });
      getAuth.mockReturnValue({ userId: 'clerk_admin_role' });

      const target = await User.create({
        clerkId: 'clerk_target',
        name: 'Target',
        email: 'target@example.com',
        role: 'bda',
      });

      const res = await request(app)
        .patch(`/api/users/${target._id}/role`)
        .send({ role: 'manager' });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('manager');
    });

    it('should forbid manager from changing roles', async () => {
      const mgr = await User.create({
        clerkId: 'clerk_mgr_role',
        name: 'Mgr Role',
        email: 'mgrrole@example.com',
        role: 'manager',
      });
      getAuth.mockReturnValue({ userId: 'clerk_mgr_role' });

      const res = await request(app)
        .patch(`/api/users/${mgr._id}/role`)
        .send({ role: 'admin' });

      expect(res.status).toBe(403);
    });
  });
});
