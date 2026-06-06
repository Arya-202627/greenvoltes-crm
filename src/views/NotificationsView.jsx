// NotificationsView.jsx
import React, { useState, useEffect } from 'react';
import { getDb, logNotification, getNotifications } from '../db/mockDb';
import { BellRing, Send, MessageSquare, Mail, AlertCircle, Plus } from 'lucide-react';

export default function NotificationsView() {
  const [db, setDb] = useState(getDb());
  const [notifs, setNotifs] = useState(getNotifications());

  // Form State
  const [template, setTemplate] = useState('Site Visit Reminder');
  const [recipient, setRecipient] = useState('Ramesh Nair (9845612301)');
  const [customText, setCustomText] = useState('Dear Ramesh Nair, our solar survey engineer Manu Varghese is scheduled to visit your site tomorrow at 10:00 AM. Please keep KSEB electricity bill copy ready. - Team Greenvoltes');

  const templates = {
    'Site Visit Reminder': 'Dear [Customer], our solar survey engineer Manu Varghese is scheduled to visit your site tomorrow at 10:00 AM. Please keep KSEB electricity bill copy ready. - Team Greenvoltes',
    'Loan Approval': 'Dear [Customer], your solar care loan of Rs. 1,50,000 has been sanctioned by SBI! Final agreement signing schedule will be sent shortly. - Team Greenvoltes',
    'Material Arrival': 'Dear [Customer], your Waaree solar panels & Growatt inverter modules have arrived at our Kochi warehouse. Site delivery is scheduled for tomorrow morning. - Team Greenvoltes',
    'Subsidy Approved': 'Dear [Customer], Congratulations! Your PM Surya Ghar rooftop solar subsidy of Rs. 78,000 has been verified & approved. Funds will credit to your registered bank account. - Team Greenvoltes'
  };

  useEffect(() => {
    setDb(getDb());
    setNotifs(getNotifications());
  }, []);

  const refreshNotifs = () => {
    setNotifs(getNotifications());
  };

  const handleTemplateChange = (tmpl) => {
    setTemplate(tmpl);
    const text = templates[tmpl] || '';
    setCustomText(text);
  };

  const handleSendTestNotification = (e) => {
    e.preventDefault();
    
    // Choose channel type based on template (simulated)
    const channel = template.includes('Subsidy') || template.includes('Arrival') ? 'WhatsApp' : 'SMS';
    
    logNotification({
      recipient: recipient,
      type: channel,
      text: customText
    });

    refreshNotifs();
    alert(`Test ${channel} notification dispatched and logged.`);
  };

  return (
    <div className="notifications-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><BellRing className="view-icon-color" /> Notification Gateway logs</h2>
          <p className="view-subtitle">Monitor automated system alerts, manage client notification templates, and inspect dispatch logs.</p>
        </div>
      </div>

      <div className="crm-main-layout" style={{ gridTemplateColumns: '1.2fr 2fr', gap: '20px' }}>
        
        {/* Template Manager Form */}
        <div className="glass-card">
          <div className="calculator-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <MessageSquare className="view-icon-color" />
            <h3 className="card-title">Test Dispatch Console</h3>
          </div>

          <form onSubmit={handleSendTestNotification}>
            <div className="form-group">
              <label>Select Template Option</label>
              <select 
                className="form-control"
                value={template}
                onChange={(e) => handleTemplateChange(e.target.value)}
              >
                {Object.keys(templates).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Recipient Target Name/Number *</label>
              <input 
                type="text" 
                required
                className="form-control"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Message Content Draft *</label>
              <textarea 
                required
                rows={5}
                className="form-control"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
              />
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              <Send size={14} /> Send Simulation Notification
            </button>
          </form>
        </div>

        {/* Logs List */}
        <div className="glass-card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}><AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary)' }} /> Dispatch History Logs</h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Log Ref</th>
                  <th>Recipient Target</th>
                  <th>Channel</th>
                  <th>Message Body Text</th>
                  <th>Dispatch Time</th>
                </tr>
              </thead>
              <tbody>
                {notifs.map((n, idx) => (
                  <tr key={idx}>
                    <td><code>{n.id}</code></td>
                    <td style={{ fontWeight: '600' }}>{n.recipient}</td>
                    <td>
                      <span className={`badge badge-${n.type === 'WhatsApp' ? 'success' : 'info'}`}>
                        {n.type}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px', wordBreak: 'break-word', fontSize: '12px' }}>{n.text}</td>
                    <td>{n.sentAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
