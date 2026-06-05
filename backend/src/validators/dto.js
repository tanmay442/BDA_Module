const { z } = require('zod');
const { STAGES, QUOTATION_STATUSES, TASK_STATUSES, TASK_PRIORITIES } = require('../constants/stages');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const leadCreate = z.object({
  companyName: z.string().trim().min(1).max(200),
  contactPerson: z.string().trim().max(200).optional().default(''),
  email: z.string().trim().email().max(200).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().default(''),
  source: z.string().trim().max(80).optional().default(''),
  currentStage: z.enum(STAGES).optional(),
  expectedDealValue: z.number().nonnegative().optional().default(0),
  notes: z.string().max(5000).optional().default(''),
  assignedTo: objectId.optional(),
}).strict();

const leadUpdate = z.object({
  companyName: z.string().trim().min(1).max(200).optional(),
  contactPerson: z.string().trim().max(200).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional(),
  source: z.string().trim().max(80).optional(),
  currentStage: z.enum(STAGES).optional(),
  expectedDealValue: z.number().nonnegative().optional(),
  notes: z.string().max(5000).optional(),
  assignedTo: objectId.optional(),
}).strict();

const leadStageUpdate = z.object({
  stage: z.enum(STAGES),
}).strict();

const taskCreate = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  leadId: objectId.optional(),
  assignedTo: objectId.optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(TASK_PRIORITIES).optional().default('medium'),
  status: z.enum(TASK_STATUSES).optional().default('pending'),
}).strict();

const taskUpdate = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  leadId: objectId.optional(),
  assignedTo: objectId.optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  status: z.enum(TASK_STATUSES).optional(),
}).strict();

const quotationItem = z.object({
  productName: z.string().trim().min(1).max(200),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  moq: z.number().int().positive().optional(),
  deliveryEstimate: z.string().trim().max(120).optional(),
}).strict();

const quotationCreate = z.object({
  leadId: objectId.optional(),
  items: z.array(quotationItem).min(1),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative().optional().default(0),
  grandTotal: z.number().nonnegative(),
}).strict();

const quotationUpdate = z.object({
  items: z.array(quotationItem).min(1).optional(),
  subtotal: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  grandTotal: z.number().nonnegative().optional(),
  status: z.enum(QUOTATION_STATUSES).optional(),
}).strict();

const clientCreate = z.object({
  leadId: objectId,
  companyName: z.string().trim().min(1).max(200),
  contactPerson: z.string().trim().max(200).optional().default(''),
  email: z.string().trim().email().max(200).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().default(''),
  gstNumber: z.string().trim().max(40).optional().default(''),
  address: z.string().trim().max(500).optional().default(''),
  accountManager: objectId.optional(),
}).strict();

const userOnboard = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  role: z.enum(['bda', 'manager']).optional(),
  company: z.string().trim().min(1).max(200),
}).strict();

const roleUpdate = z.object({
  role: z.enum(['admin', 'manager', 'bda']),
}).strict();

const activityCreate = z.object({
  leadId: objectId,
  type: z.string().trim().min(1).max(40),
  message: z.string().trim().min(1).max(2000),
}).strict();

const demoSwitchRole = z.object({
  targetRole: z.enum(['bda', 'manager', 'admin']),
}).strict();

module.exports = {
  objectId,
  leadCreate,
  leadUpdate,
  leadStageUpdate,
  taskCreate,
  taskUpdate,
  quotationCreate,
  quotationUpdate,
  clientCreate,
  userOnboard,
  roleUpdate,
  activityCreate,
  demoSwitchRole,
};
