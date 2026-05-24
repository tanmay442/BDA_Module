const mongoose = require('mongoose');
const { connect, disconnect, clearDatabase } = require('../helpers');
const User = require('../../src/modules/users/user.model');

jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  getAuth: jest.fn(),
}));

const { getAuth } = require('@clerk/express');
const { authenticate, authorize } = require('../../src/middleware/auth');

describe('authenticate middleware', () => {
  let req, res, next;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it('should return 401 if no userId in auth', async () => {
    getAuth.mockReturnValue(null);
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('should return 401 if userId is missing', async () => {
    getAuth.mockReturnValue({});
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should create user if not exists', async () => {
    getAuth.mockReturnValue({
      userId: 'clerk_new_user',
      emailAddress: 'new@example.com',
      fullName: 'New User',
    });

    await authenticate(req, res, next);

    const user = await User.findOne({ clerkId: 'clerk_new_user' });
    expect(user).toBeDefined();
    expect(user.name).toBe('New User');
    expect(user.email).toBe('new@example.com');
    expect(user.role).toBe('bda');
    expect(req.user._id.toString()).toBe(user._id.toString());
    expect(next).toHaveBeenCalled();
  });

  it('should use existing user if already synced', async () => {
    const existing = await User.create({
      clerkId: 'clerk_existing',
      name: 'Existing User',
      email: 'existing@example.com',
      role: 'manager',
    });

    getAuth.mockReturnValue({
      userId: 'clerk_existing',
      emailAddress: 'existing@example.com',
    });

    await authenticate(req, res, next);

    expect(req.user._id.toString()).toBe(existing._id.toString());
    expect(req.user.role).toBe('manager');
    expect(next).toHaveBeenCalled();
  });

  it('should pass errors to next', async () => {
    getAuth.mockImplementation(() => {
      throw new Error('Clerk error');
    });

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('authorize middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should return 401 if no user on request', () => {
    authorize('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('should return 403 if role not allowed', () => {
    req.user = { role: 'bda' };
    authorize('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
  });

  it('should allow if role matches any allowed role', () => {
    req.user = { role: 'bda' };
    authorize('admin', 'manager', 'bda')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should allow admin access', () => {
    req.user = { role: 'admin' };
    authorize('admin')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should allow manager access when manager is allowed', () => {
    req.user = { role: 'manager' };
    authorize('admin', 'manager')(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
