import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AdminEmployees({ token }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('NX'); // NX = User, ADMIN = Admin
  const [newPassword, setNewPassword] = useState('');

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers(token);
      if (Array.isArray(data)) {
        setEmployees(data.filter(u => u.role === 'NX' || u.role === 'ADMIN'));
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadEmployees();
  }, [token]);

  // Handle Add / Edit
  const openAddModal = () => {
    setSelectedEmp(null);
    setName('');
    setEmail('');
    setRole('NX');
    setShowFormModal(true);
  };

  const openEditModal = (emp) => {
    setSelectedEmp(emp);
    setName(emp.name);
    setEmail(emp.email);
    setRole(emp.role);
    setShowFormModal(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (selectedEmp) {
      // Edit mode
      const res = await api.updateUser(token, selectedEmp.id, { name, email, role });
      if (res.ok) {
        alert('Employee updated successfully');
        setShowFormModal(false);
        loadEmployees();
      } else {
        alert('Failed to update employee');
      }
    } else {
      // Add mode
      const res = await api.createUser(token, { name, email, role, password: 'Password@123' });
      if (res.ok) {
        alert('Employee added successfully! Default Password: Password@123');
        setShowFormModal(false);
        loadEmployees();
      } else {
        alert('Failed to add employee');
      }
    }
  };

  // Handle Reset Password Action
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    const res = await api.resetPassword(token, selectedEmp.id, newPassword);
    if (res.ok) {
      alert(`Password for ${selectedEmp.name} reset successfully!`);
      setShowPasswordModal(false);
      setNewPassword('');
    } else {
      alert('Failed to reset password');
    }
  };

  // Handle Deactivate / Reactivate Action
  const handleToggleStatus = async (emp) => {
    const actionName = emp.active !== false ? 'deactivate' : 'reactivate';
    if (window.confirm(`Are you sure you want to ${actionName} ${emp.name}?`)) {
      const res = await api.toggleUserStatus(token, emp.id, emp.active === false);
      if (res.ok) {
        loadEmployees();
      } else {
        alert(`Failed to ${actionName} user`);
      }
    }
  };

  return (
    <div>
      <div className="header-row">
        <h1 className="page-title">NX employee accounts</h1>
        <span className="breadcrumb-code">Admin Portal / nx employees</span>
      </div>

      <div className="sub-header-row">
        <p className="page-subtitle">NX employee accounts authorized to log dispatches and access admin functions</p>
        <button className="btn-primary" onClick={openAddModal}>+ Add NX employee</button>
      </div>

      <table className="custom-table">
        <thead>
          <tr>
            <th>NAME</th>
            <th>LOGIN EMAIL</th>
            <th>ALLOCATED ROLE</th>
            <th>STATUS</th>
            <th style={{ textAlign: 'right' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading employee records...</td></tr>
          ) : employees.map((emp) => (
            <tr key={emp.id}>
              <td style={{ fontWeight: '600' }}>{emp.name}</td>
              <td>{emp.email}</td>
              <td>
                <span className={`role-badge ${emp.role === 'ADMIN' ? 'admin' : 'user'}`}>
                  {emp.role === 'ADMIN' ? 'Portal Admin' : 'NX User'}
                </span>
              </td>
              <td>
                <span className={`status-pill ${emp.active !== false ? 'active' : 'inactive'}`}>
                  • {emp.active !== false ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div className="action-btn-group">
                  <button className="btn-action" onClick={() => openEditModal(emp)}>Edit</button>
                  <button className="btn-action" onClick={() => { setSelectedEmp(emp); setShowPasswordModal(true); }}>Reset password</button>
                  <button className="btn-action" onClick={() => handleToggleStatus(emp)}>
                    {emp.active !== false ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal: Add/Edit Employee with Role Selector */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>{selectedEmp ? 'Edit Employee' : 'Add New NX Employee'}</h3>
            <form onSubmit={handleSaveEmployee}>
              <div className="form-field">
                <label>Full Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Login Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Allocate Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="form-select">
                  <option value="NX">User (Standard Employee)</option>
                  <option value="ADMIN">Portal Admin</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-action" onClick={() => setShowFormModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Reset Password for {selectedEmp?.name}</h3>
            <form onSubmit={handleResetPassword}>
              <div className="form-field">
                <label>New Password</label>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} />
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