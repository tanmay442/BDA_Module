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
    { clerkId: 'seed_admin', name: 'Alex Admin', email: 'admin@example.com', role: 'admin', department: 'Management', company: 'ACME Manufacturing' },
    { clerkId: 'seed_manager', name: 'Degen', email: 'degen@example.com', role: 'manager', department: 'Sales', company: 'ACME Manufacturing' },
    { clerkId: 'seed_bda1', name: 'Tanmay', email: 'tanmay@example.com', role: 'bda', department: 'Sales', company: 'ACME Manufacturing' },
    { clerkId: 'seed_bda2', name: 'Sarah BDA', email: 'sarah@example.com', role: 'bda', department: 'Sales', company: 'ACME Manufacturing' },
  ]);
  console.log('Created 4 users');

  // Create leads
  const leadData = [
    { companyName: 'TechCorp India', contactPerson: 'Rajesh Kumar', email: 'rajesh@techcorp.in', phone: '+91-9876543210', industry: 'Technology', source: 'Website', expectedDealValue: 250000, currentStage: 'new', assignedTo: bda1._id, createdBy: bda1._id, notes: 'Interested in CNC-5000 series machines for their new factory' },
    { companyName: 'AutoParts Ltd', contactPerson: 'Priya Sharma', email: 'priya@autoparts.com', phone: '+91-8765432109', industry: 'Automotive', source: 'Referral', expectedDealValue: 500000, currentStage: 'contacted', assignedTo: bda1._id, createdBy: bda1._id, notes: 'Need quotation for 5 units of hydraulic press HP-100' },
    { companyName: 'SteelMakers Inc', contactPerson: 'Amit Singh', email: 'amit@steelmakers.com', phone: '+91-7654321098', industry: 'Manufacturing', source: 'Trade Show', expectedDealValue: 1200000, currentStage: 'requirement_gathered', assignedTo: bda2._id, createdBy: bda2._id, notes: 'Large order potential — needs custom automation line for steel fabrication' },
    { companyName: 'GreenEnergy Solutions', contactPerson: 'Neha Patel', email: 'neha@greenenergy.com', phone: '+91-6543210987', industry: 'Energy', source: 'LinkedIn', expectedDealValue: 800000, currentStage: 'quotation_sent', assignedTo: bda2._id, createdBy: bda2._id, notes: 'Quotation sent on 15th May for solar panel assembly line' },
    { companyName: 'FoodTech Pvt Ltd', contactPerson: 'Vikram Joshi', email: 'vikram@foodtech.com', phone: '+91-5432109876', industry: 'Food Processing', source: 'Website', expectedDealValue: 350000, currentStage: 'negotiation', assignedTo: bda1._id, createdBy: bda1._id, notes: 'Negotiating pricing on FP-200 food processing unit' },
    { companyName: 'MedEquip Corp', contactPerson: 'Dr. Sunita Reddy', email: 'sunita@medequip.com', phone: '+91-4321098765', industry: 'Healthcare', source: 'Conference', expectedDealValue: 2000000, currentStage: 'negotiation', assignedTo: bda2._id, createdBy: bda2._id, notes: 'Multiple departments interested in sterilisation equipment — site visit scheduled' },
    { companyName: 'BuildRight Constructions', contactPerson: 'Rohan Mehta', email: 'rohan@buildright.com', phone: '+91-3210987654', industry: 'Construction', source: 'Referral', expectedDealValue: 150000, currentStage: 'won', assignedTo: bda1._id, createdBy: bda1._id, notes: 'Deal closed — ordered 2 concrete mixer units. Delivery scheduled June' },
    { companyName: 'PackWell Industries', contactPerson: 'Ananya Gupta', email: 'ananya@packwell.com', phone: '+91-2109876543', industry: 'Packaging', source: 'Cold Call', expectedDealValue: 75000, currentStage: 'lost', assignedTo: bda2._id, createdBy: bda2._id, notes: 'Chose competitor — pricing was too high for their budget' },
    { companyName: 'AgriGrow Farms', contactPerson: 'Devendra Singh', email: 'devendra@agrigrow.com', phone: '+91-1098765432', industry: 'Agriculture', source: 'Website', expectedDealValue: 450000, currentStage: 'new', assignedTo: bda1._id, createdBy: bda1._id, notes: 'New inquiry — looking for automated irrigation systems for 500-acre farm' },
    { companyName: 'LogiTrans Solutions', contactPerson: 'Kavita Desai', email: 'kavita@logitrans.com', phone: '+91-9988776655', industry: 'Logistics', source: 'LinkedIn', expectedDealValue: 600000, currentStage: 'contacted', assignedTo: bda2._id, createdBy: bda2._id, notes: 'Follow-up call scheduled for conveyor belt system demo' },
    { companyName: 'Precision Tools Co', contactPerson: 'Arun Nair', email: 'arun@precisiontools.com', phone: '+91-8877665544', industry: 'Manufacturing', source: 'Referral', expectedDealValue: 320000, currentStage: 'new', assignedTo: bda1._id, createdBy: bda1._id, notes: 'Referred by SteelMakers — needs CNC tooling solutions' },
    { companyName: 'EcoBuild Materials', contactPerson: 'Meera Iyer', email: 'meera@ecobuild.com', phone: '+91-7766554433', industry: 'Construction', source: 'Trade Show', expectedDealValue: 950000, currentStage: 'requirement_gathered', assignedTo: bda2._id, createdBy: bda2._id, notes: 'Interested in eco-friendly brick pressing machines — MOQ discussion pending' },
    { companyName: 'PharmaCure Labs', contactPerson: 'Dr. Sanjay Gupta', email: 'sanjay@pharmacure.com', phone: '+91-6655443322', industry: 'Healthcare', source: 'Conference', expectedDealValue: 1500000, currentStage: 'quotation_sent', assignedTo: bda1._id, createdBy: bda1._id, notes: 'Quotation sent for tablet coating machine and packaging line' },
    { companyName: 'SwiftLogistics', contactPerson: 'Rahul Verma', email: 'rahul@swiftlogistics.com', phone: '+91-5544332211', industry: 'Logistics', source: 'Website', expectedDealValue: 180000, currentStage: 'contacted', assignedTo: bda2._id, createdBy: bda2._id, notes: 'Needs warehouse conveyor system — initial discussion done' },
  ];

  const leads = await Lead.create(leadData);
  console.log(`Created ${leads.length} leads`);

  // Create client from won lead
  const wonLead = leads.find(l => l.currentStage === 'won');
  await Client.create({
    leadId: wonLead._id,
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
    { title: 'Send product brochure', description: 'Send CNC-5000 brochure to TechCorp', leadId: leads[0]._id, assignedTo: bda1._id, dueDate: daysAgo(1), priority: 'high', status: 'pending', createdBy: bda1._id },
    { title: 'Prepare quotation for AutoParts', description: 'Create HP-100 quotation for 5 units', leadId: leads[1]._id, assignedTo: bda1._id, dueDate: daysAgo(0), priority: 'high', status: 'pending', createdBy: bda1._id },
    { title: 'Arrange demo for SteelMakers', description: 'Product demo of custom automation line', leadId: leads[2]._id, assignedTo: bda2._id, dueDate: daysFromNow(1), priority: 'medium', status: 'pending', createdBy: bda2._id },
    { title: 'Follow up on quotation', description: 'Call GreenEnergy about Q-2026-0001', leadId: leads[3]._id, assignedTo: bda2._id, dueDate: daysFromNow(2), priority: 'medium', status: 'pending', createdBy: bda2._id },
    { title: 'Negotiation meeting', description: 'Finalize FP-200 pricing with FoodTech', leadId: leads[4]._id, assignedTo: bda1._id, dueDate: daysFromNow(3), priority: 'high', status: 'pending', createdBy: manager._id },
    { title: 'Schedule site visit', description: 'Arrange MedEquip sterilisation equipment demo', leadId: leads[5]._id, assignedTo: bda2._id, dueDate: daysFromNow(5), priority: 'medium', status: 'pending', createdBy: bda2._id },
    { title: 'Welcome call to BuildRight', description: 'Onboarding call with new client', leadId: leads[6]._id, assignedTo: bda1._id, dueDate: daysAgo(3), priority: 'medium', status: 'completed', createdBy: bda1._id },
    { title: 'Research AgriGrow', description: 'Research farm size and requirements before call', leadId: leads[8]._id, assignedTo: bda1._id, dueDate: daysFromNow(1), priority: 'low', status: 'pending', createdBy: bda1._id },
    { title: 'Call LogiTrans', description: 'Follow up on demo request', leadId: leads[9]._id, assignedTo: bda2._id, dueDate: daysFromNow(1), priority: 'high', status: 'pending', createdBy: manager._id },
    { title: 'Precision Tools initial call', description: 'First call with Arun from Precision Tools', leadId: leads[10]._id, assignedTo: bda1._id, dueDate: daysFromNow(2), priority: 'medium', status: 'pending', createdBy: bda1._id },
    { title: 'EcoBuild MOQ discussion', description: 'Discuss minimum order quantities for brick press', leadId: leads[11]._id, assignedTo: bda2._id, dueDate: daysFromNow(4), priority: 'medium', status: 'pending', createdBy: manager._id },
    { title: 'PharmaCure quotation follow-up', description: 'Follow up on Q-2026-0004 sent to PharmaCure', leadId: leads[12]._id, assignedTo: bda1._id, dueDate: daysFromNow(3), priority: 'high', status: 'pending', createdBy: bda1._id },
    { title: 'Review SwiftLogistics requirements', description: 'Review warehouse dimensions for conveyor system', leadId: leads[13]._id, assignedTo: bda2._id, dueDate: daysFromNow(6), priority: 'low', status: 'pending', createdBy: bda2._id },
  ];

  const tasks = await Task.create(taskData);
  console.log(`Created ${tasks.length} tasks`);

  // Create activities
  const activityData = [
    { leadId: leads[1]._id, userId: bda1._id, type: 'call', message: 'Spoke with Priya. She is interested in our CNC-5000 model. Requested quotation for 5 units.' },
    { leadId: leads[2]._id, userId: bda2._id, type: 'meeting', message: 'Met Amit at the India Manufacturing Expo. He needs custom automation line for steel pipe fabrication.' },
    { leadId: leads[3]._id, userId: bda2._id, type: 'note', message: 'Sent quotation Q-2026-0001 for solar panel assembly line. Waiting for response.' },
    { leadId: leads[4]._id, userId: bda1._id, type: 'follow_up', message: 'Vikram wants 15% discount on bulk order of FP-200 units. Need manager approval.' },
    { leadId: leads[5]._id, userId: bda2._id, type: 'note', message: 'Dr. Reddy requested a site visit to inspect sterilisation equipment. Scheduled for next week.' },
    { leadId: leads[6]._id, userId: bda1._id, type: 'call', message: 'Rohan confirmed the order for 2 concrete mixers. Delivery scheduled for June 15.' },
    { leadId: leads[0]._id, userId: bda1._id, type: 'note', message: 'Rajesh visited the website and downloaded CNC-5000 brochure after email campaign.' },
    { leadId: leads[9]._id, userId: bda2._id, type: 'follow_up', message: 'Kavita wants to see a demo of the conveyor belt system at our facility.' },
    { leadId: leads[10]._id, userId: bda1._id, type: 'call', message: 'First call with Arun — referred by SteelMakers. Needs CNC tooling for precision parts.' },
    { leadId: leads[11]._id, userId: bda2._id, type: 'meeting', message: 'Met Meera at GreenBuild Summit. Interested in eco-friendly brick pressing machines.' },
    { leadId: leads[12]._id, userId: bda1._id, type: 'note', message: 'Sent quotation Q-2026-0004 for tablet coating machine and packaging line.' },
    { leadId: leads[13]._id, userId: bda2._id, type: 'call', message: 'Spoke with Rahul. He needs conveyor system for new warehouse in Pune.' },
    { leadId: leads[4]._id, userId: bda1._id, type: 'meeting', message: 'In-person meeting at FoodTech factory. Discussed customization options.' },
    { leadId: leads[0]._id, userId: bda1._id, type: 'follow_up', message: 'Sent CNC-5000 specifications as requested. Rajesh will discuss with engineering team.' },
    { leadId: leads[8]._id, userId: bda1._id, type: 'note', message: 'Researched AgriGrow Farms — 500-acre farm in Punjab. Needs automated drip irrigation system.' },
  ];

  const activities = await Activity.create(activityData);
  console.log(`Created ${activities.length} activities`);

  // Create quotations
  const quotationData = [
    {
      leadId: leads[3]._id,
      quotationNumber: 'Q-2026-0001',
      items: [
        { productName: 'Solar Panel Assembly Line SP-2000', quantity: 1, unitPrice: 650000, totalPrice: 650000, moq: 1, deliveryEstimate: '16 weeks' },
        { productName: 'Installation & Commissioning', quantity: 1, unitPrice: 85000, totalPrice: 85000, moq: 1, deliveryEstimate: '4 weeks' },
        { productName: 'Training Package', quantity: 1, unitPrice: 30000, totalPrice: 30000, moq: 1, deliveryEstimate: '1 week' },
      ],
      subtotal: 765000,
      tax: 76500,
      grandTotal: 841500,
      status: 'sent',
      version: 1,
      createdBy: bda2._id,
    },
    {
      leadId: leads[4]._id,
      quotationNumber: 'Q-2026-0002',
      items: [
        { productName: 'Food Processing Unit FP-200', quantity: 1, unitPrice: 280000, totalPrice: 280000, moq: 1, deliveryEstimate: '12 weeks' },
        { productName: 'Conveyor Belt System CB-100', quantity: 1, unitPrice: 45000, totalPrice: 45000, moq: 1, deliveryEstimate: '6 weeks' },
        { productName: 'Stainless Steel Tanks (500L)', quantity: 3, unitPrice: 35000, totalPrice: 105000, moq: 1, deliveryEstimate: '8 weeks' },
        { productName: '1-Year Maintenance Contract', quantity: 1, unitPrice: 25000, totalPrice: 25000, moq: 1, deliveryEstimate: 'Ongoing' },
      ],
      subtotal: 455000,
      tax: 45500,
      grandTotal: 500500,
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
        { productName: 'Die Set Kit', quantity: 2, unitPrice: 8000, totalPrice: 16000, moq: 1, deliveryEstimate: '3 weeks' },
      ],
      subtotal: 151000,
      tax: 15100,
      grandTotal: 166100,
      status: 'accepted',
      version: 1,
      createdBy: bda1._id,
    },
    {
      leadId: leads[12]._id,
      quotationNumber: 'Q-2026-0004',
      items: [
        { productName: 'Tablet Coating Machine TC-300', quantity: 1, unitPrice: 420000, totalPrice: 420000, moq: 1, deliveryEstimate: '14 weeks' },
        { productName: 'Pharma Packaging Line PL-50', quantity: 1, unitPrice: 380000, totalPrice: 380000, moq: 1, deliveryEstimate: '12 weeks' },
        { productName: 'Validation & Documentation', quantity: 1, unitPrice: 75000, totalPrice: 75000, moq: 1, deliveryEstimate: '4 weeks' },
      ],
      subtotal: 875000,
      tax: 87500,
      grandTotal: 962500,
      status: 'sent',
      version: 1,
      createdBy: bda1._id,
    },
  ];

  const quotations = await Quotation.create(quotationData);
  console.log(`Created ${quotations.length} quotations`);

  console.log('\n✅ Seed complete!');
  console.log('\nUsers:');
  console.log(`  Admin:   admin@example.com (Alex Admin)`);
  console.log(`  Manager: degen@example.com (Degen)`);
  console.log(`  BDA 1:   tanmay@example.com (Tanmay)`);
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
