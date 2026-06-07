// DealersView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getDb, saveDb, logNotification, uploadFileToServer, getUploadUrl } from '../db/mockDb';
import Modal from '../components/Modal';
import { 
  Users, Handshake, ShieldCheck, BadgePercent, BadgeIndianRupee,
  Plus, UploadCloud, ChevronRight, Check, Ban, CheckCircle2
} from 'lucide-react';

export default function DealersView({ userRole, currentUser }) {
  const [db, setDb] = useState(getDb());
  const [activeTab, setActiveTab] = useState(userRole === 'Dealer' ? 'dashboard' : 'dealers-list');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [selectedLeadForDocs, setSelectedLeadForDocs] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Canvas drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
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
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineTo(x, y);
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

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedLeadForDocs) return;
    
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      alert('Please draw a signature first.');
      return;
    }
    
    const dataUrl = canvas.toDataURL('image/png');
    
    try {
      const blob = await fetch(dataUrl).then(res => res.blob());
      const file = new File([blob], `sig-${selectedLeadForDocs.id}.png`, { type: 'image/png' });
      const uploadedData = await uploadFileToServer(file);
      
      const updatedDb = { ...db };
      const leadIdx = updatedDb.leads.findIndex(l => l.id === selectedLeadForDocs.id);
      if (leadIdx !== -1) {
        updatedDb.leads[leadIdx].documents = {
          ...updatedDb.leads[leadIdx].documents,
          signature: {
            name: uploadedData.name,
            uploaded: true,
            originalName: uploadedData.originalName,
            url: uploadedData.url
          }
        };
        saveDb(updatedDb);
        setDb(updatedDb);
        setSelectedLeadForDocs(updatedDb.leads[leadIdx]);
        alert('Signature saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save signature:', err);
      alert('Failed to save signature.');
    }
  };

  const handleDealerFileUpload = async (docKey) => {
    if (!selectedLeadForDocs) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const uploadedData = await uploadFileToServer(file);
        
        const updatedDb = { ...db };
        const leadIdx = updatedDb.leads.findIndex(l => l.id === selectedLeadForDocs.id);
        if (leadIdx !== -1) {
          updatedDb.leads[leadIdx].documents = {
            ...updatedDb.leads[leadIdx].documents,
            [docKey]: {
              name: uploadedData.name,
              uploaded: true,
              originalName: uploadedData.originalName,
              url: uploadedData.url
            }
          };
          saveDb(updatedDb);
          setDb(updatedDb);
          setSelectedLeadForDocs(updatedDb.leads[leadIdx]);
          alert(`Successfully uploaded ${file.name}!`);
        }
      } catch (err) {
        console.error('File upload failed:', err);
        alert('File upload failed. Please try again.');
      }
    };
    input.click();
  };

  // New customer registration fields
  const [newCust, setNewCust] = useState({
    name: '', age: '', gender: 'Male', phone: '', email: '', address: '',
    roofType: 'Concrete Flat Roof', projectSize: 3, inverterBrand: 'APS (Recommended)',
    panelBrand: 'APS Topcon 600 (Recommended)', loanRequired: 'No', loanAmount: '',
    coApplicantName: '', coApplicantPhone: '', coApplicantRelation: ''
  });

  useEffect(() => {
    setDb(getDb());
    if (userRole === 'Dealer') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('dealers-list');
    }
  }, [userRole]);

  // Find Dealer profile if logged in as dealer
  const myDealer = db.dealers.find(d => 
    d.email === currentUser?.email || 
    d.id === currentUser?.dealerId || 
    d.contactPerson?.toLowerCase() === currentUser?.name?.toLowerCase() || 
    d.email === currentUser?.id
  ) || db.dealers[0];

  const refreshDb = () => {
    setDb(getDb());
  };

  const handleRegisterCustomer = (e) => {
    e.preventDefault();
    const leadId = 'L' + (db.leads.length + 101);
    
    // Add to Leads
    const leadData = {
      id: leadId,
      name: newCust.name,
      age: parseInt(newCust.age),
      gender: newCust.gender,
      mobile: newCust.phone,
      alternateMobile: '',
      email: newCust.email,
      address: newCust.address,
      district: myDealer.district,
      state: myDealer.state,
      pincode: '673001',
      source: 'Dealer',
      dealerId: myDealer.id,
      status: 'New Lead',
      documents: {
        aadhaar: { name: '', uploaded: false },
        pan: { name: '', uploaded: false },
        electricityBill: { name: '', uploaded: false },
        geotaggedPhotos: { name: '', uploaded: false },
        propertyTax: { name: '', uploaded: false },
        landTax: { name: '', uploaded: false },
        bankPassbook: { name: '', uploaded: false },
        signature: { name: '', uploaded: false }
      },
      createdAt: new Date().toISOString(),
      notes: `Registered by dealer ${myDealer.name}. Project size: ${newCust.projectSize}kW. Inverter: ${newCust.inverterBrand}. Panel: ${newCust.panelBrand}.`
    };

    if (parseInt(newCust.age) > 65) {
      leadData.coApplicant = {
        name: newCust.coApplicantName,
        mobile: newCust.coApplicantPhone,
        relationship: newCust.coApplicantRelation
      };
    }

    db.leads.push(leadData);
    
    // Also increase dealer sales count
    const dIdx = db.dealers.findIndex(d => d.id === myDealer.id);
    if (dIdx !== -1) {
      db.dealers[dIdx].salesCount += 1;
      db.dealers[dIdx].earnings += 15000; // Simulated Commission
    }

    saveDb(db);
    logNotification({
      recipient: `Dealer (${myDealer.contactPerson})`,
      type: 'SMS',
      text: `Customer ${newCust.name} submitted successfully. Track status under Lead Reference: ${leadId}`
    });

    setIsAddCustomerOpen(false);
    setNewCust({
      name: '', age: '', gender: 'Male', phone: '', email: '', address: '',
      roofType: 'Concrete Flat Roof', projectSize: 3, inverterBrand: 'APS (Recommended)',
      panelBrand: 'APS Topcon 600 (Recommended)', loanRequired: 'No', loanAmount: '',
      coApplicantName: '', coApplicantPhone: '', coApplicantRelation: ''
    });
    refreshDb();
    alert(`Customer registered successfully! Lead ID: ${leadId}`);
  };

  const handleDealerStatus = (dealerId, nextStatus) => {
    const dIdx = db.dealers.findIndex(d => d.id === dealerId);
    if (dIdx !== -1) {
      db.dealers[dIdx].status = nextStatus;
      saveDb(db);
      refreshDb();
    }
  };

  // Filter leads registered by this dealer
  const mySubmissions = db.leads.filter(l => l.dealerId === myDealer.id);

  return (
    <div className="dealers-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><Handshake className="view-icon-color" /> Dealer Management</h2>
          <p className="view-subtitle">Monitor Greenvoltes franchise partners, register customers, check commission accounts, and assign zones.</p>
        </div>
        {userRole === 'Dealer' && (
          <button className="btn btn-primary" onClick={() => setIsAddCustomerOpen(true)}>
            <Plus size={16} /> Register Customer
          </button>
        )}
      </div>

      {userRole === 'Admin' ? (
        <div className="tab-container">
          <button className={`tab-btn ${activeTab === 'dealers-list' ? 'active' : ''}`} onClick={() => setActiveTab('dealers-list')}>
            Dealer Directory
          </button>
          <button className={`tab-btn ${activeTab === 'perform' ? 'active' : ''}`} onClick={() => setActiveTab('perform')}>
            Commission Oversight
          </button>
        </div>
      ) : null}

      {/* ---------------- DEALER SPECIFIC VIEW ---------------- */}
      {userRole === 'Dealer' && (
        <div className="dealer-dashboard-layout">
          {/* Dealer Stats */}
          <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
            <div className="glass-card metric-card">
              <div className="metric-icon-box">
                <Users size={18} />
              </div>
              <div className="metric-details">
                <h4>Registered Leads</h4>
                <p>{mySubmissions.length}</p>
              </div>
            </div>
            <div className="glass-card metric-card">
              <div className="metric-icon-box">
                <BadgePercent size={18} />
              </div>
              <div className="metric-details">
                <h4>Your Commission Rate</h4>
                <p>{myDealer.commissionRate}%</p>
              </div>
            </div>
            <div className="glass-card metric-card">
              <div className="metric-icon-box">
                <BadgeIndianRupee size={18} />
              </div>
              <div className="metric-details">
                <h4>Total Earnings</h4>
                <p>₹{myDealer.earnings.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="glass-card metric-card">
              <div className="metric-icon-box">
                <ShieldCheck size={18} />
              </div>
              <div className="metric-details">
                <h4>Payment Received</h4>
                <p>₹{myDealer.paidAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* List of dealer submissions */}
          <div className="glass-card">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>Your Submissions & Project Timelines</h3>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Mobile</th>
                    <th>Date Added</th>
                    <th>Sub-status</th>
                    <th>Timeline Stage</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mySubmissions.map(lead => (
                    <tr key={lead.id}>
                      <td style={{ fontWeight: '600' }}>{lead.name}</td>
                      <td>{lead.mobile}</td>
                      <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className="badge badge-info">{lead.status}</span>
                      </td>
                      <td>
                        <div className="progress-bar-container" style={{ width: '100px', height: '6px', background: 'var(--border-color)', borderRadius: '3px' }}>
                          <div style={{ height: '6px', width: lead.status === 'Completed' ? '100%' : lead.status === 'Installed' ? '85%' : '30%', background: 'var(--primary)', borderRadius: '3px' }}></div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => alert(`Showing quote details for ${lead.name}`)}>
                            View Quote
                          </button>
                          <button className="btn btn-primary btn-sm" onClick={() => setSelectedLeadForDocs(lead)}>
                            DMS Files
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {mySubmissions.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No customers registered yet. Click "Register Customer" to submit details.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ADMIN SPECIFIC VIEW ---------------- */}
      {userRole === 'Admin' && activeTab === 'dealers-list' && (
        <div className="glass-card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Approved Solar Franchise Networks</h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Dealer ID</th>
                  <th>Agency Name</th>
                  <th>Contact Person</th>
                  <th>District</th>
                  <th>Assigned Territory</th>
                  <th>Total Leads</th>
                  <th>Status</th>
                  <th>Manage Partner</th>
                </tr>
              </thead>
              <tbody>
                {db.dealers.map(dealer => (
                  <tr key={dealer.id}>
                    <td><code>{dealer.id}</code></td>
                    <td style={{ fontWeight: '600' }}>{dealer.name}</td>
                    <td>{dealer.contactPerson} ({dealer.mobile})</td>
                    <td>{dealer.district}</td>
                    <td>{dealer.assignedTerritory}</td>
                    <td>{dealer.salesCount} Bookings</td>
                    <td>
                      <span className={`badge ${dealer.status === 'Approved' ? 'badge-success' : 'badge-pending'}`}>
                        {dealer.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {dealer.status !== 'Approved' ? (
                          <button className="btn btn-primary btn-sm" onClick={() => handleDealerStatus(dealer.id, 'Approved')}>
                            <Check size={12} /> Approve
                          </button>
                        ) : (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDealerStatus(dealer.id, 'Blocked')}>
                            <Ban size={12} /> Block
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {userRole === 'Admin' && activeTab === 'perform' && (
        <div className="glass-card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Dealer Commission & Payout Registry</h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Bookings</th>
                  <th>Sales Volume (Simulated)</th>
                  <th>Total Commissions</th>
                  <th>Disbursed Payout</th>
                  <th>Outstanding Balance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {db.dealers.map(dealer => (
                  <tr key={dealer.id}>
                    <td style={{ fontWeight: '600' }}>{dealer.name}</td>
                    <td>{dealer.salesCount} Installations</td>
                    <td>₹{(dealer.salesCount * 180000).toLocaleString('en-IN')}</td>
                    <td>₹{dealer.earnings.toLocaleString('en-IN')}</td>
                    <td>₹{dealer.paidAmount.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--status-pending)', fontWeight: '600' }}>
                      ₹{(dealer.earnings - dealer.paidAmount).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => {
                          const updated = { ...db };
                          const idx = updated.dealers.findIndex(d => d.id === dealer.id);
                          if (idx !== -1) {
                            updated.dealers[idx].paidAmount = updated.dealers[idx].earnings;
                            saveDb(updated);
                            refreshDb();
                            alert(`Paid out final balance of ₹${(dealer.earnings - dealer.paidAmount)} to ${dealer.name}`);
                          }
                        }}
                        disabled={dealer.earnings - dealer.paidAmount <= 0}
                      >
                        Payout Balance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dealer Customer Registration Modal */}
      <Modal isOpen={isAddCustomerOpen} onClose={() => setIsAddCustomerOpen(false)} title="Dealer Client Intake Form">
        <form onSubmit={handleRegisterCustomer} className="dealer-new-customer-form">
          <div className="form-row">
            <div className="form-group">
              <label>Applicant Name *</label>
              <input 
                type="text" 
                required 
                className="form-control"
                value={newCust.name}
                onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Applicant Age *</label>
              <input 
                type="number" 
                required 
                className="form-control"
                value={newCust.age}
                onChange={(e) => setNewCust({ ...newCust, age: e.target.value })}
              />
            </div>
          </div>

          {/* Co-applicant details if client is above 65 */}
          {parseInt(newCust.age) > 65 && (
            <div className="co-applicant-container" style={{ border: '1px dashed var(--primary)', padding: '12px', borderRadius: '4px', marginBottom: '16px', background: 'var(--primary-glow)' }}>
              <h4 style={{ fontSize: '12px', color: 'var(--primary)', marginBottom: '8px', fontWeight: 'bold' }}>Co-Applicant Required (Client is above 65 years)</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Co-Applicant Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control"
                    value={newCust.coApplicantName}
                    onChange={(e) => setNewCust({ ...newCust, coApplicantName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input 
                    type="tel" 
                    required 
                    className="form-control"
                    value={newCust.coApplicantPhone}
                    onChange={(e) => setNewCust({ ...newCust, coApplicantPhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Relationship with Applicant *</label>
                <input 
                  type="text" 
                  required 
                  className="form-control"
                  value={newCust.coApplicantRelation}
                  onChange={(e) => setNewCust({ ...newCust, coApplicantRelation: e.target.value })}
                  placeholder="E.g., Son, Daughter, Spouse"
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number *</label>
              <input 
                type="tel" 
                required 
                className="form-control"
                value={newCust.phone}
                onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email ID</label>
              <input 
                type="email" 
                className="form-control"
                value={newCust.email}
                onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Installation Address *</label>
            <textarea 
              required 
              rows={2} 
              className="form-control"
              value={newCust.address}
              onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Roof Construction Type</label>
              <select 
                className="form-control"
                value={newCust.roofType}
                onChange={(e) => setNewCust({ ...newCust, roofType: e.target.value })}
              >
                <option value="Concrete Flat Roof">Concrete Flat Roof</option>
                <option value="Slanted Tile Roof">Slanted Tile Roof</option>
                <option value="Truss Metal Sheet Roof">Truss Metal Sheet Roof</option>
              </select>
            </div>
            <div className="form-group">
              <label>Requested Project Size (kW) *</label>
              <input 
                type="number" 
                required 
                className="form-control"
                value={newCust.projectSize}
                onChange={(e) => setNewCust({ ...newCust, projectSize: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Preferred Inverter Type</label>
              <select 
                className="form-control"
                value={newCust.inverterBrand}
                onChange={(e) => setNewCust({ ...newCust, inverterBrand: e.target.value })}
              >
                <optgroup label="Ongrid - G TIE">
                  <option value="APS (Recommended)">APS (Recommended)</option>
                  <option value="Deye (G TIE)">Deye</option>
                  <option value="Solaire (G TIE)">Solaire</option>
                  <option value="Foxess">Foxess</option>
                  <option value="Eastman (G TIE)">Eastman</option>
                  <option value="Solar Edge with Optimizer">Solar Edge with Optimizer</option>
                </optgroup>
                <optgroup label="Ongrid - Micro Inverter">
                  <option value="Hoymiles Micro inverter">Hoymiles Micro inverter</option>
                  <option value="T-sun Micro inverter">T-sun Micro inverter</option>
                  <option value="Deye Micro Inverter">Deye Micro Inverter</option>
                  <option value="Jio Spark Micro Inverter">Jio Spark Micro Inverter</option>
                  <option value="Enphase Micro Inverter (Premium)">Enphase Micro Inverter (Premium)</option>
                </optgroup>
                <optgroup label="Hybrid">
                  <option value="Deye (Hybrid)">Deye</option>
                  <option value="Solaire (Hybrid)">Solaire</option>
                  <option value="Eastman (Hybrid)">Eastman</option>
                </optgroup>
                <optgroup label="Offgrid">
                  <option value="Ashapower">Ashapower</option>
                  <option value="Microtek">Microtek</option>
                  <option value="UTL Solar">UTL Solar</option>
                  <option value="Luminous Solar">Luminous Solar</option>
                  <option value="Eastman (Offgrid)">Eastman</option>
                </optgroup>
              </select>
            </div>
            <div className="form-group">
              <label>Preferred Panel Brand</label>
              <select 
                className="form-control"
                value={newCust.panelBrand}
                onChange={(e) => setNewCust({ ...newCust, panelBrand: e.target.value })}
              >
                <optgroup label="Topcon">
                  <option value="APS Topcon 600 (Recommended)">APS Topcon 600 (Recommended)</option>
                  <option value="Waaree Topcon">Waaree Topcon</option>
                  <option value="Adani Topcon">Adani Topcon</option>
                </optgroup>
                <optgroup label="Bifacial">
                  <option value="APS Bifacial 550">APS Bifacial 550</option>
                  <option value="Waaree Bifacial 540">Waaree Bifacial 540</option>
                  <option value="Adani Bifacial 550">Adani Bifacial 550</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Solar Loan Required?</label>
              <select 
                className="form-control"
                value={newCust.loanRequired}
                onChange={(e) => setNewCust({ ...newCust, loanRequired: e.target.value })}
              >
                <option value="No">No (Cash/Self Fund)</option>
                <option value="Yes">Yes (SBI/Federal Bank)</option>
              </select>
            </div>
            {newCust.loanRequired === 'Yes' && (
              <div className="form-group">
                <label>Estimated Loan Amount Needed</label>
                <input 
                  type="number" 
                  className="form-control"
                  value={newCust.loanAmount}
                  onChange={(e) => setNewCust({ ...newCust, loanAmount: e.target.value })}
                  placeholder="E.g., 150000"
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddCustomerOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Customer Details
            </button>
          </div>
        </form>
      </Modal>

      {/* Dealer DMS Files Upload Modal */}
      <Modal 
        isOpen={!!selectedLeadForDocs} 
        onClose={() => setSelectedLeadForDocs(null)} 
        title={`KYC & Site Files: ${selectedLeadForDocs?.name}`}
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Upload customer KYC documents and site inspection details for reference:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {selectedLeadForDocs && Object.keys(selectedLeadForDocs.documents).map(key => {
              if (key === 'signature') return null;
              
              const doc = selectedLeadForDocs.documents[key];
              const label = key.toUpperCase()
                .replace('GEOTAGGEDPHOTOS', 'GEOTAG PHOTOS')
                .replace('ELECTRICITYBILL', 'KSEB BILL')
                .replace('PROPERTYTAX', 'PROPERTY TAX')
                .replace('LANDTAX', 'LAND TAX')
                .replace('BANKPASSBOOK', 'BANK PASSBOOK');

              return (
                <div key={key} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '10px 14px', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px' 
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{label}</span>
                  
                  {doc?.uploaded ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span 
                        style={{ 
                          fontSize: '12px', 
                          color: 'var(--primary)', 
                          cursor: 'pointer', 
                          textDecoration: 'underline',
                          fontWeight: '600'
                        }}
                        onClick={() => window.open(getUploadUrl(doc.name), '_blank')}
                      >
                        <Check size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        {doc.name.substring(0, 12)}...
                      </span>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDealerFileUpload(key)}
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        Replace
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDealerFileUpload(key)}
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      <UploadCloud size={12} style={{ marginRight: '6px' }} /> Upload
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Digital Signature Canvas inside Modal */}
          {selectedLeadForDocs && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
              <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '8px' }}>Customer Consent Signature</h4>
              {selectedLeadForDocs.documents.signature?.uploaded ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  color: 'var(--primary)', 
                  fontWeight: '600', 
                  fontSize: '13px',
                  background: 'rgba(16, 185, 129, 0.05)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <CheckCircle2 size={16} /> Signature captured and locked in DMS.
                  <span 
                    style={{ 
                      marginLeft: 'auto', 
                      textDecoration: 'underline', 
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    onClick={() => window.open(getUploadUrl(selectedLeadForDocs.documents.signature.name), '_blank')}
                  >
                    View Signature
                  </span>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Draw on the pad below to capture customer digital consent:
                  </p>
                  <div style={{ position: 'relative', background: '#080b11', borderRadius: '6px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <canvas 
                      ref={canvasRef} 
                      width={440} 
                      height={150}
                      style={{ display: 'block', cursor: 'crosshair', width: '100%' }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    <button 
                      type="button"
                      onClick={clearSignature}
                      style={{ 
                        position: 'absolute', 
                        bottom: '8px', 
                        right: '8px', 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid var(--border-color)', 
                        color: 'var(--text-secondary)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm" 
                    style={{ marginTop: '10px' }} 
                    onClick={saveSignature}
                  >
                    Save Customer Signature
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => setSelectedLeadForDocs(null)}>
              Close DMS Panel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
