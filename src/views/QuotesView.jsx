// QuotesView.jsx
import React, { useState, useEffect } from 'react';
import { 
  getDb, saveDb, getQuotations, getLeads, getSurveys, saveQuotation, logNotification 
} from '../db/mockDb';
import Modal from '../components/Modal';
import { jsPDF } from 'jspdf';
import { 
  FileText, Plus, FileDown, CheckCircle, Clock, RotateCcw, Calculator 
} from 'lucide-react';

export default function QuotesView() {
  const [db, setDb] = useState(getDb());
  const [quotes, setQuotes] = useState(getQuotations());
  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  // Form State
  const [newQuote, setNewQuote] = useState({
    leadId: '',
    projectSize: 3,
    inverterBrand: 'Growatt',
    panelBrand: 'Waaree (Mono PERC)',
    basePrice: 165000,
    gstRate: 13.8, // Combined split GST rate for Solar EPC contracts in India
    paymentTerms: '50% Advance, 40% on Delivery, 10% post commissioning'
  });

  useEffect(() => {
    setDb(getDb());
    setQuotes(getQuotations());
  }, []);

  const refreshQuotes = () => {
    setQuotes(getQuotations());
  };

  // Adjust prices based on project size
  const handleSizeChange = (size) => {
    const defaultPrices = {
      3: 165000,
      5: 235000,
      8: 360000,
      10: 440000
    };
    const base = defaultPrices[size] || size * 50000;
    setNewQuote({
      ...newQuote,
      projectSize: parseFloat(size),
      basePrice: base
    });
  };

  const handleCreateQuote = (e) => {
    e.preventDefault();
    const quoteId = 'Q0' + (quotes.length + 101);
    
    // Check if a survey exists to link
    const survey = db.surveys.find(s => s.leadId === newQuote.leadId);
    
    // Subsidy Math (PM Surya Ghar gets 30k per kW for first 2kW, 18k for 3rd kW, capped at 78,000 INR)
    let subsidy = 0;
    if (newQuote.projectSize >= 3) {
      subsidy = 78000;
    } else if (newQuote.projectSize === 2) {
      subsidy = 60000;
    } else if (newQuote.projectSize === 1) {
      subsidy = 30000;
    } else {
      subsidy = newQuote.projectSize >= 3 ? 78000 : newQuote.projectSize * 30000;
    }

    const base = parseFloat(newQuote.basePrice);
    const gstAmt = Math.round(base * (newQuote.gstRate / 100));
    const net = base + gstAmt;

    const quoteData = {
      id: quoteId,
      leadId: newQuote.leadId,
      surveyId: survey ? survey.id : '',
      version: 1,
      projectSize: newQuote.projectSize,
      inverterBrand: newQuote.inverterBrand,
      panelBrand: newQuote.panelBrand,
      basePrice: base,
      gstRate: newQuote.gstRate,
      gstAmount: gstAmt,
      netPrice: net,
      subsidyExpected: subsidy,
      customerShare: net - subsidy,
      paymentTerms: newQuote.paymentTerms,
      status: 'Sent',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    saveQuotation(quoteData);

    // Update lead status
    const leadsCopy = [...db.leads];
    const idx = leadsCopy.findIndex(l => l.id === newQuote.leadId);
    if (idx !== -1) {
      leadsCopy[idx].status = 'Quotation Sent';
      db.leads = leadsCopy;
      saveDb(db);
    }

    setIsNewQuoteOpen(false);
    refreshQuotes();
    alert(`Quotation generated successfully! Ref: ${quoteId}`);
  };

  const handleStatusChange = (quoteId, nextStatus) => {
    const qIdx = db.quotations.findIndex(q => q.id === quoteId);
    if (qIdx !== -1) {
      db.quotations[qIdx].status = nextStatus;
      
      // If accepted/confirmed, create project automatically (Module 17 workflow automation)
      if (nextStatus === 'Accepted') {
        const quote = db.quotations[qIdx];
        const lead = db.leads.find(l => l.id === quote.leadId);
        
        // Advance Lead Status to Order Confirmed
        const lIdx = db.leads.findIndex(l => l.id === quote.leadId);
        if (lIdx !== -1) db.leads[lIdx].status = 'Order Confirmed';

        // Add to Projects
        const projectExists = db.projects.some(p => p.leadId === quote.leadId);
        if (!projectExists) {
          db.projects.push({
            id: 'PRJ' + (db.projects.length + 101),
            leadId: quote.leadId,
            customerName: lead ? lead.name : 'Unknown Customer',
            projectSize: quote.projectSize,
            currentStage: 5, // Order Confirmation stage
            stageHistory: [
              { stage: 1, name: 'Lead', completedAt: lead ? lead.createdAt : new Date().toISOString() },
              { stage: 5, name: 'Order Confirmation', completedAt: new Date().toISOString() }
            ],
            installationTeam: { civilId: '', electricalId: '', fabricationId: '' },
            ksebApplicationNumber: 'KSEB-APP-2026-' + Math.floor(10000 + Math.random() * 90000),
            netMeterStatus: 'Pending Application',
            commissioningDate: '',
            subsidyStatus: 'Pending Registration',
            expectedCompletion: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            updatedAt: new Date().toISOString()
          });

          // Create initial MNRE application tracking row
          db.mnre.push({
            id: 'MN' + (db.mnre.length + 101),
            leadId: quote.leadId,
            consumerId: '',
            vendorId: 'GV-VEND-KL-021',
            applicationId: 'PM-SG-2026-' + Math.floor(10000 + Math.random() * 90000),
            regNumber: '',
            regStatus: 'In Progress',
            docVerification: 'Pending Documents',
            inspectionStatus: 'Pending Installation',
            subsidyAmount: quote.subsidyExpected,
            subsidyStatus: 'Pending Installation',
            alerts: [{ type: 'Warning', msg: 'Awaiting customer documentation upload.' }]
          });

          // Create a mock finance record for advance invoice (Order Confirmation gets advance payment)
          db.finance.push({
            id: 'F' + (db.finance.length + 101),
            description: `Advance receivable Order Confirmed: ${lead ? lead.name : 'Unknown'}`,
            type: 'Receivable (In)',
            amount: Math.round(quote.netPrice * 0.5), // 50% advance
            projectSize: quote.projectSize,
            date: new Date().toISOString().split('T')[0],
            gst: Math.round(quote.gstAmount * 0.5),
            zohoSynced: false
          });
        }
      }

      saveDb(db);
      refreshQuotes();
      alert(`Quote status updated to "${nextStatus}".`);
    }
  };

  const handleGenerateInvoice = (quote, type) => {
    const lead = db.leads.find(l => l.id === quote.leadId) || { name: 'N/A', mobile: 'N/A', address: 'Kerala' };
    const doc = new jsPDF();

    // Top Brand Styling
    doc.setFillColor(11, 15, 23);
    doc.rect(0, 0, 210, 42, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('GREENVOLTES SOLAR CARE', 15, 20);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('Greenvolt Energy Solutions LLP | GSTIN: 32AABCDE1234F1Z1', 15, 28);
    doc.text('Kochi Head Office: Kakkanad, Ernakulam, KL - 682030', 15, 34);

    // Document Type Header
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text(type.toUpperCase(), 15, 54);

    // Metadata
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Reference No: ${quote.id}-${type === 'Quotation' ? 'Q' : 'INV'}`, 130, 54);
    doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, 130, 60);
    doc.text(`Valid Until: ${quote.validUntil}`, 130, 66);

    // Client/Billed To Section
    doc.setFont('Helvetica', 'bold');
    doc.text('BILLED TO (CUSTOMER DETAILS)', 15, 75);
    doc.line(15, 77, 195, 77);

    doc.setFont('Helvetica', 'normal');
    doc.text(`Customer Name: ${lead.name}`, 15, 84);
    doc.text(`Mobile: ${lead.mobile}`, 15, 90);
    doc.text(`Installation Address: ${lead.address}`, 15, 96);
    doc.text(`District: ${lead.district || 'Kerala'}`, 15, 102);

    // Line Items table
    doc.setFont('Helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 115, 180, 8, 'F');
    doc.setFontSize(9);
    doc.text('Description of System', 18, 121);
    doc.text('Size (kWp)', 110, 121);
    doc.text('GST Rate', 135, 121);
    doc.text('Base Price (INR)', 160, 121);
    doc.line(15, 123, 195, 123);

    doc.setFont('Helvetica', 'normal');
    doc.text(`Rooftop Solar EPC Grid-tied Plant`, 18, 131);
    doc.text(`- Panel Brand: ${quote.panelBrand}`, 18, 136);
    doc.text(`- Inverter Brand: ${quote.inverterBrand}`, 18, 141);
    doc.text(`${quote.projectSize} kW`, 110, 131);
    doc.text(`${quote.gstRate}%`, 135, 131);
    doc.text(`Rs. ${quote.basePrice.toLocaleString('en-IN')}`, 160, 131);
    doc.line(15, 145, 195, 145);

    // Totals Math
    doc.setFont('Helvetica', 'bold');
    doc.text('Base Value:', 120, 155);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Rs. ${quote.basePrice.toLocaleString('en-IN')}`, 165, 155);

    doc.setFont('Helvetica', 'bold');
    doc.text(`GST (${quote.gstRate}% Split):`, 120, 161);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Rs. ${quote.gstAmount.toLocaleString('en-IN')}`, 165, 161);

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('Total Contract Value:', 120, 169);
    doc.text(`Rs. ${quote.netPrice.toLocaleString('en-IN')}`, 165, 169);

    doc.setTextColor(0, 0, 0);
    doc.setFont('Helvetica', 'bold');
    doc.text('MNRE Surya Ghar Subsidy (Expected):', 80, 177);
    doc.setFont('Helvetica', 'normal');
    doc.text(`- Rs. ${quote.subsidyExpected.toLocaleString('en-IN')}`, 165, 177);

    doc.setFont('Helvetica', 'bold');
    doc.text('Net Customer Out-of-Pocket Share:', 80, 185);
    doc.setTextColor(16, 185, 129);
    doc.text(`Rs. ${quote.customerShare.toLocaleString('en-IN')}`, 165, 185);

    // Payment terms
    doc.setTextColor(0, 0, 0);
    doc.setFont('Helvetica', 'bold');
    doc.text('Milestone Payment Terms:', 15, 205);
    doc.setFont('Helvetica', 'normal');
    doc.text(quote.paymentTerms || 'N/A', 15, 212);

    // Signature Area
    doc.setFont('Helvetica', 'bold');
    doc.text('For Greenvolt Energy Solutions LLP', 130, 245);
    doc.setFont('Helvetica', 'normal');
    doc.text('Authorized Signatory', 130, 258);
    doc.line(130, 252, 185, 252);

    doc.save(`${type}_Ref_${quote.id}.pdf`);
  };

  // Find leads that have completed site survey
  const leadsWithSurvey = db.leads.filter(l => l.status === 'Site Survey Completed');

  return (
    <div className="quotes-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><FileText className="view-icon-color" /> Quotations & Invoicing</h2>
          <p className="view-subtitle">Generate proposals, proforma invoices, calculate split GST, estimate subsidies, and print billing records.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNewQuoteOpen(true)}>
          <Plus size={16} /> New Proposal
        </button>
      </div>

      {/* Main Quotations Panel */}
      <div className="glass-card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Proposals & Invoices Ledger</h3>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Quote Ref</th>
                <th>Lead Ref</th>
                <th>System Capacity</th>
                <th>Contract Price</th>
                <th>Govt Subsidy</th>
                <th>Net Cust. Share</th>
                <th>Status</th>
                <th>Documents Export</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(quote => (
                <tr key={quote.id}>
                  <td><code>{quote.id}</code></td>
                  <td><code>{quote.leadId}</code></td>
                  <td>
                    <strong>{quote.projectSize} kW</strong><br />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{quote.panelBrand} / {quote.inverterBrand}</span>
                  </td>
                  <td>₹{quote.netPrice.toLocaleString('en-IN')}<br /><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(GST incl.)</span></td>
                  <td style={{ color: 'var(--primary)', fontWeight: '600' }}>₹{quote.subsidyExpected.toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: '700' }}>₹{quote.customerShare.toLocaleString('en-IN')}</td>
                  <td>
                    <select 
                      value={quote.status} 
                      onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                      className="form-control btn-sm"
                      style={{ width: '120px', padding: '4px' }}
                    >
                      <option value="Sent">Sent</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleGenerateInvoice(quote, 'Quotation')} title="Quotation PDF">
                        <FileDown size={12} /> Quote
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleGenerateInvoice(quote, 'Proforma Invoice')} title="Proforma Invoice PDF">
                        <FileDown size={12} /> Proforma
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Quotation Modal */}
      <Modal isOpen={isNewQuoteOpen} onClose={() => setIsNewQuoteOpen(false)} title="Create Solar EPC Proposal">
        <form onSubmit={handleCreateQuote}>
          <div className="form-group">
            <label>Link with Completed Site Survey *</label>
            <select 
              required
              className="form-control"
              value={newQuote.leadId}
              onChange={(e) => {
                const leadId = e.target.value;
                const survey = db.surveys.find(s => s.leadId === leadId);
                const size = survey ? survey.recommendedCapacity : 3;
                setNewQuote({
                  ...newQuote,
                  leadId: leadId
                });
                handleSizeChange(size);
              }}
            >
              <option value="">-- Choose lead --</option>
              {leadsWithSurvey.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.id})</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Recommended Capacity (kWp)</label>
              <select 
                className="form-control"
                value={newQuote.projectSize}
                onChange={(e) => handleSizeChange(e.target.value)}
              >
                <option value={3}>3 kW System</option>
                <option value={5}>5 kW System</option>
                <option value={8}>8 kW System</option>
                <option value={10}>10 kW System</option>
              </select>
            </div>
            <div className="form-group">
              <label>Base Price (INR) *</label>
              <input 
                type="number" 
                required 
                className="form-control"
                value={newQuote.basePrice}
                onChange={(e) => setNewQuote({ ...newQuote, basePrice: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Inverter Brand Choice</label>
              <select 
                className="form-control"
                value={newQuote.inverterBrand}
                onChange={(e) => setNewQuote({ ...newQuote, inverterBrand: e.target.value })}
              >
                <option value="Growatt">Growatt</option>
                <option value="Solis">Solis</option>
                <option value="Deye Hybrid">Deye Hybrid</option>
              </select>
            </div>
            <div className="form-group">
              <label>Panel Brand Choice</label>
              <select 
                className="form-control"
                value={newQuote.panelBrand}
                onChange={(e) => setNewQuote({ ...newQuote, panelBrand: e.target.value })}
              >
                <option value="Waaree (Mono PERC)">Waaree (Mono PERC)</option>
                <option value="Adani Solar (Mono PERC)">Adani Solar (Mono PERC)</option>
                <option value="Tata Power Solar">Tata Power Solar</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Split EPC GST Combined Rate (%)</label>
            <input 
              type="number" 
              step="0.1"
              required 
              className="form-control"
              value={newQuote.gstRate}
              onChange={(e) => setNewQuote({ ...newQuote, gstRate: parseFloat(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label>Payment Milestone Schedule Terms</label>
            <textarea 
              rows={2}
              className="form-control"
              value={newQuote.paymentTerms}
              onChange={(e) => setNewQuote({ ...newQuote, paymentTerms: e.target.value })}
            />
          </div>

          <div className="pricing-math-breakdown" style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '4px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--primary)', marginBottom: '8px', fontWeight: 'bold' }}><Calculator size={14} style={{ display: 'inline', marginRight: '4px' }} /> Proposal Financial Breakdown</h4>
            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Base Material & Labour Value:</span>
                <span>₹{newQuote.basePrice.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GST Tax Value ({newQuote.gstRate}%):</span>
                <span>₹{Math.round(newQuote.basePrice * (newQuote.gstRate / 100)).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '6px', fontWeight: 'bold' }}>
                <span>Contract Invoice Net Value:</span>
                <span>₹{Math.round(newQuote.basePrice * (1 + newQuote.gstRate / 100)).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}>
                <span>Surya Ghar Subsidy (Expected):</span>
                <span>- ₹{(newQuote.projectSize >= 3 ? 78000 : newQuote.projectSize === 2 ? 60000 : 30000).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewQuoteOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Generate Proposal Ledger
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
