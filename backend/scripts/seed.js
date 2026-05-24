require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
// Also load root .env which has MONGO_URI
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/modules/users/user.model');
const Lead = require('../src/modules/leads/lead.model');
const Task = require('../src/modules/tasks/task.model');
const Activity = require('../src/modules/activities/activity.model');
const Quotation = require('../src/modules/quotations/quotation.model');
const Client = require('../src/modules/clients/client.model');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Lead.deleteMany({}),
    Task.deleteMany({}),
    Activity.deleteMany({}),
    Quotation.deleteMany({}),
    Client.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Create users
  const [admin, manager, bda1, bda2] = await User.create([
    { clerkId: 'seed_admin', name: 'Alex Admin', email: 'admin@example.com', role: 'admin', department: 'Management' },
    { clerkId: 'seed_manager', name: 'Mia Manager', email: 'manager@example.com', role: 'manager', department: 'Sales' },
    { clerkId: 'seed_bda1', name: 'Bob BDA', email: 'bob@example.com', role: 'bda', department: 'Sales' },
    { clerkId: 'seed_bda2', name: 'Sarah BDA', email: 'sarah@example.com', role: 'bda', department: 'Sales' },
  ]);
  console.log('Created 4 users');

  // Create leads
  const leadData = [
    { companyName: 'TechCorp India', contactPerson: 'Rajesh Kumar', email: 'rajesh@techcorp.in', phone: '+91-9876543210', industry: 'Technology', source: 'Website', expectedDealValue: 250000, currentStage: 'new', assignedTo: bda1._id, createdBy: bda1._id, notes: 'Interested in CNC machines' },
    { companyName: 'AutoParts Ltd', contactPerson: 'Priya Sharma', email: 'priya@autoparts.com', phone: '+91-8765432109', industry: 'Automotive', source: 'Referral', expectedDealValue: 500000, currentStage: 'contacted', assignedTo: bda1._id, createdBy: bda1._id, notes: 'Need quotation for 5 units' },
    { companyName: 'SteelMakers Inc', contactPerson: 'Amit Singh', email: 'amit@steelmakers.com', phone: '+91-7654321098', industry: 'Manufacturing', source: 'Trade Show', expectedDealValue: 1200000, currentStage: 'requirement_gathered', assignedTo: bda2._id, createdBy: bda2._id, notes: 'Large order potential' },
    { companyName: 'GreenEnergy Solutions', contactPerson: 'Neha Patel', email: 'neha@greenenergy.com', phone: '+91-6543210987', industry: 'Energy', source: 'LinkedIn', expectedDealValue: 800000, currentStage: 'quotation_sent', assignedTo: bda2._id, createdBy: bda2._id, notes: 'Quotation sent on 15th May' },
    { companyName: 'FoodTech Pvt Ltd', contactPerson: 'Vikram Joshi', email: 'vikram@foodtech.com', phone: '+91-5432109876', industry: 'Food Processing', source: 'Website', expectedDealValue: 350000, currentStage: 'negotiation', assignedTo: bda1._id, createdBy: bda1._id, notes: 'Negotiating pricing' },
    { companyName: 'MedEquip Corp', contactPerson: 'Dr. Sunita Reddy', email: 'sunita@medequip.com', phone: '+91-4321098765', industry: 'Healthcare', source: 'Conference', expectedDealValue: 2000000, currentStage: 'negotiation', assignedTo: bda2._id, createdBy: bda2._id, notes: 'Multiple departments interested' },
    { companyName: 'BuildRight Constructions', contactPerson: 'Rohan Mehta', email: 'rohan@buildright.com', phone: '+91-3210987654', industry: 'Construction', source: 'Referral', expectedDealValue: 150000, currentStage: 'won', assignedTo: bda1._id, createdBy: bda1._id, notes: 'Deal closed, order placed' },
    { companyName: 'PackWell Industries', contactPerson: 'Ananya Gupta', email: 'ananya@packwell.com', phone: '+91-2109876543', industry: 'Packaging', source: 'Cold Call', expectedDealValue: 75000, currentStage: 'lost', assignedTo: bda2._id, createdBy: bda2._id, notes: 'Chose competitor' },
    { companyName: 'AgriGrow Farms', contactPerson: 'Devendra Singh', email: 'devendra@agrigrow.com', phone: '+91-1098765432', industry: 'Agriculture', source: 'Website', expectedDealValue: 450000, currentStage: 'new', assignedTo: bda1._id, createdBy: bda1._id, notes: 'New inquiry received' },
    { companyName: 'LogiTrans Solutions', contactPerson: 'Kavita Desai', email: 'kavita@logitrans.com', phone: '+91-9988776655', industry: 'Logistics', source: 'LinkedIn', expectedDealValue: 600000, currentStage: 'contacted', assignedTo: bda2._id, createdBy: bda2._id, notes: 'Follow-up call scheduled' },
  ];

  const leads = await Lead.create(leadData);
  console.log(`Created ${leads.length} leads`);

  // Create client for won lead
  await Client.create({
    leadId: leads.find(l => l.currentStage === 'won')._id,
    companyName: 'BuildRight Constructions',
    contactPerson: 'Rohan Mehta',
    email: 'rohan@buildright.com',
    phone: '+91-3210987654',
    gstNumber: '27AABCU9603R1ZX',
    address: 'Mumbai, Maharashtra',
    accountManager: bda1._id,
  });
  console.log('Created 1 client');

  // Create tasks
  const today = new Date();
  const daysAgo = (n) => new Date(today.getTime() - n * 86400000);
  const daysFromNow = (n) => new Date(today.getTime() + n * 86400000);

  const taskData = [
    { title: 'Send follow-up email', description: 'Send product brochure to TechCorp', leadId: leads[0]._id, assignedTo: bda1._id, dueDate: daysAgo(1), priority: 'high', status: 'pending', createdBy: bda1._id },
    { title: 'Prepare quotation', description: 'Create quotation for AutoParts', leadId: leads[1]._id, assignedTo: bda1._id, dueDate: daysAgo(0), priority: 'high', status: 'pending', createdBy: bda1._id },
    { title: 'Schedule demo', description: 'Arrange product demo for SteelMakers', leadId: leads[2]._id, assignedTo: bda2._id, dueDate: daysFromNow(1), priority: 'medium', status: 'pending', createdBy: bda2._id },
    { title: 'Call GreenEnergy', description: 'Follow up on sent quotation', leadId: leads[3]._id, assignedTo: bda2._id, dueDate: daysFromNow(2), priority: 'medium', status: 'pending', createdBy: bda2._id },
    { title: 'Negotiation meeting', description: 'Meeting with FoodTech to finalize pricing', leadId: leads[4]._id, assignedTo: bda1._id, dueDate: daysFromNow(3), priority: 'high', status: 'pending', createdBy: bda1._id },
    { title: 'Review MedEquip requirements', description: 'Review technical specifications', leadId: leads[5]._id, assignedTo: bda2._id, dueDate: daysFromNow(5), priority: 'low', status: 'pending', createdBy: bda2._id },
    { title: 'Welcome call to BuildRight', description: 'Onboarding call with new client', leadId: leads[6]._id, assignedTo: bda1._id, dueDate: daysAgo(3), priority: 'medium', status: 'completed', createdBy: bda1._id },
    { title: 'Research AgriGrow', description: 'Research company before call', leadId: leads[8]._id, assignedTo: bda1._id, dueDate: daysFromNow(1), priority: 'low', status: 'pending', createdBy: bda1._id },
  ];

  const tasks = await Task.create(taskData);
  console.log(`Created ${tasks.length} tasks`);

  // Create activities
  const activityData = [
    { leadId: leads[1]._id, userId: bda1._id, type: 'call', message: 'Spoke with Priya. She is interested in our CNC-5000 model.' },
    { leadId: leads[2]._id, userId: bda2._id, type: 'meeting', message: 'Met Amit at the trade show. He needs custom automation solutions.' },
    { leadId: leads[3]._id, userId: bda2._id, type: 'note', message: 'Sent quotation Q-2026-0003. Waiting for response.' },
    { leadId: leads[4]._id, userId: bda1._id, type: 'follow_up', message: 'Vikram wants a discount on bulk order. Need manager approval.' },
    { leadId: leads[5]._id, userId: bda2._id, type: 'note', message: 'Dr. Reddy requested a site visit. Scheduled for next week.' },
    { leadId: leads[6]._id, userId: bda1._id, type: 'call', message: 'Rohan confirmed the order. Delivery scheduled for June.' },
    { leadId: leads[0]._id, userId: bda1._id, type: 'note', message: 'Rajesh visited the website. Downloaded brochure.' },
    { leadId: leads[9]._id, userId: bda2._id, type: 'follow_up', message: 'Kavita wants to see a demo of the packaging line.' },
  ];

  const activities = await Activity.create(activityData);
  console.log(`Created ${activities.length} activities`);

  // Create quotations
  const quotationData = [
    {
      leadId: leads[3]._id,
      quotationNumber: 'Q-2026-0001',
      items: [
        { productName: 'CNC-5000 Machine', quantity: 2, unitPrice: 350000, totalPrice: 700000, moq: 1, deliveryEstimate: '8 weeks' },
        { productName: 'Installation Kit', quantity: 2, unitPrice: 25000, totalPrice: 50000, moq: 1, deliveryEstimate: '4 weeks' },
      ],
      subtotal: 750000,
      tax: 75000,
      grandTotal: 825000,
      status: 'sent',
      version: 1,
      createdBy: bda2._id,
    },
    {
      leadId: leads[4]._id,
      quotationNumber: 'Q-2026-0002',
      items: [
        { productName: 'Food Processing Unit FP-200', quantity: 1, unitPrice: 280000, totalPrice: 280000, moq: 1, deliveryEstimate: '12 weeks' },
        { productName: 'Conveyor Belt System', quantity: 1, unitPrice: 45000, totalPrice: 45000, moq: 1, deliveryEstimate: '6 weeks' },
        { productName: 'Maintenance Contract (1 year)', quantity: 1, unitPrice: 25000, totalPrice: 25000, moq: 1, deliveryEstimate: 'Ongoing' },
      ],
      subtotal: 350000,
      tax: 35000,
      grandTotal: 385000,
      status: 'revised',
      version: 2,
      createdBy: bda1._id,
    },
    {
      leadId: leads[6]._id,
      quotationNumber: 'Q-2026-0003',
      items: [
        { productName: 'Hydraulic Press HP-100', quantity: 1, unitPrice: 120000, totalPrice: 120000, moq: 1, deliveryEstimate: '6 weeks' },
        { productName: 'Safety Guard System', quantity: 1, unitPrice: 15000, totalPrice: 15000, moq: 1, deliveryEstimate: '4 weeks' },
      ],
      subtotal: 135000,
      tax: 13500,
      grandTotal: 148500,
      status: 'accepted',
      version: 1,
      createdBy: bda1._id,
    },
  ];

  const quotations = await Quotation.create(quotationData);
  console.log(`Created ${quotations.length} quotations`);

  console.log('\n✅ Seed complete!');
  console.log('\nUsers:');
  console.log(`  Admin:   admin@example.com`);
  console.log(`  Manager: manager@example.com`);
  console.log(`  BDA 1:   bob@example.com (Bob BDA)`);
  console.log(`  BDA 2:   sarah@example.com (Sarah BDA)`);
  console.log(`\nStats:`);
  console.log(`  ${leads.length} leads`);
  console.log(`  ${tasks.length} tasks`);
  console.log(`  ${activities.length} activities`);
  console.log(`  ${quotations.length} quotations`);
  console.log(`  1 client`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
