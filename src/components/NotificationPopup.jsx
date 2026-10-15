import React from 'react';
import { getDecisionLabel } from '../constants/statuses';

const ACTION_TEXT = {
  nx_reply: 'replied',
  remark: 'added a remark',
  resolved: 'resolved the ticket'
};

// Shown to suppliers once per batch of new NX activity on their dispatches.
export default function NotificationPopup({ items, onOpen, onLater }) {
  // Nothing left to respond to on tickets that have since been resolved.
  const resolvedIds = new Set(items.filter((i) => i.event_type === 'resolved').map((i) => i.dispatch_id));

  return (
    <div className="modal-overlay">
      <div className="modal-box notification-popup" role="dialog" aria-labelledby="notification-title">
        <h3 id="notification-title">Updates from NX</h3>
        <p className="sub">The NX dispatch team has responded on {new Set(items.map((i) => i.dispatch_id)).size === 1 ? 'a dispatch' : 'your dispatches'}.</p>

        <ul className="notification-list">
          {items.map((item) => (
            <li key={item.id}>
              <div className="notification-head">
                <b>{item.transaction_id}</b>
                <span>{new Date(item.created_at).toLocaleString()}</span>
              </div>
              <div>
                {item.actor_name || 'NX'} {ACTION_TEXT[item.event_type] || 'updated the ticket'}
                {item.decision && <>: <b>"{getDecisionLabel(item.decision)}"</b></>}
              </div>
              {item.remark && <div className="notification-remark">{item.remark}</div>}
              <button type="button" className="btn-action" onClick={() => onOpen(item)}>
                {resolvedIds.has(item.dispatch_id) ? 'View' : 'View & respond'}
              </button>
            </li>
          ))}
        </ul>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onLater}>Later</button>
        </div>
      </div>
    </div>
  );
}
