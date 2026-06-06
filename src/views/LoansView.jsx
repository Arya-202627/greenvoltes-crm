// LoansView.jsx
import React, { useState, useEffect } from 'react';
import { getDb, saveDb, getCollection } from '../db/mockDb';
import { Banknote, Calculator, FileCheck, CheckSquare, RefreshCw } from 'lucide-react';

export default function LoansView() {
  const [db, setDb] = useState(getDb());
  const [loanApplications, setLoanApplications] = useState(db.loans);

  // EMI Calculator State
  const [calcAmount, setCalcAmount] = useState(150000);
  const [calcRate, setCalcRate] = useState(8.5); // SBI rate
  const [calcTenure, setCalcTenure] = useState(5); // Years
  const [emiResult, setEmiResult] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);

  useEffect(() => {
    setDb(getDb());
    setLoanApplications(db.loans);
    calculateEMI();
  }, []);

  const refreshLoans = () => {
    const fresh = getDb();
    setDb(fresh);
    setLoanApplications(fresh.loans);
  };

  const handleUpdateLoanStage = (loanId, nextStage) => {
    const updated = { ...db };
    const idx = updated.loans.findIndex(l => l.id === loanId);
    if (idx !== -1) {
      updated.loans[idx].stage = nextStage;
      updated.loans[idx].updatedAt = new Date().toISOString();

      // If disbursed, create a finance transaction
      if (nextStage === 'Disbursed') {
        const loan = updated.loans[idx];
        const lead = updated.leads.find(l => l.id === loan.leadId);
        updated.finance.push({
          id: 'F' + (updated.finance.length + 101),
          description: `SBI Loan Disbursal for ${lead ? lead.name : 'Customer'}`,
          type: 'Receivable (In)',
          amount: loan.loanAmount,
          projectSize: 0,
          date: new Date().toISOString().split('T')[0],
          gst: 0,
          zohoSynced: false
        });
      }

      saveDb(updated);
      refreshLoans();
      alert(`Loan application stage updated to "${nextStage}".`);
    }
  };

  // EMI formula: [P x R x (1+R)^N]/[((1+R)^N)-1]
  const calculateEMI = () => {
    const principal = parseFloat(calcAmount);
    const monthlyRate = parseFloat(calcRate) / 12 / 100;
    const totalMonths = parseInt(calcTenure) * 12;

    if (principal > 0 && monthlyRate > 0 && totalMonths > 0) {
      const emiVal = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
      const totalPayableVal = emiVal * totalMonths;
      setEmiResult(Math.round(emiVal));
      setTotalInterest(Math.round(totalPayableVal - principal));
    }
  };

  return (
    <div className="loans-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><Banknote className="view-icon-color" /> Customer Loan Processing</h2>
          <p className="view-subtitle">Monitor solar bank loan approvals, file sanction letters, review EMIs, and process NBFC disbursals.</p>
        </div>
      </div>

      <div className="crm-main-layout">
        {/* Applications registry */}
        <div className="glass-card crm-list-pane">
          <h3 className="card-title" style={{ marginBottom: '16px', padding: '16px' }}>Financing Registry</h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Lead ID</th>
                  <th>NBFC Bank Option</th>
                  <th>Disbursal Amount</th>
                  <th>Interest Rate</th>
                  <th>Monthly EMI</th>
                  <th>Approval Stage</th>
                  <th>Disbursal Sync</th>
                </tr>
              </thead>
              <tbody>
                {loanApplications.map(loan => (
                  <tr key={loan.id}>
                    <td><code>{loan.id}</code></td>
                    <td><code>{loan.leadId}</code></td>
                    <td style={{ fontWeight: '600' }}>{loan.bankName}</td>
                    <td>₹{loan.loanAmount.toLocaleString('en-IN')}</td>
                    <td>{loan.interestRate}%</td>
                    <td>₹{loan.emiAmount.toLocaleString('en-IN')}/mo</td>
                    <td>
                      <select 
                        value={loan.stage} 
                        onChange={(e) => handleUpdateLoanStage(loan.id, e.target.value)}
                        className="form-control btn-sm"
                        style={{ width: '130px', padding: '4px' }}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Approved">Approved</option>
                        <option value="Sanctioned">Sanctioned</option>
                        <option value="Disbursed">Disbursed</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge badge-${loan.stage === 'Disbursed' ? 'success' : 'pending'}`}>
                        {loan.stage === 'Disbursed' ? 'Funds Cleared' : 'Pending Disbursal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* EMI Interest Calculator */}
        <div className="glass-card">
          <div className="calculator-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Calculator className="view-icon-color" />
            <h3 className="card-title">Solar EMI Quote Calculator</h3>
          </div>

          <div className="calculator-body">
            <div className="form-group">
              <label>Select Loan Principal (INR) *</label>
              <input 
                type="number" 
                className="form-control" 
                value={calcAmount} 
                onChange={(e) => { setCalcAmount(e.target.value); }}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Annual Interest Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="form-control" 
                  value={calcRate} 
                  onChange={(e) => { setCalcRate(e.target.value); }}
                />
              </div>
              <div className="form-group">
                <label>Tenure (Years)</label>
                <select 
                  className="form-control" 
                  value={calcTenure} 
                  onChange={(e) => { setCalcTenure(e.target.value); }}
                >
                  <option value={3}>3 Years</option>
                  <option value={5}>5 Years (Recommended)</option>
                  <option value={7}>7 Years</option>
                </select>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} onClick={calculateEMI}>
              <RefreshCw size={14} /> Calculate EMI Schedule
            </button>

            {/* Calculations results */}
            <div className="calculator-results" style={{ marginTop: '20px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Calculated Monthly EMI:</span>
                <strong style={{ fontSize: '16px', color: 'var(--primary)' }}>₹{emiResult.toLocaleString('en-IN')} / mo</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Interest Payable:</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>₹{totalInterest.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Total Principal + Interest:</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>₹{(Number(calcAmount) + Number(totalInterest)).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
