import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PKG_TYPES } from '../constants/packageTypes';

const emptyQuantities = () => Object.fromEntries(PKG_TYPES.map((p) => [p.code, 0]));
const emptyDescriptions = () => Object.fromEntries(PKG_TYPES.filter((p) => p.hasDescription).map((p) => [p.code, '']));

export default function NxNewDispatch({ token, user, onCreated }) {
  const [receivers, setReceivers] = useState([]);
  const [receiverId, setReceiverId] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverDetails, setDriverDetails] = useState('');
  const [quantities, setQuantities] = useState(emptyQuantities());
  const [descriptions, setDescriptions] = useState(emptyDescriptions());
  const [saving, setSaving] = useState(false);

  const loadReceivers = async () => {
    try {
      const data = await api.getReceivers(token);
      if (Array.isArray(data)) {
        setReceivers(data);
        setReceiverId(data[0]?.id || '');
      }
    } catch (err) {
      console.error('Failed to load receivers:', err);
    }
  };

  useEffect(() => {
    if (token) loadReceivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleQuantityChange = (code, value) => {
    const qty = Math.max(0, Number(value) || 0);
    setQuantities((prev) => ({ ...prev, [code]: qty }));
  };

  const handleDescriptionChange = (code, value) => {
    setDescriptions((prev) => ({ ...prev, [code]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!receiverId) {
      alert('Select a supplier before submitting.');
      return;
    }
    if (!vehicleNo.trim()) {
      alert('Vehicle no. is required.');
      return;
    }

    const lines = PKG_TYPES
      .map((p) => ({
        package_code: p.code,
        dispatched_qty: Number(quantities[p.code]) || 0,
        description: p.hasDescription ? descriptions[p.code].trim() : undefined
      }))
      .filter((line) => line.dispatched_qty > 0);

    if (lines.length === 0) {
      alert('Enter a quantity greater than zero for at least one package type.');
      return;
    }

    const missingDescription = lines.find((line) => line.description !== undefined && !line.description);
    if (missingDescription) {
      alert('Specify what the "Others" item is before submitting.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.createDispatch(token, {
        receiver_id: receiverId,
        dispatch_date_time: new Date().toISOString(),
        vehicle_no: vehicleNo,
        driver_details: driverDetails,
        lines
      });

      if (res.ok) {
        const data = await res.json();
        const receiver = receivers.find((r) => String(r.id) === String(receiverId));
        alert(`${data.dispatch.transaction_id} submitted${receiver ? ` — notification sent to ${receiver.name}` : ''}`);
        onCreated();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to create dispatch');
      }
    } catch (err) {
      console.error('Create dispatch error:', err);
      alert('Unable to reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="header-row">
        <h1 className="page-title">New dispatch entry</h1>
        <span className="breadcrumb-code">{user?.role === 'ADMIN' ? 'Admin Portal' : 'NX Portal'} / New dispatch</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="panel" style={{ maxWidth: '720px' }}>
          <h3>Dispatch details</h3>
          <p className="sub">Transaction ID is generated automatically on submit.</p>
          <div className="detail-grid">
            <div className="form-field">
              <label>Supplier <span style={{ color: '#DC2626' }}>*</span></label>
              <select required value={receiverId} onChange={(e) => setReceiverId(e.target.value)} className="form-select">
                <option value="" disabled>Select a supplier</option>
                {receivers.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} — {r.code}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Vehicle no. <span style={{ color: '#DC2626' }}>*</span></label>
              <input required value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="e.g. TN10BE8750" />
            </div>
            <div className="form-field">
              <label>Driver details <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <input value={driverDetails} onChange={(e) => setDriverDetails(e.target.value)} placeholder="Optional" />
            </div>
            <div className="form-field">
              <label>Warehouse PIC</label>
              <div style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: '#F8FAFC', color: 'var(--text-muted)' }}>
                {user?.name || 'NX Dispatch Staff'}
              </div>
            </div>
          </div>
        </div>

        <div className="panel" style={{ maxWidth: '720px' }}>
          <h3>Package quantities</h3>
          <p className="sub">Enter dispatched quantity per package type</p>
          <table className="custom-table" style={{ boxShadow: 'none' }}>
            <thead>
              <tr>
                <th>PACKAGE TYPE</th>
                <th>DESCRIPTION</th>
                <th style={{ textAlign: 'right' }}>DISPATCHED QTY</th>
              </tr>
            </thead>
            <tbody>
              {PKG_TYPES.map((p) => (
                <tr key={p.code}>
                  <td>{p.label} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({p.code})</span></td>
                  <td>
                    {p.hasDescription ? (
                      <input
                        type="text"
                        placeholder="Specify item"
                        value={descriptions[p.code]}
                        onChange={(e) => handleDescriptionChange(p.code, e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      />
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <input
                      type="number"
                      min="0"
                      value={quantities[p.code]}
                      onChange={(e) => handleQuantityChange(p.code, e.target.value)}
                      style={{ width: '100px', textAlign: 'right', padding: '6px 8px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="submit" className="btn-primary" disabled={saving || !receiverId || !vehicleNo.trim()}>
          {saving ? 'Submitting...' : 'Submit & notify supplier'}
        </button>
      </form>
    </div>
  );
}
