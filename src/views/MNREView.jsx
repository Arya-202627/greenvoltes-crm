// MNREView.jsx
import React, { useState, useEffect } from 'react';
import { getDb, saveDb, logNotification } from '../db/mockDb';
import { ShieldAlert, ShieldCheck, AlertCircle, CheckCircle, BellRing, FileUp, Sparkles } from 'lucide-react';

export default function MNREView() {
  const [db, setDb] = useState(getDb());
  const [mnreRecords, setMnreRecords] = useState(db.mnre);

  useEffect(() => {
    setDb(getDb());
    setMnreRecords(db.mnre);
  }, []);

  const refreshMnre = () => {
    const fresh = getDb();
    setDb(fresh);
    setMnreRecords(fresh.mnre);
  };

  const handleUpdateRecord = (recId, field, value) => {
    const updated = { ...db };
    const idx = updated.mnre.findIndex(m => m.id === recId);
    if (idx !== -1) {
      updated.mnre[idx][field] = value;
      
      // Auto resolve or trigger alarms
      if (field === 'regStatus' && value === 'Completed') {
        updated.mnre[idx].docVerification = 'Approved';
        updated.mnre[idx].alerts = [];
      }
      
      saveDb(updated);
      refreshMnre();
    }
  };

  // Compute stats
  const totalSubsidies = mnreRecords.length;
  const pendingInspection = mnreRecords.filter(m => m.inspectionStatus === 'Pending Installation').length;
  const totalSubAmt = mnreRecords.reduce((sum, m) => sum + (m.subsidyAmount || 78000), 0);

  return (
    <div className="mnre-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><ShieldAlert className="view-icon-color" /> MNRE & PM Surya Ghar Subsidy</h2>
          <p className="view-subtitle">Monitor vendor declarations, consumer registrations, doc verifications, and MNRE subsidy clearances.</p>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
        <div className="glass-card metric-card">
          <div className="metric-icon-box">
            <Sparkles size={18} />
          </div>
          <div className="metric-details">
            <h4>Portal Applications</h4>
            <p>{totalSubsidies}</p>
          </div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon-box">
            <AlertCircle size={18} />
          </div>
          <div className="metric-details">
            <h4>Pending Inspects</h4>
            <p>{pendingInspection}</p>
          </div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon-box">
            <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="metric-details">
            <h4>Expected Subsidies</h4>
            <p>₹{totalSubAmt.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon-box">
            <BellRing size={18} />
          </div>
          <div className="metric-details">
            <h4>Active Alerts</h4>
            <p>{mnreRecords.reduce((sum, m) => sum + m.alerts.length, 0)}</p>
          </div>
        </div>
      </div>

      {/* Main Registry */}
      <div className="glass-card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>PM Surya Ghar Portal Records</h3>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>App ID</th>
                <th>Lead ID</th>
                <th>Consumer Connection ID</th>
                <th>Registration No.</th>
                <th>Surya Ghar Status</th>
                <th>KYC Verification</th>
                <th>Subsidy Status</th>
                <th>Alert Notification</th>
              </tr>
            </thead>
            <tbody>
              {mnreRecords.map(m => (
                <tr key={m.id}>
                  <td><code>{m.applicationId}</code></td>
                  <td><code>{m.leadId}</code></td>
                  <td>
                    <input 
                      type="text" 
                      className="form-control btn-sm" 
                      style={{ width: '130px', padding: '4px' }} 
                      value={m.consumerId || ''} 
                      onChange={(e) => handleUpdateRecord(m.id, 'consumerId', e.target.value)}
                      placeholder="Add Consumer ID"
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      className="form-control btn-sm" 
                      style={{ width: '130px', padding: '4px' }} 
                      value={m.regNumber || ''} 
                      onChange={(e) => handleUpdateRecord(m.id, 'regNumber', e.target.value)}
                      placeholder="Add Reg No"
                    />
                  </td>
                  <td>
                    <select 
                      value={m.regStatus} 
                      onChange={(e) => handleUpdateRecord(m.id, 'regStatus', e.target.value)}
                      className="form-control btn-sm" 
                      style={{ width: '120px', padding: '4px' }}
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Documents Uploaded">Docs Uploaded</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: m.docVerification.includes('Pending') ? 'var(--status-pending)' : 'var(--primary)' }}>
                      {m.docVerification}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${m.subsidyStatus.includes('Received') ? 'success' : 'pending'}`}>
                      {m.subsidyStatus}
                    </span>
                  </td>
                  <td>
                    {m.alerts.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-danger)', fontSize: '11px', fontWeight: '600' }}>
                        <AlertCircle size={12} /> {m.alerts[0].msg}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: '600' }}>✓ Verified</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
