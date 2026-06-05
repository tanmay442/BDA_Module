const STAGES = [
  'new',
  'contacted',
  'requirement_gathered',
  'quotation_sent',
  'negotiation',
  'won',
  'lost',
];

const STAGE_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  requirement_gathered: 'Requirements Gathered',
  quotation_sent: 'Quotation Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

const STAGE_INDEX = Object.fromEntries(STAGES.map((s, i) => [s, i]));

const QUOTATION_STATUSES = ['draft', 'sent', 'revised', 'accepted', 'rejected'];
const TASK_STATUSES = ['pending', 'completed'];
const TASK_PRIORITIES = ['low', 'medium', 'high'];
const ROLES = ['admin', 'manager', 'bda'];
const PIPELINE_STAGES = [
  'new',
  'contacted',
  'requirement_gathered',
  'quotation_sent',
  'negotiation',
  'won',
];

const STAGE_LABELS_SHORT = {
  new: 'New',
  contacted: 'Contacted',
  requirement_gathered: 'Requirements',
  quotation_sent: 'Quotation',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

module.exports = {
  STAGES,
  STAGE_LABELS,
  STAGE_LABELS_SHORT,
  STAGE_INDEX,
  QUOTATION_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  ROLES,
  PIPELINE_STAGES,
};
