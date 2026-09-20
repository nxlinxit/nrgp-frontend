import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import AdminEmployees from './pages/AdminEmployees';
import AdminSuppliers from './pages/AdminSuppliers';
import DispatchDashboard from './pages/DispatchDashboard';

const TAB_META = {
  dispatches: { title: 'Dispatches', breadcrumb: 'Dispatches' },
  'nx-users': { title: 'NX employees', breadcrumb: 'NX employees' },
  receivers: { title: 'Supplier / receiver accounts', breadcrumb: 'Receiver master' }
};

const defaultTabForRole = (role) => (role === 'ADMIN' ? 'nx-users' : 'dispatches');

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nrgp_token') || '');
  const [activeTab, setActiveTab] = useState('dispatches');

  const handleLoginSuccess = (loggedInUser, authToken) => {
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem('nrgp_token', authToken);
    setActiveTab(defaultTabForRole(loggedInUser.role));
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('nrgp_token');
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const meta = TAB_META[activeTab] || { title: 'NRGP', breadcrumb: '' };

  return (
    <div className="app-shell">
      <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <div className="main-content">
        <Header title={meta.title} breadcrumb={meta.breadcrumb} />

        {activeTab === 'dispatches' && (user.role === 'ADMIN' || user.role === 'NX' || user.role === 'RECEIVER') && (
          <DispatchDashboard token={token} user={user} />
        )}
        {activeTab === 'nx-users' && user.role === 'ADMIN' && (
          <AdminEmployees token={token} />
        )}
        {activeTab === 'receivers' && user.role === 'ADMIN' && (
          <AdminSuppliers token={token} />
        )}
      </div>
    </div>
  );
}
