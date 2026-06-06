// CEOView.jsx
import React, { useState, useEffect } from 'react';
import { 
  getLeads, getProjects, getDb, getFinance, getInventory, getCollection 
} from '../db/mockDb';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, Users, ShieldAlert, BadgeIndianRupee, Package, CheckCircle2,
  FileDown, Filter, Calendar
} from 'lucide-react';

export default function CEOView() {
  const [db, setDb] = useState(getDb());
  const [filterPeriod, setFilterPeriod] = useState('All');

  useEffect(() => {
    // Poll DB or set up local refresh
    setDb(getDb());
  }, []);

  // Compute Metrics
  const totalLeads = db.leads.length;
  const activeProjects = db.projects.filter(p => p.currentStage < 14).length;
  const completedProjects = db.projects.filter(p => p.currentStage === 14).length;
  
  // Total Revenue: sum of receivable finance records
  const totalRevenue = db.finance
    .filter(f => f.type.includes('Receivable'))
    .reduce((sum, f) => sum + f.amount, 0);

  // Total Outstanding: calculated roughly based on open projects (net price - payments)
  const pendingSubsidy = db.mnre
    .filter(m => m.subsidyStatus !== 'Received')
    .reduce((sum, m) => sum + (m.subsidyAmount || 78000), 0);

  const pendingLoans = db.loans
    .filter(l => l.stage !== 'Disbursed')
    .reduce((sum, l) => sum + l.loanAmount, 0);

  // Stock Value
  const stockValue = db.inventory.reduce((sum, item) => sum + (item.qty * item.price), 0);

  // Profit calculations
  // Panel Cost: WA-2026 panel costs, etc.
  const grossProfit = totalRevenue * 0.42; // Simulated EPC gross margin
  const netMargin = grossProfit - (stockValue * 0.05);

  // Graph Data 1: Monthly Revenue & Sales
  const salesTrendData = [
    { name: 'Jan', Sales: 450000, Revenue: 210000 },
    { name: 'Feb', Sales: 600000, Revenue: 380000 },
    { name: 'Mar', Sales: 850000, Revenue: 520000 },
    { name: 'Apr', Sales: 980000, Revenue: 710000 },
    { name: 'May', Sales: 1250000, Revenue: 890000 },
    { name: 'Jun', Sales: 1500000, Revenue: 1120000 }
  ];

  // Graph Data 2: Projects by Stage
  const stageDistribution = [
    { stage: 'Survey', count: db.leads.filter(l => l.status === 'Site Survey Completed').length },
    { stage: 'Quotation', count: db.leads.filter(l => l.status === 'Quotation Sent').length },
    { stage: 'Confirmed', count: db.leads.filter(l => l.status === 'Order Confirmed').length },
    { stage: 'Procurement', count: db.projects.filter(p => p.currentStage === 6).length },
    { stage: 'Installed', count: db.leads.filter(l => l.status === 'Installed').length },
    { stage: 'Subsidy Pending', count: db.leads.filter(l => l.status === 'Subsidy Pending').length },
    { stage: 'Completed', count: db.leads.filter(l => l.status === 'Completed').length }
  ];

  // Export to CSV helper
  const handleExport = (type) => {
    alert(`Generating and downloading ${type} report as Excel/PDF...`);
  };

  return (
    <div className="view-container">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><TrendingUp className="view-icon-color" /> CEO Dashboard</h2>
          <p className="view-subtitle">Executive business analytics & financial performance for Greenvoltes.</p>
        </div>
        <div className="header-actions">
          <div className="filter-select-box">
            <Filter size={14} className="filter-icon" />
            <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="period-dropdown">
              <option value="All">All Time</option>
              <option value="Month">This Month</option>
              <option value="Quarter">This Quarter</option>
              <option value="Year">This Fiscal Year</option>
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('Executive')}>
            <FileDown size={14} /> Export Summary
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-cols-4">
        <div className="glass-card metric-card">
          <div className="metric-icon-box" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            <Users size={20} style={{ color: 'var(--status-new)' }} />
          </div>
          <div className="metric-details">
            <h4>Total Leads</h4>
            <p>{totalLeads}</p>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon-box" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <Calendar size={20} style={{ color: 'var(--status-pending)' }} />
          </div>
          <div className="metric-details">
            <h4>Active Projects</h4>
            <p>{activeProjects}</p>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon-box" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <BadgeIndianRupee size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="metric-details">
            <h4>Total Revenue</h4>
            <p>₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon-box" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}>
            <Package size={20} style={{ color: 'var(--status-info)' }} />
          </div>
          <div className="metric-details">
            <h4>Stock Valuation</h4>
            <p>₹{stockValue.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <div className="glass-card secondary-metric">
          <span className="sec-metric-label">Estimated Gross Margin (42%)</span>
          <span className="sec-metric-value text-green">₹{grossProfit.toLocaleString('en-IN')}</span>
        </div>
        <div className="glass-card secondary-metric">
          <span className="sec-metric-label">Pending Subsidy Amount (MNRE)</span>
          <span className="sec-metric-value text-amber">₹{pendingSubsidy.toLocaleString('en-IN')}</span>
        </div>
        <div className="glass-card secondary-metric">
          <span className="sec-metric-label">Pending Loan Disbursals</span>
          <span className="sec-metric-value text-blue">₹{pendingLoans.toLocaleString('en-IN')}</span>
        </div>
        <div className="glass-card secondary-metric">
          <span className="sec-metric-label">Completed Projects</span>
          <span className="sec-metric-value text-purple">{completedProjects} Installed</span>
        </div>
      </div>

      {/* Recharts Graphical Analysis */}
      <div className="grid-cols-2">
        <div className="glass-card chart-container">
          <h3 className="chart-title">Revenue & Sales Run Rate</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                <Area type="monotone" dataKey="Sales" stroke="var(--primary)" fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="Revenue" stroke="var(--secondary)" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card chart-container">
          <h3 className="chart-title">Solar Lead Stages Distribution</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={stageDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="stage" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                  {stageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--primary)' : 'var(--secondary)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dealer & Territory Performance Leaderboard */}
      <div className="glass-card" style={{ marginTop: '24px' }}>
        <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="card-title">Dealer & Partner Network Performance</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('Dealers')}>
            Download Partner Report
          </button>
        </div>
        
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Partner ID</th>
                <th>Dealer Name</th>
                <th>District</th>
                <th>Territory</th>
                <th>Orders Booked</th>
                <th>Total Earnings</th>
                <th>Paid Commission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {db.dealers.map(dealer => (
                <tr key={dealer.id}>
                  <td><code>{dealer.id}</code></td>
                  <td style={{ fontWeight: '600' }}>{dealer.name}</td>
                  <td>{dealer.district}</td>
                  <td>{dealer.assignedTerritory}</td>
                  <td>{dealer.salesCount} Installations</td>
                  <td>₹{dealer.earnings.toLocaleString('en-IN')}</td>
                  <td>₹{dealer.paidAmount.toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`badge ${dealer.status === 'Approved' ? 'badge-success' : 'badge-pending'}`}>
                      {dealer.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .view-container {
          display: flex;
          flex-direction: column;
        }

        .view-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .view-icon-color {
          color: var(--primary);
          display: inline-block;
          vertical-align: middle;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .filter-select-box {
          display: flex;
          align-items: center;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 6px 12px;
        }

        .filter-icon {
          color: var(--text-muted);
          margin-right: 8px;
        }

        .period-dropdown {
          background: transparent;
          border: none;
          color: var(--text-primary);
          outline: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }

        .period-dropdown option {
          background: var(--bg-secondary);
        }

        .secondary-metric {
          display: flex;
          flex-direction: column;
          padding: 16px;
          background: rgba(27, 35, 54, 0.4);
          border: 1px solid var(--border-color);
        }

        .sec-metric-label {
          font-size: 11px;
          color: var(--text-secondary);
          margin-bottom: 6px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .sec-metric-value {
          font-size: 18px;
          font-weight: 700;
          font-family: var(--font-title);
        }

        .text-green { color: var(--primary); }
        .text-amber { color: var(--status-pending); }
        .text-blue { color: var(--status-new); }
        .text-purple { color: var(--status-purple); }

        .chart-container {
          background: var(--bg-secondary);
        }

        .chart-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 20px;
          color: var(--text-primary);
          border-left: 3px solid var(--primary);
          padding-left: 10px;
        }

        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
