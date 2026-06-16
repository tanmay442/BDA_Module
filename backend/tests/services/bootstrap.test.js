const { connect, disconnect, clearDatabase } = require('../helpers');
const User = require('../../src/modules/users/user.model');
const AuditLog = require('../../src/modules/auditLogs/auditLog.model');
const {
  promoteIfBootstrapEmail,
  ensureBootstrapAdmins,
  getBootstrapEmails,
} = require('../../src/services/bootstrap');

describe('bootstrap service', () => {
  beforeAll(async () => {
    await connect();
  });
  afterAll(async () => {
    await disconnect();
  });
  afterEach(async () => {
    await clearDatabase();
    delete process.env.BOOTSTRAP_ADMIN_EMAILS;
  });

  describe('getBootstrapEmails', () => {
    it('returns empty array when env not set', () => {
      delete process.env.BOOTSTRAP_ADMIN_EMAILS;
      expect(getBootstrapEmails()).toEqual([]);
    });
    it('parses, trims, lowercases', () => {
      process.env.BOOTSTRAP_ADMIN_EMAILS = '  A@X.com, b@x.com ,A@x.COM  ,';
      expect(getBootstrapEmails()).toEqual(['a@x.com', 'b@x.com']);
    });
  });

  describe('promoteIfBootstrapEmail', () => {
    it('is a no-op when BOOTSTRAP_ADMIN_EMAILS is unset', async () => {
      const u = await User.create({
        clerkId: 'u1', email: 'a@x.com', name: 'A', role: 'bda',
      });
      expect(await promoteIfBootstrapEmail(u)).toBe(false);
      const after = await User.findById(u._id);
      expect(after.role).toBe('bda');
    });

    it('is a no-op when user email is not in allowlist', async () => {
      process.env.BOOTSTRAP_ADMIN_EMAILS = 'admin@x.com';
      const u = await User.create({
        clerkId: 'u1', email: 'other@x.com', name: 'O', role: 'bda',
      });
      expect(await promoteIfBootstrapEmail(u)).toBe(false);
      const after = await User.findById(u._id);
      expect(after.role).toBe('bda');
    });

    it('promotes to admin when no admin exists and email matches', async () => {
      process.env.BOOTSTRAP_ADMIN_EMAILS = 'admin@x.com';
      const u = await User.create({
        clerkId: 'u1', email: 'admin@x.com', name: 'Admin', role: 'bda',
      });
      expect(await promoteIfBootstrapEmail(u)).toBe(true);
      const after = await User.findById(u._id);
      expect(after.role).toBe('admin');
      const logs = await AuditLog.find({ action: 'system.bootstrap_admin' });
      expect(logs).toHaveLength(1);
    });

    it('is a no-op when an admin already exists', async () => {
      process.env.BOOTSTRAP_ADMIN_EMAILS = 'admin@x.com';
      await User.create({
        clerkId: 'existing', email: 'existing@x.com', name: 'Existing', role: 'admin',
      });
      const u = await User.create({
        clerkId: 'u1', email: 'admin@x.com', name: 'Newbie', role: 'bda',
      });
      expect(await promoteIfBootstrapEmail(u)).toBe(false);
      const after = await User.findById(u._id);
      expect(after.role).toBe('bda');
    });

    it('is case-insensitive on email match', async () => {
      process.env.BOOTSTRAP_ADMIN_EMAILS = 'Admin@X.com';
      const u = await User.create({
        clerkId: 'u1', email: 'admin@x.com', name: 'A', role: 'bda',
      });
      expect(await promoteIfBootstrapEmail(u)).toBe(true);
    });
  });

  describe('ensureBootstrapAdmins (startup)', () => {
    it('skips when no env set', async () => {
      const result = await ensureBootstrapAdmins();
      expect(result.promoted).toBe(0);
    });
    it('skips when admin already exists', async () => {
      await User.create({
        clerkId: 'a', email: 'a@x.com', name: 'A', role: 'admin',
      });
      process.env.BOOTSTRAP_ADMIN_EMAILS = 'b@x.com';
      await User.create({
        clerkId: 'b', email: 'b@x.com', name: 'B', role: 'bda',
      });
      const result = await ensureBootstrapAdmins();
      expect(result.promoted).toBe(0);
      const b = await User.findOne({ clerkId: 'b' });
      expect(b.role).toBe('bda');
    });
    it('promotes matching user when no admin exists', async () => {
      process.env.BOOTSTRAP_ADMIN_EMAILS = 'boot@x.com';
      await User.create({
        clerkId: 'b', email: 'boot@x.com', name: 'B', role: 'bda',
      });
      const result = await ensureBootstrapAdmins();
      expect(result.promoted).toBe(1);
      const b = await User.findOne({ clerkId: 'b' });
      expect(b.role).toBe('admin');
    });
    it('returns 0 when env is set but no matching user exists yet', async () => {
      process.env.BOOTSTRAP_ADMIN_EMAILS = 'nobody@x.com';
      const result = await ensureBootstrapAdmins();
      expect(result.promoted).toBe(0);
    });
  });
});
