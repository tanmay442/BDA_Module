require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/modules/users/user.model');
const Lead = require('../src/modules/leads/lead.model');
const Task = require('../src/modules/tasks/task.model');
const Activity = require('../src/modules/activities/activity.model');
const Quotation = require('../src/modules/quotations/quotation.model');
const Client = require('../src/modules/clients/client.model');

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run seed in production');
  process.exit(1);
}

const today = new Date('2026-06-05T09:00:00Z');
const day = (offset) => new Date(today.getTime() + offset * 86400000);
const setTs = (Model, docs) =>
  Promise.all(
    docs.map((d) =>
      Model.collection.updateOne(
        { _id: d._id },
        { $set: { createdAt: d._ts, updatedAt: d._ts } }
      )
    )
  );

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Safety: refuse to wipe a DB that has Clerk-synced users (any user
  // whose clerkId doesn't start with 'seed_').
  const realUsers = await User.countDocuments({ clerkId: { $not: /^seed_/ } });
  if (realUsers > 0) {
    console.error(
      `Refusing to seed: ${realUsers} non-seed user(s) exist. ` +
      'This script wipes all data. Run against an empty DB.'
    );
    process.exit(1);
  }

  await Promise.all([
    User.deleteMany({}),
    Lead.deleteMany({}),
    Task.deleteMany({}),
    Activity.deleteMany({}),
    Quotation.deleteMany({}),
    Client.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  const [admin, manager, bda] = await User.create([
    { clerkId: 'seed_admin', name: 'Alex Admin', email: 'admin@example.com', role: 'admin', department: 'Management', company: 'ACME Manufacturing' },
    { clerkId: 'seed_manager', name: 'Degen', email: 'degen@example.com', role: 'manager', department: 'Sales', company: 'ACME Manufacturing' },
    { clerkId: 'seed_bda', name: 'Sarah BDA', email: 'sarah@example.com', role: 'bda', department: 'Sales', company: 'ACME Manufacturing' },
  ]);
  console.log('Created 3 users (Tanmay removed)');

  const leadSpecs = [
    { company: 'TechCorp India',          contact: 'Rajesh Kumar',   email: 'rajesh@techcorp.in',        phone: '+91-9876543210', industry: 'Technology',     source: 'Website',     value: 250000,  stage: 'new',                   owner: bda._id,    note: 'Interested in CNC-5000 series machines for their new factory',                  created: -8 },
    { company: 'AutoParts Ltd',           contact: 'Priya Sharma',   email: 'priya@autoparts.com',       phone: '+91-8765432109', industry: 'Automotive',    source: 'Referral',    value: 500000,  stage: 'contacted',             owner: bda._id,    note: 'Need quotation for 5 units of hydraulic press HP-100',                         created: -5 },
    { company: 'SteelMakers Inc',         contact: 'Amit Singh',     email: 'amit@steelmakers.com',      phone: '+91-7654321098', industry: 'Manufacturing', source: 'Trade Show', value: 1200000, stage: 'requirement_gathered',  owner: manager._id, note: 'Large order potential — custom automation line for steel fabrication',         created: -3 },
    { company: 'GreenEnergy Solutions',   contact: 'Neha Patel',     email: 'neha@greenenergy.com',      phone: '+91-6543210987', industry: 'Energy',        source: 'LinkedIn',    value: 800000,  stage: 'quotation_sent',        owner: manager._id, note: 'Quotation sent for solar panel assembly line',                                 created: 0  },
    { company: 'FoodTech Pvt Ltd',        contact: 'Vikram Joshi',   email: 'vikram@foodtech.com',       phone: '+91-5432109876', industry: 'Food Processing',source: 'Website',    value: 350000,  stage: 'negotiation',           owner: bda._id,    note: 'Negotiating pricing on FP-200 food processing unit',                            created: 12 },
    { company: 'MedEquip Corp',           contact: 'Dr. Sunita Reddy',email:'sunita@medequip.com',       phone: '+91-4321098765', industry: 'Healthcare',    source: 'Conference',  value: 2000000, stage: 'negotiation',           owner: manager._id, note: 'Multiple departments interested in sterilisation equipment — site visit set',   created: 18 },
    { company: 'BuildRight Constructions',contact: 'Rohan Mehta',    email: 'rohan@buildright.com',      phone: '+91-3210987654', industry: 'Construction',  source: 'Referral',    value: 150000,  stage: 'won',                   owner: bda._id,    note: 'Deal closed — ordered 2 concrete mixer units. Delivery scheduled next month',   created: -25 },
    { company: 'PackWell Industries',     contact: 'Ananya Gupta',   email: 'ananya@packwell.com',       phone: '+91-2109876543', industry: 'Packaging',     source: 'Cold Call',   value: 75000,   stage: 'lost',                  owner: manager._id, note: 'Chose competitor — pricing was too high for their budget',                      created: -12 },
    { company: 'AgriGrow Farms',          contact: 'Devendra Singh', email: 'devendra@agrigrow.com',     phone: '+91-1098765432', industry: 'Agriculture',   source: 'Website',     value: 450000,  stage: 'new',                   owner: bda._id,    note: 'New inquiry — automated irrigation systems for 500-acre farm',                   created: 25 },
    { company: 'LogiTrans Solutions',     contact: 'Kavita Desai',   email: 'kavita@logitrans.com',      phone: '+91-9988776655', industry: 'Logistics',     source: 'LinkedIn',    value: 600000,  stage: 'contacted',             owner: manager._id, note: 'Follow-up call scheduled for conveyor belt system demo',                         created: 30 },
    { company: 'Precision Tools Co',      contact: 'Arun Nair',      email: 'arun@precisiontools.com',   phone: '+91-8877665544', industry: 'Manufacturing', source: 'Referral',    value: 320000,  stage: 'new',                   owner: bda._id,    note: 'Referred by SteelMakers — needs CNC tooling solutions',                          created: 40 },
    { company: 'EcoBuild Materials',     contact: 'Meera Iyer',     email: 'meera@ecobuild.com',        phone: '+91-7766554433', industry: 'Construction',  source: 'Trade Show',  value: 950000,  stage: 'requirement_gathered',  owner: manager._id, note: 'Eco-friendly brick pressing machines — MOQ discussion pending',                  created: 48 },
    { company: 'PharmaCure Labs',         contact: 'Dr. Sanjay Gupta',email:'sanjay@pharmacure.com',     phone: '+91-6655443322', industry: 'Healthcare',    source: 'Conference',  value: 1500000, stage: 'quotation_sent',        owner: bda._id,    note: 'Quotation sent for tablet coating machine and packaging line',                  created: 55 },
    { company: 'SwiftLogistics',          contact: 'Rahul Verma',    email: 'rahul@swiftlogistics.com',  phone: '+91-5544332211', industry: 'Logistics',     source: 'Website',     value: 180000,  stage: 'contacted',             owner: manager._id, note: 'Warehouse conveyor system — initial discussion done',                            created: 65 },
    { company: 'Helios Power Systems',    contact: 'Pooja Bhatt',    email: 'pooja@heliospower.io',      phone: '+91-4433221100', industry: 'Energy',        source: 'LinkedIn',    value: 1750000, stage: 'requirement_gathered',  owner: bda._id,    note: 'Turbine assembly automation — Q4 evaluation pending',                            created: 78 },
    { company: 'Nimbus Cloud Kitchens',   contact: 'Karan Mehta',    email: 'karan@nimbuskc.com',        phone: '+91-3322110099', industry: 'Food Processing',source: 'Referral',  value: 280000,  stage: 'new',                   owner: manager._id, note: 'Central kitchen expansion — needs 3 processing units',                           created: 95 },
    { company: 'AeroStruct Components',   contact: 'Nidhi Rao',      email: 'nidhi@aerostruct.co',       phone: '+91-2211009988', industry: 'Manufacturing', source: 'Trade Show',  value: 2400000, stage: 'negotiation',           owner: manager._id, note: 'Aerospace-grade CNC quote under review by their board',                          created: 110 },
    { company: 'Verdant Textiles',        contact: 'Imran Khan',     email: 'imran@verdanttex.in',       phone: '+91-1100998877', industry: 'Manufacturing', source: 'Cold Call',   value: 420000,  stage: 'quotation_sent',        owner: bda._id,    note: 'Loom assembly line quote sent, awaiting response',                               created: 130 },
    { company: 'Polestar Auto',           contact: 'Tanya Malhotra', email: 'tanya@polestarauto.com',    phone: '+91-9988771122', industry: 'Automotive',    source: 'Conference',  value: 3100000, stage: 'requirement_gathered',  owner: bda._id,    note: 'EV battery housing production line — large Q4 deal potential',                   created: 150 },
    { company: 'Coastal Marine Works',    contact: 'Suresh Nair',    email: 'suresh@coastalmarine.in',   phone: '+91-8877445566', industry: 'Manufacturing', source: 'Website',     value: 880000,  stage: 'new',                   owner: manager._id, note: 'Shipyard automation — demo scheduled for late October',                          created: 175 },
  ];

  const leads = await Lead.create(
    leadSpecs.map((l) => ({
      companyName: l.company,
      contactPerson: l.contact,
      email: l.email,
      phone: l.phone,
      industry: l.industry,
      source: l.source,
      expectedDealValue: l.value,
      currentStage: l.stage,
      assignedTo: l.owner,
      createdBy: l.owner,
      notes: l.note,
    }))
  );
  await setTs(Lead, leads.map((lead, i) => ({ _id: lead._id, _ts: day(leadSpecs[i].created) })));
  console.log(`Created ${leads.length} leads`);

  const wonLead = leads.find((l) => l.currentStage === 'won');
  await Client.create({
    leadId: wonLead._id,
    companyName: 'BuildRight Constructions',
    contactPerson: 'Rohan Mehta',
    email: 'rohan@buildright.com',
    phone: '+91-3210987654',
    gstNumber: '27AABCU9603R1ZX',
    address: 'Mumbai, Maharashtra',
    accountManager: bda._id,
  });
  console.log('Created 1 client');

  const L = (idx) => leads[idx]._id;
  const taskSpecs = [
    { title: 'Send product brochure',                 leadIdx: 0,  assignee: bda._id,    due: 2,  pri: 'high',   status: 'pending',   creator: bda._id },
    { title: 'Prepare HP-100 quotation',              leadIdx: 1,  assignee: bda._id,    due: 0,  pri: 'high',   status: 'pending',   creator: bda._id },
    { title: 'Arrange SteelMakers demo',              leadIdx: 2,  assignee: manager._id, due: 5,  pri: 'medium', status: 'pending',   creator: manager._id },
    { title: 'Follow up on Q-2026-0001',              leadIdx: 3,  assignee: manager._id, due: 8,  pri: 'medium', status: 'pending',   creator: manager._id },
    { title: 'Finalize FP-200 pricing',               leadIdx: 4,  assignee: bda._id,    due: 10, pri: 'high',   status: 'pending',   creator: manager._id },
    { title: 'MedEquip site visit prep',              leadIdx: 5,  assignee: manager._id, due: 14, pri: 'medium', status: 'pending',   creator: manager._id },
    { title: 'Onboarding call with BuildRight',       leadIdx: 6,  assignee: bda._id,    due: -2, pri: 'medium', status: 'completed', creator: bda._id },
    { title: 'Research AgriGrow irrigation',           leadIdx: 8,  assignee: bda._id,    due: 18, pri: 'low',    status: 'pending',   creator: bda._id },
    { title: 'LogiTrans demo follow-up',              leadIdx: 9,  assignee: manager._id, due: 20, pri: 'high',   status: 'pending',   creator: manager._id },
    { title: 'Precision Tools intro call',            leadIdx: 10, assignee: bda._id,    due: 28, pri: 'medium', status: 'pending',   creator: bda._id },
    { title: 'EcoBuild MOQ discussion',               leadIdx: 11, assignee: manager._id, due: 35, pri: 'medium', status: 'pending',   creator: manager._id },
    { title: 'PharmaCure quotation follow-up',        leadIdx: 12, assignee: bda._id,    due: 42, pri: 'high',   status: 'pending',   creator: bda._id },
    { title: 'Review SwiftLogistics warehouse',       leadIdx: 13, assignee: manager._id, due: 50, pri: 'low',    status: 'pending',   creator: manager._id },
    { title: 'Helios turbine spec review',            leadIdx: 14, assignee: bda._id,    due: 65, pri: 'high',   status: 'pending',   creator: bda._id },
    { title: 'Nimbus kitchen layout plan',            leadIdx: 15, assignee: manager._id, due: 80, pri: 'medium', status: 'pending',   creator: manager._id },
    { title: 'AeroStruct board presentation',         leadIdx: 16, assignee: manager._id, due: 95, pri: 'high',   status: 'pending',   creator: manager._id },
    { title: 'Verdant Textiles call-back',            leadIdx: 17, assignee: bda._id,    due: 115,pri: 'medium', status: 'pending',   creator: bda._id },
    { title: 'Polestar battery line quotation',       leadIdx: 18, assignee: bda._id,    due: 135,pri: 'high',   status: 'pending',   creator: manager._id },
    { title: 'Coastal Marine demo prep',              leadIdx: 19, assignee: manager._id, due: 160,pri: 'medium', status: 'pending',   creator: manager._id },
  ];

  const tasks = await Task.create(
    taskSpecs.map((t) => ({
      title: t.title,
      leadId: L(t.leadIdx),
      assignedTo: t.assignee,
      dueDate: day(t.due),
      priority: t.pri,
      status: t.status,
    }))
  );
  await setTs(Task, tasks.map((t, i) => ({ _id: t._id, _ts: day(taskSpecs[i].due - 7) })));
  console.log(`Created ${tasks.length} tasks`);

  const activitySpecs = [
    { leadIdx: 1,  user: bda._id,    type: 'call',        msg: 'Spoke with Priya. She is interested in our CNC-5000 model. Requested quotation for 5 units.',                                       off: -4 },
    { leadIdx: 2,  user: manager._id, type: 'meeting',     msg: 'Met Amit at the India Manufacturing Expo. He needs custom automation line for steel pipe fabrication.',                                off: -3 },
    { leadIdx: 3,  user: manager._id, type: 'note',        msg: 'Sent quotation Q-2026-0001 for solar panel assembly line. Waiting for response.',                                                    off: -1 },
    { leadIdx: 4,  user: bda._id,    type: 'follow_up',   msg: 'Vikram wants 15% discount on bulk order of FP-200 units. Need manager approval.',                                                     off: 3  },
    { leadIdx: 5,  user: manager._id, type: 'note',        msg: 'Dr. Reddy requested a site visit to inspect sterilisation equipment. Scheduled for next week.',                                      off: 5  },
    { leadIdx: 6,  user: bda._id,    type: 'call',        msg: 'Rohan confirmed the order for 2 concrete mixers. Delivery scheduled for next month.',                                                  off: -20 },
    { leadIdx: 0,  user: bda._id,    type: 'note',        msg: 'Rajesh visited the website and downloaded CNC-5000 brochure after email campaign.',                                                  off: -7 },
    { leadIdx: 9,  user: manager._id, type: 'follow_up',   msg: 'Kavita wants to see a demo of the conveyor belt system at our facility.',                                                              off: 12 },
    { leadIdx: 10, user: bda._id,    type: 'call',        msg: 'First call with Arun — referred by SteelMakers. Needs CNC tooling for precision parts.',                                              off: 25 },
    { leadIdx: 11, user: manager._id, type: 'meeting',     msg: 'Met Meera at GreenBuild Summit. Interested in eco-friendly brick pressing machines.',                                                  off: 35 },
    { leadIdx: 12, user: bda._id,    type: 'note',        msg: 'Sent quotation Q-2026-0004 for tablet coating machine and packaging line.',                                                            off: 45 },
    { leadIdx: 13, user: manager._id, type: 'call',        msg: 'Spoke with Rahul. He needs conveyor system for new warehouse in Pune.',                                                                off: 55 },
    { leadIdx: 4,  user: bda._id,    type: 'meeting',     msg: 'In-person meeting at FoodTech factory. Discussed customization options.',                                                              off: 6  },
    { leadIdx: 0,  user: bda._id,    type: 'follow_up',   msg: 'Sent CNC-5000 specifications as requested. Rajesh will discuss with engineering team.',                                              off: -2 },
    { leadIdx: 8,  user: bda._id,    type: 'note',        msg: 'Researched AgriGrow Farms — 500-acre farm in Punjab. Needs automated drip irrigation system.',                                          off: 15 },
    { leadIdx: 14, user: bda._id,    type: 'meeting',     msg: 'Visited Helios facility. They are evaluating turbine assembly automation for Q4.',                                                      off: 60 },
    { leadIdx: 16, user: manager._id, type: 'note',        msg: 'AeroStruct board review scheduled for late September. Q3 close target.',                                                              off: 90 },
    { leadIdx: 18, user: bda._id,    type: 'call',        msg: 'Polestar EV division expressed strong interest. Demo planned for October.',                                                            off: 130 },
  ];

  const activities = await Activity.create(
    activitySpecs.map((a) => ({
      leadId: L(a.leadIdx),
      userId: a.user,
      type: a.type,
      message: a.msg,
    }))
  );
  await setTs(Activity, activities.map((a, i) => ({ _id: a._id, _ts: day(activitySpecs[i].off) })));
  console.log(`Created ${activities.length} activities`);

  const quotationSpecs = [
    {
      leadIdx: 3,  number: 'Q-2026-0001', owner: manager._id, status: 'sent',     off: -2,
      items: [
        { name: 'Solar Panel Assembly Line SP-2000',     qty: 1, price: 650000, moq: 1, delivery: '16 weeks' },
        { name: 'Installation & Commissioning',         qty: 1, price: 85000,  moq: 1, delivery: '4 weeks'  },
        { name: 'Training Package',                     qty: 1, price: 30000,  moq: 1, delivery: '1 week'   },
      ],
    },
    {
      leadIdx: 4,  number: 'Q-2026-0002', owner: bda._id,    status: 'revised',  off: 4,
      items: [
        { name: 'Food Processing Unit FP-200',          qty: 1, price: 280000, moq: 1, delivery: '12 weeks' },
        { name: 'Conveyor Belt System CB-100',          qty: 1, price: 45000,  moq: 1, delivery: '6 weeks'  },
        { name: 'Stainless Steel Tanks (500L)',         qty: 3, price: 35000,  moq: 1, delivery: '8 weeks'  },
        { name: '1-Year Maintenance Contract',          qty: 1, price: 25000,  moq: 1, delivery: 'Ongoing'  },
      ],
    },
    {
      leadIdx: 6,  number: 'Q-2026-0003', owner: bda._id,    status: 'accepted', off: -18,
      items: [
        { name: 'Hydraulic Press HP-100',               qty: 1, price: 120000, moq: 1, delivery: '6 weeks' },
        { name: 'Safety Guard System',                  qty: 1, price: 15000,  moq: 1, delivery: '4 weeks' },
        { name: 'Die Set Kit',                          qty: 2, price: 8000,   moq: 1, delivery: '3 weeks' },
      ],
    },
    {
      leadIdx: 12, number: 'Q-2026-0004', owner: bda._id,    status: 'sent',     off: 38,
      items: [
        { name: 'Tablet Coating Machine TC-300',        qty: 1, price: 420000, moq: 1, delivery: '14 weeks' },
        { name: 'Pharma Packaging Line PL-50',          qty: 1, price: 380000, moq: 1, delivery: '12 weeks' },
        { name: 'Validation & Documentation',           qty: 1, price: 75000,  moq: 1, delivery: '4 weeks'  },
      ],
    },
    {
      leadIdx: 17, number: 'Q-2026-0005', owner: bda._id,    status: 'sent',     off: 110,
      items: [
        { name: 'Loom Assembly Line LA-12',             qty: 2, price: 165000, moq: 1, delivery: '10 weeks' },
        { name: 'Yarn Preparation Unit',                qty: 1, price: 95000,  moq: 1, delivery: '8 weeks'  },
      ],
    },
    {
      leadIdx: 18, number: 'Q-2026-0006', owner: manager._id, status: 'draft',   off: 125,
      items: [
        { name: 'EV Battery Housing Line BH-500',       qty: 1, price: 1450000, moq: 1, delivery: '20 weeks' },
        { name: 'Robotic Welding Cell RW-3',            qty: 3, price: 320000,  moq: 1, delivery: '12 weeks' },
        { name: 'On-site Commissioning & Training',    qty: 1, price: 180000,  moq: 1, delivery: '6 weeks'  },
      ],
    },
  ];

  const quotations = await Quotation.create(
    quotationSpecs.map((q) => {
      const items = q.items.map((it) => ({
        productName: it.name,
        quantity: it.qty,
        unitPrice: it.price,
        totalPrice: it.qty * it.price,
        moq: it.moq,
        deliveryEstimate: it.delivery,
      }));
      const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
      const tax = Math.round(subtotal * 0.1);
      return {
        leadId: L(q.leadIdx),
        quotationNumber: q.number,
        items,
        subtotal,
        tax,
        grandTotal: subtotal + tax,
        status: q.status,
        version: q.status === 'revised' ? 2 : 1,
        createdBy: q.owner,
      };
    })
  );
  await setTs(Quotation, quotations.map((q, i) => ({ _id: q._id, _ts: day(quotationSpecs[i].off) })));
  console.log(`Created ${quotations.length} quotations`);

  console.log('\n✅ Seed complete!');
  console.log('\nUsers:');
  console.log(`  Admin:   admin@example.com (Alex Admin)`);
  console.log(`  Manager: degen@example.com (Degen)`);
  console.log(`  BDA:     sarah@example.com (Sarah BDA)`);
  console.log(`\nStats:`);
  console.log(`  ${leads.length} leads`);
  console.log(`  ${tasks.length} tasks`);
  console.log(`  ${activities.length} activities`);
  console.log(`  ${quotations.length} quotations`);
  console.log(`  1 client`);
  console.log(`\nDate range: 2026-06-05 to 2026-12-31`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
