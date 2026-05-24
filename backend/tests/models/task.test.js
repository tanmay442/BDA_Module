const mongoose = require('mongoose');
const { connect, disconnect, clearDatabase } = require('../helpers');
const User = require('../../src/modules/users/user.model');
const Task = require('../../src/modules/tasks/task.model');

describe('Task Model', () => {
  let user;

  beforeAll(async () => {
    await connect();
    user = await User.create({
      clerkId: 'clerk_task_test',
      name: 'Task Tester',
      email: 'task@example.com',
      role: 'bda',
    });
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await clearDatabase();
    user = await User.create({
      clerkId: 'clerk_task_test',
      name: 'Task Tester',
      email: 'task@example.com',
      role: 'bda',
    });
  });

  const validTask = () => ({
    title: 'Follow up with client',
    description: 'Call about quotation',
    assignedTo: user._id,
    dueDate: new Date('2026-06-01'),
    priority: 'high',
  });

  it('should create a valid task', async () => {
    const task = await Task.create(validTask());
    expect(task.title).toBe('Follow up with client');
    expect(task.status).toBe('pending');
    expect(task.priority).toBe('high');
  });

  it('should require title', async () => {
    const data = validTask();
    delete data.title;
    await expect(Task.create(data)).rejects.toThrow();
  });

  it('should require assignedTo', async () => {
    const data = validTask();
    delete data.assignedTo;
    await expect(Task.create(data)).rejects.toThrow();
  });

  it('should default status to pending', async () => {
    const task = await Task.create({
      title: 'Simple task',
      assignedTo: user._id,
    });
    expect(task.status).toBe('pending');
  });

  it('should default priority to medium', async () => {
    const task = await Task.create({
      title: 'Medium priority task',
      assignedTo: user._id,
    });
    expect(task.priority).toBe('medium');
  });

  it('should reject invalid priority', async () => {
    await expect(
      Task.create({ ...validTask(), priority: 'urgent' })
    ).rejects.toThrow();
  });

  it('should reject invalid status', async () => {
    await expect(
      Task.create({ ...validTask(), status: 'in_progress' })
    ).rejects.toThrow();
  });

  it('should accept optional leadId', async () => {
    const task = await Task.create({
      ...validTask(),
      leadId: new mongoose.Types.ObjectId(),
    });
    expect(task.leadId).toBeDefined();
  });
});
