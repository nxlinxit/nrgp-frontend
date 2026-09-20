const API_BASE = 'https://nrgp-backend.onrender.com/api';

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

export const api = {
  // Authentication
  login: async (email, password) => {
    return fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  },

  // Admin User Management
  getUsers: async (token) => {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders(token) });
    return res.json();
  },

  createUser: async (token, userData) => {
    return fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(userData)
    });
  },

  updateUser: async (token, userId, userData) => {
    return fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(userData)
    });
  },

  resetPassword: async (token, userId, newPassword) => {
    return fetch(`${API_BASE}/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ newPassword })
    });
  },

  toggleUserStatus: async (token, userId, active) => {
    return fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ active })
    });
  },

  // Receivers directory (for the dispatch creation dropdown)
  getReceivers: async (token) => {
    const res = await fetch(`${API_BASE}/receivers`, { headers: getHeaders(token) });
    return res.json();
  },

  // Admin Supplier / Receiver Master (company + its login account)
  getSupplierAccounts: async (token) => {
    const res = await fetch(`${API_BASE}/admin/receivers`, { headers: getHeaders(token) });
    return res.json();
  },

  createSupplierAccount: async (token, supplierData) => {
    return fetch(`${API_BASE}/admin/receivers`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(supplierData)
    });
  },

  updateSupplierAccount: async (token, supplierId, supplierData) => {
    return fetch(`${API_BASE}/admin/receivers/${supplierId}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(supplierData)
    });
  },

  resetSupplierPassword: async (token, supplierId, newPassword) => {
    return fetch(`${API_BASE}/admin/receivers/${supplierId}/reset-password`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ newPassword })
    });
  },

  toggleSupplierStatus: async (token, supplierId, active) => {
    return fetch(`${API_BASE}/admin/receivers/${supplierId}/status`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ active })
    });
  },

  // Dispatches
  getDispatches: async (token, { status } = {}) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API_BASE}/dispatches${query}`, { headers: getHeaders(token) });
    return res.json();
  },

  createDispatch: async (token, dispatchData) => {
    return fetch(`${API_BASE}/dispatches`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(dispatchData)
    });
  }
};