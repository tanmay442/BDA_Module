const mongoose = require('mongoose');
const { connect, disconnect, clearDatabase } = require('../helpers');
const User = require('../../src/modules/users/user.model');
const Client = require('../../src/modules/clients/client.model');

describe('Client Model', () => {
  let user;
  let leadId;

  beforeAll(async () => {
    await connect();
    user = await User.create({
      clerkId: 'clerk_client_test',
      name: 'Client Tester',
      email: 'client@example.com',
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
      clerkId: 'clerk_client_test',
      name: 'Client Tester',
      email: 'client@example.com',
      role: 'bda',
    });
  });

  const validClient = () => ({
    leadId,
    companyName: 'Converted Corp',
    contactPerson: 'Bob Smith',
    email: 'bob@converted.com',
    phone: '9876543210',
    gstNumber: 'GSTIN123456',
    address: '123 Industrial Area',
    accountManager: user._id,
  });

  it('should create a valid client', async () => {
    const client = await Client.create(validClient());
    expect(client.companyName).toBe('Converted Corp');
    expect(client.gstNumber).toBe('GSTIN123456');
  });

  it('should require companyName', async () => {
    const data = validClient();
    delete data.companyName;
    await expect(Client.create(data)).rejects.toThrow();
  });

  it('should require leadId', async () => {
    const data = validClient();
    delete data.leadId;
    await expect(Client.create(data)).rejects.toThrow();
  });

  it('should enforce unique leadId', async () => {
    await Client.create(validClient());
    await expect(Client.create(validClient())).rejects.toThrow();
  });
});
