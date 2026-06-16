const crypto = require('crypto');
const request = require('supertest');
const { Webhook } = require('svix');
const { connect, disconnect, clearDatabase } = require('../helpers');
const User = require('../../src/modules/users/user.model');
const AuditLog = require('../../src/modules/auditLogs/auditLog.model');
const app = require('../../src/app');

const SECRET = 'whsec_test_secret_for_unit_tests';
const KEY_ID = 'key_test_123';

function signPayload(payload, ts = Math.floor(Date.now() / 1000)) {
  const id = `msg_${crypto.randomBytes(8).toString('hex')}`;
  const toSign = `${id}.${ts}.${payload}`;
  const secretBytes = Buffer.from(SECRET.replace(/^whsec_/, ''), 'base64');
  const sig = crypto.createHmac('sha256', secretBytes).update(toSign).digest('base64');
  return {
    id,
    ts,
    sig: `v1,${sig}`,
    payload,
  };
}

function signedHeaders(payload, ts) {
  const s = signPayload(payload, ts);
  return {
    'svix-id': s.id,
    'svix-timestamp': String(s.ts),
    'svix-signature': s.sig,
  };
}

describe('POST /api/webhooks/clerk', () => {
  beforeAll(async () => {
    process.env.CLERK_WEBHOOK_SECRET = SECRET;
    await connect();
  });
  afterAll(async () => {
    await disconnect();
    delete process.env.CLERK_WEBHOOK_SECRET;
  });
  afterEach(async () => {
    await clearDatabase();
  });

  it('returns 400 when svix headers are missing', async () => {
    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .send({ type: 'user.created' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/svix/i);
  });

  it('returns 401 when signature is invalid', async () => {
    const payload = JSON.stringify({ type: 'user.created', data: {} });
    const headers = signedHeaders(payload);
    headers['svix-signature'] = 'v1,thisisnotvalid';
    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set(headers)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(res.status).toBe(401);
  });

  it('returns 410 when timestamp is stale (replay attack)', async () => {
    const payload = JSON.stringify({ type: 'user.created', data: {} });
    const headers = signedHeaders(payload, Math.floor(Date.now() / 1000) - 600); // 10 min old
    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set(headers)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(res.status).toBe(410);
  });

  it('upserts a user on user.created (does NOT touch role from payload)', async () => {
    const payload = JSON.stringify({
      type: 'user.created',
      data: {
        id: 'clerk_abc',
        email_addresses: [{ id: 'em1', email_address: 'New@Example.com' }],
        primary_email_address_id: 'em1',
        first_name: 'New',
        last_name: 'User',
        image_url: 'https://img.example/avatar.png',
      },
    });
    const headers = signedHeaders(payload);
    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set(headers)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(res.status).toBe(200);
    const u = await User.findOne({ clerkId: 'clerk_abc' });
    expect(u).toBeDefined();
    expect(u.email).toBe('new@example.com'); // lowercased
    expect(u.name).toBe('New User');
    expect(u.role).toBe('bda'); // default, never from payload
  });

  it('updates email/name on user.updated WITHOUT overwriting role', async () => {
    await User.create({
      clerkId: 'clerk_existing',
      email: 'old@x.com',
      name: 'Old',
      role: 'manager', // user was promoted by an admin
    });
    const payload = JSON.stringify({
      type: 'user.updated',
      data: {
        id: 'clerk_existing',
        email_addresses: [{ id: 'em1', email_address: 'new@x.com' }],
        primary_email_address_id: 'em1',
        first_name: 'New',
        last_name: 'Name',
      },
    });
    const headers = signedHeaders(payload);
    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set(headers)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(res.status).toBe(200);
    const u = await User.findOne({ clerkId: 'clerk_existing' });
    expect(u.email).toBe('new@x.com');
    expect(u.name).toBe('New Name');
    expect(u.role).toBe('manager'); // preserved
  });

  it('deletes the user on user.deleted (idempotent)', async () => {
    await User.create({
      clerkId: 'clerk_to_delete',
      email: 'd@x.com',
      name: 'D',
    });
    const payload = JSON.stringify({
      type: 'user.deleted',
      data: { id: 'clerk_to_delete' },
    });
    const headers = signedHeaders(payload);
    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set(headers)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(res.status).toBe(200);
    expect(await User.findOne({ clerkId: 'clerk_to_delete' })).toBeNull();
  });

  it('ignores unknown event types with 200 (Svix stops retrying)', async () => {
    const payload = JSON.stringify({ type: 'session.created', data: {} });
    const headers = signedHeaders(payload);
    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set(headers)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.ignored).toBe('session.created');
  });

  it('promotes first admin via BOOTSTRAP_ADMIN_EMAILS', async () => {
    process.env.BOOTSTRAP_ADMIN_EMAILS = 'first.admin@example.com';
    const payload = JSON.stringify({
      type: 'user.created',
      data: {
        id: 'clerk_first_admin',
        email_addresses: [{ id: 'em1', email_address: 'first.admin@example.com' }],
        primary_email_address_id: 'em1',
        first_name: 'First',
        last_name: 'Admin',
      },
    });
    const headers = signedHeaders(payload);
    const res = await request(app)
      .post('/api/webhooks/clerk')
      .set(headers)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(res.status).toBe(200);
    const u = await User.findOne({ clerkId: 'clerk_first_admin' });
    expect(u.role).toBe('admin');
    const log = await AuditLog.findOne({ action: 'system.bootstrap_admin' });
    expect(log).toBeDefined();
    delete process.env.BOOTSTRAP_ADMIN_EMAILS;
  });
});
