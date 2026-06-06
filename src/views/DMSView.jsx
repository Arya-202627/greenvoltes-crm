// DMSView.jsx
import React, { useState, useEffect } from 'react';
import { getDb, saveDb, getUploadUrl } from '../db/mockDb';
import { FolderClosed, Search, FileText, CheckCircle, AlertTriangle, History, Download } from 'lucide-react';

export default function DMSView() {
  const [db, setDb] = useState(getDb());
  const [filterCat, setFilterCat] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Simulated download history
  const [downloadHistory] = useState([
    { file: 'kseb_bill_ramesh.pdf', user: 'Rahul R. (Accounts)', date: '2026-06-05 11:30 AM' },
    { file: 'aadhaar_george.pdf', user: 'Preetha S. (MNRE)', date: '2026-06-04 02:15 PM' },
    { file: 'sbi_sanction_l003.pdf', user: 'Vimal Kumar (Loan)', date: '2026-06-04 10:00 AM' }
  ]);

  useEffect(() => {
    setDb(getDb());
  }, []);

  const documentCategories = [
    { id: 'All', label: 'All Folders' },
    { id: 'Customer', label: 'Customer KYC (Aadhaar/PAN)' },
    { id: 'Project', label: 'Project Files (BOM/Structure)' },
    { id: 'MNRE', label: 'MNRE / Surya Ghar' },
    { id: 'Loan', label: 'Loan Agreements' },
    { id: 'Supplier', label: 'Supplier POs & Invoices' }
  ];

  // Compile all files dynamically from db
  const compileAllFiles = () => {
    const list = [];
    
    // Customer KYC files from leads
    db.leads.forEach(l => {
      Object.keys(l.documents).forEach(k => {
        const doc = l.documents[k];
        if (doc && doc.uploaded && doc.name) {
          list.push({
            name: doc.name,
            category: 'Customer',
            owner: l.name,
            version: 'v1.0',
            expiry: 'No Expiry',
            size: '1.2 MB'
          });
        }
      });
    });

    // Loan agreements
    db.loans.forEach(l => {
      const lead = db.leads.find(le => le.id === l.leadId) || { name: 'Customer' };
      if (l.sanctionLetter) {
        list.push({
          name: l.sanctionLetter,
          category: 'Loan',
          owner: lead.name,
          version: 'v1.0',
          expiry: 'No Expiry',
          size: '850 KB'
        });
      }
      if (l.agreement) {
        list.push({
          name: l.agreement,
          category: 'Loan',
          owner: lead.name,
          version: 'v1.1',
          expiry: 'No Expiry',
          size: '2.4 MB'
        });
      }
    });

    // Purchase orders from purchases
    db.purchases.forEach(p => {
      list.push({
        name: `po_invoice_${p.id.toLowerCase()}.pdf`,
        category: 'Supplier',
        owner: p.supplierName,
        version: 'v1.0',
        expiry: 'No Expiry',
        size: '450 KB'
      });
    });

    // Subsidies / MNRE commissioning
    db.projects.filter(p => p.currentStage >= 11).forEach(p => {
      list.push({
        name: `kseb_commissioning_${p.id.toLowerCase()}.pdf`,
        category: 'MNRE',
        owner: p.customerName,
        version: 'v1.0',
        expiry: 'No Expiry',
        size: '1.8 MB'
      });
    });

    return list;
  };

  const allCompiledFiles = compileAllFiles();

  // Filter Files
  const filteredFiles = allCompiledFiles.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCat === 'All' || f.category === filterCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="dms-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><FolderClosed className="view-icon-color" /> Centralized Document DMS</h2>
          <p className="view-subtitle">Store and verify KSEB applications, client identity proofs, solar bank contracts, and supplier invoices.</p>
        </div>
      </div>

      <div className="crm-main-layout" style={{ gridTemplateColumns: '1.2fr 2fr', gap: '20px' }}>
        
        {/* Sidebar Folders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card">
            <h4 style={{ fontSize: '13px', color: 'var(--primary)', marginBottom: '16px', textTransform: 'uppercase' }}>DMS Categories</h4>
            <div className="dms-folders-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {documentCategories.map(cat => (
                <button 
                  key={cat.id} 
                  className={`btn ${filterCat === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', fontSize: '12px' }}
                  onClick={() => setFilterCat(cat.id)}
                >
                  <FolderClosed size={14} style={{ marginRight: '8px' }} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Expiry alerts & stats */}
          <div className="glass-card">
            <h4 style={{ fontSize: '13px', color: 'var(--primary)', marginBottom: '12px' }}><History size={14} style={{ display: 'inline', marginRight: '6px' }} /> Download History</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {downloadHistory.map((d, idx) => (
                <div key={idx} style={{ fontSize: '11px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{d.file}</span><br />
                  <span style={{ color: 'var(--text-muted)' }}>Downloaded by {d.user} on {d.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Files Area */}
        <div className="glass-card">
          <div className="dms-files-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px' }}>
            <div className="search-box" style={{ flex: 1 }}>
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Simulate OCR Search (Search filename or client name)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Filename Description</th>
                  <th>Category Folder</th>
                  <th>Linked Client/Owner</th>
                  <th>DMS Version</th>
                  <th>Expiry Date</th>
                  <th>Size</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: '600' }}>{file.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-info">{file.category}</span></td>
                    <td>{file.owner}</td>
                    <td><code>{file.version}</code></td>
                    <td>{file.expiry}</td>
                    <td>{file.size}</td>
                    <td>
                      <button 
                        className="icon-btn" 
                        onClick={() => window.open(getUploadUrl(file.name), '_blank')} 
                        title="Download secure file"
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredFiles.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No documents matched your search filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
