import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getPackageLabel } from '../constants/packageTypes';

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

  // NX dispute resolution form state
  const [resolutionNote, setResolutionNote] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getDispatch(token, dispatchId);
      setDispatch(data);

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

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      alert('Add a resolution note before marking this resolved.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.resolveDispute(token, dispatchId, resolutionNote.trim());
      if (res.ok) {
        setResolutionNote('');
        await load();
        onChanged?.();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to resolve dispute');
      }
    } catch (err) {
      console.error('Resolve dispute error:', err);
      alert('Unable to reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading dispatch...</div>;
  }
  if (!dispatch) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Dispatch not found.</div>;
  }

  const editable = user.role === 'RECEIVER' && dispatch.status === 'pending';
  const canResolve = (user.role === 'NX' || user.role === 'ADMIN') && dispatch.status === 'disputed';
  const lines = editable ? formLines : (dispatch.lines || []);

  return (
    <div>
      <button className="btn-action" onClick={onBack} style={{ marginBottom: '16px' }}>← Back</button>

      <div className="header-row">
        <h1 className="page-title">{dispatch.transaction_id}</h1>
        <span className={`dispatch-status ${dispatch.status}`}>{dispatch.status.replace('_', ' ')}</span>
      </div>

      <div className="panel" style={{ background: '#FFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px 24px', margin: '16px 0' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>{dispatch.receiver_name} ({dispatch.receiver_code})</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.9rem' }}>
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

      <div className="panel" style={{ background: '#FFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px 24px', margin: '16px 0' }}>
        <h3 style={{ marginBottom: '4px' }}>{editable ? 'Confirm received quantity' : 'Package summary'}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
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
                  <td>{getPackageLabel(l.package_code)}</td>
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
        <div className="panel" style={{ background: '#FFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px 24px', margin: '16px 0' }}>
          <h3>Resolution note</h3>
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

      {canResolve && (
        <div className="panel" style={{ background: '#FFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px 24px', margin: '16px 0' }}>
          <h3>Resolve dispute</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>
            Add a resolution note — this closes the dispute and moves it into the receiver's history.
          </p>
          <form onSubmit={handleResolve}>
            <textarea
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Verified CCTV, recovered misrouted carton, handed over on-site."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '12px' }}
            />
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Mark resolved'}
            </button>
          </form>
        </div>
      )}

      {user.role === 'RECEIVER' && dispatch.status === 'disputed' && (
        <div style={{ padding: '10px 12px', background: '#FEF3C7', color: '#B45309', borderRadius: '6px', fontSize: '0.85rem' }}>
          This dispute is with the NX dispatch team. You'll see it move to History once they mark it resolved.
        </div>
      )}
    </div>
  );
}
