const mongoose = require('mongoose');
const request = require('supertest');
const { connect, disconnect, clearDatabase } = require('../helpers');
const app = require('../../src/app');
const User = require('../../src/modules/users/user.model');
const Task = require('../../src/modules/tasks/task.model');

jest.mock('@clerk/express', () => ({
  clerkMiddleware: () => (req, res, next) => next(),
  getAuth: jest.fn(),
}));

const { getAuth } = require('@clerk/express');

describe('Task Routes', () => {
  let user;

  beforeAll(async () => {
    await connect();
    user = await User.create({
      clerkId: 'clerk_task_route',
      name: 'Task Router',
      email: 'taskroute@example.com',
      role: 'bda',
    });
    getAuth.mockReturnValue({ userId: 'clerk_task_route' });
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await clearDatabase();
    user = await User.create({
      clerkId: 'clerk_task_route',
      name: 'Task Router',
      email: 'taskroute@example.com',
      role: 'bda',
    });
    getAuth.mockReturnValue({ userId: 'clerk_task_route' });
  });

  describe('POST /api/tasks', () => {
    it('should create a task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Follow up', assignedTo: user._id });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Follow up');
      expect(res.body.status).toBe('pending');
    });

    it('should require title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ assignedTo: user._id });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/tasks', () => {
    it('should list tasks assigned to BDA', async () => {
      await Task.create({ title: 'Task 1', assignedTo: user._id });
      await Task.create({ title: 'Task 2', assignedTo: user._id });

      const res = await request(app).get('/api/tasks');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter by status', async () => {
      await Task.create({ title: 'Pending', assignedTo: user._id });
      await Task.create({ title: 'Done', assignedTo: user._id, status: 'completed' });

      const res = await request(app).get('/api/tasks?status=completed');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Done');
    });

    it('should filter by priority', async () => {
      await Task.create({ title: 'Normal', assignedTo: user._id });
      await Task.create({ title: 'Urgent', assignedTo: user._id, priority: 'high' });

      const res = await request(app).get('/api/tasks?priority=high');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Urgent');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get a task by id', async () => {
      const task = await Task.create({ title: 'Specific', assignedTo: user._id });

      const res = await request(app).get(`/api/tasks/${task._id}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Specific');
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('should update a task', async () => {
      const task = await Task.create({ title: 'Old', assignedTo: user._id });

      const res = await request(app)
        .patch(`/api/tasks/${task._id}`)
        .send({ title: 'Updated', status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated');
      expect(res.body.status).toBe('completed');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task as manager', async () => {
      user.role = 'manager';
      await user.save();
      const task = await Task.create({ title: 'Delete me', assignedTo: user._id });

      const res = await request(app).delete(`/api/tasks/${task._id}`);

      expect(res.status).toBe(200);
      expect(await Task.findById(task._id)).toBeNull();
    });

    it('should forbid BDA from deleting a task', async () => {
      const task = await Task.create({ title: 'Do not delete', assignedTo: user._id });

      const res = await request(app).delete(`/api/tasks/${task._id}`);

      expect(res.status).toBe(403);
    });
  });
});
