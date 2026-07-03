// LoginView.jsx
import React, { useState } from 'react';
import { loginUserToServer } from '../db/mockDb';
import { ShieldCheck, Mail, Lock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDemoDrawer, setShowDemoDrawer] = useState(false);

  const demoUsers = [
    { email: 'admin@greenvoltes.in', pass: 'admin123', role: 'Admin' },
    { email: 'dinesh', pass: '8714889721', role: 'Dealer (Dinesh)' },
    { email: 'ganesh', pass: '9633223787', role: 'Dealer (Ganesh)' },
    { email: 'ruksana', pass: '8129900484', role: 'Dealer (Ruksana C R.)' },
    { email: 'yadu', pass: '8129920094', role: 'Dealer (Yadhu S)' },
    { email: 'vyshak', pass: '7994005973', role: 'Dealer (Vyshak)' },
    { email: 'kannan', pass: '9947762396', role: 'Dealer (Kannan K S)' },
    { email: 'rinku', pass: '7907347100', role: 'Dealer (Rinku Mathew)' },
    { email: 'aswin', pass: '8590544311', role: 'Dealer (Aswin)' },
    { email: 'anandu', pass: '9633591854', role: 'Dealer (Anandu L)' },
    { email: 'customer@greenvoltes.in', pass: 'customer123', role: 'Customer' },
    { email: 'anoop@greenvoltes.in', pass: 'sales123', role: 'Sales Manager' },
    { email: 'manu@greenvoltes.in', pass: 'survey123', role: 'Site Survey Engineer' },
    { email: 'devan@greenvoltes.in', pass: 'design123', role: 'Design Engineer' },
    { email: 'staff', pass: 'staff123', role: 'Office Staff' }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await loginUserToServer(email, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      }
    } catch (err) {
      setError(err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="login-screen-wrapper">
      <div className="login-container-card glass-card">
        {/* Branding header */}
        <div className="login-branding">
          <div className="logo-container-wide-login">
            <img src="/logo.png" alt="Greenvolt Energy Solutions Logo" className="login-logo-wide" />
          </div>
          <p>Solar EPC Enterprise ERP & CRM</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="login-error-alert">
              <span>{error}</span>
            </div>
          )}

          <div className="login-input-group">
            <label>Email or Username</label>
            <div className="input-box">
              <Mail size={16} className="input-icon" />
              <input 
                type="text" 
                required 
                placeholder="Email or Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="login-input-group">
            <label>Security Password</label>
            <div className="input-box">
              <Lock size={16} className="input-icon" />
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        {/* Demo Credentials Drawer */}
        <div className="demo-credentials-section">
          <button 
            type="button" 
            onClick={() => setShowDemoDrawer(!showDemoDrawer)} 
            className="demo-toggle-btn"
          >
            <span><Sparkles size={12} style={{ display: 'inline', marginRight: '6px' }} /> Quick Demo Logins</span>
            {showDemoDrawer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showDemoDrawer && (
            <div className="demo-drawer-content">
              <p className="drawer-hint">Select a staff/partner profile to auto-fill credentials:</p>
              <div className="demo-badges-grid">
                {demoUsers.map((user) => (
                  <button
                    key={user.role}
                    type="button"
                    className="demo-profile-badge"
                    onClick={() => fillCredentials(user.email, user.pass)}
                  >
                    <span className="demo-role">{user.role}</span>
                    <span className="demo-email">{user.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .login-screen-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          width: 100vw;
          background: radial-gradient(circle at top right, #1b263b 0%, #080b11 70%);
          padding: 20px;
          box-sizing: border-box;
          font-family: var(--font-primary);
        }

        .login-container-card {
          width: 100%;
          max-width: 440px;
          padding: 36px 30px;
          border-radius: var(--radius-md);
          background: rgba(11, 15, 23, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .login-branding {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 30px;
        }

        .logo-container-wide-login {
          background: #ffffff;
          padding: 10px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 280px;
          height: 60px;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.15);
          margin-bottom: 16px;
          box-sizing: border-box;
        }

        .login-logo-wide {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .login-branding p {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-error-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: var(--status-danger);
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
          text-align: center;
        }

        .login-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .login-input-group label {
          font-size: 11px;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-box {
          display: flex;
          align-items: center;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          transition: border-color var(--transition-fast);
        }

        .input-box:focus-within {
          border-color: var(--primary);
        }

        .input-icon {
          color: var(--text-muted);
          margin-right: 12px;
        }

        .input-box input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 14px;
          width: 100%;
        }

        .login-btn {
          margin-top: 10px;
          width: 100%;
          justify-content: center;
          padding: 12px;
          font-size: 14px;
          font-weight: 600;
        }

        .demo-credentials-section {
          margin-top: 24px;
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
        }

        .demo-toggle-btn {
          background: none;
          border: none;
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--primary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 0;
          outline: none;
          transition: color var(--transition-fast);
        }

        .demo-toggle-btn:hover {
          color: #fff;
        }

        .demo-drawer-content {
          margin-top: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 12px;
        }

        .drawer-hint {
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 10px;
        }

        .demo-badges-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .demo-profile-badge {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 6px 10px;
          text-align: left;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .demo-profile-badge:hover {
          border-color: var(--primary);
          background: rgba(16, 185, 129, 0.04);
        }

        .demo-role {
          font-size: 11px;
          font-weight: 700;
          color: var(--primary);
        }

        .demo-email {
          font-size: 9px;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
