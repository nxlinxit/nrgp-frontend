import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function NxDashboard({ token, user, onNavigate, onOpenDetail }) {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getDispatches(token, {});
      setDispatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load dispatches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
  }, [token]);

  const counts = {
    pending: dispatches.filter((d) => d.status === 'pending').length,
    disputed: dispatches.filter((d) => d.status === 'disputed').length,
    resolved: dispatches.filter((d) => d.status === 'resolved').length,
    confirmed: dispatches.filter((d) => d.status === 'confirmed').length
  };
  const recent = dispatches.slice(0, 5);

  return (
    <div>
      <div className="header-row">
        <h1 className="page-title">Dispatch dashboard</h1>
        <span className="breadcrumb-code">{user?.role === 'ADMIN' ? 'Admin Portal' : user?.role === 'RECEIVER' ? 'Supplier Portal' : 'NX Portal'} / Dashboard</span>
      </div>

      <div className="stat-row" style={{ marginTop: '16px' }}>
        <div className="stat-card pending" onClick={() => onNavigate('pending')}>
          <div className="stat-num">{counts.pending}</div>
          <div className="stat-label">Pending with supplier</div>
        </div>
        <div className="stat-card disputed" onClick={() => onNavigate('disputed')}>
          <div className="stat-num">{counts.disputed}</div>
          <div className="stat-label">Disputed</div>
        </div>
        <div className="stat-card resolved" onClick={() => onNavigate('resolved')}>
          <div className="stat-num">{counts.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card confirmed" onClick={() => onNavigate('historical')}>
          <div className="stat-num">{counts.confirmed}</div>
          <div className="stat-label">Historical data</div>
        </div>
      </div>

      <div className="sub-header-row">
        <p className="page-subtitle">Recent activity — click a card above for the full segregated list</p>
        {user?.role !== 'RECEIVER' && (
          <button className="btn-primary" onClick={() => onNavigate('new-dispatch')}>+ New dispatch</button>
        )}
      </div>

      <table className="custom-table">
        <thead>
          <tr>
            <th>TRANSACTION ID</th>
            <th>SUPPLIER</th>
            <th>VEHICLE</th>
            <th>DISPATCH DATE</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading dispatches...</td></tr>
          ) : recent.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>No dispatches yet.</td></tr>
          ) : (
            recent.map((disp) => (
              <tr key={disp.id} className="clickable-row" onClick={() => onOpenDetail(disp.id)}>
                <td style={{ fontWeight: '700', color: 'var(--navy)' }}>{disp.transaction_id}</td>
                <td>{disp.receiver_name}</td>
                <td>{disp.vehicle_no || 'N/A'}</td>
                <td>{new Date(disp.dispatch_date_time).toLocaleString()}</td>
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
    </div>
  );
}
