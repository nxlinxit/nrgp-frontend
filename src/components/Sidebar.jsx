import React from 'react';
import { Users, Building2, LogOut, LayoutDashboard, PlusCircle, Clock, AlertTriangle, CheckCircle, Archive } from 'lucide-react';

const NAV_NX = [
  { key: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { key: 'new-dispatch', label: 'New dispatch', Icon: PlusCircle },
  { key: 'pending', label: 'Pending with supplier', Icon: Clock },
  { key: 'disputed', label: 'Disputed', Icon: AlertTriangle },
  { key: 'resolved', label: 'Resolved', Icon: CheckCircle },
  { key: 'historical', label: 'Historical data', Icon: Archive }
];

const NAV_ADMIN = [
  ...NAV_NX,
  { key: 'nx-users', label: 'NX employees', Icon: Users },
  { key: 'receivers', label: 'Suppliers', Icon: Building2 }
];

const NAV_RECEIVER = NAV_NX.filter((item) => item.key !== 'new-dispatch');

const NAV_BY_ROLE = { ADMIN: NAV_ADMIN, NX: NAV_NX, RECEIVER: NAV_RECEIVER };

export default function Sidebar({ user, activeTab, setActiveTab, onLogout }) {
  const nav = NAV_BY_ROLE[user.role] || [];

  return (
    <div className="sidebar">
      <div>
        <div className="sidebar-brand">
          <span className="brand-dot"></span>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', lineHeight: '1.1' }}>NRGP</div>
            <div style={{ fontSize: '0.75rem', color: '#8E8EA8' }}>Non-Returnable Gate Pass</div>
          </div>
        </div>

        <div className="sidebar-divider"></div>

        {nav.map(({ key, label, Icon }) => (
          <div key={key} className={`nav-item ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
            <Icon className="nav-icon" size={18} /> {label}
          </div>
        ))}
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
