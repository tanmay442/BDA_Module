export const STAGES = [
  'new',
  'contacted',
  'requirement_gathered',
  'quotation_sent',
  'negotiation',
  'won',
  'lost',
];

export const STAGE_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  requirement_gathered: 'Requirements Gathered',
  quotation_sent: 'Quotation Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export const STAGE_LABELS_SHORT = {
  new: 'New',
  contacted: 'Contacted',
  requirement_gathered: 'Req. Gathered',
  quotation_sent: 'Quotation',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export const STAGE_LABELS_KANBAN = {
  new: 'New',
  contacted: 'Contacted',
  requirement_gathered: 'Req. Gathered',
  quotation_sent: 'Quote Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export const STAGE_ACCENTS = {
  new: 'gray',
  contacted: 'blue',
  requirement_gathered: 'yellow',
  quotation_sent: 'purple',
  negotiation: 'orange',
  won: 'green',
  lost: 'red',
};

export const PIPELINE_STAGES = [
  'new',
  'contacted',
  'requirement_gathered',
  'quotation_sent',
  'negotiation',
  'won',
];

export const QUOTATION_STATUSES = ['draft', 'sent', 'revised', 'accepted', 'rejected'];

export const TASK_STATUSES = ['pending', 'completed'];

export const TASK_PRIORITIES = ['low', 'medium', 'high'];

export const ROLES = ['admin', 'manager', 'bda'];

export const LEAD_UPDATE_FIELDS = [
  'companyName',
  'contactPerson',
  'email',
  'phone',
  'industry',
  'source',
  'expectedDealValue',
  'notes',
  'assignedTo',
];

export const TASK_UPDATE_FIELDS = [
  'title',
  'description',
  'leadId',
  'assignedTo',
  'dueDate',
  'priority',
  'status',
];

export const QUOTATION_UPDATE_FIELDS = [
  'leadId',
  'items',
  'subtotal',
  'tax',
  'grandTotal',
  'status',
];
