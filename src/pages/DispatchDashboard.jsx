import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const STATUS_TABS = ['ALL', 'pending', 'in_transit', 'completed'];

export default function DispatchDashboard({ token }) {
  const [dispatches, setDispatches] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Dispatch Form State
  const [receiverId, setReceiverId] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverDetails, setDriverDetails] = useState('');
  const [packageCode, setPackageCode] = useState('');
  const [quantity, setQuantity] = useState(1);

  const loadDispatches = async () => {
    setLoading(true);
    try {
      const data = await api.getDispatches(token, activeFilter === 'ALL' ? {} : { status: activeFilter });
      setDispatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load dispatches:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReceivers = async () => {
    try {
      const data = await api.getReceivers(token);
      if (Array.isArray(data)) setReceivers(data);
    } catch (err) {
      console.error('Failed to load receivers:', err);
    }
  };

  useEffect(() => {
    if (token) loadDispatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeFilter]);

  useEffect(() => {
    if (token) loadReceivers();
  }, [token]);

  const openCreateModal = () => {
    setReceiverId(receivers[0]?.id || '');
    setVehicleNo('');
    setDriverDetails('');
    setPackageCode('');
    setQuantity(1);
    setShowCreateModal(true);
  };

  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.createDispatch(token, {
        receiver_id: receiverId,
        dispatch_date_time: new Date().toISOString(),
        vehicle_no: vehicleNo,
        driver_details: driverDetails,
        lines: [{ package_code: packageCode, dispatched_qty: Number(quantity) }]
      });

      if (res.ok) {
        setShowCreateModal(false);
        loadDispatches();
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
        <h1 className="page-title">Dispatch Operations</h1>
        <span className="breadcrumb-code">Employee Portal / Dispatches</span>
      </div>

      <div className="sub-header-row">
        <div className="filter-tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeFilter === tab ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab)}
            >
              {tab === 'ALL' ? 'All' : tab.replace('_', ' ')}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={openCreateModal}>+ New Dispatch</button>
      </div>

      <table className="custom-table">
        <thead>
          <tr>
            <th>TRANSACTION ID</th>
            <th>RECEIVER</th>
            <th>VEHICLE</th>
            <th>WAREHOUSE PIC</th>
            <th>DISPATCHED</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading dispatches...</td></tr>
          ) : dispatches.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: 'center' }}>No dispatches found.</td></tr>
          ) : (
            dispatches.map((disp) => (
              <tr key={disp.id}>
                <td style={{ fontWeight: '700', color: 'var(--navy)' }}>{disp.transaction_id}</td>
                <td>{disp.receiver_name}</td>
                <td>{disp.vehicle_no || 'N/A'}</td>
                <td>{disp.warehouse_pic}</td>
                <td>{new Date(disp.dispatch_submitted_at).toLocaleDateString()}</td>
                <td>
                  <span className={`dispatch-status ${disp.status}`}>
                    {disp.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* New Dispatch Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Create New Dispatch Gate Pass</h3>
            <form onSubmit={handleCreateDispatch}>
              <div className="form-field">
                <label>Receiver</label>
                <select required value={receiverId} onChange={(e) => setReceiverId(e.target.value)} className="form-select">
                  <option value="" disabled>Select a receiver</option>
                  {receivers.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Vehicle No.</label>
                <input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="e.g. MH-12-AB-1234" />
              </div>
              <div className="form-field">
                <label>Driver Details</label>
                <input value={driverDetails} onChange={(e) => setDriverDetails(e.target.value)} placeholder="e.g. John Doe" />
              </div>
              <div className="form-field">
                <label>Package Code</label>
                <input required value={packageCode} onChange={(e) => setPackageCode(e.target.value)} placeholder="e.g. PKG-001" />
              </div>
              <div className="form-field">
                <label>Quantity</label>
                <input type="number" min="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-action" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving || !receiverId}>
                  {saving ? 'Issuing...' : 'Issue Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
