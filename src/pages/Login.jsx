import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.login(email, password);
      const data = await res.json();

      if (res.ok) {
        // Pass authenticated user object & token up to App
        onLoginSuccess(data.user, data.token);
      } else {
        setErrorMsg(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Unable to connect to login service. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-badge">NRGP</div>
          <h2>Non-Returnable Gate Pass</h2>
          <p>Enter your credentials to sign in to your account</p>
        </div>

        {errorMsg && <div className="error-banner">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              placeholder="user@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}