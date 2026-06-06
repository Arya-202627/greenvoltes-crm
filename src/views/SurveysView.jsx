// SurveysView.jsx
import React, { useState, useEffect } from 'react';
import { getDb, saveDb, saveSurvey, getSurveys, getLeads } from '../db/mockDb';
import Modal from '../components/Modal';
import { jsPDF } from 'jspdf';
import { 
  ClipboardList, Plus, FileDown, ShieldCheck, MapPin, 
  Layers, Zap, Check, Eye
} from 'lucide-react';

export default function SurveysView({ userRole }) {
  const [db, setDb] = useState(getDb());
  const [surveys, setSurveys] = useState(getSurveys());
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [viewBOM, setViewBOM] = useState(null);

  // New survey state
  const [newSurvey, setNewSurvey] = useState({
    leadId: '',
    roofType: 'Concrete Flat Roof',
    roofArea: '',
    gpsCoordinates: '9.9312° N, 76.2673° E',
    shadowAnalysis: '',
    existingLoad: '',
    sanctionedLoad: '',
    phaseType: 'Single Phase',
    engineerRemarks: '',
    recommendedCapacity: 3
  });

  useEffect(() => {
    setDb(getDb());
    setSurveys(getSurveys());
  }, []);

  const refreshSurveys = () => {
    setSurveys(getSurveys());
  };

  const handleCreateSurvey = (e) => {
    e.preventDefault();
    const surveyId = 'S' + (surveys.length + 101);
    
    // Auto-generate estimated generation (typically 120 units per kW per month in Kerala)
    const estGen = newSurvey.recommendedCapacity * 120;
    
    // Auto-generate Bill of Materials based on capacity
    const panelQty = Math.ceil((newSurvey.recommendedCapacity * 1000) / 550);
    const mockBOM = [
      { item: `Solar Panels (550W Mono PERC)`, qty: panelQty, spec: 'Greenvolt Premium' },
      { item: `Grid-tied Inverter`, qty: 1, spec: `${newSurvey.recommendedCapacity}kW, ${newSurvey.phaseType}` },
      { item: `Standard Aluminum Rails`, qty: Math.ceil(panelQty * 4), spec: 'Structure Mounts' },
      { item: `ACDB/DCDB protection boxes`, qty: 1, spec: 'IP65 Rated' },
      { item: `Solar Cable 4sqmm`, qty: newSurvey.recommendedCapacity > 5 ? 120 : 80, spec: 'Meters' }
    ];

    const surveyData = {
      id: surveyId,
      leadId: newSurvey.leadId,
      roofType: newSurvey.roofType,
      roofArea: parseFloat(newSurvey.roofArea),
      gpsCoordinates: newSurvey.gpsCoordinates,
      shadowAnalysis: newSurvey.shadowAnalysis,
      existingLoad: parseFloat(newSurvey.existingLoad),
      sanctionedLoad: parseFloat(newSurvey.sanctionedLoad),
      phaseType: newSurvey.phaseType,
      engineerRemarks: newSurvey.engineerRemarks,
      recommendedCapacity: parseFloat(newSurvey.recommendedCapacity),
      estGeneration: estGen,
      bom: mockBOM,
      createdAt: new Date().toISOString()
    };

    saveSurvey(surveyData);
    
    // Update Lead status to "Site Survey Completed"
    const leadsCopy = [...db.leads];
    const leadIdx = leadsCopy.findIndex(l => l.id === newSurvey.leadId);
    if (leadIdx !== -1) {
      leadsCopy[leadIdx].status = 'Site Survey Completed';
      db.leads = leadsCopy;
      saveDb(db);
    }

    setIsSurveyOpen(false);
    setNewSurvey({
      leadId: '',
      roofType: 'Concrete Flat Roof',
      roofArea: '',
      gpsCoordinates: '9.9312° N, 76.2673° E',
      shadowAnalysis: '',
      existingLoad: '',
      sanctionedLoad: '',
      phaseType: 'Single Phase',
      engineerRemarks: '',
      recommendedCapacity: 3
    });
    refreshSurveys();
    alert(`Survey report registered successfully! Ref: ${surveyId}`);
  };

  // PDF generation utilizing jsPDF
  const generatePDF = (survey) => {
    const lead = db.leads.find(l => l.id === survey.leadId) || { name: 'N/A', mobile: 'N/A' };
    const doc = new jsPDF();

    // Top Header Styling
    doc.setFillColor(11, 15, 23);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('GREENVOLTES SOLAR CARE', 15, 20);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('Greenvolt Energy Solutions LLP | Kochi, Kerala', 15, 28);
    doc.text('https://www.greenvoltes.in/', 15, 33);

    // Document Title
    doc.setTextColor(16, 185, 129); // Green Accent
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text('SITE SURVEY & ENGINEERING FEASIBILITY REPORT', 15, 52);

    // Client Details Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('CLIENT DETAILS', 15, 62);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 64, 195, 64);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Lead Reference ID: ${survey.leadId}`, 15, 71);
    doc.text(`Customer Name: ${lead.name}`, 15, 77);
    doc.text(`Mobile Number: ${lead.mobile}`, 15, 83);
    doc.text(`Address: ${lead.address || 'Kerala'}`, 15, 89);

    // Survey parameters section
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TECHNICAL SURVEY PARAMETERS', 15, 101);
    doc.line(15, 103, 195, 103);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Roof Construction Type: ${survey.roofType}`, 15, 110);
    doc.text(`Total Roof Area (Sq.Ft): ${survey.roofArea} sqft`, 15, 116);
    doc.text(`GPS Coordinates: ${survey.gpsCoordinates}`, 15, 122);
    doc.text(`Electrical Phase: ${survey.phaseType}`, 15, 128);
    doc.text(`Sanctioned Connection Load: ${survey.sanctionedLoad} kW`, 15, 134);
    doc.text(`Existing Consumer Load: ${survey.existingLoad} kW`, 15, 140);
    doc.text(`Shadow & Obstruction Analysis: ${survey.shadowAnalysis || 'Clear'}`, 15, 146);

    // Recommendation section
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('GREENVOLTES ENGG RECOMMENDATIONS', 15, 158);
    doc.line(15, 160, 195, 160);

    doc.setFont('Helvetica', 'normal');
    doc.text(`Recommended Solar Plant Size: ${survey.recommendedCapacity} kWp`, 15, 167);
    doc.text(`Estimated Energy Generation: ~${survey.estGeneration} Units/Month`, 15, 173);
    doc.text(`Engineering Comments: ${survey.engineerRemarks || 'None'}`, 15, 179);

    // BOM section
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PRELIMINARY BILL OF MATERIALS (BOM)', 15, 195);
    doc.line(15, 197, 195, 197);

    doc.setFont('Helvetica', 'normal');
    let yLoc = 205;
    survey.bom.forEach((bomItem, idx) => {
      doc.text(`${idx + 1}. ${bomItem.item} - Qty: ${bomItem.qty} (${bomItem.spec})`, 15, yLoc);
      yLoc += 7;
    });

    // Save PDF trigger
    doc.save(`Survey_Report_${survey.leadId}.pdf`);
  };

  // Find leads that are ready for site visit
  const openLeadsForSurvey = db.leads.filter(l => 
    l.status === 'New Lead' || l.status === 'Contacted' || l.status === 'Site Visit Scheduled'
  );

  return (
    <div className="surveys-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><ClipboardList className="view-icon-color" /> Site Survey Management</h2>
          <p className="view-subtitle">Enter roof evaluations, shadow analysis parameters, calculate grid connections, and generate structural BOM sheets.</p>
        </div>
        {userRole !== 'Customer' && (
          <button className="btn btn-primary" onClick={() => setIsSurveyOpen(true)}>
            <Plus size={16} /> New Survey Report
          </button>
        )}
      </div>

      <div className="glass-card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Site Survey Engineering Registry</h3>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Survey ID</th>
                <th>Lead Ref</th>
                <th>Roof Details</th>
                <th>Connection Phase</th>
                <th>Rec Capacity</th>
                <th>Est. Gen/Mo</th>
                <th>BOM List</th>
                <th>Export</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map(survey => (
                <tr key={survey.id}>
                  <td><code>{survey.id}</code></td>
                  <td><code>{survey.leadId}</code></td>
                  <td>
                    <strong>{survey.roofType}</strong><br />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}><MapPin size={10} style={{ display: 'inline' }} /> {survey.gpsCoordinates} ({survey.roofArea} sqft)</span>
                  </td>
                  <td>{survey.phaseType} / Load: {survey.sanctionedLoad}kW</td>
                  <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{survey.recommendedCapacity} kW</td>
                  <td>{survey.estGeneration} Units</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setViewBOM(survey)}>
                      <Eye size={12} /> View BOM ({survey.bom.length})
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => generatePDF(survey)}>
                      <FileDown size={12} /> PDF Report
                    </button>
                  </td>
                </tr>
              ))}
              {surveys.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No site survey reports saved yet. Click "New Survey Report" to register one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View BOM Modal */}
      <Modal isOpen={viewBOM !== null} onClose={() => setViewBOM(null)} title={`Preliminary BOM: Project ${viewBOM?.leadId}`}>
        {viewBOM && (
          <div className="bom-view-panel">
            <h4 style={{ color: 'var(--primary)', marginBottom: '12px' }}>System Size: {viewBOM.recommendedCapacity}kW ({viewBOM.phaseType})</h4>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Material Description</th>
                    <th>Required Qty</th>
                    <th>Specification Details</th>
                  </tr>
                </thead>
                <tbody>
                  {viewBOM.bom.map((b, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600' }}>{b.item}</td>
                      <td>{b.qty}</td>
                      <td><code>{b.spec}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-primary" onClick={() => { generatePDF(viewBOM); setViewBOM(null); }}>
                <FileDown size={14} /> Download PDF Survey Report
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Survey Modal */}
      <Modal isOpen={isSurveyOpen} onClose={() => setIsSurveyOpen(false)} title="Create Site Survey Report">
        <form onSubmit={handleCreateSurvey}>
          <div className="form-group">
            <label>Select Associated Customer Lead *</label>
            <select 
              required
              className="form-control"
              value={newSurvey.leadId}
              onChange={(e) => setNewSurvey({ ...newSurvey, leadId: e.target.value })}
            >
              <option value="">-- Choose active lead --</option>
              {openLeadsForSurvey.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.id} - Status: {l.status})</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Roof Construction Type</label>
              <select 
                className="form-control"
                value={newSurvey.roofType}
                onChange={(e) => setNewSurvey({ ...newSurvey, roofType: e.target.value })}
              >
                <option value="Concrete Flat Roof">Concrete Flat Roof</option>
                <option value="Slanted Tile Roof">Slanted Tile Roof</option>
                <option value="Truss Metal Sheet Roof">Truss Metal Sheet Roof</option>
              </select>
            </div>
            <div className="form-group">
              <label>Available Roof Area (sqft) *</label>
              <input 
                type="number" 
                required 
                className="form-control"
                value={newSurvey.roofArea}
                onChange={(e) => setNewSurvey({ ...newSurvey, roofArea: e.target.value })}
                placeholder="E.g., 450"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>GPS Coordinates *</label>
              <input 
                type="text" 
                required 
                className="form-control"
                value={newSurvey.gpsCoordinates}
                onChange={(e) => setNewSurvey({ ...newSurvey, gpsCoordinates: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Electrical Phase Type</label>
              <select 
                className="form-control"
                value={newSurvey.phaseType}
                onChange={(e) => setNewSurvey({ ...newSurvey, phaseType: e.target.value })}
              >
                <option value="Single Phase">Single Phase</option>
                <option value="Three Phase">Three Phase</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Sanctioned Load (kW) *</label>
              <input 
                type="number" 
                step="0.1"
                required 
                className="form-control"
                value={newSurvey.sanctionedLoad}
                onChange={(e) => setNewSurvey({ ...newSurvey, sanctionedLoad: e.target.value })}
                placeholder="E.g., 5.0"
              />
            </div>
            <div className="form-group">
              <label>Existing Connected Load (kW) *</label>
              <input 
                type="number" 
                step="0.1"
                required 
                className="form-control"
                value={newSurvey.existingLoad}
                onChange={(e) => setNewSurvey({ ...newSurvey, existingLoad: e.target.value })}
                placeholder="E.g., 4.2"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Shadow Obstruction & Solar Access Analysis *</label>
            <textarea 
              required
              rows={2}
              className="form-control"
              value={newSurvey.shadowAnalysis}
              onChange={(e) => setNewSurvey({ ...newSurvey, shadowAnalysis: e.target.value })}
              placeholder="E.g., Clear southern access. Small shadow from concrete parapet on north-east side during winters."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Recommended System Size (kW) *</label>
              <input 
                type="number" 
                required 
                className="form-control"
                value={newSurvey.recommendedCapacity}
                onChange={(e) => setNewSurvey({ ...newSurvey, recommendedCapacity: e.target.value })}
                placeholder="E.g., 3"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Engineering Surveyor Remarks</label>
            <textarea 
              rows={2} 
              className="form-control"
              value={newSurvey.engineerRemarks}
              onChange={(e) => setNewSurvey({ ...newSurvey, engineerRemarks: e.target.value })}
              placeholder="E.g., Structure mount requires elevated GI channels at 1.2m height. Safe civil footing required."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSurveyOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Survey & Auto-BOM
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
