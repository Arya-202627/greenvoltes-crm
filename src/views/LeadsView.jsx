// LeadsView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  getLeads, saveLead, deleteLead, logNotification, uploadFileToServer, getUploadUrl
} from '../db/mockDb';
import Modal from '../components/Modal';
import { 
  Search, Plus, FileText, CheckCircle2, ChevronRight, Edit3, Trash2,
  Phone, Mail, MapPin, UploadCloud, Check, UserPlus
} from 'lucide-react';

export default function LeadsView() {
  const [leads, setLeads] = useState(getLeads());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  
  // Modals state
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  
  // Form fields
  const [newLead, setNewLead] = useState({
    name: '', age: '', gender: 'Male', mobile: '', alternateMobile: '',
    email: '', address: '', district: 'Thiruvananthapuram', state: 'Kerala',
    pincode: '', source: 'Website', status: 'New Lead', notes: ''
  });

  // Signature Canvas Ref
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const districts = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 
    'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 
    'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
  ];

  const leadStatuses = [
    'New Lead', 'Contacted', 'Site Visit Scheduled', 'Site Survey Completed',
    'Quotation Sent', 'Negotiation', 'Order Confirmed', 'Installation Pending',
    'Installed', 'Subsidy Pending', 'Completed'
  ];

  const refreshLeads = () => {
    setLeads(getLeads());
  };

  const handleCreateLead = (e) => {
    e.preventDefault();
    const leadId = 'L' + (leads.length + 101);
    const leadData = {
      ...newLead,
      id: leadId,
      createdAt: new Date().toISOString(),
      documents: {
        aadhaar: { name: '', uploaded: false },
        pan: { name: '', uploaded: false },
        electricityBill: { name: '', uploaded: false },
        geotaggedPhotos: { name: '', uploaded: false },
        propertyTax: { name: '', uploaded: false },
        landTax: { name: '', uploaded: false },
        bankPassbook: { name: '', uploaded: false },
        signature: { name: '', uploaded: false }
      }
    };
    saveLead(leadData);
    logNotification({
      recipient: `${leadData.name} (${leadData.mobile})`,
      type: 'SMS',
      text: `Welcome ${leadData.name} to Greenvoltes! We have registered your lead for Solar EPC installations. Reference: ${leadId}`
    });
    setIsNewLeadOpen(false);
    setNewLead({
      name: '', age: '', gender: 'Male', mobile: '', alternateMobile: '',
      email: '', address: '', district: 'Thiruvananthapuram', state: 'Kerala',
      pincode: '', source: 'Website', status: 'New Lead', notes: ''
    });
    refreshLeads();
  };

  const handleUpdateStatus = (lead, nextStatus) => {
    const updated = { ...lead, status: nextStatus };
    saveLead(updated);
    logNotification({
      recipient: `${lead.name} (${lead.mobile})`,
      type: 'WhatsApp',
      text: `Dear ${lead.name}, your solar installation project status has been updated to "${nextStatus}". - Greenvoltes`
    });
    setActiveLead(updated);
    refreshLeads();
  };

  const handleRealUpload = (docKey) => {
    if (!activeLead) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const uploadedData = await uploadFileToServer(file);
        const updatedLead = {
          ...activeLead,
          documents: {
            ...activeLead.documents,
            [docKey]: { 
              name: uploadedData.name, 
              uploaded: true,
              originalName: uploadedData.originalName,
              url: uploadedData.url
            }
          }
        };
        saveLead(updatedLead);
        setActiveLead(updatedLead);
        refreshLeads();
        alert(`Successfully uploaded ${file.name}!`);
      } catch (err) {
        console.error('File upload failed:', err);
        alert('File upload failed. Make sure the backend server is running.');
      }
    };
    input.click();
  };

  // Canvas signature helpers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    if (!activeLead) return;
    const updatedLead = {
      ...activeLead,
      documents: {
        ...activeLead.documents,
        signature: { name: 'customer_signed_canvas.png', uploaded: true }
      }
    };
    saveLead(updatedLead);
    setActiveLead(updatedLead);
    refreshLeads();
    alert('Customer digital signature saved to DMS successfully!');
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      deleteLead(id);
      setActiveLead(null);
      refreshLeads();
    }
  };

  // Filter Leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.mobile.includes(searchTerm) || 
                          lead.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchesDistrict = districtFilter === 'All' || lead.district === districtFilter;
    return matchesSearch && matchesStatus && matchesDistrict;
  });

  return (
    <div className="leads-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><UserPlus className="view-icon-color" /> Leads & Customer CRM</h2>
          <p className="view-subtitle">Monitor inquiries, schedule site surveys, compile KSEB applications, and store KYC files.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNewLeadOpen(true)}>
          <Plus size={16} /> Add New Lead
        </button>
      </div>

      {/* Filters Section */}
      <div className="glass-card filters-card">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by ID, name, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-dropdown">
            <option value="All">All Statuses</option>
            {leadStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className="filter-dropdown">
            <option value="All">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="crm-main-layout">
        {/* Leads Table */}
        <div className="glass-card crm-list-pane">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Lead ID</th>
                  <th>Customer Name</th>
                  <th>Contact</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr 
                    key={lead.id} 
                    className={`lead-row ${activeLead?.id === lead.id ? 'active-lead-row' : ''}`}
                    onClick={() => setActiveLead(lead)}
                  >
                    <td><code>{lead.id}</code></td>
                    <td style={{ fontWeight: '600' }}>{lead.name}</td>
                    <td>{lead.mobile}</td>
                    <td>{lead.district}</td>
                    <td>
                      <span className={`badge badge-${
                        lead.status.includes('Completed') || lead.status === 'Installed' ? 'success' :
                        lead.status.includes('Pending') || lead.status.includes('Scheduled') ? 'pending' :
                        lead.status.includes('Quotation') || lead.status.includes('Confirmed') ? 'info' : 'new'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                        <button className="icon-btn" onClick={() => setActiveLead(lead)} title="View Detail">
                          <ChevronRight size={16} />
                        </button>
                        <button className="icon-btn text-danger-hover" onClick={() => handleDelete(lead.id)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead Details Pane */}
        {activeLead && (
          <div className="glass-card crm-details-pane">
            <div className="pane-header">
              <h3>Lead File: {activeLead.name}</h3>
              <code>ID: {activeLead.id}</code>
            </div>

            <div className="pane-content">
              {/* Core Details */}
              <div className="detail-section">
                <h4>Contact Details</h4>
                <p><Phone size={12} /> {activeLead.mobile} {activeLead.alternateMobile && `/ ${activeLead.alternateMobile}`}</p>
                <p><Mail size={12} /> {activeLead.email || 'No Email Added'}</p>
                <p><MapPin size={12} /> {activeLead.address}, {activeLead.district}, {activeLead.pincode}</p>
                <p><strong>Age:</strong> {activeLead.age} yrs | <strong>Gender:</strong> {activeLead.gender} | <strong>Source:</strong> {activeLead.source}</p>
              </div>

              {/* Status Update Flow */}
              <div className="detail-section">
                <h4>Advance Workflow Status</h4>
                <div className="status-timeline-selector">
                  <select 
                    value={activeLead.status} 
                    onChange={(e) => handleUpdateStatus(activeLead, e.target.value)}
                    className="form-control"
                  >
                    {leadStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Document Checkbox List */}
              <div className="detail-section">
                <h4>KYC & Site Files (Module 1 & 15)</h4>
                <div className="dms-mini-uploader">
                  {Object.keys(activeLead.documents).map(key => {
                    const doc = activeLead.documents[key];
                    return (
                      <div key={key} className="dms-row">
                        <span className="doc-label">{key.toUpperCase().replace('GEOTAGGEDPHOTOS', 'GEOTAG PHOTOS').replace('ELECTRICITYBILL', 'KSEB BILL')}</span>
                        {doc.uploaded ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <span 
                              className="doc-status-ok" 
                              style={{ cursor: 'pointer', textDecoration: 'underline' }} 
                              onClick={() => window.open(getUploadUrl(doc.name), '_blank')} 
                              title="Click to view file"
                            >
                              <Check size={14} /> {doc.name.substring(0, 15)}...
                            </span>
                            <button 
                              className="icon-btn btn-sm" 
                              onClick={() => window.open(getUploadUrl(doc.name), '_blank')} 
                              title="Download document"
                              style={{ border: 'none', padding: '2px', background: 'none' }}
                            >
                              <UploadCloud size={12} style={{ transform: 'rotate(180deg)', color: 'var(--primary)', cursor: 'pointer' }} />
                            </button>
                          </div>
                        ) : (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleRealUpload(key)}>
                            <UploadCloud size={12} /> Upload
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Digital Signature Pad */}
              <div className="detail-section">
                <h4>Customer Consent Signature</h4>
                {activeLead.documents.signature.uploaded ? (
                  <div className="sig-approved">
                    <CheckCircle2 size={16} /> Signature captured and locked in DMS.
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Draw on the black pad below to capture customer digital approval:</p>
                    <div className="signature-pad-container">
                      <canvas 
                        ref={canvasRef} 
                        width={300} 
                        height={150}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <button className="signature-pad-clear" onClick={clearSignature}>Clear</button>
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: '8px' }} onClick={saveSignature}>
                      Save Signature
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Lead Modal */}
      <Modal isOpen={isNewLeadOpen} onClose={() => setIsNewLeadOpen(false)} title="Register New Solar Inquiry">
        <form onSubmit={handleCreateLead} className="new-lead-form">
          <div className="form-row">
            <div className="form-group">
              <label>Customer Full Name *</label>
              <input 
                type="text" 
                required 
                className="form-control"
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input 
                type="number" 
                className="form-control"
                value={newLead.age}
                onChange={(e) => setNewLead({ ...newLead, age: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mobile Number *</label>
              <input 
                type="tel" 
                required 
                className="form-control"
                value={newLead.mobile}
                onChange={(e) => setNewLead({ ...newLead, mobile: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Alternate Mobile</label>
              <input 
                type="tel" 
                className="form-control"
                value={newLead.alternateMobile}
                onChange={(e) => setNewLead({ ...newLead, alternateMobile: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email ID</label>
              <input 
                type="email" 
                className="form-control"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select 
                className="form-control"
                value={newLead.gender}
                onChange={(e) => setNewLead({ ...newLead, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Installation Address *</label>
            <textarea 
              required 
              rows={2} 
              className="form-control"
              value={newLead.address}
              onChange={(e) => setNewLead({ ...newLead, address: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>District *</label>
              <select 
                className="form-control"
                value={newLead.district}
                onChange={(e) => setNewLead({ ...newLead, district: e.target.value })}
              >
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Pincode *</label>
              <input 
                type="text" 
                required 
                className="form-control"
                value={newLead.pincode}
                onChange={(e) => setNewLead({ ...newLead, pincode: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Lead Source</label>
              <select 
                className="form-control"
                value={newLead.source}
                onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
              >
                <option value="Facebook">Facebook Ads</option>
                <option value="Website">Website Form</option>
                <option value="Dealer">Dealer Referral</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Walk-in">Walk-in Customer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Initial Status</label>
              <select 
                className="form-control"
                value={newLead.status}
                onChange={(e) => setNewLead({ ...newLead, status: e.target.value })}
              >
                {leadStatuses.slice(0, 3).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Internal Notes / Requirements</label>
            <textarea 
              rows={2} 
              className="form-control"
              value={newLead.notes}
              onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
              placeholder="E.g., Inquired for 3kW Rooftop system under PM Surya Ghar Yojana."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewLeadOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Lead
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        .leads-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .filters-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 16px;
          margin-bottom: 0px;
        }

        @media (max-width: 768px) {
          .filters-card {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .search-box {
          display: flex;
          align-items: center;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          flex: 1;
        }

        .search-icon {
          color: var(--text-muted);
          margin-right: 10px;
        }

        .search-input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          width: 100%;
          font-family: var(--font-primary);
          font-size: 14px;
        }

        .filter-group {
          display: flex;
          gap: 12px;
        }

        .filter-dropdown {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          outline: none;
          font-size: 13px;
          cursor: pointer;
        }

        .crm-main-layout {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 992px) {
          .crm-main-layout {
            grid-template-columns: 1fr;
          }
        }

        .crm-list-pane {
          padding: 0;
          overflow: hidden;
        }

        .lead-row {
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .active-lead-row {
          background-color: rgba(16, 185, 129, 0.08) !important;
          border-left: 3px solid var(--primary);
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color var(--transition-fast), background-color var(--transition-fast);
        }

        .icon-btn:hover {
          color: var(--primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .icon-btn.text-danger-hover:hover {
          color: var(--status-danger);
          background: rgba(239, 68, 68, 0.08);
        }

        .crm-details-pane {
          position: sticky;
          top: 94px;
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
        }

        .pane-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: rgba(27, 35, 54, 0.3);
          border-bottom: 1px solid var(--border-color);
        }

        .pane-header h3 {
          font-size: 16px;
        }

        .pane-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-height: 70vh;
          overflow-y: auto;
        }

        .detail-section {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
        }

        .detail-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .detail-section h4 {
          font-size: 13px;
          color: var(--primary);
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-section p {
          font-size: 13px;
          color: var(--text-primary);
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dms-mini-uploader {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dms-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-tertiary);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 12px;
        }

        .doc-label {
          font-weight: 600;
          color: var(--text-secondary);
        }

        .doc-status-ok {
          color: var(--primary);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .sig-approved {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--primary);
          font-weight: 600;
          font-size: 13px;
          background: rgba(16, 185, 129, 0.05);
          padding: 12px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(16, 185, 129, 0.15);
        }
      `}</style>
    </div>
  );
}
