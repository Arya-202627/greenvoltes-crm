// ProjectsView.jsx
import React, { useState, useEffect } from 'react';
import { getDb, saveDb, saveProject, getProjects } from '../db/mockDb';
import Modal from '../components/Modal';
import { 
  Briefcase, CheckCircle, ChevronRight, Clock, AlertTriangle, 
  MapPin, Plus, ClipboardList, Layers, Settings, Wrench
} from 'lucide-react';

export default function ProjectsView() {
  const [db, setDb] = useState(getDb());
  const [projects, setProjects] = useState(getProjects());
  const [selectedProject, setSelectedProject] = useState(null);

  const stages = [
    { num: 1, name: 'Lead' },
    { num: 2, name: 'Site Survey' },
    { num: 3, name: 'Design' },
    { num: 4, name: 'Quotation' },
    { num: 5, name: 'Order Confirmed' },
    { num: 6, name: 'Material Procurement' },
    { num: 7, name: 'Installation' },
    { num: 8, name: 'KSEB Application' },
    { num: 9, name: 'Net Meter Approval' },
    { num: 10, name: 'Inspection' },
    { num: 11, name: 'Commissioning' },
    { num: 12, name: 'Subsidy Application' },
    { num: 13, name: 'Subsidy Received' },
    { num: 14, name: 'Project Completed' }
  ];

  useEffect(() => {
    setDb(getDb());
    setProjects(getProjects());
  }, []);

  const refreshProjects = () => {
    setProjects(getProjects());
  };

  const handleAdvanceStage = (proj, nextStageNum) => {
    const stageInfo = stages.find(s => s.num === parseInt(nextStageNum));
    if (!stageInfo) return;

    const historyCopy = [...proj.stageHistory];
    // Avoid double logs
    if (!historyCopy.some(h => h.stage === stageInfo.num)) {
      historyCopy.push({
        stage: stageInfo.num,
        name: stageInfo.name,
        completedAt: new Date().toISOString()
      });
    }

    const updated = {
      ...proj,
      currentStage: stageInfo.num,
      stageHistory: historyCopy,
      updatedAt: new Date().toISOString()
    };

    // Workflow triggers (Module 17 automation)
    if (stageInfo.num === 14) {
      // Completed, mark subsidy as Completed
      const mnIdx = db.mnre.findIndex(m => m.leadId === proj.leadId);
      if (mnIdx !== -1) {
        db.mnre[mnIdx].subsidyStatus = 'Received';
        db.mnre[mnIdx].regStatus = 'Completed';
      }
      
      // Mark Lead as Completed
      const lIdx = db.leads.findIndex(l => l.id === proj.leadId);
      if (lIdx !== -1) db.leads[lIdx].status = 'Completed';
    }

    saveProject(updated);
    
    // Save other DB alterations if applicable
    saveDb(db);

    setSelectedProject(updated);
    refreshProjects();
    alert(`Project advanced to: Stage ${stageInfo.num} - ${stageInfo.name}`);
  };

  const handleAssignTeam = (proj, type, empId) => {
    const updated = {
      ...proj,
      installationTeam: {
        ...proj.installationTeam,
        [type]: empId
      }
    };
    saveProject(updated);
    setSelectedProject(updated);
    refreshProjects();
    alert(`Team updated successfully.`);
  };

  // Stats
  const delayedCount = projects.filter(p => new Date(p.expectedCompletion) < new Date() && p.currentStage < 14).length;
  const installationPending = projects.filter(p => p.currentStage === 6).length;
  const netMeterPending = projects.filter(p => p.currentStage === 8).length;
  const completionRate = projects.length > 0 
    ? Math.round((projects.filter(p => p.currentStage === 14).length / projects.length) * 100)
    : 0;

  return (
    <div className="projects-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><Briefcase className="view-icon-color" /> Project Pipeline (14 Stages)</h2>
          <p className="view-subtitle">Track installation milestones, KSEB solar applications, structural procurement, and subsidy receipts.</p>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
        <div className="glass-card metric-card">
          <div className="metric-icon-box" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <AlertTriangle size={18} style={{ color: 'var(--status-danger)' }} />
          </div>
          <div className="metric-details">
            <h4>Delayed Projects</h4>
            <p>{delayedCount}</p>
          </div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon-box" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <Wrench size={18} style={{ color: 'var(--status-pending)' }} />
          </div>
          <div className="metric-details">
            <h4>Procured & Awaiting Inst.</h4>
            <p>{installationPending}</p>
          </div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon-box" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            <Clock size={18} style={{ color: 'var(--status-new)' }} />
          </div>
          <div className="metric-details">
            <h4>KSEB Approval Pending</h4>
            <p>{netMeterPending}</p>
          </div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-icon-box" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle size={18} style={{ color: 'var(--status-success)' }} />
          </div>
          <div className="metric-details">
            <h4>Completion Rate</h4>
            <p>{completionRate}%</p>
          </div>
        </div>
      </div>

      {/* Project Grid */}
      <div className="glass-card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Project Portfolios & Milestones</h3>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Project ID</th>
                <th>Client Name</th>
                <th>System Size</th>
                <th>Current Pipeline Stage</th>
                <th>KSEB Application No</th>
                <th>Timeline Target</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(proj => {
                const currentStageName = stages.find(s => s.num === proj.currentStage)?.name || 'N/A';
                return (
                  <tr key={proj.id}>
                    <td><code>{proj.id}</code></td>
                    <td style={{ fontWeight: '600' }}>{proj.customerName}</td>
                    <td>{proj.projectSize} kWp</td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '12px' }}>
                        Stage {proj.currentStage}: {currentStageName}
                      </span>
                    </td>
                    <td><code>{proj.ksebApplicationNumber || 'Not Filed'}</code></td>
                    <td>
                      <span style={{ color: new Date(proj.expectedCompletion) < new Date() && proj.currentStage < 14 ? 'var(--status-danger)' : 'inherit' }}>
                        {proj.expectedCompletion}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedProject(proj)}>
                        <Settings size={12} /> Configure
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configure Project Modal */}
      <Modal isOpen={selectedProject !== null} onClose={() => setSelectedProject(null)} title={`Configure Project: ${selectedProject?.customerName}`}>
        {selectedProject && (
          <div className="project-config-form">
            {/* Visual Stage Progress */}
            <div className="stage-progress-indicator" style={{ marginBottom: '24px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--primary)', marginBottom: '8px' }}>Project Stage Timeline</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {stages.map(s => {
                  const isCompleted = selectedProject.currentStage >= s.num;
                  return (
                    <span 
                      key={s.num} 
                      style={{ 
                        fontSize: '10px', 
                        padding: '4px 8px', 
                        background: isCompleted ? 'var(--primary)' : 'var(--bg-tertiary)',
                        color: isCompleted ? '#0c120c' : 'var(--text-secondary)',
                        borderRadius: '3px',
                        fontWeight: '600'
                      }}
                    >
                      {s.num}. {s.name}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Advance Stage Form */}
            <div className="form-group">
              <label>Advance Stage Status *</label>
              <select 
                value={selectedProject.currentStage}
                onChange={(e) => handleAdvanceStage(selectedProject, e.target.value)}
                className="form-control"
              >
                {stages.map(s => <option key={s.num} value={s.num}>Stage {s.num}: {s.name}</option>)}
              </select>
            </div>

            {/* Team Allocations */}
            <h4 style={{ fontSize: '13px', color: 'var(--primary)', marginTop: '20px', marginBottom: '10px', textTransform: 'uppercase' }}>Assign Installation Crew</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Civil Foundations Engineer</label>
                <select 
                  className="form-control"
                  value={selectedProject.installationTeam.civilId || ''}
                  onChange={(e) => handleAssignTeam(selectedProject, 'civilId', e.target.value)}
                >
                  <option value="">-- Assign Civil --</option>
                  {db.employees.filter(e => e.role.includes('Civil') || e.role.includes('Manager')).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Fabrication/Structure Lead</label>
                <select 
                  className="form-control"
                  value={selectedProject.installationTeam.fabricationId || ''}
                  onChange={(e) => handleAssignTeam(selectedProject, 'fabricationId', e.target.value)}
                >
                  <option value="">-- Assign Fabrication --</option>
                  {db.employees.filter(e => e.role.includes('Fabrication') || e.role.includes('Manager')).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Electrical Connection Engineer</label>
              <select 
                className="form-control"
                value={selectedProject.installationTeam.electricalId || ''}
                onChange={(e) => handleAssignTeam(selectedProject, 'electricalId', e.target.value)}
              >
                <option value="">-- Assign Electrical --</option>
                {db.employees.filter(e => e.role.includes('Electrical') || e.role.includes('Manager')).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            {/* KSEB Application details */}
            <h4 style={{ fontSize: '13px', color: 'var(--primary)', marginTop: '20px', marginBottom: '10px', textTransform: 'uppercase' }}>KSEB Grid Connectivity Tracking</h4>
            <div className="form-row">
              <div className="form-group">
                <label>KSEB Application Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={selectedProject.ksebApplicationNumber || ''} 
                  onChange={(e) => {
                    const updated = { ...selectedProject, ksebApplicationNumber: e.target.value };
                    saveProject(updated);
                    setSelectedProject(updated);
                    refreshProjects();
                  }}
                />
              </div>

              <div className="form-group">
                <label>Net Meter Grid Status</label>
                <select 
                  className="form-control"
                  value={selectedProject.netMeterStatus}
                  onChange={(e) => {
                    const updated = { ...selectedProject, netMeterStatus: e.target.value };
                    saveProject(updated);
                    setSelectedProject(updated);
                    refreshProjects();
                  }}
                >
                  <option value="Pending Application">Pending Application</option>
                  <option value="Applied - Under Inspection">Applied - Under Inspection</option>
                  <option value="Approved & Installed">Approved & Installed</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={() => setSelectedProject(null)}>
                Close Configuration
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
