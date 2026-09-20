import React, { useState, useEffect } from 'react';

export default function DispatchDashboard({ token }) {
  const [dispatches, setDispatches] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Dispatch Form State
  const [receiverName, setReceiverName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Mock initial load (Connect with api.getDispatches when backend endpoint is ready)
  useEffect(() => {
    setDispatches([
      { id: 'DISP-1001', receiver: 'Acme Logistics', item: 'Server Rack Components', qty: 4, status: 'PENDING', date: '2026-03-28' },
      { id: 'DISP-1002', receiver: 'Apex Hardware', item: 'Fiber Optic Spools', qty: 12, status: 'COMPLETED', date: '2026-03-27' },
      { id: 'DISP-1003', receiver: 'Global Tech Solution', item: 'Monitors & Cables', qty: 8, status: 'IN_TRANSIT', date: '2026-03-26' }
    ]);
  }, []);

  const handleCreateDispatch = (e) => {
    e.preventDefault();
    const newEntry = {
      id: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
      receiver: receiverName,
      item: itemDescription,
      qty: Number(quantity),
      status: 'PENDING',
      date: new Date().toISOString().split('T')[0]
    };

    setDispatches([newEntry, ...dispatches]);
    setShowCreateModal(false);
    setReceiverName('');
    setItemDescription('');
    setQuantity(1);
    alert('Dispatch created successfully!');
  };

  const filteredDispatches = dispatches.filter((item) => {
    if (activeFilter === 'ALL') return true;
    return item.status === activeFilter;
  });

  return (
    <div>
      <div className="header-row">
        <h1 className="page-title">Dispatch Operations</h1>
        <span className="breadcrumb-code">Employee Portal / Dispatches</span>
      </div>

      <div className="sub-header-row">
        <div className="filter-tabs">
          <button className={`tab-btn ${activeFilter === 'ALL' ? 'active' : ''}`} onClick={() => setActiveFilter('ALL')}>All</button>
          <button className={`tab-btn ${activeFilter === 'PENDING' ? 'active' : ''}`} onClick={() => setActiveFilter('PENDING')}>Pending</button>
          <button className={`tab-btn ${activeFilter === 'IN_TRANSIT' ? 'active' : ''}`} onClick={() => setActiveFilter('IN_TRANSIT')}>In Transit</button>
          <button className={`tab-btn ${activeFilter === 'COMPLETED' ? 'active' : ''}`} onClick={() => setActiveFilter('COMPLETED')}>Completed</button>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>+ New Dispatch</button>
      </div>

      <table className="custom-table">
        <thead>
          <tr>
            <th>DISPATCH ID</th>
            <th>RECEIVER</th>
            <th>ITEM DESCRIPTION</th>
            <th>QTY</th>
            <th>DATE</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {filteredDispatches.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: 'center' }}>No dispatches found.</td></tr>
          ) : (
            filteredDispatches.map((disp) => (
              <tr key={disp.id}>
                <td style={{ fontWeight: '700', color: 'var(--navy)' }}>{disp.id}</td>
                <td>{disp.receiver}</td>
                <td>{disp.item}</td>
                <td>{disp.qty}</td>
                <td>{disp.date}</td>
                <td>
                  <span className={`dispatch-status ${disp.status.toLowerCase()}`}>
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
                <label>Receiver / Vendor Name</label>
                <input required value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="e.g. Acme Corp" />
              </div>
              <div className="form-field">
                <label>Item Description</label>
                <input required value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} placeholder="e.g. Spare Parts Box" />
              </div>
              <div className="form-field">
                <label>Quantity</label>
                <input type="number" min="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-action" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Issue Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}