import { PKG_TYPES, getPackageLabel } from '../constants/packageTypes';
import { EVENT_LABELS, getActorLabel, getDecisionLabel, getStatusLabel } from '../constants/statuses';

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '');

// Entries rebuilt from data saved before history tracking have no real
// resolve time.
export const formatEventTime = (event) =>
  event.backfilled && event.event_type === 'resolved' ? 'time not recorded' : formatDateTime(event.created_at);

const latestEvent = (events, type) => [...events].reverse().find((e) => e.event_type === type);

const issueRaised = (lines) =>
  lines
    .filter((l) => l.confirm_status === 'Disputed')
    .map((l) => `${getPackageLabel(l.package_code)}: sent ${l.dispatched_qty}, received ${l.received_qty}${l.remark ? ` - ${l.remark}` : ''}`)
    .join('; ');

const eventSummary = (e) => {
  const parts = [formatEventTime(e), getActorLabel(e.actor_role, e.actor_name), EVENT_LABELS[e.event_type] || e.event_type];
  if (e.decision) parts.push(`"${getDecisionLabel(e.decision)}"`);
  if (e.remark) parts.push(e.remark);
  return parts.join(' · ');
};

// One row per dispatch: header details, quantities per package type, the
// dispute summary and the full history (one line per entry in one cell).
export function buildDispatchRows(dispatches) {
  const qtyHeaders = PKG_TYPES.flatMap((p) => [`${p.label} Dispatched`, `${p.label} Received`, `${p.label} Short/Excess`]);
  const headers = [
    'Transaction ID', 'Supplier Code', 'Supplier', 'Status',
    'Dispatch Date & Time', 'Vehicle', 'Driver Details', 'Created By (Warehouse PIC)',
    'Dispatch Submitted', 'Receiving Date & Time', 'Receipt Submitted',
    ...qtyHeaders, 'Others Description',
    'Issue Raised', 'NX Reply', 'NX Reply By', 'Remarks Count',
    'Resolved By', 'Resolved On', 'Resolution Remark', 'Full History'
  ];

  const rows = dispatches.map((d) => {
    const lines = d.lines || [];
    const events = d.events || [];
    const qtyCells = PKG_TYPES.flatMap((p) => {
      const line = lines.find((l) => l.package_code === p.code);
      if (!line) return ['', '', ''];
      const received = line.received_qty ?? '';
      const diff = line.received_qty === null || line.received_qty === undefined ? '' : line.received_qty - line.dispatched_qty;
      return [line.dispatched_qty, received, diff];
    });
    const others = lines.find((l) => l.package_code === 'OTH-001');
    const lastReply = latestEvent(events, 'nx_reply');
    const resolvedEvent = latestEvent(events, 'resolved');

    return [
      d.transaction_id, d.receiver_code, d.receiver_name, getStatusLabel(d.status),
      formatDateTime(d.dispatch_date_time), d.vehicle_no || '', d.driver_details || '', d.warehouse_pic || '',
      formatDateTime(d.dispatch_submitted_at), formatDateTime(d.receiving_date_time), formatDateTime(d.receipt_submitted_at),
      ...qtyCells, others?.description || '',
      issueRaised(lines),
      getDecisionLabel(d.nx_decision),
      lastReply ? lastReply.actor_name || '' : '',
      events.filter((e) => e.event_type === 'remark').length,
      resolvedEvent ? getActorLabel(resolvedEvent.actor_role, resolvedEvent.actor_name) : '',
      resolvedEvent ? formatEventTime(resolvedEvent) : '',
      d.status === 'resolved' ? d.resolution_note || '' : '',
      events.map(eventSummary).join('\n')
    ];
  });

  return { headers, rows };
}

// One row per history entry — easiest to filter and pivot in Excel.
export function buildHistoryRows(dispatches) {
  const headers = ['Transaction ID', 'Supplier', 'Current Status', 'Date & Time', 'By', 'Role', 'Action', 'NX Reply', 'Remark'];
  const rows = dispatches.flatMap((d) =>
    (d.events || []).map((e) => [
      d.transaction_id,
      d.receiver_name,
      getStatusLabel(d.status),
      formatEventTime(e),
      e.actor_name || (e.actor_role === 'RECEIVER' ? 'Supplier' : 'NX'),
      e.actor_role === 'RECEIVER' ? 'Supplier' : e.actor_role === 'ADMIN' ? 'Admin' : 'NX',
      EVENT_LABELS[e.event_type] || e.event_type,
      getDecisionLabel(e.decision),
      e.remark || ''
    ])
  );
  return { headers, rows };
}
