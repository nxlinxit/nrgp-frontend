import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AdminSuppliers({ token }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await api.getSupplierAccounts(token);
      if (Array.isArray(data)) setSuppliers(data);
    } catch (err) {
      console.error('Failed to fetch supplier accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadSuppliers();
  }, [token]);

  const openAddModal = () => {
    setSelectedSupplier(null);
    setCode('');
    setCompanyName('');
    setAddress('');
    setLoginEmail('');
    setShowFormModal(true);
  };

  const openEditModal = (sup) => {
    setSelectedSupplier(sup);
    setCode(sup.code);
    setCompanyName(sup.name);
    setAddress(sup.address || '');
    setLoginEmail(sup.login_email || '');
    setShowFormModal(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (selectedSupplier) {
      const res = await api.updateSupplierAccount(token, selectedSupplier.id, {
        code, name: companyName, address, email: loginEmail
      });
      if (res.ok) {
        alert('Supplier updated successfully');
        setShowFormModal(false);
        loadSuppliers();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to update supplier');
      }
    } else {
      const res = await api.createSupplierAccount(token, {
        code, name: companyName, address, email: loginEmail, password: 'Password@123'
      });
      if (res.ok) {
        alert('Supplier added successfully! Default login password: Password@123');
        setShowFormModal(false);
        loadSuppliers();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to add supplier');
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    const res = await api.resetSupplierPassword(token, selectedSupplier.id, newPassword);
    if (res.ok) {
      alert(`Password for ${selectedSupplier.name} reset successfully!`);
      setShowPasswordModal(false);
      setNewPassword('');
    } else {
      alert('Failed to reset password');
    }
  };

  const handleToggleStatus = async (sup) => {
    const actionName = sup.active !== false ? 'deactivate' : 'reactivate';
    if (window.confirm(`Are you sure you want to ${actionName} ${sup.name}?`)) {
      const res = await api.toggleSupplierStatus(token, sup.id, sup.active === false);
      if (res.ok) {
        loadSuppliers();
      } else {
        alert(`Failed to ${actionName} supplier`);
      }
    }
  };

  return (
    <div>
      <div className="header-row">
        <h1 className="page-title">Supplier / receiver accounts</h1>
        <span className="breadcrumb-code">Admin Portal / receiver master</span>
      </div>

      <div className="sub-header-row">
        <p className="page-subtitle">Supplier / receiver accounts used for dispatch notification and portal login</p>
        <button className="btn-primary" onClick={openAddModal}>+ Add supplier</button>
      </div>

      <table className="custom-table">
        <thead>
          <tr>
            <th>CODE</th>
            <th>NAME</th>
            <th>LOGIN EMAIL</th>
            <th>ADDRESS</th>
            <th style={{ textAlign: 'right' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading supplier records...</td></tr>
          ) : suppliers.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>No suppliers found.</td></tr>
          ) : (
            suppliers.map((sup) => (
              <tr key={sup.id}>
                <td style={{ fontWeight: '600' }}>{sup.code}</td>
                <td>{sup.name}</td>
                <td>{sup.login_email || 'N/A'}</td>
                <td>{sup.address || 'N/A'}</td>
                <td style={{ textAlign: 'right' }}>
                  <div className="action-btn-group">
                    <button className="btn-action" onClick={() => openEditModal(sup)}>Edit</button>
                    <button className="btn-action" onClick={() => { setSelectedSupplier(sup); setShowPasswordModal(true); }}>Reset password</button>
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
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>{selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
            <form onSubmit={handleSaveSupplier}>
              <div className="form-field">
                <label>Code</label>
                <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. I107" />
              </div>
              <div className="form-field">
                <label>Company / Contact Name</label>
                <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Login Email</label>
                <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Plot 14, Ind. Area, Chennai" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-action" onClick={() => setShowFormModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Reset Password for {selectedSupplier?.name}</h3>
            <form onSubmit={handleResetPassword}>
              <div className="form-field">
                <label>New Password</label>
                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-action" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
