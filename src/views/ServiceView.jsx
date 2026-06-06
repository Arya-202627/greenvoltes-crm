// ServiceView.jsx
import React, { useState, useEffect } from 'react';
import { getDb, saveDb, getServiceTickets, saveServiceTicket } from '../db/mockDb';
import Modal from '../components/Modal';
import { 
  Activity, Plus, CheckCircle2, AlertTriangle, ShieldCheck, 
  Settings, Clock, Sparkles
} from 'lucide-react';

export default function ServiceView() {
  const [db, setDb] = useState(getDb());
  const [tickets, setTickets] = useState(getServiceTickets());
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  // New ticket state
  const [newTicket, setNewTicket] = useState({
    customerName: '',
    mobile: '',
    topic: 'Inverter Error',
    desc: '',
    priority: 'Medium',
    engineerId: 'EMP011'
  });

  useEffect(() => {
    setDb(getDb());
    setTickets(getServiceTickets());
  }, []);

  const refreshTickets = () => {
    setTickets(getServiceTickets());
  };

  const handleCreateTicket = (e) => {
    e.preventDefault();
    const tkId = 'TK0' + (tickets.length + 101);
    
    const ticketData = {
      id: tkId,
      customerName: newTicket.customerName,
      mobile: newTicket.mobile,
      topic: newTicket.topic,
      desc: newTicket.desc,
      status: 'Open',
      priority: newTicket.priority,
      engineerId: newTicket.engineerId,
      createdAt: new Date().toISOString().split('T')[0]
    };

    saveServiceTicket(ticketData);
    setIsNewTicketOpen(false);
    setNewTicket({ customerName: '', mobile: '', topic: 'Inverter Error', desc: '', priority: 'Medium', engineerId: 'EMP011' });
    refreshTickets();
    alert(`Complaint ticket registered successfully! Ref: ${tkId}`);
  };

  const handleResolveTicket = (ticketId) => {
    const updated = { ...db };
    const tIdx = updated.serviceTickets.findIndex(t => t.id === ticketId);
    if (tIdx !== -1) {
      updated.serviceTickets[tIdx].status = 'Closed';
      saveDb(updated);
      refreshTickets();
      alert('Ticket marked as Resolved.');
    }
  };

  return (
    <div className="service-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><Activity className="view-icon-color" /> Service & Warranty Management</h2>
          <p className="view-subtitle">Track panel/inverter performance guarantees, logs customer support requests, and schedules annual solar maintenance.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNewTicketOpen(true)}>
          <Plus size={16} /> File Complaint Ticket
        </button>
      </div>

      {/* Grid of warranty registry */}
      <div className="grid-cols-2">
        {/* AMC & Warranty list */}
        <div className="glass-card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}><ShieldCheck size={16} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary)' }} /> 5-Year Maintenance & Warranty Registry</h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Panel Guarantee</th>
                  <th>Inverter Guarantee</th>
                  <th>5-Year AMC Plan</th>
                  <th>Next Service Due</th>
                </tr>
              </thead>
              <tbody>
                {db.leads.filter(l => l.status === 'Completed' || l.status === 'Installed').map((lead, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600' }}>{lead.name}</td>
                    <td>25-Year Performance</td>
                    <td>5-Year Standard</td>
                    <td>
                      <span className="badge badge-success">Active Plan</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--status-pending)', fontWeight: 'bold' }}>2026-11-15</span>
                    </td>
                  </tr>
                ))}
                {db.leads.filter(l => l.status === 'Completed' || l.status === 'Installed').length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No completed solar projects registered in the warranty database.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Complaints Ticket list */}
        <div className="glass-card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}><AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px', color: 'var(--status-pending)' }} /> Customer Help Desk Tickets</h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Client</th>
                  <th>Topic</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Resolution</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(tk => {
                  const eng = db.employees.find(e => e.id === tk.engineerId);
                  return (
                    <tr key={tk.id}>
                      <td><code>{tk.id}</code></td>
                      <td>
                        <strong>{tk.customerName}</strong><br />
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{tk.mobile}</span>
                      </td>
                      <td>
                        <strong>{tk.topic}</strong><br />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tk.desc}</span>
                      </td>
                      <td>
                        <span className={`badge ${tk.priority === 'High' ? 'badge-danger' : tk.priority === 'Medium' ? 'badge-pending' : 'badge-info'}`}>
                          {tk.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${tk.status === 'Open' ? 'badge-danger' : 'badge-success'}`}>
                          {tk.status}
                        </span>
                      </td>
                      <td>
                        {tk.status === 'Open' ? (
                          <button className="btn btn-primary btn-sm" onClick={() => handleResolveTicket(tk.id)}>
                            Resolve
                          </button>
                        ) : (
                          <span style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: 'bold' }}>✓ Fixed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Complaint Modal */}
      <Modal isOpen={isNewTicketOpen} onClose={() => setIsNewTicketOpen(false)} title="Register Service Complaint Ticket">
        <form onSubmit={handleCreateTicket}>
          <div className="form-group">
            <label>Customer Full Name *</label>
            <input 
              type="text" 
              required
              className="form-control"
              value={newTicket.customerName}
              onChange={(e) => setNewTicket({ ...newTicket, customerName: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mobile Number *</label>
              <input 
                type="tel" 
                required
                className="form-control"
                value={newTicket.mobile}
                onChange={(e) => setNewTicket({ ...newTicket, mobile: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Assign Support Engineer</label>
              <select 
                className="form-control"
                value={newTicket.engineerId}
                onChange={(e) => setNewTicket({ ...newTicket, engineerId: e.target.value })}
              >
                {db.employees.filter(e => e.role.includes('Service') || e.role.includes('Engineer')).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Topic / Area of Trouble</label>
              <select 
                className="form-control"
                value={newTicket.topic}
                onChange={(e) => setNewTicket({ ...newTicket, topic: e.target.value })}
              >
                <option value="Inverter offline">Inverter Offline/WiFi issue</option>
                <option value="Low generation output">Low Generation Output</option>
                <option value="Structure damage">Structural / Mounting Check</option>
                <option value="ACDB/DCDB tripped">Distribution Box Trips</option>
                <option value="Other">Other System Failures</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority Level</label>
              <select 
                className="form-control"
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="High">High (Immediate Action)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Detailed Complaint Description *</label>
            <textarea 
              required
              rows={3}
              className="form-control"
              value={newTicket.desc}
              onChange={(e) => setNewTicket({ ...newTicket, desc: e.target.value })}
              placeholder="Describe the exact error message or behaviour witnessed by the customer."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewTicketOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Log Complaint
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
