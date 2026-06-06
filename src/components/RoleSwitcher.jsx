import React from 'react';
import { User, ShieldAlert, ShieldCheck, Cpu, RefreshCw, Menu } from 'lucide-react';

export default function RoleSwitcher({ userRole, setUserRole, onRoleChange, currentUser, onLogout, toggleSidebar }) {
  const roles = [
    'Admin',
    'Dealer',
    'Customer',
    'Sales Manager',
    'Site Survey Engineer',
    'Design Engineer',
    'MNRE Executive',
    'Loan Executive',
    'Store Manager',
    'Accounts Executive',
    'Service Engineer',
    'Installation Team'
  ];

  const handleRoleChange = (e) => {
    const nextRole = e.target.value;
    setUserRole(nextRole);
    if (onRoleChange) {
      onRoleChange(nextRole);
    }
  };

  return (
    <header className="role-switcher-header">
      <div className="header-left">
        <button className="mobile-menu-toggle-btn" onClick={toggleSidebar} title="Open Menu">
          <Menu size={20} />
        </button>
        <Cpu className="sys-status-icon" size={16} style={{ color: '#22c55e' }} />
        <span className="sys-status-text">Server Connected</span>
        <span className="pulse-indicator" style={{ background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></span>
      </div>

      <div className="header-right">
        <button 
          onClick={() => window.location.reload()} 
          className="header-refresh-btn" 
          title="Force Sync with SQLite Server"
        >
          <RefreshCw size={13} className="refresh-icon-spin" />
          <span>Sync & Reload</span>
        </button>

        <div className="time-display">
          <span>June 6, 2026</span>
          <span className="time-sep">|</span>
          <span>16:15 IST</span>
        </div>
        
        {currentUser?.role === 'Admin' ? (
          <div className="role-select-container">
            <ShieldAlert size={15} className="role-select-icon" />
            <select 
              value={userRole} 
              onChange={handleRoleChange} 
              className="role-dropdown"
              title="Change active user role to view different dashboards"
            >
              {roles.map(role => (
                <option key={role} value={role}>{role} Perspective</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="role-display-badge">
            <ShieldCheck size={14} style={{ color: 'var(--primary)' }} />
            <span>{currentUser?.role || 'Staff'} Perspective</span>
          </div>
        )}
        
        <div className="user-profile-badge">
          <User size={16} className="profile-icon" />
          <span className="profile-name">{currentUser?.name || 'Arya Rajagopal'}</span>
          <button 
            onClick={onLogout} 
            className="logout-btn-header"
            title="Log Out Securely"
          >
            Logout
          </button>
        </div>
      </div>

      <style>{`
        .role-switcher-header {
          position: fixed;
          top: 0;
          left: 260px;
          right: 0;
          height: 70px;
          background: rgba(11, 15, 23, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 999;
          transition: left var(--transition-normal);
        }

        @media (max-width: 992px) {
          .role-switcher-header {
            left: 0;
            padding: 0 16px;
          }
          .mobile-menu-toggle-btn {
            display: flex;
          }
        }

        .mobile-menu-toggle-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 8px;
          margin-right: 8px;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast);
        }

        .mobile-menu-toggle-btn:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sys-status-icon {
          color: var(--primary);
        }

        .sys-status-text {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .pulse-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          display: inline-block;
          box-shadow: 0 0 6px #22c55e;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .time-display {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        @media (max-width: 768px) {
          .time-display {
            display: none;
          }
          .sys-status-text {
            display: none;
          }
          .profile-name {
            display: none;
          }
          .header-refresh-btn span {
            display: none;
          }
          .header-refresh-btn {
            padding: 6px 8px;
          }
          .role-dropdown {
            font-size: 11px;
            padding: 6px 8px 6px 0;
          }
          .role-select-container {
            padding: 0 4px;
          }
        }

        .time-sep {
          color: var(--border-color);
        }

        .role-select-container {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 0 8px 0 12px;
          transition: border-color var(--transition-fast);
        }

        .role-select-container:hover {
          border-color: var(--primary);
        }

        .role-select-icon {
          color: var(--primary);
          margin-right: 8px;
        }

        .role-dropdown {
          background: transparent;
          border: none;
          color: var(--text-primary);
          padding: 8px 12px 8px 0;
          font-size: 13px;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          font-family: var(--font-primary);
        }

        .role-dropdown option {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .user-profile-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
        }

        .profile-icon {
          color: var(--text-secondary);
        }

        .profile-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .header-refresh-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: var(--primary);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          outline: none;
        }

        .header-refresh-btn:hover {
          background: var(--primary);
          color: #fff;
          box-shadow: 0 0 8px var(--primary);
          border-color: var(--primary);
        }

        .header-refresh-btn:hover .refresh-icon-spin {
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .role-display-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 600;
          color: var(--primary);
        }

        .logout-btn-header {
          margin-left: 8px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #ef4444;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
          outline: none;
        }

        .logout-btn-header:hover {
          background: #ef4444;
          color: #fff;
          border-color: #ef4444;
          box-shadow: 0 0 6px #ef4444;
        }
      `}</style>
    </header>
  );
}
