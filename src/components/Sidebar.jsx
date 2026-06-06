// Sidebar.jsx
import React from 'react';
import { 
  BarChart3, Users, Landmark, FileText, ClipboardList, Briefcase, 
  ShieldCheck, Banknote, Package, ShoppingCart, Wrench, UserCheck, 
  IndianRupee, Activity, User, FolderClosed, BellRing, Settings
} from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, userRole }) {
  // Navigation list with icons and role access
  const allNavItems = [
    { id: 'ceo', label: 'CEO Dashboard', icon: BarChart3, roles: ['Admin', 'Sales Manager'] },
    { id: 'leads', label: 'Leads & CRM', icon: Users, roles: ['Admin', 'Sales Manager', 'Sales Executive'] },
    { id: 'dealer', label: 'Dealer Portal', icon: Landmark, roles: ['Admin', 'Dealer'] },
    { id: 'surveys', label: 'Site Surveys', icon: ClipboardList, roles: ['Admin', 'Site Survey Engineer'] },
    { id: 'quotes', label: 'Quotations & Invoices', icon: FileText, roles: ['Admin', 'Sales Manager', 'Sales Executive'] },
    { id: 'projects', label: 'Project Pipeline', icon: Briefcase, roles: ['Admin', 'Design Engineer', 'Installation Manager'] },
    { id: 'mnre', label: 'MNRE & Surya Ghar', icon: ShieldCheck, roles: ['Admin', 'MNRE Executive'] },
    { id: 'loans', label: 'Loan Processing', icon: Banknote, roles: ['Admin', 'Loan Executive'] },
    { id: 'inventory', label: 'Inventory & Stock', icon: Package, roles: ['Admin', 'Store Manager', 'Procurement Manager'] },
    { id: 'purchases', label: 'Purchase Orders', icon: ShoppingCart, roles: ['Admin', 'Procurement Manager'] },
    { id: 'installations', label: 'Installations & QC', icon: Wrench, roles: ['Admin', 'Installation Manager', 'Installation Team'] },
    { id: 'employees', label: 'Employee Manager', icon: UserCheck, roles: ['Admin'] },
    { id: 'finance', label: 'Finance & Accounts', icon: IndianRupee, roles: ['Admin', 'Accounts Executive'] },
    { id: 'service', label: 'Service & Warranty', icon: Activity, roles: ['Admin', 'Service Engineer'] },
    { id: 'customer_portal', label: 'Customer Portal', icon: User, roles: ['Admin', 'Customer'] },
    { id: 'dms', label: 'Document DMS', icon: FolderClosed, roles: ['Admin', 'Sales Manager', 'Sales Executive', 'Site Survey Engineer', 'MNRE Executive', 'Loan Executive', 'Accounts Executive'] },
    { id: 'notifications', label: 'Notifications Feed', icon: BellRing, roles: ['Admin'] }
  ];

  // Filter navigation items based on active role
  // Admin sees everything
  const visibleItems = userRole === 'Admin' 
    ? allNavItems 
    : allNavItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo-container-wide">
          <img src="/logo.png" alt="Greenvolt Energy Solutions Logo" className="sidebar-logo-wide" />
        </div>
      </div>
      
      <div className="sidebar-role-badge">
        <span className="role-dot"></span>
        <span className="role-text">{userRole} View</span>
      </div>

      <nav className="sidebar-nav">
        {visibleItems.map(item => {
          const IconComponent = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <IconComponent size={18} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p className="version">Greenvoltes ERP v1.0.0</p>
        <p className="copyright">© 2026 Greenvolt Energy</p>
      </div>

      <style>{`
        .sidebar {
          width: 260px;
          height: 100vh;
          background: #0e1420;
          border-right: 1px solid var(--border-color);
          position: fixed;
          top: 0;
          left: 0;
          display: flex;
          flex-direction: column;
          z-index: 1000;
        }

        .sidebar-brand {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }

        .logo-container-wide {
          background: #ffffff;
          padding: 8px 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 52px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          flex-shrink: 0;
          box-sizing: border-box;
        }

        .sidebar-logo-wide {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .sidebar-role-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 16px 20px 8px 20px;
          padding: 8px 12px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: var(--radius-sm);
        }

        .role-dot {
          width: 8px;
          height: 8px;
          background-color: var(--primary);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--primary);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .role-text {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 14px;
          background: none;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          text-align: left;
          font-family: var(--font-primary);
          font-size: 13.5px;
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .sidebar-nav-item:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.03);
          transform: translateX(3px);
        }

        .sidebar-nav-item.active {
          color: #0c120c;
          background: var(--primary);
          font-weight: 600;
          box-shadow: 0 0 12px var(--primary-glow);
        }

        .sidebar-nav-item.active .nav-icon {
          color: #0c120c;
        }

        .nav-icon {
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }

        .sidebar-nav-item:hover .nav-icon {
          color: var(--primary);
        }

        .sidebar-footer {
          padding: 16px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          font-size: 10px;
          color: var(--text-muted);
          text-align: center;
        }

        .version {
          font-weight: 600;
          margin-bottom: 2px;
        }
      `}</style>
    </aside>
  );
}
