const mongoose = require('mongoose');
const { connect, disconnect, clearDatabase } = require('../helpers');
const User = require('../../src/modules/users/user.model');
const Activity = require('../../src/modules/activities/activity.model');

describe('Activity Model', () => {
  let user;
  let leadId;

  beforeAll(async () => {
    await connect();
    user = await User.create({
      clerkId: 'clerk_act_test',
      name: 'Activity Tester',
      email: 'act@example.com',
      role: 'bda',
    });
    leadId = new mongoose.Types.ObjectId();
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await clearDatabase();
    user = await User.create({
      clerkId: 'clerk_act_test',
      name: 'Activity Tester',
      email: 'act@example.com',
      role: 'bda',
    });
  });

  const validActivity = () => ({
    leadId,
    userId: user._id,
    type: 'note',
    message: 'Called client, interested in products',
  });

  it('should create a valid activity', async () => {
    const activity = await Activity.create(validActivity());
    expect(activity.type).toBe('note');
    expect(activity.message).toBe('Called client, interested in products');
  });

  it('should require leadId', async () => {
    const data = validActivity();
    delete data.leadId;
    await expect(Activity.create(data)).rejects.toThrow();
  });

  it('should require userId', async () => {
    const data = validActivity();
    delete data.userId;
    await expect(Activity.create(data)).rejects.toThrow();
  });

  it('should require message', async () => {
    const data = validActivity();
    delete data.message;
    await expect(Activity.create(data)).rejects.toThrow();
  });

  it('should require type', async () => {
    const data = validActivity();
    delete data.type;
    await expect(Activity.create(data)).rejects.toThrow();
  });

  it('should reject invalid type', async () => {
    await expect(
      Activity.create({ ...validActivity(), type: 'email' })
    ).rejects.toThrow();
  });

  it('should accept all valid activity types', async () => {
    const types = ['call', 'note', 'meeting', 'follow_up', 'chat_update'];
    for (const type of types) {
      const activity = await Activity.create({
        leadId,
        userId: user._id,
        type,
        message: `Test ${type}`,
      });
      expect(activity.type).toBe(type);
    }
  });
});
