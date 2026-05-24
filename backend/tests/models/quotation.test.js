const mongoose = require('mongoose');
const { connect, disconnect, clearDatabase } = require('../helpers');
const User = require('../../src/modules/users/user.model');
const Quotation = require('../../src/modules/quotations/quotation.model');

describe('Quotation Model', () => {
  let user;
  let leadId;

  beforeAll(async () => {
    await connect();
    user = await User.create({
      clerkId: 'clerk_quote_test',
      name: 'Quote Tester',
      email: 'quote@example.com',
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
      clerkId: 'clerk_quote_test',
      name: 'Quote Tester',
      email: 'quote@example.com',
      role: 'bda',
    });
  });

  const validQuote = () => ({
    leadId,
    quotationNumber: 'Q-2026-0001',
    items: [
      { productName: 'Widget A', quantity: 10, unitPrice: 100, totalPrice: 1000 },
      { productName: 'Widget B', quantity: 5, unitPrice: 200, totalPrice: 1000 },
    ],
    subtotal: 2000,
    tax: 180,
    grandTotal: 2180,
    createdBy: user._id,
  });

  it('should create a valid quotation', async () => {
    const q = await Quotation.create(validQuote());
    expect(q.quotationNumber).toBe('Q-2026-0001');
    expect(q.items).toHaveLength(2);
    expect(q.grandTotal).toBe(2180);
    expect(q.status).toBe('draft');
    expect(q.version).toBe(1);
  });

  it('should require leadId', async () => {
    const data = validQuote();
    delete data.leadId;
    await expect(Quotation.create(data)).rejects.toThrow();
  });

  it('should require quotationNumber', async () => {
    const data = validQuote();
    delete data.quotationNumber;
    await expect(Quotation.create(data)).rejects.toThrow();
  });

  it('should enforce unique quotationNumber', async () => {
    await Quotation.create(validQuote());
    await expect(Quotation.create(validQuote())).rejects.toThrow();
  });

  it('should require items', async () => {
    const data = validQuote();
    delete data.items;
    await expect(Quotation.create(data)).rejects.toThrow();
  });

  it('should reject invalid status', async () => {
    await expect(
      Quotation.create({ ...validQuote(), status: 'cancelled' })
    ).rejects.toThrow();
  });

  it('should accept all valid statuses', async () => {
    const statuses = ['draft', 'sent', 'revised', 'accepted', 'rejected'];
    for (const status of statuses) {
      const q = await Quotation.create({
        ...validQuote(),
        quotationNumber: `Q-${Date.now()}-${status}`,
        status,
      });
      expect(q.status).toBe(status);
    }
  });

  it('should reject negative subtotal', async () => {
    await expect(
      Quotation.create({ ...validQuote(), subtotal: -100 })
    ).rejects.toThrow();
  });

  it('should default version to 1', async () => {
    const q = await Quotation.create({
      ...validQuote(),
      quotationNumber: `Q-${Date.now()}-default`,
    });
    expect(q.version).toBe(1);
  });
});
