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

  // Validates a stored token and returns the signed-in user
  getMe: async (token) => {
    return fetch(`${API_BASE}/auth/me`, { headers: getHeaders(token) });
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

  bulkCreateUsers: async (token, rows) => {
    const res = await fetch(`${API_BASE}/admin/users/bulk`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ rows })
    });
    return res.json();
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

  bulkCreateSuppliers: async (token, rows) => {
    const res = await fetch(`${API_BASE}/admin/receivers/bulk`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ rows })
    });
    return res.json();
  },

  // Dispatches
  // details: true also returns package lines and full history (for exports)
  getDispatches: async (token, { status, details } = {}) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (details) params.set('details', '1');
    const query = params.toString() ? `?${params}` : '';
    const res = await fetch(`${API_BASE}/dispatches${query}`, { headers: getHeaders(token) });
    return res.json();
  },

  createDispatch: async (token, dispatchData) => {
    return fetch(`${API_BASE}/dispatches`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(dispatchData)
    });
  },

  getDispatch: async (token, id) => {
    const res = await fetch(`${API_BASE}/dispatches/${id}`, { headers: getHeaders(token) });
    return res.json();
  },

  submitReceipt: async (token, id, payload) => {
    return fetch(`${API_BASE}/dispatches/${id}/receive`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    });
  },

  // NX answers a dispute; moves it to Open ticket
  replyToDispute: async (token, id, decision, remark) => {
    return fetch(`${API_BASE}/dispatches/${id}/reply`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ decision, remark })
    });
  },

  addRemark: async (token, id, remark) => {
    return fetch(`${API_BASE}/dispatches/${id}/remark`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ remark })
    });
  },

  resolveTicket: async (token, id, remark) => {
    return fetch(`${API_BASE}/dispatches/${id}/resolve`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ remark })
    });
  },

  // Unread counts per status, plus the supplier pop-up entries
  getNotifications: async (token) => {
    const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders(token) });
    if (!res.ok) throw new Error(`Notifications failed: ${res.status}`);
    return res.json();
  },

  dismissNotifications: async (token, upToEventId) => {
    return fetch(`${API_BASE}/notifications/dismiss`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ upToEventId })
    });
  }
};