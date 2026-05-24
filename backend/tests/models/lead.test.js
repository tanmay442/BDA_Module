const mongoose = require('mongoose');
const { connect, disconnect, clearDatabase } = require('../helpers');
const User = require('../../src/modules/users/user.model');
const Lead = require('../../src/modules/leads/lead.model');

describe('Lead Model', () => {
  let user;

  beforeAll(async () => {
    await connect();
    user = await User.create({
      clerkId: 'clerk_lead_test',
      name: 'Lead Tester',
      email: 'lead@example.com',
      role: 'bda',
    });
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await clearDatabase();
    user = await User.create({
      clerkId: 'clerk_lead_test',
      name: 'Lead Tester',
      email: 'lead@example.com',
      role: 'bda',
    });
  });

  const validLead = () => ({
    companyName: 'Acme Corp',
    contactPerson: 'Jane Smith',
    email: 'jane@acme.com',
    phone: '1234567890',
    industry: 'Manufacturing',
    source: 'Website',
    currentStage: 'new',
    expectedDealValue: 50000,
    createdBy: user._id,
  });

  it('should create a valid lead', async () => {
    const lead = await Lead.create(validLead());
    expect(lead._id).toBeDefined();
    expect(lead.companyName).toBe('Acme Corp');
    expect(lead.currentStage).toBe('new');
  });

  it('should require companyName', async () => {
    const data = validLead();
    delete data.companyName;
    await expect(Lead.create(data)).rejects.toThrow();
  });

  it('should require createdBy', async () => {
    const data = validLead();
    delete data.createdBy;
    await expect(Lead.create(data)).rejects.toThrow();
  });

  it('should default currentStage to new', async () => {
    const lead = await Lead.create({
      companyName: 'Default Stage Co',
      createdBy: user._id,
    });
    expect(lead.currentStage).toBe('new');
  });

  it('should reject invalid stage', async () => {
    await expect(
      Lead.create({ ...validLead(), currentStage: 'invalid_stage' })
    ).rejects.toThrow();
  });

  it('should accept all valid stages', async () => {
    const stages = [
      'new',
      'contacted',
      'requirement_gathered',
      'quotation_sent',
      'negotiation',
      'won',
      'lost',
    ];
    for (const stage of stages) {
      const lead = await Lead.create({ ...validLead(), currentStage: stage });
      expect(lead.currentStage).toBe(stage);
    }
  });

  it('should accept optional assignedTo', async () => {
    const lead = await Lead.create({
      ...validLead(),
      assignedTo: user._id,
    });
    expect(lead.assignedTo.toString()).toBe(user._id.toString());
  });

  it('should default expectedDealValue to 0', async () => {
    const lead = await Lead.create({
      companyName: 'Zero Value Inc',
      createdBy: user._id,
    });
    expect(lead.expectedDealValue).toBe(0);
  });

  it('should include timestamps', async () => {
    const lead = await Lead.create(validLead());
    expect(lead.createdAt).toBeInstanceOf(Date);
    expect(lead.updatedAt).toBeInstanceOf(Date);
  });
});
