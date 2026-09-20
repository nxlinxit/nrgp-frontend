import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function DispatchList({ token, status, title, breadcrumb, emptyMessage, onOpenDetail }) {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getDispatches(token, status ? { status } : {});
      setDispatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load dispatches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, status]);

  return (
    <div>
      <div className="header-row">
        <h1 className="page-title">{title}</h1>
        <span className="breadcrumb-code">{breadcrumb}</span>
      </div>

      <table className="custom-table" style={{ marginTop: '16px' }}>
        <thead>
          <tr>
            <th>TRANSACTION ID</th>
            <th>RECEIVER</th>
            <th>VEHICLE</th>
            <th>DISPATCH DATE</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading dispatches...</td></tr>
          ) : dispatches.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>{emptyMessage || 'No dispatches found.'}</td></tr>
          ) : (
            dispatches.map((disp) => (
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
