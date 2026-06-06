// InstallationsView.jsx
import React, { useState, useEffect } from 'react';
import { getDb, saveDb, logNotification } from '../db/mockDb';
import Modal from '../components/Modal';
import { jsPDF } from 'jspdf';
import { 
  Wrench, CheckSquare, ShieldCheck, MapPin, Plus, 
  FileCheck, UserCheck, Play, Power, Calendar
} from 'lucide-react';

export default function InstallationsView() {
  const [db, setDb] = useState(getDb());
  const [insts, setInsts] = useState(db.installations);
  const [selectedInst, setSelectedInst] = useState(null);
  const [activeChecklist, setActiveChecklist] = useState(null);

  // GPS Attendance simulator fields
  const [attRecord, setAttRecord] = useState({
    staffId: 'EMP005',
    checkIn: '09:00 AM',
    gps: '9.9312° N, 76.2673° E (Kochi)'
  });

  useEffect(() => {
    setDb(getDb());
    setInsts(db.installations);
  }, []);

  const refreshInst = () => {
    const fresh = getDb();
    setDb(fresh);
    setInsts(fresh.installations);
  };

  const handleUpdateStatus = (instId, type, nextStatus) => {
    const updated = { ...db };
    const idx = updated.installations.findIndex(i => i.id === instId);
    if (idx !== -1) {
      updated.installations[idx][type] = nextStatus;
      
      // Calculate total completion percentage
      let score = 0;
      if (updated.installations[idx].civilStatus === 'Completed') score += 30;
      if (updated.installations[idx].civilStatus === 'In Progress') score += 15;
      
      if (updated.installations[idx].fabricationStatus === 'Completed') score += 40;
      if (updated.installations[idx].fabricationStatus === 'In Progress') score += 20;

      if (updated.installations[idx].electricalStatus === 'Completed') score += 30;
      if (updated.installations[idx].electricalStatus === 'In Progress') score += 15;
      
      updated.installations[idx].workProgress = score;

      // Automatically advance Project stage to 7 (Installation) if installation starts
      const projId = updated.installations[idx].projectId;
      const projIdx = updated.projects.findIndex(p => p.id === projId);
      if (projIdx !== -1 && updated.projects[projIdx].currentStage < 7) {
        updated.projects[projIdx].currentStage = 7; // Installation Stage
      }

      saveDb(updated);
      refreshInst();
    }
  };

  const handleQCVerification = (instId, checkKey, checkedVal) => {
    const updated = { ...db };
    
    // Check if quality check object exists for project
    const inst = updated.installations.find(i => i.id === instId);
    if (!inst) return;
    
    let qcRecord = updated.qualityChecks.find(q => q.projectId === inst.projectId);
    
    if (!qcRecord) {
      qcRecord = {
        id: 'QC' + Date.now(),
        projectId: inst.projectId,
        checklist: {
          earthingVerified: false,
          acdbInstalled: false,
          dcdbInstalled: false,
          spdInstalled: false,
          structureInspected: false,
          generationTestPassed: false
        },
        verifiedBy: 'Gokul Krishna (Service Engineer)',
        signedAt: ''
      };
      updated.qualityChecks.push(qcRecord);
    }

    qcRecord.checklist[checkKey] = checkedVal;
    
    // If all checked, sign the document
    const allChecked = Object.values(qcRecord.checklist).every(v => v === true);
    if (allChecked) {
      qcRecord.signedAt = new Date().toISOString().split('T')[0];
      
      // Auto-advance project to Stage 10 (Inspection) / 11 (Commissioning)
      const pIdx = updated.projects.findIndex(p => p.id === inst.projectId);
      if (pIdx !== -1) {
        updated.projects[pIdx].currentStage = 10; // Inspection Stage
        
        // Advance lead to Installed status
        const leadIdx = updated.leads.findIndex(l => l.id === updated.projects[pIdx].leadId);
        if (leadIdx !== -1) updated.leads[leadIdx].status = 'Installed';
      }
    } else {
      qcRecord.signedAt = '';
    }

    saveDb(updated);
    refreshInst();
    // Refresh modal states
    const freshQC = updated.qualityChecks.find(q => q.projectId === inst.projectId);
    setActiveChecklist(freshQC);
  };

  const handleGPSCheckin = (instId) => {
    const updated = { ...db };
    const idx = updated.installations.findIndex(i => i.id === instId);
    if (idx !== -1) {
      const staff = updated.employees.find(e => e.id === attRecord.staffId);
      updated.installations[idx].attendance.push({
        date: new Date().toISOString().split('T')[0],
        staffId: attRecord.staffId,
        staffName: staff ? staff.name : 'Unknown Staff',
        checkIn: attRecord.checkIn,
        checkOut: '05:00 PM',
        gps: attRecord.gps
      });
      saveDb(updated);
      refreshInst();
      alert('GPS Check-in logged successfully.');
    }
  };

  const generateQCCertificate = (qc) => {
    const proj = db.projects.find(p => p.id === qc.projectId) || { customerName: 'Customer', projectSize: 3 };
    const doc = new jsPDF();

    // Border Frame
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1.5);
    doc.rect(8, 8, 194, 280);

    // Decorative Header logo
    doc.setFillColor(11, 15, 23);
    doc.rect(10, 10, 190, 42, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('GREENVOLTES ENERGY SOLUTIONS', 15, 25);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('Quality Assurance and EPC Testing Laboratory | Kochi, Kerala', 15, 33);
    doc.text('PM Surya Ghar MNRE Registered Solar Installer', 15, 38);

    // Certificate Title
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(18);
    doc.setFont('Helvetica', 'bold');
    doc.text('CERTIFICATE OF QUALITY & COMMISSIONING COMPLIANCE', 18, 68);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'normal');
    
    // Body Text
    let body = `This is to certify that the Rooftop Grid-Connected Solar Photovoltaic Power Plant\nof capacity ${proj.projectSize} kWp, installed for customer ${proj.customerName} (Project Ref: ${qc.projectId}),\nhas been thoroughly tested, inspected and cleared by our engineering quality team.`;
    doc.text(body, 20, 84);

    // Checklist specifications
    doc.setFont('Helvetica', 'bold');
    doc.text('QUALITY STANDARDS COMPLIED:', 20, 115);
    doc.setFont('Helvetica', 'normal');

    doc.text('[X] 1. Double Earthing Verification (AC & DC Sides) - PASSED', 25, 125);
    doc.text('[X] 2. AC Distribution Box (ACDB) Isolation Check - PASSED', 25, 132);
    doc.text('[X] 3. DC Distribution Box (DCDB) Surge Fuses Check - PASSED', 25, 139);
    doc.text('[X] 4. Surge Protection Device (SPD) Grounding Check - PASSED', 25, 146);
    doc.text('[X] 5. Wind Resistance Structure Tension Load Analysis - PASSED', 25, 153);
    doc.text('[X] 6. Synchronous Generation Injection Metering Test - PASSED', 25, 160);

    // Signatures
    doc.setFont('Helvetica', 'bold');
    doc.text('Quality Assurance Team Sign', 20, 215);
    doc.text('Project Engineering Manager', 130, 215);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Verified by: ${qc.verifiedBy}`, 20, 222);
    doc.text('Approved Signatory', 130, 222);
    doc.text(`Date of Signing: ${qc.signedAt}`, 20, 228);

    // Save Certificate
    doc.save(`QC_Certificate_${qc.projectId}.pdf`);
  };

  const getQcRecord = (projId) => {
    return db.qualityChecks.find(q => q.projectId === projId) || {
      checklist: {
        earthingVerified: false,
        acdbInstalled: false,
        dcdbInstalled: false,
        spdInstalled: false,
        structureInspected: false,
        generationTestPassed: false
      }
    };
  };

  return (
    <div className="installations-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><Wrench className="view-icon-color" /> Installations & Quality Control</h2>
          <p className="view-subtitle">Monitor site structure fabrications, allocate AC/DC electrical cable tasks, verify safety ground check sheets, and file certificates.</p>
        </div>
      </div>

      {/* Grid of installation progress */}
      <div className="glass-card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>On-Site Work Progress</h3>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Project Ref</th>
                <th>Client Name</th>
                <th>Civil Footings</th>
                <th>Truss Fabrication</th>
                <th>AC/DC Cabling</th>
                <th>Work Completion %</th>
                <th>Daily Attendance</th>
                <th>QC Audit Sheet</th>
              </tr>
            </thead>
            <tbody>
              {insts.map(inst => {
                const qc = getQcRecord(inst.projectId);
                return (
                  <tr key={inst.id}>
                    <td><code>{inst.projectId}</code></td>
                    <td style={{ fontWeight: '600' }}>{inst.customerName}</td>
                    <td>
                      <select 
                        value={inst.civilStatus} 
                        onChange={(e) => handleUpdateStatus(inst.id, 'civilStatus', e.target.value)}
                        className="form-control btn-sm"
                        style={{ width: '120px', padding: '4px' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        value={inst.fabricationStatus} 
                        onChange={(e) => handleUpdateStatus(inst.id, 'fabricationStatus', e.target.value)}
                        className="form-control btn-sm"
                        style={{ width: '120px', padding: '4px' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        value={inst.electricalStatus} 
                        onChange={(e) => handleUpdateStatus(inst.id, 'electricalStatus', e.target.value)}
                        className="form-control btn-sm"
                        style={{ width: '120px', padding: '4px' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '6px', background: 'var(--border-color)', borderRadius: '3px' }}>
                          <div style={{ height: '6px', width: `${inst.workProgress}%`, background: 'var(--primary)', borderRadius: '3px' }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{inst.workProgress}%</span>
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedInst(inst)}>
                        <UserCheck size={12} /> Log Crew ({inst.attendance.length})
                      </button>
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => setActiveChecklist(qc)}>
                        <CheckSquare size={12} /> QC Checklist
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* QC Checklist Modal */}
      <Modal isOpen={activeChecklist !== null} onClose={() => setActiveChecklist(null)} title={`Quality Control Checklist (Module 19)`}>
        {activeChecklist && (
          <div className="qc-checklist-panel">
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Before grid commissioning can occur, all structural and electrical systems must comply with MNRE regulations. Verify checks below:</p>
            
            <div className="checklist-items" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={activeChecklist.checklist.earthingVerified} 
                  onChange={(e) => handleQCVerification(insts[0].id, 'earthingVerified', e.target.checked)}
                />
                <span>AC/DC Dual Earth Rods Verified</span>
              </label>

              <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={activeChecklist.checklist.acdbInstalled} 
                  onChange={(e) => handleQCVerification(insts[0].id, 'acdbInstalled', e.target.checked)}
                />
                <span>ACDB Surge Isolation Box Installed</span>
              </label>

              <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={activeChecklist.checklist.dcdbInstalled} 
                  onChange={(e) => handleQCVerification(insts[0].id, 'dcdbInstalled', e.target.checked)}
                />
                <span>DCDB Input String Isolation Box Installed</span>
              </label>

              <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={activeChecklist.checklist.spdInstalled} 
                  onChange={(e) => handleQCVerification(insts[0].id, 'spdInstalled', e.target.checked)}
                />
                <span>Surge Protection Device (SPD) Grounding Verified</span>
              </label>

              <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={activeChecklist.checklist.structureInspected} 
                  onChange={(e) => handleQCVerification(insts[0].id, 'structureInspected', e.target.checked)}
                />
                <span>Elevated GI structure Tension Inspections Passed</span>
              </label>

              <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={activeChecklist.checklist.generationTestPassed} 
                  onChange={(e) => handleQCVerification(insts[0].id, 'generationTestPassed', e.target.checked)}
                />
                <span>Injection synchronisation test passed</span>
              </label>
            </div>

            {activeChecklist.signedAt ? (
              <div className="qc-complete-actions" style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '600', marginBottom: '12px' }}>
                  <FileCheck size={18} /> QC Verification Complete. Audit signed on {activeChecklist.signedAt}.
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => generateQCCertificate(activeChecklist)}>
                  Generate QC Compliance Certificate PDF
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '20px', fontSize: '11px', color: 'var(--status-danger)', textAlign: 'center' }}>
                * Complete all checklist clearances to generate the official QC Certificate.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Attendance Log Modal */}
      <Modal isOpen={selectedInst !== null} onClose={() => setSelectedInst(null)} title={`GPS Attendance: Crew Log`}>
        {selectedInst && (
          <div className="crew-attendance-panel">
            <h4 style={{ fontSize: '13px', color: 'var(--primary)', marginBottom: '12px' }}>Register Today's Crew Attendance</h4>
            <div className="form-row" style={{ marginBottom: '16px' }}>
              <div className="form-group">
                <label>Select Staff Installer</label>
                <select 
                  className="form-control"
                  value={attRecord.staffId}
                  onChange={(e) => setAttRecord({ ...attRecord, staffId: e.target.value })}
                >
                  {db.employees.filter(e => e.role.includes('Team')).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>GPS Checked-In Location</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={attRecord.gps}
                  onChange={(e) => setAttRecord({ ...attRecord, gps: e.target.value })}
                />
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleGPSCheckin(selectedInst.id)}>
              Save Check-In
            </button>

            <h4 style={{ fontSize: '13px', color: 'var(--primary)', marginTop: '20px', marginBottom: '8px' }}>Log Registry for Project {selectedInst.projectId}</h4>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Crew Member</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>GPS Address Coords</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInst.attendance.map((att, idx) => (
                    <tr key={idx}>
                      <td>{att.date}</td>
                      <td>{att.staffName}</td>
                      <td>{att.checkIn}</td>
                      <td>{att.checkOut}</td>
                      <td><code>{att.gps}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
