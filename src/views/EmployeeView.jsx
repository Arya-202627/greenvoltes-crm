// EmployeeView.jsx
import React, { useState, useEffect } from 'react';
import { getDb, saveDb } from '../db/mockDb';
import Modal from '../components/Modal';
import { 
  UserCheck, Users, Plus, CheckCircle, Clock, Calendar, 
  UserX, ClipboardList, Briefcase
} from 'lucide-react';

export default function EmployeeView() {
  const [db, setDb] = useState(getDb());
  const [activeTab, setActiveTab] = useState('directory');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewEmpOpen, setIsNewEmpOpen] = useState(false);

  // New task form
  const [taskForm, setTaskForm] = useState({
    assignedTo: 'EMP003',
    title: '',
    desc: '',
    due: ''
  });

  // New employee form
  const [empForm, setEmpForm] = useState({
    name: '',
    role: 'Sales Executive',
    email: '',
    phone: '',
    attendanceToday: 'Present'
  });

  useEffect(() => {
    setDb(getDb());
  }, []);

  const refreshDb = () => {
    setDb(getDb());
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    const taskId = 'T0' + (db.tasks.length + 1);
    db.tasks.push({
      id: taskId,
      assignedTo: taskForm.assignedTo,
      title: taskForm.title,
      desc: taskForm.desc,
      due: taskForm.due,
      status: 'Pending'
    });
    saveDb(db);
    setIsNewTaskOpen(false);
    setTaskForm({ assignedTo: 'EMP003', title: '', desc: '', due: '' });
    refreshDb();
    alert('Task assigned successfully!');
  };

  const handleCreateEmployee = (e) => {
    e.preventDefault();
    const empId = 'EMP0' + (db.employees.length + 1);
    db.employees.push({
      id: empId,
      ...empForm
    });
    saveDb(db);
    setIsNewEmpOpen(false);
    setEmpForm({ name: '', role: 'Sales Executive', email: '', phone: '', attendanceToday: 'Present' });
    refreshDb();
    alert('Staff profile created successfully!');
  };

  const handleToggleTask = (taskId) => {
    const updated = { ...db };
    const tIdx = updated.tasks.findIndex(t => t.id === taskId);
    if (tIdx !== -1) {
      updated.tasks[tIdx].status = updated.tasks[tIdx].status === 'Pending' ? 'Completed' : 'Pending';
      saveDb(updated);
      refreshDb();
    }
  };

  const handleToggleAttendance = (empId) => {
    const updated = { ...db };
    const eIdx = updated.employees.findIndex(e => e.id === empId);
    if (eIdx !== -1) {
      updated.employees[eIdx].attendanceToday = updated.employees[eIdx].attendanceToday === 'Present' ? 'On Leave' : 'Present';
      saveDb(updated);
      refreshDb();
    }
  };

  return (
    <div className="employee-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><UserCheck className="view-icon-color" /> Employee & Task Management</h2>
          <p className="view-subtitle">Manage engineering crew staff cards, log attendance, assign tasks, and monitor completion status boards.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setIsNewTaskOpen(true)}>
            <ClipboardList size={14} /> Assign Task
          </button>
          <button className="btn btn-primary" onClick={() => setIsNewEmpOpen(true)}>
            <Plus size={14} /> Add Employee
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-container">
        <button className={`tab-btn ${activeTab === 'directory' ? 'active' : ''}`} onClick={() => setActiveTab('directory')}>
          <Users size={14} style={{ display: 'inline', marginRight: '6px' }} /> Staff Directory & Attendance
        </button>
        <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          <Briefcase size={14} style={{ display: 'inline', marginRight: '6px' }} /> Task Boards
        </button>
      </div>

      {/* ---------------- DIRECTORY TAB ---------------- */}
      {activeTab === 'directory' && (
        <div className="glass-card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Staff Profiles & Attendance Registry</h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Designated Role</th>
                  <th>Email ID</th>
                  <th>Phone Number</th>
                  <th>Attendance Status</th>
                  <th>Toggle Check</th>
                </tr>
              </thead>
              <tbody>
                {db.employees.map(emp => (
                  <tr key={emp.id}>
                    <td><code>{emp.id}</code></td>
                    <td style={{ fontWeight: '600' }}>{emp.name}</td>
                    <td>{emp.role}</td>
                    <td>{emp.email}</td>
                    <td>{emp.phone}</td>
                    <td>
                      <span className={`badge ${emp.attendanceToday === 'Present' ? 'badge-success' : 'badge-danger'}`}>
                        {emp.attendanceToday}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleToggleAttendance(emp.id)}>
                        Toggle Attendance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- TASKS TAB ---------------- */}
      {activeTab === 'tasks' && (
        <div className="glass-card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>EPC Task Assignments & Reminders</h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Assigned Crew</th>
                  <th>Task Title</th>
                  <th>Instruction Details</th>
                  <th>Due Date</th>
                  <th>Work Status</th>
                  <th>Mark Action</th>
                </tr>
              </thead>
              <tbody>
                {db.tasks.map(t => {
                  const emp = db.employees.find(e => e.id === t.assignedTo);
                  return (
                    <tr key={t.id}>
                      <td><code>{t.id}</code></td>
                      <td style={{ fontWeight: '600' }}>{emp ? emp.name : 'Unknown Staff'}</td>
                      <td style={{ fontWeight: '600' }}>{t.title}</td>
                      <td>{t.desc}</td>
                      <td>{t.due}</td>
                      <td>
                        <span className={`badge ${t.status === 'Completed' ? 'badge-success' : 'badge-pending'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => handleToggleTask(t.id)}
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      <Modal isOpen={isNewTaskOpen} onClose={() => setIsNewTaskOpen(false)} title="Assign New Task">
        <form onSubmit={handleCreateTask}>
          <div className="form-group">
            <label>Select Staff Member *</label>
            <select 
              className="form-control"
              value={taskForm.assignedTo}
              onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
            >
              {db.employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Task Title *</label>
            <input 
              type="text" 
              required
              className="form-control"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="E.g., Complete Shadow Analysis"
            />
          </div>

          <div className="form-group">
            <label>Instruction Description</label>
            <textarea 
              rows={3}
              className="form-control"
              value={taskForm.desc}
              onChange={(e) => setTaskForm({ ...taskForm, desc: e.target.value })}
              placeholder="E.g., Visit client site to analyze surrounding trees and check KSEB meter location details."
            />
          </div>

          <div className="form-group">
            <label>Due Date *</label>
            <input 
              type="date" 
              required
              className="form-control"
              value={taskForm.due}
              onChange={(e) => setTaskForm({ ...taskForm, due: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewTaskOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Assign Task
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Employee Modal */}
      <Modal isOpen={isNewEmpOpen} onClose={() => setIsNewEmpOpen(false)} title="Add New Employee Profile">
        <form onSubmit={handleCreateEmployee}>
          <div className="form-group">
            <label>Full Name *</label>
            <input 
              type="text" 
              required
              className="form-control"
              value={empForm.name}
              onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Designated Role</label>
              <select 
                className="form-control"
                value={empForm.role}
                onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
              >
                <option value="Sales Manager">Sales Manager</option>
                <option value="Sales Executive">Sales Executive</option>
                <option value="Site Survey Engineer">Site Survey Engineer</option>
                <option value="Design Engineer">Design Engineer</option>
                <option value="Procurement Manager">Procurement Manager</option>
                <option value="Store Manager">Store Manager</option>
                <option value="MNRE Executive">MNRE Executive</option>
                <option value="Loan Executive">Loan Executive</option>
                <option value="Accounts Executive">Accounts Executive</option>
                <option value="Service Engineer">Service Engineer</option>
                <option value="Installation Team (Civil)">Installation Team (Civil)</option>
                <option value="Installation Team (Fabrication)">Installation Team (Fabrication)</option>
                <option value="Installation Team (Electrical)">Installation Team (Electrical)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input 
                type="tel" 
                required
                className="form-control"
                value={empForm.phone}
                onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email ID *</label>
            <input 
              type="email" 
              required
              className="form-control"
              value={empForm.email}
              onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewEmpOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
