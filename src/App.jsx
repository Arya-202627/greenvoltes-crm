// App.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RoleSwitcher from './components/RoleSwitcher';
import { fetchDbFromServer } from './db/mockDb';

// Import Views
import CEOView from './views/CEOView';
import LeadsView from './views/LeadsView';
import DealersView from './views/DealersView';
import SurveysView from './views/SurveysView';
import QuotesView from './views/QuotesView';
import ProjectsView from './views/ProjectsView';
import MNREView from './views/MNREView';
import LoansView from './views/LoansView';
import InventoryView from './views/InventoryView';
import InstallationsView from './views/InstallationsView';
import EmployeeView from './views/EmployeeView';
import FinanceView from './views/FinanceView';
import ServiceView from './views/ServiceView';
import CustomerView from './views/CustomerView';
import DMSView from './views/DMSView';
import NotificationsView from './views/NotificationsView';
import LoginView from './views/LoginView';

import './App.css'; // Clear old styles and fallback to index.css

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('greenvoltes_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [userRole, setUserRole] = useState(() => {
    const saved = localStorage.getItem('greenvoltes_user');
    if (saved) {
      return JSON.parse(saved).role;
    }
    return 'Admin';
  });

  const [activeView, setActiveView] = useState(() => {
    const saved = localStorage.getItem('greenvoltes_user');
    if (saved) {
      const role = JSON.parse(saved).role;
      // Default views mapping for roles
      const defaultViews = {
        Admin: 'ceo',
        Dealer: 'dealer',
        Customer: 'customer_portal',
        'Sales Manager': 'ceo',
        'Sales Executive': 'leads',
        'Site Survey Engineer': 'surveys',
        'Design Engineer': 'projects',
        'MNRE Executive': 'mnre',
        'Loan Executive': 'loans',
        'Store Manager': 'inventory',
        'Accounts Executive': 'finance',
        'Service Engineer': 'service',
        'Installation Team': 'installations'
      };
      return defaultViews[role] || 'ceo';
    }
    return 'ceo';
  });

  const [loading, setLoading] = useState(true);
  const [syncTrigger, setSyncTrigger] = useState(0);

  useEffect(() => {
    // Initial fetch of the database from server
    fetchDbFromServer().then(() => setLoading(false));

    // Poll the backend SQLite server every 4 seconds to catch updates from other users
    const interval = setInterval(() => {
      fetchDbFromServer();
    }, 4000);

    // Listen to database sync events to force active tab update if needed
    const handleDbSync = () => {
      setSyncTrigger(prev => prev + 1);
    };
    window.addEventListener('db-synced', handleDbSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('db-synced', handleDbSync);
    };
  }, []);


  // Map of views to check role authorization
  const viewPermissions = {
    ceo: ['Admin', 'Sales Manager'],
    leads: ['Admin', 'Sales Manager', 'Sales Executive'],
    dealer: ['Admin', 'Dealer'],
    surveys: ['Admin', 'Site Survey Engineer'],
    quotes: ['Admin', 'Sales Manager', 'Sales Executive'],
    projects: ['Admin', 'Design Engineer', 'Installation Manager'],
    mnre: ['Admin', 'MNRE Executive'],
    loans: ['Admin', 'Loan Executive'],
    inventory: ['Admin', 'Store Manager', 'Procurement Manager'],
    purchases: ['Admin', 'Procurement Manager'],
    installations: ['Admin', 'Installation Manager', 'Installation Team'],
    employees: ['Admin'],
    finance: ['Admin', 'Accounts Executive'],
    service: ['Admin', 'Service Engineer'],
    customer_portal: ['Admin', 'Customer'],
    dms: ['Admin', 'Sales Manager', 'Sales Executive', 'Site Survey Engineer', 'MNRE Executive', 'Loan Executive', 'Accounts Executive'],
    notifications: ['Admin']
  };

  // Default redirect views for each role
  const defaultViews = {
    Admin: 'ceo',
    Dealer: 'dealer',
    Customer: 'customer_portal',
    'Sales Manager': 'ceo',
    'Sales Executive': 'leads',
    'Site Survey Engineer': 'surveys',
    'Design Engineer': 'projects',
    'MNRE Executive': 'mnre',
    'Loan Executive': 'loans',
    'Store Manager': 'inventory',
    'Accounts Executive': 'finance',
    'Service Engineer': 'service',
    'Installation Team': 'installations'
  };

  const handleRoleChange = (newRole) => {
    setUserRole(newRole);
    // If current view is not permitted for new role, redirect
    const allowedRolesForCurrentView = viewPermissions[activeView] || [];
    if (!allowedRolesForCurrentView.includes(newRole)) {
      const redirect = defaultViews[newRole] || 'ceo';
      setActiveView(redirect);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('greenvoltes_user', JSON.stringify(user));
    setUserRole(user.role);
    const redirect = defaultViews[user.role] || 'ceo';
    setActiveView(redirect);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('greenvoltes_user');
    setUserRole('Admin');
    setActiveView('ceo');
  };

  // Render active view component
  const renderView = () => {
    switch (activeView) {
      case 'ceo':
        return <CEOView />;
      case 'leads':
        return <LeadsView />;
      case 'dealer':
        return <DealersView userRole={userRole} />;
      case 'surveys':
        return <SurveysView userRole={userRole} />;
      case 'quotes':
        return <QuotesView />;
      case 'projects':
        return <ProjectsView />;
      case 'mnre':
        return <MNREView />;
      case 'loans':
        return <LoansView />;
      case 'inventory':
        return <InventoryView userRole={userRole} />;
      case 'purchases':
        return <InventoryView userRole={userRole} />; // Shares PO & inventory view
      case 'installations':
        return <InstallationsView />;
      case 'employees':
        return <EmployeeView />;
      case 'finance':
        return <FinanceView />;
      case 'service':
        return <ServiceView />;
      case 'customer_portal':
        return <CustomerView />;
      case 'dms':
        return <DMSView />;
      case 'notifications':
        return <NotificationsView />;
      default:
        return <CEOView />;
    }
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0b0f17',
        color: '#f3f4f6',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          border: '4px solid rgba(16, 185, 129, 0.1)',
          borderTop: '4px solid #10b981',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}></div>
        <p style={{ fontWeight: '500', fontSize: '15px' }}>Connecting to Greenvoltes Server...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (currentUser === null) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        userRole={userRole} 
      />

      {/* Top Header role controller bar */}
      <RoleSwitcher 
        userRole={userRole} 
        setUserRole={setUserRole} 
        onRoleChange={handleRoleChange} 
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main View Display Port */}
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
