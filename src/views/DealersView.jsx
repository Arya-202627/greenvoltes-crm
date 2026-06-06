// DealersView.jsx
import React, { useState, useEffect } from 'react';
import { getDb, saveDb, logNotification } from '../db/mockDb';
import Modal from '../components/Modal';
import { 
  Users, Handshake, ShieldCheck, BadgePercent, BadgeIndianRupee,
  Plus, UploadCloud, ChevronRight, Check, Ban
} from 'lucide-react';

export default function DealersView({ userRole, currentUser }) {
  const [db, setDb] = useState(getDb());
  const [activeTab, setActiveTab] = useState(userRole === 'Dealer' ? 'dashboard' : 'dealers-list');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);

  // New customer registration fields
  const [newCust, setNewCust] = useState({
    name: '', age: '', gender: 'Male', phone: '', email: '', address: '',
    roofType: 'Concrete Flat Roof', projectSize: 3, inverterBrand: 'APS',
    panelBrand: 'APS', loanRequired: 'No', loanAmount: '',
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
      roofType: 'Concrete Flat Roof', projectSize: 3, inverterBrand: 'APS',
      panelBrand: 'APS', loanRequired: 'No', loanAmount: '',
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
                        <button className="btn btn-secondary btn-sm" onClick={() => alert(`Showing quote details for ${lead.name}`)}>
                          View Quote
                        </button>
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
              <label>Preferred Inverter Brand</label>
              <select 
                className="form-control"
                value={newCust.inverterBrand}
                onChange={(e) => setNewCust({ ...newCust, inverterBrand: e.target.value })}
              >
                <option value="APS">APS (Recommended)</option>
                <option value="Deye">Deye</option>
              </select>
            </div>
            <div className="form-group">
              <label>Preferred Panel Brand</label>
              <select 
                className="form-control"
                value={newCust.panelBrand}
                onChange={(e) => setNewCust({ ...newCust, panelBrand: e.target.value })}
              >
                <option value="APS">APS (Recommended)</option>
                <option value="Waaree Solar">Waaree Solar</option>
                <option value="Adani">Adani</option>
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
    </div>
  );
}
