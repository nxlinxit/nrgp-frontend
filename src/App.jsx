import React, { useState, useEffect } from 'react';

// Package Types Reference
const PACKAGE_TYPES = [
  { code: 'BIN-001', label: 'Bin' },
  { code: 'PAL-001', label: 'Pallet' },
  { code: 'STP-001', label: 'Steel pallet' },
  { code: 'TRO-001', label: 'Trolley' },
  { code: 'CB-001', label: 'Carton box' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nrgp_token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Dispatch Form State
  const [receiverId, setReceiverId] = useState('1');
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverDetails, setDriverDetails] = useState('');
  const [packageQtys, setPackageQtys] = useState({
    'BIN-001': 0, 'PAL-001': 0, 'STP-001': 0, 'TRO-001': 0, 'CB-001': 0
  });

  const API_BASE = 'https://nrgp-backend.onrender.com/api';

  // Handle Shared Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('nrgp_token', data.token);

        // Set default active tab based on role
        if (data.user.role === 'RECEIVER') {
          setActiveTab('open');
        } else if (data.user.role === 'ADMIN') {
          setActiveTab('nx-users');
        } else {
          setActiveTab('dashboard');
        }
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      alert('Could not connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('nrgp_token');
  };

  // Fetch Dispatches
  const fetchDispatches = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/dispatches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDispatches(data);
    } catch (err) {
      console.error('Error fetching dispatches:', err);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchDispatches();
    }
  }, [token, user, activeTab]);

  // Submit New Dispatch
  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    const lines = Object.entries(packageQtys)
      .map(([code, qty]) => ({ packageCode: code, dispatchedQty: parseInt(qty) || 0 }))
      .filter(line => line.dispatchedQty > 0);

    if (lines.length === 0) {
      alert('Please enter a quantity for at least one package type');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/dispatches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: parseInt(receiverId),
          vehicleNo,
          driverDetails,
          lines
        })
      });
      if (res.ok) {
        alert('Dispatch created successfully!');
        setVehicleNo('');
        setDriverDetails('');
        setPackageQtys({ 'BIN-001': 0, 'PAL-001': 0, 'STP-001': 0, 'TRO-001': 0, 'CB-001': 0 });
        setActiveTab('pending');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create dispatch');
      }
    } catch (err) {
      alert('Error submitting dispatch');
    }
  };

  // If not logged in, render Single Shared Login Page
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--navy)' }}>
        <form onSubmit={handleLogin} style={{ background: '#FFF', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ color: 'var(--navy)', marginBottom: '8px' }}>NX Logistics</h2>
          <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '0.9rem' }}>Non-Returnable Gate Pass Portal</p>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '12px', backgroundColor: 'var(--lime)', border: 'none', borderRadius: '6px', fontWeight: '700', color: 'var(--navy)', cursor: 'pointer' }}
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  // Logged-in Portal Shell
  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div>
          <div className="sidebar-brand">
            <span style={{ color: 'var(--lime)' }}>NX</span> Logistics
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '20px' }}>
            Logged in as: <strong>{user.name || user.email}</strong> ({user.role})
          </div>

          {/* Navigation Items based on Role */}
          {user.role === 'NX' && (
            <>
              <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</div>
              <div className={`nav-item ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')}>+ New Dispatch</div>
              <div className={`nav-item ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>Pending with Supplier</div>
              <div className={`nav-item ${activeTab === 'disputed' ? 'active' : ''}`} onClick={() => setActiveTab('disputed')}>Disputed</div>
              <div className={`nav-item ${activeTab === 'resolved' ? 'active' : ''}`} onClick={() => setActiveTab('resolved')}>Resolved</div>
              <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Historical Data</div>
            </>
          )}

          {user.role === 'RECEIVER' && (
            <>
              <div className={`nav-item ${activeTab === 'open' ? 'active' : ''}`} onClick={() => setActiveTab('open')}>Open Dispatches</div>
              <div className={`nav-item ${activeTab === 'disputed' ? 'active' : ''}`} onClick={() => setActiveTab('disputed')}>Disputed</div>
              <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</div>
            </>
          )}

          {user.role === 'ADMIN' && (
            <>
              <div className={`nav-item ${activeTab === 'nx-users' ? 'active' : ''}`} onClick={() => setActiveTab('nx-users')}>NX Employees</div>
              <div className={`nav-item ${activeTab === 'receivers' ? 'active' : ''}`} onClick={() => setActiveTab('receivers')}>Suppliers / Receivers</div>
            </>
          )}
        </div>

        <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #475569', color: '#CBD5E1', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>

      {/* Main Workspace Area */}
      <div className="main-content">
        {/* NX New Dispatch View */}
        {user.role === 'NX' && activeTab === 'new' && (
          <div style={{ background: '#FFF', padding: '24px', borderRadius: '8px', maxWidth: '800px' }}>
            <h2 style={{ marginBottom: '20px' }}>Log New Dispatch</h2>
            <form onSubmit={handleCreateDispatch}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Warehouse PIC (Auto-Fetched)</label>
                <input type="text" disabled value={user.name || 'NX Employee'} style={{ width: '100%', padding: '10px', background: '#F1F5F9', border: '1px solid var(--border)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Vehicle Number</label>
                  <input type="text" required value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="e.g. MH-12-AB-1234" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Driver Details (Optional)</label>
                  <input type="text" value={driverDetails} onChange={e => setDriverDetails(e.target.value)} placeholder="Driver Name / Contact" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)' }} />
                </div>
              </div>

              <h4 style={{ margin: '20px 0 10px 0' }}>Dispatched Package Quantities</h4>
              {PACKAGE_TYPES.map(pkg => (
                <div key={pkg.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '8px', background: '#F8FAFC', borderRadius: '6px' }}>
                  <span>{pkg.label} (<span className="code-font">{pkg.code}</span>)</span>
                  <input 
                    type="number" 
                    min="0" 
                    value={packageQtys[pkg.code]} 
                    onChange={e => setPackageQtys({ ...packageQtys, [pkg.code]: e.target.value })} 
                    style={{ width: '100px', padding: '6px', textAlign: 'right' }} 
                  />
                </div>
              ))}

              <button type="submit" style={{ marginTop: '20px', padding: '12px 24px', backgroundColor: 'var(--navy)', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                Submit Dispatch
              </button>
            </form>
          </div>
        )}

        {/* ADMIN Views: User Directory Tables */}
        {user.role === 'ADMIN' && (activeTab === 'nx-users' || activeTab === 'receivers') && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>
              {activeTab === 'nx-users' ? 'NX Employee Directory' : 'Supplier / Receiver Directory'}
            </h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Account Status</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === 'nx-users' ? (
                  <tr>
                    <td className="code-font">USR-001</td>
                    <td>Sumedh (NX Employee)</td>
                    <td>sumedh@nipponexpress.com</td>
                    <td><span className="badge pending">NX</span></td>
                    <td><span className="badge confirmed">Active</span></td>
                  </tr>
                ) : (
                  <tr>
                    <td className="code-font">RCV-001</td>
                    <td>Supplier / Receiver Account</td>
                    <td>receiver@supplier.com</td>
                    <td><span className="badge resolved">RECEIVER</span></td>
                    <td><span className="badge confirmed">Active</span></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Dispatch Data Table View (For Non-Admin Tabs) */}
        {user.role !== 'ADMIN' && activeTab !== 'new' && (
          <div>
            <h2 style={{ marginBottom: '20px', textTransform: 'capitalize' }}>{activeTab} Dispatches</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Receiver</th>
                  <th>Vehicle No</th>
                  <th>Warehouse PIC</th>
                  <th>Submitted At (System)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dispatches.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8' }}>No records found</td></tr>
                ) : (
                  dispatches.map(d => (
                    <tr key={d.id}>
                      <td data-label="Transaction ID" className="code-font">{d.transaction_id}</td>
                      <td data-label="Receiver">{d.receiver_name}</td>
                      <td data-label="Vehicle No">{d.vehicle_no}</td>
                      <td data-label="Warehouse PIC">{d.warehouse_pic}</td>
                      <td data-label="Submitted At" className="code-font">{new Date(d.dispatch_submitted_at).toLocaleString()}</td>
                      <td data-label="Status"><span className={`badge ${d.status}`}>{d.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}