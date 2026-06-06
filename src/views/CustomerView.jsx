// CustomerView.jsx
import React, { useState, useEffect } from 'react';
import { getDb, saveDb, saveServiceTicket } from '../db/mockDb';
import { 
  User, CheckCircle, Clock, Calendar, FileDown, 
  HelpCircle, Sparkles, Activity
} from 'lucide-react';

export default function CustomerView() {
  const [db, setDb] = useState(getDb());
  const [selectedCustId, setSelectedCustId] = useState('L003'); // Default to George Joseph (active project)
  
  // Service request state
  const [topic, setTopic] = useState('Inverter offline');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    setDb(getDb());
  }, []);

  const refreshDb = () => {
    setDb(getDb());
  };

  const handleCustomerTicket = (e) => {
    e.preventDefault();
    const cust = db.leads.find(l => l.id === selectedCustId);
    if (!cust) return;

    db.serviceTickets.push({
      id: 'TK0' + (db.serviceTickets.length + 101),
      customerName: cust.name,
      mobile: cust.mobile,
      topic: topic,
      desc: desc,
      status: 'Open',
      priority: 'Low',
      engineerId: 'EMP011',
      createdAt: new Date().toISOString().split('T')[0]
    });

    saveDb(db);
    setDesc('');
    refreshDb();
    alert('Support ticket logged. Greenvoltes service engineer will contact you shortly.');
  };

  // Find active customer profile
  const customer = db.leads.find(l => l.id === selectedCustId);
  const project = db.projects.find(p => p.leadId === selectedCustId);
  const quote = db.quotations.find(q => q.leadId === selectedCustId);
  const mnre = db.mnre.find(m => m.leadId === selectedCustId);

  // 14 Stages definition
  const stages = [
    { num: 1, name: 'Lead' },
    { num: 2, name: 'Site Survey' },
    { num: 3, name: 'Design' },
    { num: 4, name: 'Quotation' },
    { num: 5, name: 'Order Confirmed' },
    { num: 6, name: 'Material Procurement' },
    { num: 7, name: 'Installation' },
    { num: 8, name: 'KSEB Application' },
    { num: 9, name: 'Net Meter Approval' },
    { num: 10, name: 'Inspection' },
    { num: 11, name: 'Commissioning' },
    { num: 12, name: 'Subsidy Application' },
    { num: 13, name: 'Subsidy Received' },
    { num: 14, name: 'Project Completed' }
  ];

  const currentStageNum = project ? project.currentStage : (customer && customer.status === 'Site Survey Completed' ? 2 : 1);

  return (
    <div className="customer-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><User className="view-icon-color" /> Customer Portal</h2>
          <p className="view-subtitle">Simulate customer logins to track solar installations, download warranty papers, and request support.</p>
        </div>
        
        {/* Customer Selector Dropdown for simulation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>[Simulate Portal for]:</span>
          <select 
            value={selectedCustId} 
            onChange={(e) => setSelectedCustId(e.target.value)}
            className="form-control btn-sm"
            style={{ width: '180px', padding: '6px' }}
          >
            {db.leads.map(l => (
              <option key={l.id} value={l.id}>{l.name} ({l.id})</option>
            ))}
          </select>
        </div>
      </div>

      {customer ? (
        <div className="customer-portal-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '16px' }}>
          
          {/* Main timeline */}
          <div className="glass-card">
            <div className="welcome-banner" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div className="avatar-placeholder" style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontWeight: 'bold', fontSize: '18px', color: 'var(--primary)', padding: '10px 14px' }}>
                {customer.name.charAt(0)}
              </div>
              <div>
                <h3 className="card-title">Welcome back, {customer.name}!</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>System installation location: {customer.address}, {customer.district}</p>
              </div>
            </div>

            {/* Interactive Timeline Progress */}
            <h4 style={{ fontSize: '14px', color: 'var(--primary)', marginBottom: '16px' }}><Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }} /> Installation Timeline Tracker</h4>
            
            <div className="customer-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border-color)' }}>
              {stages.map(s => {
                const isActive = currentStageNum === s.num;
                const isPassed = currentStageNum > s.num;
                return (
                  <div key={s.num} className="timeline-node" style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                    <div 
                      className="node-dot" 
                      style={{ 
                        position: 'absolute', 
                        left: '-27px', 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: isActive ? 'var(--primary)' : isPassed ? 'var(--secondary)' : 'var(--bg-tertiary)',
                        border: '2px solid ' + (isActive ? 'var(--primary)' : isPassed ? 'var(--secondary)' : 'var(--border-color)'),
                        boxShadow: isActive ? '0 0 8px var(--primary)' : 'none'
                      }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500', color: isActive ? 'var(--primary)' : isPassed ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {s.num}. {s.name}
                    </span>
                    {isActive && (
                      <span className="badge badge-success" style={{ fontSize: '9px', padding: '2px 6px' }}>Current Stage</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Downloads & Help Desk Panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Subsidy Info */}
            {mnre && (
              <div className="glass-card" style={{ border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.02)' }}>
                <h4 style={{ fontSize: '13px', color: 'var(--primary)', marginBottom: '8px' }}>PM Surya Ghar Subsidy Status</h4>
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>Application ID:</strong> <code>{mnre.applicationId}</code></div>
                  <div><strong>Subsidised Capacity:</strong> {quote ? quote.projectSize : 3} kWp</div>
                  <div><strong>Govt Subsidy Amount:</strong> ₹{mnre.subsidyAmount.toLocaleString('en-IN')}</div>
                  <div style={{ marginTop: '8px' }}>
                    <span className="badge badge-info">{mnre.subsidyStatus}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Document Vault */}
            <div className="glass-card">
              <h4 style={{ fontSize: '13px', color: 'var(--primary)', marginBottom: '12px' }}>Download Documents</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { if (quote) alert('Downloading Proposal Quote PDF...'); else alert('Quote not generated yet.'); }} style={{ justifyContent: 'space-between', width: '100%' }}>
                  <span><FileDown size={12} style={{ display: 'inline', marginRight: '6px' }} /> Proforma Proposal Quote</span>
                  <span>PDF</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => alert('Downloading KSEB Commissioning report...')} style={{ justifyContent: 'space-between', width: '100%' }}>
                  <span><FileDown size={12} style={{ display: 'inline', marginRight: '6px' }} /> KSEB Commissioning Certificate</span>
                  <span>PDF</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => alert('Downloading 5-Year Panel/Inverter Warranty...')} style={{ justifyContent: 'space-between', width: '100%' }}>
                  <span><FileDown size={12} style={{ display: 'inline', marginRight: '6px' }} /> 5-Year Inverter Warranty Card</span>
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Help desk logger */}
            <div className="glass-card">
              <h4 style={{ fontSize: '13px', color: 'var(--primary)', marginBottom: '12px' }}><HelpCircle size={14} style={{ display: 'inline', marginRight: '4px' }} /> Raise Help Request</h4>
              <form onSubmit={handleCustomerTicket}>
                <div className="form-group">
                  <label>Topic</label>
                  <select className="form-control" value={topic} onChange={(e) => setTopic(e.target.value)}>
                    <option value="Inverter offline">Inverter WiFi Offline</option>
                    <option value="Low generation output">Solar Generation output is low</option>
                    <option value="Structure damage">Roof Mount structure check</option>
                    <option value="ACDB/DCDB tripped">Distribution fuse tripped</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea 
                    required 
                    rows={2} 
                    className="form-control" 
                    value={desc} 
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Enter details of your request..."
                  />
                </div>
                <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                  Submit Support Ticket
                </button>
              </form>
            </div>
          </div>

        </div>
      ) : (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Please select a valid customer from the dropdown.
        </div>
      )}
    </div>
  );
}
