import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getPackageLabel } from '../constants/packageTypes';
import { NX_DECISIONS, EVENT_LABELS, getActorLabel, getDecisionLabel, getStatusLabel } from '../constants/statuses';
import { formatEventTime } from '../utils/dispatchExport';

const toDatetimeLocal = (value) => {
  const d = value ? new Date(value) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '—');

export default function DispatchDetail({ token, user, dispatchId, onBack, onChanged }) {
  const [dispatch, setDispatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Receiver confirmation form state
  const [receivingDateTime, setReceivingDateTime] = useState('');
  const [formLines, setFormLines] = useState([]);

  // NX reply (Disputed / Open ticket) and Open ticket remark form state
  const [replyDecision, setReplyDecision] = useState('');
  const [remarkText, setRemarkText] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getDispatch(token, dispatchId);
      setDispatch(data);
      setReplyDecision(data.nx_decision || '');
      // Opening a dispatch marks it read, so refresh the unread badges.
      onChanged?.();

      if (user.role === 'RECEIVER' && data.status === 'pending') {
        setReceivingDateTime(toDatetimeLocal(null));
        setFormLines(
          (data.lines || []).map((l) => ({
            ...l,
            received_qty: l.dispatched_qty,
            confirm_status: 'Accepted',
            remark: ''
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load dispatch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && dispatchId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, dispatchId]);

  const updateLineQty = (lineId, value) => {
    setFormLines((prev) => prev.map((l) => {
      if (l.id !== lineId) return l;
      const receivedQty = Number(value) || 0;
      return { ...l, received_qty: receivedQty, confirm_status: receivedQty === l.dispatched_qty ? 'Accepted' : 'Disputed' };
    }));
  };

  const updateLineRemark = (lineId, value) => {
    setFormLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, remark: value } : l)));
  };

  const handleSubmitReceipt = async (e) => {
    e.preventDefault();

    const missingRemark = formLines.some((l) => l.confirm_status === 'Disputed' && !l.remark.trim());
    if (missingRemark) {
      alert('Add a remark for every disputed line before submitting.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.submitReceipt(token, dispatchId, {
        receiving_date_time: new Date(receivingDateTime).toISOString(),
        lines: formLines.map((l) => ({ id: l.id, received_qty: l.received_qty, remark: l.remark || null }))
      });
      if (res.ok) {
        await load();
        onChanged?.();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to submit receipt');
      }
    } catch (err) {
      console.error('Submit receipt error:', err);
      alert('Unable to reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Runs a dispute action (reply / remark / resolve) and reloads on success.
  const runAction = async (request, failMessage) => {
    setSaving(true);
    try {
      const res = await request();
      if (res.ok) {
        setRemarkText('');
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || failMessage);
      }
    } catch (err) {
      console.error(`${failMessage}:`, err);
      alert('Unable to reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReply = (e) => {
    e.preventDefault();
    if (!replyDecision) {
      alert('Choose your reply to the supplier.');
      return;
    }
    if (!remarkText.trim()) {
      alert('Add a remark explaining your reply.');
      return;
    }
    runAction(() => api.replyToDispute(token, dispatchId, replyDecision, remarkText.trim()), 'Failed to send reply');
  };

  // In an open ticket NX may also change its answer; a changed answer is sent
  // as a new reply so the history keeps both.
  const handleAddRemark = () => {
    if (!remarkText.trim()) {
      alert('Type a remark first.');
      return;
    }
    const decisionChanged = isNx && replyDecision && replyDecision !== dispatch.nx_decision;
    runAction(
      () => decisionChanged
        ? api.replyToDispute(token, dispatchId, replyDecision, remarkText.trim())
        : api.addRemark(token, dispatchId, remarkText.trim()),
      'Failed to add remark'
    );
  };

  const handleResolve = () => {
    if (!remarkText.trim()) {
      alert('Add a closing remark before resolving.');
      return;
    }
    if (!window.confirm(`Resolve ${dispatch.transaction_id}? This closes the ticket for both NX and the supplier.`)) return;
    runAction(() => api.resolveTicket(token, dispatchId, remarkText.trim()), 'Failed to resolve ticket');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading dispatch...</div>;
  }
  if (!dispatch) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Dispatch not found.</div>;
  }

  const editable = user.role === 'RECEIVER' && dispatch.status === 'pending';
  const isNx = user.role === 'NX' || user.role === 'ADMIN';
  const canReply = isNx && dispatch.status === 'disputed';
  const isOpenTicket = dispatch.status === 'open';
  const events = dispatch.events || [];
  const resolvedEvent = [...events].reverse().find((ev) => ev.event_type === 'resolved');
  const lines = editable ? formLines : (dispatch.lines || []);

  return (
    <div>
      <button className="btn-action" onClick={onBack} style={{ marginBottom: '16px' }}>← Back</button>

      <div className="header-row">
        <h1 className="page-title">{dispatch.transaction_id}</h1>
        <span className={`dispatch-status ${dispatch.status}`}>{getStatusLabel(dispatch.status)}</span>
      </div>

      <div className="panel">
        <p className="sub" style={{ marginBottom: '12px' }}>{dispatch.receiver_name} ({dispatch.receiver_code})</p>
        <div className="detail-grid">
          <div><b>Dispatch date &amp; time</b><br />{formatDateTime(dispatch.dispatch_date_time)}</div>
          <div>
            <b>Receiving date &amp; time</b><br />
            {editable ? (
              <input type="datetime-local" value={receivingDateTime} onChange={(e) => setReceivingDateTime(e.target.value)} />
            ) : formatDateTime(dispatch.receiving_date_time)}
          </div>
          <div><b>Vehicle no.</b><br />{dispatch.vehicle_no || 'N/A'}</div>
          <div><b>Warehouse PIC</b><br />{dispatch.warehouse_pic}</div>
          <div><b>Dispatch submitted at</b><br />{formatDateTime(dispatch.dispatch_submitted_at)}</div>
          <div><b>Receipt submitted at</b><br />{formatDateTime(dispatch.receipt_submitted_at)}</div>
        </div>
      </div>

      <div className="panel">
        <h3>{editable ? 'Confirm received quantity' : 'Package summary'}</h3>
        <p className="sub">
          {editable ? 'Dispatched quantity is fixed. Enter what you received — confirmation is set automatically from the quantity match.' : 'This dispatch has already been submitted.'}
        </p>
        <table className="custom-table">
          <thead>
            <tr>
              <th>TYPE</th>
              <th>DISPATCHED</th>
              <th>RECEIVED</th>
              <th>SHORT/EXCESS</th>
              <th>CONFIRMATION</th>
              <th>REMARKS</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const diff = l.received_qty === null || l.received_qty === undefined ? null : l.received_qty - l.dispatched_qty;
              return (
                <tr key={l.id}>
                  <td>
                    {getPackageLabel(l.package_code)}
                    {l.description && <span style={{ color: 'var(--text-muted)' }}> — {l.description}</span>}
                  </td>
                  <td>{l.dispatched_qty}</td>
                  <td>
                    {editable ? (
                      <input
                        type="number"
                        min="0"
                        value={l.received_qty}
                        onChange={(e) => updateLineQty(l.id, e.target.value)}
                        style={{ width: '90px', padding: '6px 8px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      />
                    ) : (l.received_qty ?? '—')}
                  </td>
                  <td style={{ color: diff > 0 ? '#16A34A' : diff < 0 ? '#DC2626' : 'var(--text-muted)' }}>
                    {diff === null ? '—' : (diff > 0 ? `+${diff}` : diff)}
                  </td>
                  <td>
                    {l.confirm_status ? (
                      <span className={`dispatch-status ${l.confirm_status === 'Disputed' ? 'disputed' : 'confirmed'}`}>{l.confirm_status}</span>
                    ) : '—'}
                  </td>
                  <td>
                    {editable ? (
                      <input
                        type="text"
                        placeholder={l.confirm_status === 'Disputed' ? 'Required — explain the mismatch' : 'e.g. Nil'}
                        value={l.remark}
                        onChange={(e) => updateLineRemark(l.id, e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      />
                    ) : (l.remark || '—')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {editable && formLines.some((l) => l.confirm_status === 'Disputed') && (
          <div style={{ marginTop: '14px', padding: '10px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '6px', fontSize: '0.85rem' }}>
            Quantity mismatch detected on one or more lines — marked Disputed automatically. A remark is required on each before you can submit, and NX will be notified.
          </div>
        )}
      </div>

      {dispatch.status === 'resolved' && dispatch.resolution_note && (
        <div className="panel">
          <h3>Resolution</h3>
          <p className="sub">
            {resolvedEvent ? `Resolved by ${getActorLabel(resolvedEvent.actor_role, resolvedEvent.actor_name)} · ${formatEventTime(resolvedEvent)}` : 'Resolved'}
            {dispatch.nx_decision && ` · NX reply: "${getDecisionLabel(dispatch.nx_decision)}"`}
          </p>
          <p style={{ color: 'var(--text-dark)' }}>{dispatch.resolution_note}</p>
        </div>
      )}

      {editable && (
        <form onSubmit={handleSubmitReceipt}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Submitting...' : 'Confirm & submit entry'}
          </button>
        </form>
      )}

      {canReply && (
        <div className="panel">
          <h3>Reply to supplier</h3>
          <p className="sub">
            Choose your answer and explain it. The dispatch moves to <b>Open ticket</b> and the supplier is notified.
          </p>
          <form onSubmit={handleReply}>
            <DecisionChoice value={replyDecision} onChange={setReplyDecision} />
            <textarea
              rows={3}
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder="e.g. Loading sheet and gate CCTV show 60 cartons loaded."
              className="remark-input"
            />
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Sending...' : 'Send reply'}
            </button>
          </form>
        </div>
      )}

      {user.role === 'RECEIVER' && dispatch.status === 'disputed' && (
        <div className="notice warning">
          Your mismatch report is with the NX dispatch team. You'll be notified here when they reply.
        </div>
      )}

      {isOpenTicket && (
        <div className="panel">
          <h3>Open ticket</h3>
          {dispatch.nx_decision && (
            <div className={`decision-banner ${dispatch.nx_decision}`}>
              NX reply: <b>{getDecisionLabel(dispatch.nx_decision)}</b>
            </div>
          )}
          <p className="sub">
            Add a remark to continue the discussion, or resolve the ticket with a closing remark once both sides agree.
          </p>
          {isNx && (
            <>
              <label className="field-label">NX reply (change it if your answer has changed)</label>
              <DecisionChoice value={replyDecision} onChange={setReplyDecision} />
            </>
          )}
          <textarea
            rows={3}
            value={remarkText}
            onChange={(e) => setRemarkText(e.target.value)}
            placeholder={isNx ? 'Your remark to the supplier' : 'Your remark to NX'}
            className="remark-input"
          />
          <div className="action-btn-group">
            <button type="button" className="btn-action" disabled={saving} onClick={handleAddRemark}>
              {saving ? 'Saving...' : 'Add remark'}
            </button>
            <button type="button" className="btn-primary" disabled={saving} onClick={handleResolve}>
              Resolve
            </button>
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div className="panel">
          <h3>History</h3>
          <p className="sub">Everything that has happened to this dispatch, oldest first.</p>
          <ol className="timeline">
            {events.map((ev) => (
              <li key={ev.id} className={`timeline-item ${ev.actor_role === 'RECEIVER' ? 'supplier' : 'nx'} ${ev.event_type}`}>
                <div className="timeline-meta">
                  <span>{formatEventTime(ev)}</span>
                  <span>·</span>
                  <b>{getActorLabel(ev.actor_role, ev.actor_name)}</b>
                </div>
                <div className="timeline-title">{EVENT_LABELS[ev.event_type] || ev.event_type}</div>
                {ev.decision && <div className="timeline-decision">"{getDecisionLabel(ev.decision)}"</div>}
                {ev.remark && <div className="timeline-remark">{ev.remark}</div>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function DecisionChoice({ value, onChange }) {
  return (
    <div className="decision-choice">
      {NX_DECISIONS.map((d) => (
        <label key={d.value} className={`decision-option ${value === d.value ? 'selected' : ''}`}>
          <input type="radio" name="nx-decision" value={d.value} checked={value === d.value} onChange={() => onChange(d.value)} />
          {d.label}
        </label>
      ))}
    </div>
  );
}
