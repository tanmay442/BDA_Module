const mongoose = require('mongoose');
const { connect, disconnect, clearDatabase } = require('../helpers');
const User = require('../../src/modules/users/user.model');

describe('User Model', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  const validUser = {
    clerkId: 'clerk_test_123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'bda',
  };

  it('should create a valid user', async () => {
    const user = await User.create(validUser);
    expect(user._id).toBeDefined();
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
    expect(user.role).toBe('bda');
  });

  it('should require clerkId', async () => {
    await expect(User.create({ name: 'No Clerk' })).rejects.toThrow();
  });

  it('should require name', async () => {
    await expect(User.create({ clerkId: 'test' })).rejects.toThrow();
  });

  it('should enforce unique clerkId', async () => {
    await User.create(validUser);
    await expect(User.create(validUser)).rejects.toThrow();
  });

  it('should enforce unique email', async () => {
    await User.create(validUser);
    await expect(
      User.create({ ...validUser, clerkId: 'clerk_test_456' })
    ).rejects.toThrow();
  });

  it('should reject invalid role', async () => {
    await expect(
      User.create({ ...validUser, role: 'superadmin' })
    ).rejects.toThrow();
  });

  it('should lowercase email automatically', async () => {
    const user = await User.create({
      ...validUser,
      email: 'JOHN@EXAMPLE.COM',
    });
    expect(user.email).toBe('john@example.com');
  });

  it('should set default role to bda', async () => {
    const user = await User.create({
      clerkId: 'clerk_test_default',
      name: 'Default',
      email: 'default@example.com',
    });
    expect(user.role).toBe('bda');
  });

  it('should include timestamps', async () => {
    const user = await User.create(validUser);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
});
