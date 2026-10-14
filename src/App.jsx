import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import AdminEmployees from './pages/AdminEmployees';
import AdminSuppliers from './pages/AdminSuppliers';
import NxDashboard from './pages/NxDashboard';
import NxNewDispatch from './pages/NxNewDispatch';
import DispatchList from './pages/DispatchList';
import DispatchDetail from './pages/DispatchDetail';
import NotificationPopup from './components/NotificationPopup';
import { api } from './services/api';

const TAB_META = {
  'nx-users': { title: 'NX employee accounts', breadcrumb: 'NX employees' },
  receivers: { title: 'Supplier accounts', breadcrumb: 'Supplier master' },
  dashboard: { title: 'Dispatch dashboard', breadcrumb: 'Dashboard' },
  'new-dispatch': { title: 'New dispatch entry', breadcrumb: 'New dispatch' },
  pending: { title: 'Pending with supplier', breadcrumb: 'Pending' },
  disputed: { title: 'Disputed dispatches', breadcrumb: 'Disputed' },
  open: { title: 'Open tickets', breadcrumb: 'Open tickets' },
  resolved: { title: 'Resolved disputes', breadcrumb: 'Resolved' },
  historical: { title: 'Historical data', breadcrumb: 'Historical' }
};

const DEFAULT_TAB_BY_ROLE = { ADMIN: 'nx-users', NX: 'dashboard', RECEIVER: 'dashboard' };
const ADMIN_ONLY_TABS = ['nx-users', 'receivers'];
const TAB_STORAGE_KEY = 'nrgp_active_tab';

const isTabAllowed = (tab, role) => {
  if (!TAB_META[tab]) return false;
  if (ADMIN_ONLY_TABS.includes(tab)) return role === 'ADMIN';
  if (tab === 'new-dispatch') return role !== 'RECEIVER';
  return true;
};

const readStoredTab = () => {
  try {
    return sessionStorage.getItem(TAB_STORAGE_KEY);
  } catch {
    return null;
  }
};

