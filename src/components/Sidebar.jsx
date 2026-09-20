import React from 'react';
import { Truck, Users, Building2, LogOut } from 'lucide-react';

export default function Sidebar({ user, activeTab, setActiveTab, onLogout }) {
  const canSeeDispatches = user.role === 'ADMIN' || user.role === 'NX' || user.role === 'RECEIVER';

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

        {canSeeDispatches && (
          <div className={`nav-item ${activeTab === 'dispatches' ? 'active' : ''}`} onClick={() => setActiveTab('dispatches')}>
            <Truck className="nav-icon" size={18} /> Dispatches
          </div>
        )}

        {user.role === 'ADMIN' && (
          <>
            <div className={`nav-item ${activeTab === 'nx-users' ? 'active' : ''}`} onClick={() => setActiveTab('nx-users')}>
              <Users className="nav-icon" size={18} /> NX employees
            </div>
            <div className={`nav-item ${activeTab === 'receivers' ? 'active' : ''}`} onClick={() => setActiveTab('receivers')}>
              <Building2 className="nav-icon" size={18} /> Suppliers / receivers
            </div>
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#FFF' }}>{user.name || 'Portal Admin'}</div>
        <div style={{ fontSize: '0.8rem', color: '#A0A0C0', marginBottom: '6px' }}>{user.email}</div>
        <div className="role-tag">{user.role === 'ADMIN' ? 'Portal admin' : user.role}</div>

        <button onClick={onLogout} className="btn-logout">
          <LogOut size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Log out
        </button>
      </div>
    </div>
  );
}
