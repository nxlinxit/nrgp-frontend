export const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  disputed: 'Disputed',
  open: 'Open ticket',
  resolved: 'Resolved'
};

export const getStatusLabel = (status) => STATUS_LABELS[status] || status;

// NX's answer to a dispute.
export const NX_DECISIONS = [
  { value: 'accept_mismatch', label: 'Yes, we accept the mismatch entry' },
  { value: 'dispatched_correct', label: 'No, we have dispatched the right quantity as per the entry' }
];

export const getDecisionLabel = (value) => NX_DECISIONS.find((d) => d.value === value)?.label || '';

export const EVENT_LABELS = {
  created: 'Dispatch created',
  receipt_confirmed: 'Receipt confirmed — all quantities match',
  mismatch_reported: 'Supplier reported a mismatch',
  nx_reply: 'NX replied',
  remark: 'Remark added',
  resolved: 'Ticket resolved'
};

const isNx = (role) => role === 'NX' || role === 'ADMIN';

// "Anita Desai (NX)" / "Apex Auto Components (Supplier)".
export const getActorLabel = (role, name) => {
  if (isNx(role)) return name ? `${name} (NX)` : 'NX';
  return name ? `${name} (Supplier)` : 'Supplier';
};