const storeTab = (tab) => {
  try {
    if (tab) sessionStorage.setItem(TAB_STORAGE_KEY, tab);
    else sessionStorage.removeItem(TAB_STORAGE_KEY);
  } catch {
    // Storage unavailable (e.g. private mode) — the tab just won't survive a refresh.
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nrgp_token') || '');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeDispatchId, setActiveDispatchId] = useState(null);
  // True while a stored token is being checked, so a refresh doesn't flash the login page.
  const [restoringSession, setRestoringSession] = useState(() => Boolean(localStorage.getItem('nrgp_token')));

  useEffect(() => {
    if (!restoringSession) return;
    let cancelled = false;

    const restore = async () => {
      try {
        const res = await api.getMe(token);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          const storedTab = readStoredTab();
          setUser(data.user);
          setActiveTab(isTabAllowed(storedTab, data.user.role) ? storedTab : (DEFAULT_TAB_BY_ROLE[data.user.role] || 'dashboard'));
        } else if (res.status === 401 || res.status === 403) {
          // Expired or invalid token, or the account was deactivated.
          setToken('');
          localStorage.removeItem('nrgp_token');
          storeTab(null);
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        if (!cancelled) setRestoringSession(false);
      }
    };

    restore();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) storeTab(activeTab);
  }, [user, activeTab]);

  // Unread badges for the sidebar, plus the supplier's pop-up entries.
  const [notifications, setNotifications] = useState({ unread: {}, popup: [] });

  const refreshNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getNotifications(token);
      setNotifications({ unread: data.unread || {}, popup: data.popup || [] });
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [token]);

  useEffect(() => {
    if (!user) return undefined;
    refreshNotifications();
    const timer = setInterval(refreshNotifications, 60000);
    return () => clearInterval(timer);
  }, [user, refreshNotifications]);

  // Marks everything the pop-up showed as seen; it won't pop up again.
  const dismissPopup = async () => {
    const newest = notifications.popup[0];
    setNotifications((prev) => ({ ...prev, popup: [] }));
    if (!newest) return;
    try {
      await api.dismissNotifications(token, newest.id);
    } catch (err) {
      console.error('Failed to dismiss notifications:', err);
    }
  };

  const handleLoginSuccess = (loggedInUser, authToken) => {
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem('nrgp_token', authToken);
    setActiveTab(DEFAULT_TAB_BY_ROLE[loggedInUser.role] || 'dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    setActiveDispatchId(null);
    setNotifications({ unread: {}, popup: [] });
    localStorage.removeItem('nrgp_token');
    storeTab(null);
  };

  const goToTab = (tab) => {
    setActiveDispatchId(null);
    setActiveTab(tab);
    refreshNotifications();
  };

  if (restoringSession) {
    return <div className="login-wrapper" style={{ color: '#FFF' }}>Loading...</div>;
  }

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
          onChanged={refreshNotifications}
        />
      );
    }

    if (user.role === 'ADMIN') {
      if (activeTab === 'nx-users') return <AdminEmployees token={token} />;
      if (activeTab === 'receivers') return <AdminSuppliers token={token} />;
    }

    if (user.role === 'NX' || user.role === 'ADMIN' || user.role === 'RECEIVER') {
      const portalLabel = user.role === 'ADMIN' ? 'Admin Portal' : user.role === 'RECEIVER' ? 'Supplier Portal' : 'NX Portal';
      if (activeTab === 'dashboard') return <NxDashboard token={token} user={user} onNavigate={goToTab} onOpenDetail={setActiveDispatchId} />;
      if (activeTab === 'new-dispatch' && user.role !== 'RECEIVER') return <NxNewDispatch token={token} user={user} onCreated={() => goToTab('dashboard')} />;
      if (activeTab === 'pending') return <DispatchList token={token} status="pending" title={TAB_META.pending.title} breadcrumb={`${portalLabel} / Pending`} emptyMessage={user.role === 'RECEIVER' ? 'Nothing waiting on you right now — new dispatches will appear here.' : 'No dispatches currently pending with a supplier.'} onOpenDetail={setActiveDispatchId} />;
      if (activeTab === 'disputed') return <DispatchList token={token} status="disputed" title={TAB_META.disputed.title} breadcrumb={`${portalLabel} / Disputed`} emptyMessage="All clear — no open disputes right now." onOpenDetail={setActiveDispatchId} />;
      if (activeTab === 'open') return <DispatchList token={token} status="open" title={TAB_META.open.title} breadcrumb={`${portalLabel} / Open tickets`} emptyMessage={user.role === 'RECEIVER' ? 'No open tickets — NX replies to your mismatch reports will appear here.' : 'No open tickets right now.'} onOpenDetail={setActiveDispatchId} />;
      if (activeTab === 'resolved') return <DispatchList token={token} status="resolved" title={TAB_META.resolved.title} breadcrumb={`${portalLabel} / Resolved`} emptyMessage="No resolved disputes yet." onOpenDetail={setActiveDispatchId} />;
      if (activeTab === 'historical') return <DispatchList token={token} status={null} title={TAB_META.historical.title} breadcrumb={`${portalLabel} / Historical`} emptyMessage="No historical records yet." onOpenDetail={setActiveDispatchId} />;
    }

    return null;
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} activeTab={activeTab} setActiveTab={goToTab} onLogout={handleLogout} unread={notifications.unread} />

      <div className="main-content">
        <Header title={meta.title} breadcrumb={meta.breadcrumb} />
        {renderBody()}
      </div>

      {user.role === 'RECEIVER' && notifications.popup.length > 0 && (
        <NotificationPopup
          items={notifications.popup}
          onLater={dismissPopup}
          onOpen={(item) => {
            dismissPopup();
            setActiveTab(notifications.popup.some((i) => i.dispatch_id === item.dispatch_id && i.event_type === 'resolved') ? 'resolved' : 'open');
            setActiveDispatchId(item.dispatch_id);
          }}
        />
      )}
    </div>
  );
}
