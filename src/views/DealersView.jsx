// DealersView.jsx
import React, { useState, useEffect } from 'react';
import { getDb, saveDb, logNotification, uploadFileToServer, getUploadUrl } from '../db/mockDb';
import Modal from '../components/Modal';
import { 
  Users, Handshake, ShieldCheck, BadgePercent, BadgeIndianRupee,
  Plus, UploadCloud, ChevronRight, Check, Ban
} from 'lucide-react';

export default function DealersView({ userRole, currentUser }) {
  const [db, setDb] = useState(getDb());
  const [activeTab, setActiveTab] = useState(userRole === 'Dealer' ? 'dashboard' : 'employees-list');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [selectedLeadForDocs, setSelectedLeadForDocs] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null); // { docKey, percent }


  const handleDealerFileUpload = async (docKey) => {
    if (!selectedLeadForDocs) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        setUploadProgress({ docKey, percent: 0 });
        const uploadedData = await uploadFileToServer(file, (percent) => {
          setUploadProgress({ docKey, percent });
        });
        
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
          setUploadProgress(null);
          alert(`Successfully uploaded ${file.name}!`);
        }
      } catch (err) {
        setUploadProgress(null);
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
      setActiveTab('employees-list');
    }
  }, [userRole]);

  const myDealer = db.dealers.find(d => 
    d.email?.toLowerCase() === currentUser?.email?.toLowerCase() || 
    d.id === currentUser?.dealerId || 
    d.id === currentUser?.employeeId || 
    d.contactPerson?.toLowerCase() === currentUser?.name?.toLowerCase() || 
    d.email?.toLowerCase() === currentUser?.id?.toLowerCase()
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
  const mySubmissions = db.leads.filter(l => l.dealerId === myDealer.id && l.status === 'Order Confirmed');

  return (
    <div className="dealers-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><Handshake className="view-icon-color" /> Dealer Portal</h2>
          <p className="view-subtitle">Monitor Greenvoltes dealer submissions and check commission/payout accounts.</p>
        </div>
      </div>

      {userRole === 'Admin' ? (
        <div className="tab-container">
          <button className={`tab-btn ${activeTab === 'employees-list' ? 'active' : ''}`} onClick={() => setActiveTab('employees-list')}>
            Dealer Directory
          </button>
          <button className={`tab-btn ${activeTab === 'perform' ? 'active' : ''}`} onClick={() => setActiveTab('perform')}>
            Performance Oversight
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
                <h4>Confirmed Orders</h4>
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
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No confirmed orders assigned to your profile yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ADMIN SPECIFIC VIEW ---------------- */}
      {userRole === 'Admin' && activeTab === 'employees-list' && (
        <div className="glass-card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Approved Solar Dealer & Franchise Directory</h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Dealer ID</th>
                  <th>Dealer/Agency Name</th>
                  <th>Contact Person</th>
                  <th>District</th>
                  <th>Assigned Territory</th>
                  <th>Total Leads</th>
                  <th>Status</th>
                  <th>Manage Status</th>
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
                  <th>Dealer / Agency</th>
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
              const doc = selectedLeadForDocs.documents[key];
              const label = key.toUpperCase()
                .replace('GEOTAGGEDPHOTOS', 'GEOTAG PHOTOS')
                .replace('ELECTRICITYBILL', 'KSEB BILL')
                .replace('PROPERTYTAX', 'PROPERTY TAX')
                .replace('LANDTAX', 'LAND TAX')
                .replace('BANKPASSBOOK', 'BANK PASSBOOK')
                .replace('SIGNATURE', 'CUSTOMER SIGNATURE');

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
                  
                  {uploadProgress && uploadProgress.docKey === key ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
                      <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: 'var(--primary)', height: '100%', width: `${uploadProgress.percent}%` }}></div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--primary)' }}>{uploadProgress.percent}%</span>
                    </div>
                  ) : doc?.uploaded ? (
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
