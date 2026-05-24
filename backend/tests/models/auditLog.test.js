const mongoose = require('mongoose');
const { connect, disconnect, clearDatabase } = require('../helpers');
const User = require('../../src/modules/users/user.model');
const AuditLog = require('../../src/modules/auditLogs/auditLog.model');

describe('AuditLog Model', () => {
  let user;

  beforeAll(async () => {
    await connect();
    user = await User.create({
      clerkId: 'clerk_audit_test',
      name: 'Audit Tester',
      email: 'audit@example.com',
      role: 'admin',
    });
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await clearDatabase();
    user = await User.create({
      clerkId: 'clerk_audit_test',
      name: 'Audit Tester',
      email: 'audit@example.com',
      role: 'admin',
    });
  });

  const validAuditLog = () => ({
    userId: user._id,
    action: 'lead_stage_changed',
    entityType: 'Lead',
    entityId: new mongoose.Types.ObjectId(),
    oldValue: { currentStage: 'new' },
    newValue: { currentStage: 'contacted' },
  });

  it('should create a valid audit log', async () => {
    const log = await AuditLog.create(validAuditLog());
    expect(log.action).toBe('lead_stage_changed');
    expect(log.entityType).toBe('Lead');
    expect(log.oldValue.currentStage).toBe('new');
    expect(log.newValue.currentStage).toBe('contacted');
  });

  it('should require userId', async () => {
    const data = validAuditLog();
    delete data.userId;
    await expect(AuditLog.create(data)).rejects.toThrow();
  });

  it('should require action', async () => {
    const data = validAuditLog();
    delete data.action;
    await expect(AuditLog.create(data)).rejects.toThrow();
  });

  it('should require entityType', async () => {
    const data = validAuditLog();
    delete data.entityType;
    await expect(AuditLog.create(data)).rejects.toThrow();
  });

  it('should require entityId', async () => {
    const data = validAuditLog();
    delete data.entityId;
    await expect(AuditLog.create(data)).rejects.toThrow();
  });

  it('should allow null oldValue and newValue', async () => {
    const log = await AuditLog.create({
      userId: user._id,
      action: 'lead_created',
      entityType: 'Lead',
      entityId: new mongoose.Types.ObjectId(),
    });
    expect(log.oldValue).toBeUndefined();
    expect(log.newValue).toBeUndefined();
  });

  it('should include timestamps', async () => {
    const log = await AuditLog.create(validAuditLog());
    expect(log.createdAt).toBeInstanceOf(Date);
    expect(log.updatedAt).toBeInstanceOf(Date);
  });
});
