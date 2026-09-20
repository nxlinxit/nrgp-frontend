import React from 'react';

export default function Sidebar({ user, activeTab, setActiveTab, onLogout }) {
  return (
    <div className="sidebar">
      <div>
        <div className="sidebar-brand">
          <span className="brand-dot"></span>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', lineHeight: '1.1' }}>NRGP</div>
            <div style={{ fontSize: '0.75rem', color: '#8E8EA8' }}>Gate Pass Portal</div>
          </div>
        </div>

        <div className="sidebar-divider"></div>

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
      </div>

      <div className="sidebar-footer">
        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#FFF' }}>{user.name || 'Portal Admin'}</div>
        <div style={{ fontSize: '0.8rem', color: '#A0A0C0', marginBottom: '6px' }}>{user.email}</div>
        <div className="role-tag">{user.role === 'ADMIN' ? 'Portal admin' : user.role}</div>
        
        <button onClick={onLogout} className="btn-logout">Log out</button>
      </div>
    </div>
  );
}