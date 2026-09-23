import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import AdminEmployees from './pages/AdminEmployees';
import AdminSuppliers from './pages/AdminSuppliers';
import NxDashboard from './pages/NxDashboard';
import NxNewDispatch from './pages/NxNewDispatch';
import DispatchList from './pages/DispatchList';
import DispatchDetail from './pages/DispatchDetail';

const TAB_META = {
  'nx-users': { title: 'NX employee accounts', breadcrumb: 'NX employees' },
  receivers: { title: 'Supplier accounts', breadcrumb: 'Supplier master' },
  dashboard: { title: 'Dispatch dashboard', breadcrumb: 'Dashboard' },
  'new-dispatch': { title: 'New dispatch entry', breadcrumb: 'New dispatch' },
  pending: { title: 'Pending with supplier', breadcrumb: 'Pending' },
  disputed: { title: 'Disputed dispatches', breadcrumb: 'Disputed' },
  resolved: { title: 'Resolved disputes', breadcrumb: 'Resolved' },
  historical: { title: 'Historical data', breadcrumb: 'Historical' },
  open: { title: 'Open dispatches', breadcrumb: 'Open' },
  history: { title: 'Submission history', breadcrumb: 'History' }
};

const DEFAULT_TAB_BY_ROLE = { ADMIN: 'nx-users', NX: 'dashboard', RECEIVER: 'open' };

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nrgp_token') || '');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeDispatchId, setActiveDispatchId] = useState(null);

  const handleLoginSuccess = (loggedInUser, authToken) => {
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem('nrgp_token', authToken);
    setActiveTab(DEFAULT_TAB_BY_ROLE[loggedInUser.role] || 'dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('nrgp_token');
  };

  const goToTab = (tab) => {
    setActiveDispatchId(null);
    setActiveTab(tab);
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const meta = TAB_META[activeTab] || { title: 'NRGP', breadcrumb: '' };

  const renderBody = () => {
    if (activeDispatchId) {
      return (
        <DispatchDetail
          token={token}
          user={user}
          dispatchId={activeDispatchId}
          onBack={() => setActiveDispatchId(null)}
          onChanged={() => {}}
        />
      );
    }

    if (user.role === 'ADMIN') {
      if (activeTab === 'nx-users') return <AdminEmployees token={token} />;
      if (activeTab === 'receivers') return <AdminSuppliers token={token} />;
    }

    if (user.role === 'NX' || user.role === 'ADMIN') {
      const portalLabel = user.role === 'ADMIN' ? 'Admin Portal' : 'NX Portal';
      if (activeTab === 'dashboard') return <NxDashboard token={token} user={user} onNavigate={goToTab} onOpenDetail={setActiveDispatchId} />;
      if (activeTab === 'new-dispatch') return <NxNewDispatch token={token} user={user} onCreated={() => goToTab('dashboard')} />;
      if (activeTab === 'pending') return <DispatchList token={token} status="pending" title={TAB_META.pending.title} breadcrumb={`${portalLabel} / Pending`} emptyMessage="No dispatches currently pending with a supplier." onOpenDetail={setActiveDispatchId} />;
      if (activeTab === 'disputed') return <DispatchList token={token} status="disputed" title={TAB_META.disputed.title} breadcrumb={`${portalLabel} / Disputed`} emptyMessage="All clear — no open disputes right now." onOpenDetail={setActiveDispatchId} />;
      if (activeTab === 'resolved') return <DispatchList token={token} status="resolved" title={TAB_META.resolved.title} breadcrumb={`${portalLabel} / Resolved`} emptyMessage="No resolved disputes yet." onOpenDetail={setActiveDispatchId} />;
      if (activeTab === 'historical') return <DispatchList token={token} status={null} title={TAB_META.historical.title} breadcrumb={`${portalLabel} / Historical`} emptyMessage="No historical records yet." onOpenDetail={setActiveDispatchId} />;
    }

    if (user.role === 'RECEIVER') {
      if (activeTab === 'open') return <DispatchList token={token} status="pending" title={TAB_META.open.title} breadcrumb="Receiver Portal / Open" emptyMessage="Nothing waiting on you right now — new dispatches will appear here." onOpenDetail={setActiveDispatchId} />;
      if (activeTab === 'disputed') return <DispatchList token={token} status="disputed" title={TAB_META.disputed.title} breadcrumb="Receiver Portal / Disputed" emptyMessage="No open disputes right now." onOpenDetail={setActiveDispatchId} />;
      if (activeTab === 'history') return <DispatchList token={token} status={null} title={TAB_META.history.title} breadcrumb="Receiver Portal / History" emptyMessage="No dispatches on record yet." onOpenDetail={setActiveDispatchId} />;
    }

    return null;
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} activeTab={activeTab} setActiveTab={goToTab} onLogout={handleLogout} />

      <div className="main-content">
        <Header title={meta.title} breadcrumb={meta.breadcrumb} />
        {renderBody()}
      </div>
    </div>
  );
}
