import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import AdminEmployees from './pages/AdminEmployees';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nrgp_token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('nx-users');

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await api.login(email, password);
    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('nrgp_token', data.token);
      setActiveTab('nx-users');
    } else {
      alert(data.error || 'Login failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('nrgp_token');
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--navy)' }}>
        <form onSubmit={handleLogin} style={{ background: '#FFF', padding: '32px', borderRadius: '8px', width: '320px' }}>
          <h2>NRGP Login</h2>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', margin: '10px 0', padding: '8px' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', margin: '10px 0', padding: '8px' }} />
          <button type="submit" style={{ width: '100%', padding: '10px', background: 'var(--lime)', border: 'none', fontWeight: 'bold' }}>Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      <div className="main-content">
        {activeTab === 'nx-users' && <AdminEmployees token={token} />}
      </div>
    </div>
  );
}