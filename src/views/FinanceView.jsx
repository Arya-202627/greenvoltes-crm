// FinanceView.jsx
import React, { useState, useEffect } from 'react';
import { getDb, saveDb } from '../db/mockDb';
import { 
  IndianRupee, Calculator, RefreshCw, Send, CheckSquare, 
  ArrowUpRight, ArrowDownLeft, BookOpen, AlertCircle
} from 'lucide-react';

export default function FinanceView() {
  const [db, setDb] = useState(getDb());
  const [financeRecords, setFinanceRecords] = useState(db.finance);
  const [syncLogs, setSyncLogs] = useState([
    { time: '2026-06-05 10:00 AM', status: 'Success', msg: 'Connected to Zoho Books API Gateway.' },
    { time: '2026-06-05 10:05 AM', status: 'Success', msg: 'Synced invoice F001 (Ramesh Nair Advance payment).' },
    { time: '2026-06-05 10:05 AM', status: 'Success', msg: 'Synced invoice F002 (George Joseph Advance payment).' }
  ]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Profit Calculator State
  const [profCalc, setProfCalc] = useState({
    projVal: 200000,
    panelCost: 95340,
    bosCost: 20000,
    fabCost: 12000,
    labourCost: 12000
  });

  // New Transaction Form State
  const [newTrans, setNewTrans] = useState({
    description: '',
    type: 'Receivable (In)',
    amount: '',
    projectSize: 3,
    gst: ''
  });

  useEffect(() => {
    setDb(getDb());
    setFinanceRecords(db.finance);
  }, []);

  const refreshFinance = () => {
    const fresh = getDb();
    setDb(fresh);
    setFinanceRecords(fresh.finance);
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    const fid = 'F' + (db.finance.length + 101);
    const cost = parseFloat(newTrans.amount);
    const gstAmt = newTrans.gst ? parseFloat(newTrans.gst) : Math.round(cost * 0.18); // Default 18%

    db.finance.push({
      id: fid,
      description: newTrans.description,
      type: newTrans.type,
      amount: cost,
      projectSize: parseFloat(newTrans.projectSize),
      date: new Date().toISOString().split('T')[0],
      gst: gstAmt,
      zohoSynced: false
    });

    saveDb(db);
    setNewTrans({ description: '', type: 'Receivable (In)', amount: '', projectSize: 3, gst: '' });
    refreshFinance();
    alert(`Transaction recorded: ${fid}`);
  };

  const handleZohoSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const updated = { ...db };
      let count = 0;
      const logsCopy = [...syncLogs];

      updated.finance.forEach((f, idx) => {
        if (!f.zohoSynced) {
          updated.finance[idx].zohoSynced = true;
          count++;
          logsCopy.unshift({
            time: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'Success',
            msg: `Synced ledger item ${f.id} (${f.description}) to Zoho Books API.`
          });
        }
      });

      saveDb(updated);
      setSyncLogs(logsCopy);
      setIsSyncing(false);
      refreshFinance();
      alert(`Zoho Books Synchronization complete. Synced ${count} new ledger transactions.`);
    }, 2000);
  };

  // Profitability Calculations
  const calcGrossProfit = profCalc.projVal - (profCalc.panelCost + profCalc.bosCost + profCalc.fabCost + profCalc.labourCost);
  const calcProfitPercent = profCalc.projVal > 0 ? Math.round((calcGrossProfit / profCalc.projVal) * 100) : 0;
  const calcNetMargin = calcGrossProfit - (profCalc.projVal * 0.05); // Less 5% admin/sales expenses

  return (
    <div className="finance-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><IndianRupee className="view-icon-color" /> Finance & Accounting</h2>
          <p className="view-subtitle">Monitor customer receivables, process procurement payables, calculate project margins, and sync Zoho Books.</p>
        </div>
      </div>

      <div className="crm-main-layout">
        {/* Ledger table */}
        <div className="glass-card crm-list-pane">
          <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '16px 16px 0 16px' }}>
            <h3 className="card-title">Receivables & Payables Ledger</h3>
            <button className="btn btn-primary btn-sm" onClick={handleZohoSync} disabled={isSyncing}>
              <RefreshCw size={12} className={isSyncing ? 'spin-anim' : ''} /> {isSyncing ? 'Syncing...' : 'Sync Zoho Books API'}
            </button>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Trans ID</th>
                  <th>Description</th>
                  <th>Transaction Type</th>
                  <th>Capital Amount</th>
                  <th>GST Tax Value</th>
                  <th>Recording Date</th>
                  <th>Zoho Synced</th>
                </tr>
              </thead>
              <tbody>
                {financeRecords.map(f => (
                  <tr key={f.id}>
                    <td><code>{f.id}</code></td>
                    <td style={{ fontWeight: '600' }}>{f.description}</td>
                    <td>
                      <span className={`badge badge-${f.type.includes('Receivable') ? 'success' : 'danger'}`}>
                        {f.type}
                      </span>
                    </td>
                    <td>₹{f.amount.toLocaleString('en-IN')}</td>
                    <td>₹{f.gst.toLocaleString('en-IN')}</td>
                    <td>{f.date}</td>
                    <td>
                      <span className={`badge ${f.zohoSynced ? 'badge-success' : 'badge-pending'}`}>
                        {f.zohoSynced ? 'Synced' : 'Pending Sync'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Project Profitability Calculator */}
        <div className="glass-card">
          <div className="calculator-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Calculator className="view-icon-color" />
            <h3 className="card-title">Project Profitability Calculator</h3>
          </div>

          <div className="calculator-body">
            <div className="form-group">
              <label>Project Value Amount (INR)</label>
              <input 
                type="number" 
                className="form-control" 
                value={profCalc.projVal} 
                onChange={(e) => setProfCalc({ ...profCalc, projVal: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Solar Panel Cost (INR)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={profCalc.panelCost} 
                  onChange={(e) => setProfCalc({ ...profCalc, panelCost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>BOS Materials Cost (INR)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={profCalc.bosCost} 
                  onChange={(e) => setProfCalc({ ...profCalc, bosCost: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Fabrication Cost (INR)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={profCalc.fabCost} 
                  onChange={(e) => setProfCalc({ ...profCalc, fabCost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>Labour Cost (INR)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={profCalc.labourCost} 
                  onChange={(e) => setProfCalc({ ...profCalc, labourCost: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="calculator-results" style={{ marginTop: '20px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Calculated Gross Profit:</span>
                <strong style={{ fontSize: '15px', color: 'var(--primary)' }}>₹{calcGrossProfit.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Profit Margin Percentage:</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--status-info)' }}>{calcProfitPercent}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Est. Net Margin (minus admin):</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--status-purple)' }}>₹{calcNetMargin.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zoho Sync Log Console */}
      <div className="glass-card" style={{ marginTop: '20px' }}>
        <h3 className="card-title" style={{ marginBottom: '16px' }}><BookOpen size={16} style={{ display: 'inline', marginRight: '6px' }} /> Zoho Books API Integration Gateway Logs</h3>
        <div className="sync-logs-console" style={{ background: '#000', padding: '16px', borderRadius: '6px', maxHeight: '180px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px', color: '#39ff14', border: '1px solid var(--border-color)' }}>
          {syncLogs.map((log, idx) => (
            <div key={idx} style={{ marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span>{' '}
              <span style={{ color: log.status === 'Success' ? '#10b981' : '#ef4444' }}>{log.status.toUpperCase()}:</span>{' '}
              {log.msg}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .spin-anim {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
