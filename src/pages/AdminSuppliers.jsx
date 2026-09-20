import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AdminSuppliers({ token }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers(token);
      if (Array.isArray(data)) {
        setSuppliers(data.filter((u) => u.role === 'SUPPLIER' || u.role === 'RECEIVER'));
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadSuppliers();
  }, [token]);

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setCompanyName('');
    setContactEmail('');
    setPhone('');
    setShowModal(true);
  };

  const handleOpenEditModal = (sup) => {
    setEditingSupplier(sup);
    setCompanyName(sup.name || '');
    setContactEmail(sup.email || '');
    setPhone(sup.phone || '');
    setShowModal(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (editingSupplier) {
      const res = await api.updateUser(token, editingSupplier.id, {
        name: companyName,
        email: contactEmail,
        phone,
        role: 'SUPPLIER'
      });
      if (res.ok) {
        alert('Supplier updated successfully');
        setShowModal(false);
        loadSuppliers();
      } else {
        alert('Failed to update supplier');
      }
    } else {
      const res = await api.createUser(token, {
        name: companyName,
        email: contactEmail,
        phone,
        role: 'SUPPLIER',
        password: 'Password@123'
      });
      if (res.ok) {
        alert('Supplier added successfully!');
        setShowModal(false);
        loadSuppliers();
      } else {
        alert('Failed to add supplier');
      }
    }
  };

  const handleToggleStatus = async (sup) => {
    const nextState = !sup.active;
    if (window.confirm(`Are you sure you want to ${nextState ? 'activate' : 'deactivate'} ${sup.name}?`)) {
      const res = await api.toggleUserStatus(token, sup.id, nextState);
      if (res.ok) loadSuppliers();
    }
  };

  return (
    <div>
      <div className="header-row">
        <h1 className="page-title">Suppliers & Receivers</h1>
        <span className="breadcrumb-code">Admin Portal / suppliers</span>
      </div>

      <div className="sub-header-row">
        <p className="page-subtitle">Authorized third-party vendors and receiving entities</p>
        <button className="btn-primary" onClick={handleOpenAddModal}>+ Add Supplier / Receiver</button>
      </div>

      <table className="custom-table">
        <thead>
          <tr>
            <th>COMPANY / NAME</th>
            <th>CONTACT EMAIL</th>
            <th>PHONE</th>
            <th>STATUS</th>
            <th style={{ textAlign: 'right' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading supplier records...</td></tr>
          ) : (
            suppliers.map((sup) => (
              <tr key={sup.id}>
                <td style={{ fontWeight: '600' }}>{sup.name}</td>
                <td>{sup.email}</td>
                <td>{sup.phone || 'N/A'}</td>
                <td>
                  <span className={`status-pill ${sup.active !== false ? 'active' : 'inactive'}`}>
                    • {sup.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="action-btn-group">
                    <button className="btn-action" onClick={() => handleOpenEditModal(sup)}>Edit</button>
                    <button className="btn-action" onClick={() => handleToggleStatus(sup)}>
                      {sup.active !== false ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Add / Edit Supplier Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
            <form onSubmit={handleSaveSupplier}>
              <div className="form-field">
                <label>Company / Contact Name</label>
                <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Contact Email</label>
                <input type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Phone Number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-action" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}