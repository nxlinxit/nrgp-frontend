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
  const [activeTab, setActiveTab] = useState('nx-users');
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

  // Login Screen
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--navy)' }}>
        <form onSubmit={handleLogin} style={{ background: '#FFF', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ color: 'var(--navy)', marginBottom: '4px', fontSize: '1.5rem', fontWeight: '700' }}>NRGP</h2>
          <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '0.85rem' }}>Gate Pass Portal</p>
          
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

  return (
    <div className="app-shell">
      {/* Left Sidebar */}
      <div className="sidebar">
        <div>
          <div className="sidebar-brand">
            <span className="brand-dot"></span>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', lineHeight: '1.1' }}>NRGP</div>
              <div style={{ fontSize: '0.75rem', color: '#8E8EA8', fontWeight: '400' }}>Gate Pass Portal</div>
            </div>
          </div>

          <div className="sidebar-divider"></div>

          {/* Navigation */}
          {user.role === 'ADMIN' && (
            <>
              <div className={`nav-item ${activeTab === 'nx-users' ? 'active' : ''}`} onClick={() => setActiveTab('nx-users')}>
                <span className="nav-icon">📄</span> NX employees
              </div>
              <div className={`nav-item ${activeTab === 'receivers' ? 'active' : ''}`} onClick={() => setActiveTab('receivers')}>
                <span className="nav-icon">📄</span> Suppliers / receivers
              </div>
            </>
          )}

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
        </div>

        {/* Sidebar Footer User Card */}
        <div className="sidebar-footer">
          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#FFF' }}>{user.name || 'Portal Admin'}</div>
          <div style={{ fontSize: '0.8rem', color: '#A0A0C0', marginBottom: '6px' }}>{user.email || 'admin@nipponexpress.co.in'}</div>
          <div className="role-tag">{user.role === 'ADMIN' ? 'Portal admin' : user.role}</div>
          
          <button onClick={handleLogout} className="btn-logout">
            Log out
          </button>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="main-content">
        {/* Admin Section 1: NX Employee Accounts */}
        {user.role === 'ADMIN' && activeTab === 'nx-users' && (
          <div>
            <div className="header-row">
              <h1 className="page-title">NX employee accounts</h1>
              <span className="breadcrumb-code">Admin Portal / nx employees</span>
            </div>

            <div className="sub-header-row">
              <p className="page-subtitle">NX employee accounts authorized to log dispatches</p>
              <button className="btn-primary">+ Add NX employee</button>
            </div>

            <table className="custom-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>LOGIN EMAIL</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '500' }}>Guru Supervisor</td>
                  <td>guru@nipponexpress.co.in</td>
                  <td><span className="status-pill active">• Active</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-btn-group">
                      <button className="btn-action">Edit</button>
                      <button className="btn-action">Reset password</button>
                      <button className="btn-action">Deactivate</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '500' }}>Anita Supervisor</td>
                  <td>anita@nipponexpress.co.in</td>
                  <td><span className="status-pill active">• Active</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-btn-group">
                      <button className="btn-action">Edit</button>
                      <button className="btn-action">Reset password</button>
                      <button className="btn-action">Deactivate</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Admin Section 2: Supplier / Receiver Accounts */}
        {user.role === 'ADMIN' && activeTab === 'receivers' && (
          <div>
            <div className="header-row">
              <h1 className="page-title">Supplier / receiver accounts</h1>
              <span className="breadcrumb-code">Admin Portal / receiver master</span>
            </div>

            <div className="sub-header-row">
              <p className="page-subtitle">Supplier / receiver accounts used for dispatch notification and portal login</p>
              <button className="btn-primary">+ Add supplier</button>
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
                <tr>
                  <td className="code-font">I107</td>
                  <td style={{ fontWeight: '500' }}>Usui Susira</td>
                  <td>usui.susira@example-supplier.com</td>
                  <td>Plot 14, Ind. Area, Chennai</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-btn-group">
                      <button className="btn-action">Edit</button>
                      <button className="btn-action">Reset password</button>
                      <button className="btn-action">Deactivate</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="code-font">I112</td>
                  <td style={{ fontWeight: '500' }}>Meesho Fulfillment Hub</td>
                  <td>ops@meesho-fc.example.com</td>
                  <td>Zepto Rd, Pune MIDC</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-btn-group">
                      <button className="btn-action">Edit</button>
                      <button className="btn-action">Reset password</button>
                      <button className="btn-action">Deactivate</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="code-font">I098</td>
                  <td style={{ fontWeight: '500' }}>Amazon FC Bhiwandi</td>
                  <td>inbound@amzn-fc.example.com</td>
                  <td>Bhiwandi, Thane</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-btn-group">
                      <button className="btn-action">Edit</button>
                      <button className="btn-action">Reset password</button>
                      <button className="btn-action">Deactivate</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* NX New Dispatch Form */}
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

        {/* Dispatch Data Table View for Non-Admin */}
        {user.role !== 'ADMIN' && activeTab !== 'new' && (
          <div>
            <h2 style={{ marginBottom: '20px', textTransform: 'capitalize' }}>{activeTab} Dispatches</h2>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>TRANSACTION ID</th>
                  <th>RECEIVER</th>
                  <th>VEHICLE NO</th>
                  <th>WAREHOUSE PIC</th>
                  <th>SUBMITTED AT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {dispatches.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8' }}>No records found</td></tr>
                ) : (
                  dispatches.map(d => (
                    <tr key={d.id}>
                      <td className="code-font">{d.transaction_id}</td>
                      <td>{d.receiver_name}</td>
                      <td>{d.vehicle_no}</td>
                      <td>{d.warehouse_pic}</td>
                      <td className="code-font">{new Date(d.dispatch_submitted_at).toLocaleString()}</td>
                      <td><span className="status-pill active">{d.status}</span></td>
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