// LeadsView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  getLeads, saveLead, deleteLead, logNotification, uploadFileToServer, getUploadUrl, getDb
} from '../db/mockDb';
import { jsPDF } from 'jspdf';
import Modal from '../components/Modal';
import { 
  Search, Plus, FileText, CheckCircle2, ChevronRight, Edit3, Trash2,
  Phone, Mail, MapPin, UploadCloud, Check, UserPlus
} from 'lucide-react';

// Helper to convert image URL to base64
const loadImageAsBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      resolve(null);
    };
  });
};

const getSignatureImage = async (lead) => {
  const sig = lead.documents?.signature;
  if (!sig || !sig.uploaded) return null;
  if (sig.dataUrl) return sig.dataUrl;
  
  const url = getUploadUrl(sig.name);
  try {
    const dataUrl = await loadImageAsBase64(url);
    return dataUrl;
  } catch (e) {
    console.error('Failed to load signature image:', e);
    return null;
  }
};

export default function LeadsView() {
  const [leads, setLeads] = useState(getLeads());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  
  // Modals state
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  
  // Form fields
  const [newLead, setNewLead] = useState({
    name: '', age: '', gender: 'Male', mobile: '', alternateMobile: '',
    email: '', address: '', district: 'Thiruvananthapuram', state: 'Kerala',
    pincode: '', source: 'Website', status: 'New Lead', notes: ''
  });

  // Signature Canvas Ref
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const districts = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 
    'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 
    'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
  ];

  const leadStatuses = [
    'New Lead', 'Contacted', 'Site Visit Scheduled', 'Site Survey Completed',
    'Quotation Sent', 'Negotiation', 'Order Confirmed', 'Installation Pending',
    'Installed', 'Subsidy Pending', 'Completed'
  ];

  const refreshLeads = () => {
    setLeads(getLeads());
  };

  const handleCreateLead = (e) => {
    e.preventDefault();
    const leadId = 'L' + (leads.length + 101);
    const leadData = {
      ...newLead,
      id: leadId,
      createdAt: new Date().toISOString(),
      documents: {
        aadhaar: { name: '', uploaded: false },
        pan: { name: '', uploaded: false },
        electricityBill: { name: '', uploaded: false },
        geotaggedPhotos: { name: '', uploaded: false },
        propertyTax: { name: '', uploaded: false },
        landTax: { name: '', uploaded: false },
        bankPassbook: { name: '', uploaded: false },
        signature: { name: '', uploaded: false }
      }
    };
    saveLead(leadData);
    logNotification({
      recipient: `${leadData.name} (${leadData.mobile})`,
      type: 'SMS',
      text: `Welcome ${leadData.name} to Greenvoltes! We have registered your lead for Solar EPC installations. Reference: ${leadId}`
    });
    setIsNewLeadOpen(false);
    setNewLead({
      name: '', age: '', gender: 'Male', mobile: '', alternateMobile: '',
      email: '', address: '', district: 'Thiruvananthapuram', state: 'Kerala',
      pincode: '', source: 'Website', status: 'New Lead', notes: ''
    });
    refreshLeads();
  };

  const handleUpdateStatus = (lead, nextStatus) => {
    const updated = { ...lead, status: nextStatus };
    saveLead(updated);
    logNotification({
      recipient: `${lead.name} (${lead.mobile})`,
      type: 'WhatsApp',
      text: `Dear ${lead.name}, your solar installation project status has been updated to "${nextStatus}". - Greenvoltes`
    });
    setActiveLead(updated);
    refreshLeads();
  };

  const handleRealUpload = (docKey) => {
    if (!activeLead) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const uploadedData = await uploadFileToServer(file);
        const updatedLead = {
          ...activeLead,
          documents: {
            ...activeLead.documents,
            [docKey]: { 
              name: uploadedData.name, 
              uploaded: true,
              originalName: uploadedData.originalName,
              url: uploadedData.url
            }
          }
        };
        saveLead(updatedLead);
        setActiveLead(updatedLead);
        refreshLeads();
        alert(`Successfully uploaded ${file.name}!`);
      } catch (err) {
        console.error('File upload failed:', err);
        alert('File upload failed. Make sure the backend server is running.');
      }
    };
    input.click();
  };

  // Canvas signature helpers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
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
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
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

  const saveSignature = () => {
    if (!activeLead) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const updatedLead = {
      ...activeLead,
      documents: {
        ...activeLead.documents,
        signature: { name: 'customer_signed_canvas.png', uploaded: true, dataUrl: dataUrl }
      }
    };
    saveLead(updatedLead);
    setActiveLead(updatedLead);
    refreshLeads();
    alert('Customer digital signature saved to DMS successfully!');
  };

  const generateVendorFeasibility = async (lead) => {
    if (!lead) return;
    
    // Look up site survey in the database
    const dbInstance = getDb();
    const survey = dbInstance.surveys?.find(s => s.leadId === lead.id) || null;
    
    const doc = new jsPDF();
    const primaryColor = [11, 15, 23]; // Dark Slate
    const accentColor = [16, 185, 129]; // Emerald Green
    
    // Header banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('GREENVOLTES ENERGY SOLUTIONS LLP', 15, 18);
    
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text('Corporate Solar EPC Partner | Kochi, Kerala | Reg: GV-VEND-KL-021', 15, 26);
    doc.text('PM-Surya Ghar Authorized System Integrator | support@greenvoltes.in', 15, 32);
    
    // Document Title
    doc.setTextColor(...accentColor);
    doc.setFontSize(15);
    doc.setFont('Helvetica', 'bold');
    doc.text('TECHNICAL SURVEY & VENDOR FEASIBILITY CERTIFICATE', 15, 52);
    
    // Horizontal Line
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 56, 195, 56);
    
    // Section: Meta Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Lead ID: ${lead.id}`, 15, 63);
    doc.text(`Certificate Date: ${new Date().toLocaleDateString('en-IN')}`, 15, 69);
    doc.text(`Survey Ref: ${survey ? survey.id : 'GV-FS-MOCK-2026'}`, 140, 63);
    doc.text(`KSEB License: Class A Electrical`, 140, 69);
    
    // Section 1: Customer Details Table
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 76, 180, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('1. CUSTOMER & SITE DETAILS', 18, 81.5);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    let y = 91;
    doc.text(`Full Name:`, 15, y);
    doc.setFont('Helvetica', 'bold');
    doc.text(lead.name, 50, y);
    
    doc.setFont('Helvetica', 'normal');
    y += 7;
    doc.text(`Mobile Number:`, 15, y);
    doc.text(lead.mobile, 50, y);
    
    y += 7;
    doc.text(`Email Address:`, 15, y);
    doc.text(lead.email || 'N/A', 50, y);
    
    y += 7;
    doc.text(`Site Address:`, 15, y);
    const splitAddr = doc.splitTextToSize(`${lead.address}, ${lead.district}, Pin: ${lead.pincode}`, 140);
    doc.text(splitAddr, 50, y);
    
    y += (splitAddr.length * 5) + 3;
    
    // Section 2: Technical Feasibility Parameters
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y, 180, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('2. SITE TECHNICAL PARAMETERS', 18, y + 5.5);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    y += 15;
    doc.text(`Roof Type:`, 15, y);
    doc.text(survey ? survey.roofType : 'Concrete Flat Roof', 75, y);
    
    y += 7;
    doc.text(`Available Roof Area:`, 15, y);
    doc.text(survey ? `${survey.roofArea} Sq.Ft` : '450 Sq.Ft (Standard)', 75, y);
    
    y += 7;
    doc.text(`GPS Coordinates:`, 15, y);
    doc.text(survey ? survey.gpsCoordinates : '9.9312° N, 76.2673° E', 75, y);
    
    y += 7;
    doc.text(`Connected Phase Type:`, 15, y);
    doc.text(survey ? survey.phaseType : 'Single Phase', 75, y);
    
    y += 7;
    doc.text(`Sanctioned Connection Load:`, 15, y);
    doc.text(survey ? `${survey.sanctionedLoad} kW` : '3.0 kW', 75, y);
    
    y += 7;
    doc.text(`Shadow & Obstruction Analysis:`, 15, y);
    doc.text(survey ? (survey.shadowAnalysis || 'Clear Southern Sky') : 'Negligible shadow / Highly feasible', 75, y);
    
    // Section 3: Engineering Conclusion
    y += 12;
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y, 180, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('3. ENGINEERING FEASIBILITY VERIFICATION', 18, y + 5.5);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    y += 15;
    doc.text(`Recommended Capacity:`, 15, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.text(survey ? `${survey.recommendedCapacity} kWp` : '3.0 kWp', 75, y);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('Helvetica', 'normal');
    y += 7;
    doc.text(`Monthly Energy Generation (Est):`, 15, y);
    doc.text(survey ? `~${survey.estGeneration} kWh / Units` : '~360 kWh / Units', 75, y);
    
    y += 7;
    doc.text(`Feasibility Outcome:`, 15, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(22, 163, 74);
    doc.text(`CERTIFIED FEASIBLE`, 75, y);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('Helvetica', 'normal');
    y += 7;
    doc.text(`Remarks:`, 15, y);
    const splitRemarks = doc.splitTextToSize(survey ? (survey.engineerRemarks || 'Site meets all standards.') : 'Roof has excellent solar access. Suitable for standard GI structural rails. Direct grid feed connection recommended.', 120);
    doc.text(splitRemarks, 75, y);
    
    // Signatures
    doc.setFontSize(10);
    y = 240;
    
    // First Party
    doc.setFont('Helvetica', 'bold');
    doc.text('First Party (Consumer Signature)', 15, y);
    doc.setFont('Helvetica', 'normal');
    doc.line(15, y + 16, 75, y + 16);
    
    if (lead.documents.signature.uploaded) {
      const sigDataUrl = lead.documents.signature.dataUrl || (lead.documents.signature.name ? await getSignatureImage(lead) : null);
      if (sigDataUrl) {
        try {
          doc.addImage(sigDataUrl, 'PNG', 18, y + 1, 40, 14);
        } catch (e) {
          console.error('Failed to render signature in PDF:', e);
          doc.text('(Drawn Digitally)', 25, y + 10);
        }
      } else {
        doc.text('(Signed in DMS)', 25, y + 10);
      }
    } else {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('[Awaiting Signature Capture]', 22, y + 10);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
    }
    
    // Vendor
    doc.setFont('Helvetica', 'bold');
    doc.text('For Greenvolt Energy Solutions LLP', 120, y);
    doc.setFont('Helvetica', 'normal');
    doc.line(120, y + 16, 185, y + 16);
    doc.text('Authorized Technical Signatory', 120, y + 21);
    
    doc.setFont('Courier', 'italic');
    doc.setTextColor(...accentColor);
    doc.text('GREENVOLTES SEAL', 130, y + 10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('Helvetica', 'normal');
    
    doc.save(`Feasibility_Report_${lead.id}.pdf`);
  };

  const generateVendorAgreement = async (lead) => {
    if (!lead) return;
    
    // Look up site survey and quotation in the database
    const dbInstance = getDb();
    const survey = dbInstance.surveys?.find(s => s.leadId === lead.id) || null;
    const quote = dbInstance.quotations?.find(q => q.leadId === lead.id && q.status === 'Accepted') || 
                  dbInstance.quotations?.find(q => q.leadId === lead.id) || null;
                  
    const systemSize = quote ? quote.projectSize : (survey ? survey.recommendedCapacity : 3);
    
    // Financials calculation (fallback to default if no quote exists)
    let basePrice = 165000;
    let gstRate = 13.8;
    let gstAmount = 22770;
    let netPrice = 187770;
    let subsidyExpected = 78000;
    let customerShare = 109770;
    
    if (quote) {
      basePrice = quote.basePrice;
      gstRate = quote.gstRate;
      gstAmount = quote.gstAmount;
      netPrice = quote.netPrice;
      subsidyExpected = quote.subsidyExpected;
      customerShare = quote.customerShare;
    } else {
      if (systemSize === 1) {
        basePrice = 65000; gstAmount = 8970; netPrice = 73970; subsidyExpected = 30000; customerShare = 43970;
      } else if (systemSize === 2) {
        basePrice = 115000; gstAmount = 15870; netPrice = 130870; subsidyExpected = 60000; customerShare = 70870;
      } else if (systemSize >= 3) {
        basePrice = systemSize * 55000;
        gstAmount = Math.round(basePrice * 0.138);
        netPrice = basePrice + gstAmount;
        subsidyExpected = 78000;
        customerShare = netPrice - subsidyExpected;
      }
    }
    
    const doc = new jsPDF();
    const primaryColor = [11, 15, 23]; // Dark Slate
    const accentColor = [16, 185, 129]; // Emerald Green
    
    // ==========================================
    // PAGE 1: HEADER & CONTRACT DETAILS
    // ==========================================
    
    // Header banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('GREENVOLTES ENERGY SOLUTIONS LLP', 15, 16);
    
    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.text('Empanelled Solar EPC Vendor | GSTIN: 32AABCDE1234F1Z1 | Reg: GV-VEND-KL-021', 15, 23);
    doc.text('Kochi HO: Kakkanad, Ernakulam, Kerala - 682030 | crm.greenvoltes.in', 15, 28);
    
    // Agreement Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont('Helvetica', 'bold');
    doc.text('AGREEMENT BETWEEN CONSUMER & VENDOR FOR INSTALLATION OF RTS PROJECT', 15, 48);
    doc.setFontSize(10.5);
    doc.setTextColor(...accentColor);
    doc.text('UNDER PM - SURYA GHAR: MUFT BIJLI YOJANA', 15, 53);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 56, 195, 56);
    
    // Section: Agreement Execution Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9.5);
    doc.setFont('Helvetica', 'normal');
    
    const execText = `This agreement is executed on this ${new Date().getDate()} day of ${new Date().toLocaleString('en-IN', { month: 'long' })}, ${new Date().getFullYear()} for the design, supply, installation, testing, commissioning, and 5-year Comprehensive Maintenance Contract (CMC) of a grid-connected rooftop solar (RTS) power plant under the PM-Surya Ghar Scheme.`;
    const splitExec = doc.splitTextToSize(execText, 180);
    doc.text(splitExec, 15, 63);
    
    let y = 63 + (splitExec.length * 5) + 5;
    
    // Part A: First Party (Consumer)
    doc.setFont('Helvetica', 'bold');
    doc.text('BETWEEN (First Party - Consumer):', 15, y);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Name: ${lead.name}`, 15, y + 6);
    doc.text(`Contact: +91-${lead.mobile}`, 15, y + 11);
    
    const clientAddress = `Installation Address: ${lead.address}, ${lead.district}, Pin: ${lead.pincode}, Kerala`;
    const splitAddr = doc.splitTextToSize(clientAddress, 180);
    doc.text(splitAddr, 15, y + 16);
    
    y = y + 16 + (splitAddr.length * 5) + 3;
    
    // Part B: Second Party (Vendor)
    doc.setFont('Helvetica', 'bold');
    doc.text('AND (Second Party - Empanelled Vendor):', 15, y);
    doc.setFont('Helvetica', 'normal');
    doc.text('Company Name: Greenvolt Energy Solutions LLP', 15, y + 6);
    doc.text('Registered Office: Kakkanad, Ernakulam, KL - 682030', 15, y + 11);
    doc.text('Empanelment Reference ID: GV-VEND-KL-021 (Approved by ANERT / MNRE)', 15, y + 16);
    
    y = y + 26;
    
    // Section 1: Scope & Technical Parameters Table
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y, 180, 7, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('1. PROJECT CAPACITY & EQUIPMENT STANDARD', 18, y + 5);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    y += 12;
    doc.text(`RTS Plant Capacity:`, 15, y);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${systemSize} kWp Grid-Tied Solar System`, 75, y);
    
    doc.setFont('Helvetica', 'normal');
    y += 6;
    doc.text(`Solar Modules Brand:`, 15, y);
    doc.text(quote ? quote.panelBrand : 'Waaree (Mono PERC - DCR compliant)', 75, y);
    
    y += 6;
    doc.text(`Grid-tied Inverter Brand:`, 15, y);
    doc.text(quote ? quote.inverterBrand : 'Growatt / Solis (Dual MPPT)', 75, y);
    
    y += 6;
    doc.text(`Mounting Structure:`, 15, y);
    doc.text('Hot-dip Galvanized Iron Structure (Wind-resistant up to 150 km/h)', 75, y);
    
    y += 10;
    
    // Section 2: Financial Terms & Subsidy
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y, 180, 7, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('2. CONTRACT PRICING & SUBSIDY DETAILS', 18, y + 5);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    y += 12;
    doc.text(`Total Base EPC Contract Value:`, 15, y);
    doc.text(`Rs. ${basePrice.toLocaleString('en-IN')}`, 75, y);
    
    y += 6;
    doc.text(`Split GST tax amount (${gstRate}% rate):`, 15, y);
    doc.text(`Rs. ${gstAmount.toLocaleString('en-IN')}`, 75, y);
    
    y += 6;
    doc.text(`Gross Project Billing Value (Contract Price):`, 15, y);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Rs. ${netPrice.toLocaleString('en-IN')}`, 75, y);
    
    doc.setFont('Helvetica', 'normal');
    y += 6;
    doc.text(`Expected Central Government MNRE Subsidy:`, 15, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.text(`- Rs. ${subsidyExpected.toLocaleString('en-IN')}`, 75, y);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('Helvetica', 'normal');
    y += 6;
    doc.text(`Net Consumer Out-of-Pocket Share:`, 15, y);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Rs. ${customerShare.toLocaleString('en-IN')}`, 75, y);
    
    // Footer line for page 1
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text('Page 1 of 2 - Confidentially Executed between Consumer and Greenvoltes', 15, 285);
    
    // ==========================================
    // PAGE 2: OBLIGATIONS & SIGNATURES
    // ==========================================
    doc.addPage();
    doc.setTextColor(0, 0, 0);
    
    // Page 2 header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('GREENVOLTES SOLAR CARE - MODEL CONTRACT', 15, 15);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 17, 195, 17);
    
    y = 25;
    
    // Section 3: First Party Obligations
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y, 180, 7, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('3. FIRST PARTY (CONSUMER) OBLIGATIONS', 18, y + 5);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    y += 11;
    const obligationsFirst = [
      '1. Provide clear and shadow-free roof access to the vendor for structural mounting and panel layout setup.',
      '2. Provide safe, secure dry storage for all plant materials (panels, inverter, structures) delivered to the premises prior to construction.',
      '3. Submit KSEB Net-Metering applications and clear KSEB application fee receipts as required.',
      '4. Disburse milestone payments on time: 50% advance on sign-off, 40% on material delivery, 10% post net-meter grid syncing.'
    ];
    obligationsFirst.forEach(o => {
      doc.text(o, 15, y);
      y += 5.5;
    });
    
    y += 3;
    
    // Section 4: Second Party Obligations
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y, 180, 7, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('4. SECOND PARTY (VENDOR) OBLIGATIONS', 18, y + 5);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    y += 11;
    const obligationsSecond = [
      '1. Complete structural mounting, cable conduits, inverter configuration, and KSEB inspection preparation within 45 days.',
      '2. Ensure all parts used (panels, inverter, protection boxes) comply with MNRE solar standard safety and DCR rules.',
      '3. Provide KSEB Net-Metering inspection coordination and upload completion files to the PM-Surya Ghar national portal.',
      '4. Provide 5 years of free Comprehensive Maintenance Services (including half-yearly checkups and panel cleaning tutorials).'
    ];
    obligationsSecond.forEach(o => {
      doc.text(o, 15, y);
      y += 5.5;
    });
    
    y += 3;
    
    // Section 5: Component Warranty Table
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y, 180, 7, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('5. MANUFACTURER WARRANTY TERMS', 18, y + 5);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    y += 11;
    doc.setFont('Helvetica', 'bold');
    doc.text('Component', 16, y);
    doc.text('Warranty Period', 70, y);
    doc.text('Details', 120, y);
    doc.setFont('Helvetica', 'normal');
    doc.line(15, y + 2, 195, y + 2);
    
    y += 7;
    doc.text('Solar Panels', 16, y);
    doc.text('25 Years', 70, y);
    doc.text('Linear performance output guaranteed above 80% after 25 years.', 120, y);
    
    y += 5.5;
    doc.text('Grid-tied Inverter', 16, y);
    doc.text('5 Years', 70, y);
    doc.text('Comprehensive product replacement warranty against electronic faults.', 120, y);
    
    y += 5.5;
    doc.text('Mounting Structures', 16, y);
    doc.text('10 Years', 70, y);
    doc.text('Structural warranty against corrosion, wind damage, and mechanical failure.', 120, y);
    
    y += 12;
    
    // Section 6: Legal & Dispute Resolution
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y, 180, 7, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('6. GENERAL TERMS & JURISDICTION', 18, y + 5);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    y += 11;
    const splitGeneral = doc.splitTextToSize('This contract is legally binding under the PM-Surya Ghar guidelines. Any disputes arising between the customer and vendor shall first be addressed through mutual discussion, failing which they shall be referred to arbitration in accordance with the Indian Arbitration and Conciliation Act, and subject to the exclusive jurisdiction of the courts at Ernakulam, Kerala.', 180);
    doc.text(splitGeneral, 15, y);
    
    y = 230;
    doc.setFontSize(10);
    
    // Signature lines
    doc.setFont('Helvetica', 'bold');
    doc.text('First Party (Consumer Signature)', 15, y);
    doc.setFont('Helvetica', 'normal');
    doc.line(15, y + 16, 75, y + 16);
    
    if (lead.documents.signature.uploaded) {
      const sigDataUrl = lead.documents.signature.dataUrl || (lead.documents.signature.name ? await getSignatureImage(lead) : null);
      if (sigDataUrl) {
        try {
          doc.addImage(sigDataUrl, 'PNG', 18, y + 1, 40, 14);
        } catch (e) {
          console.error('Failed to render signature in PDF:', e);
          doc.text('(Drawn Digitally)', 25, y + 10);
        }
      } else {
        doc.text('(Signed in DMS)', 25, y + 10);
      }
    } else {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('[Awaiting Signature Capture]', 22, y + 10);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
    }
    
    // Vendor Signature
    doc.setFont('Helvetica', 'bold');
    doc.text('Second Party (For Greenvoltes)', 120, y);
    doc.setFont('Helvetica', 'normal');
    doc.line(120, y + 16, 185, y + 16);
    doc.text('Authorized Commercial Signatory', 120, y + 21);
    
    doc.setFont('Courier', 'italic');
    doc.setTextColor(...accentColor);
    doc.text('GREENVOLTES CONTRACT SEAL', 125, y + 10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('Helvetica', 'normal');
    
    // Page 2 footer
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text('Page 2 of 2 - Confidentially Executed between Consumer and Greenvoltes', 15, 285);
    
    doc.save(`Vendor_Agreement_${lead.id}.pdf`);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      deleteLead(id);
      setActiveLead(null);
      refreshLeads();
    }
  };

  // Filter Leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.mobile.includes(searchTerm) || 
                          lead.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchesDistrict = districtFilter === 'All' || lead.district === districtFilter;
    return matchesSearch && matchesStatus && matchesDistrict;
  });

  return (
    <div className="leads-view">
      <div className="view-header-row">
        <div>
          <h2 className="view-title"><UserPlus className="view-icon-color" /> Leads & Customer CRM</h2>
          <p className="view-subtitle">Monitor inquiries, schedule site surveys, compile KSEB applications, and store KYC files.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNewLeadOpen(true)}>
          <Plus size={16} /> Add New Lead
        </button>
      </div>

      {/* Filters Section */}
      <div className="glass-card filters-card">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by ID, name, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-dropdown">
            <option value="All">All Statuses</option>
            {leadStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className="filter-dropdown">
            <option value="All">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="crm-main-layout">
        {/* Leads Table */}
        <div className="glass-card crm-list-pane">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Lead ID</th>
                  <th>Customer Name</th>
                  <th>Contact</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr 
                    key={lead.id} 
                    className={`lead-row ${activeLead?.id === lead.id ? 'active-lead-row' : ''}`}
                    onClick={() => setActiveLead(lead)}
                  >
                    <td><code>{lead.id}</code></td>
                    <td style={{ fontWeight: '600' }}>{lead.name}</td>
                    <td>{lead.mobile}</td>
                    <td>{lead.district}</td>
                    <td>
                      <span className={`badge badge-${
                        lead.status.includes('Completed') || lead.status === 'Installed' ? 'success' :
                        lead.status.includes('Pending') || lead.status.includes('Scheduled') ? 'pending' :
                        lead.status.includes('Quotation') || lead.status.includes('Confirmed') ? 'info' : 'new'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                        <button className="icon-btn" onClick={() => setActiveLead(lead)} title="View Detail">
                          <ChevronRight size={16} />
                        </button>
                        <button className="icon-btn text-danger-hover" onClick={() => handleDelete(lead.id)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead Details Pane */}
        {activeLead && (
          <div className="glass-card crm-details-pane">
            <div className="pane-header">
              <h3>Lead File: {activeLead.name}</h3>
              <code>ID: {activeLead.id}</code>
            </div>

            <div className="pane-content">
              {/* Core Details */}
              <div className="detail-section">
                <h4>Contact Details</h4>
                <p><Phone size={12} /> {activeLead.mobile} {activeLead.alternateMobile && `/ ${activeLead.alternateMobile}`}</p>
                <p><Mail size={12} /> {activeLead.email || 'No Email Added'}</p>
                <p><MapPin size={12} /> {activeLead.address}, {activeLead.district}, {activeLead.pincode}</p>
                <p><strong>Age:</strong> {activeLead.age} yrs | <strong>Gender:</strong> {activeLead.gender} | <strong>Source:</strong> {activeLead.source}</p>
              </div>

              {/* Status Update Flow */}
              <div className="detail-section">
                <h4>Advance Workflow Status</h4>
                <div className="status-timeline-selector">
                  <select 
                    value={activeLead.status} 
                    onChange={(e) => handleUpdateStatus(activeLead, e.target.value)}
                    className="form-control"
                  >
                    {leadStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Document Checkbox List */}
              <div className="detail-section">
                <h4>KYC & Site Files (Module 1 & 15)</h4>
                <div className="dms-mini-uploader">
                  {Object.keys(activeLead.documents).map(key => {
                    const doc = activeLead.documents[key];
                    return (
                      <div key={key} className="dms-row">
                        <span className="doc-label">{key.toUpperCase().replace('GEOTAGGEDPHOTOS', 'GEOTAG PHOTOS').replace('ELECTRICITYBILL', 'KSEB BILL')}</span>
                        {doc.uploaded ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <span 
                              className="doc-status-ok" 
                              style={{ cursor: 'pointer', textDecoration: 'underline' }} 
                              onClick={() => window.open(getUploadUrl(doc.name), '_blank')} 
                              title="Click to view file"
                            >
                              <Check size={14} /> {doc.name.substring(0, 15)}...
                            </span>
                            <button 
                              className="icon-btn btn-sm" 
                              onClick={() => window.open(getUploadUrl(doc.name), '_blank')} 
                              title="Download document"
                              style={{ border: 'none', padding: '2px', background: 'none' }}
                            >
                              <UploadCloud size={12} style={{ transform: 'rotate(180deg)', color: 'var(--primary)', cursor: 'pointer' }} />
                            </button>
                          </div>
                        ) : (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleRealUpload(key)}>
                            <UploadCloud size={12} /> Upload
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Digital Signature Pad */}
              <div className="detail-section">
                <h4>Customer Consent Signature</h4>
                {activeLead.documents.signature.uploaded ? (
                  <div className="sig-approved">
                    <CheckCircle2 size={16} /> Signature captured and locked in DMS.
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Draw on the black pad below to capture customer digital approval:</p>
                    <div className="signature-pad-container">
                      <canvas 
                        ref={canvasRef} 
                        width={300} 
                        height={150}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <button className="signature-pad-clear" onClick={clearSignature}>Clear</button>
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: '8px' }} onClick={saveSignature}>
                      Save Signature
                    </button>
                  </div>
                )}
              </div>

              {/* Document Generation */}
              <div className="detail-section">
                <h4>Generate Contracts & Reports</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Export official feasibility assessments and consumer-vendor agreements:</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => generateVendorFeasibility(activeLead)} style={{ flex: 1 }}>
                    <FileText size={12} /> Feasibility Report
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => generateVendorAgreement(activeLead)} style={{ flex: 1 }}>
                    <FileText size={12} /> Vendor Agreement
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Lead Modal */}
      <Modal isOpen={isNewLeadOpen} onClose={() => setIsNewLeadOpen(false)} title="Register New Solar Inquiry">
        <form onSubmit={handleCreateLead} className="new-lead-form">
          <div className="form-row">
            <div className="form-group">
              <label>Customer Full Name *</label>
              <input 
                type="text" 
                required 
                className="form-control"
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input 
                type="number" 
                className="form-control"
                value={newLead.age}
                onChange={(e) => setNewLead({ ...newLead, age: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mobile Number *</label>
              <input 
                type="tel" 
                required 
                className="form-control"
                value={newLead.mobile}
                onChange={(e) => setNewLead({ ...newLead, mobile: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Alternate Mobile</label>
              <input 
                type="tel" 
                className="form-control"
                value={newLead.alternateMobile}
                onChange={(e) => setNewLead({ ...newLead, alternateMobile: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email ID</label>
              <input 
                type="email" 
                className="form-control"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select 
                className="form-control"
                value={newLead.gender}
                onChange={(e) => setNewLead({ ...newLead, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Installation Address *</label>
            <textarea 
              required 
              rows={2} 
              className="form-control"
              value={newLead.address}
              onChange={(e) => setNewLead({ ...newLead, address: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>District *</label>
              <select 
                className="form-control"
                value={newLead.district}
                onChange={(e) => setNewLead({ ...newLead, district: e.target.value })}
              >
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Pincode *</label>
              <input 
                type="text" 
                required 
                className="form-control"
                value={newLead.pincode}
                onChange={(e) => setNewLead({ ...newLead, pincode: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Lead Source</label>
              <select 
                className="form-control"
                value={newLead.source}
                onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
              >
                <option value="Facebook">Facebook Ads</option>
                <option value="Website">Website Form</option>
                <option value="Dealer">Dealer Referral</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Walk-in">Walk-in Customer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Initial Status</label>
              <select 
                className="form-control"
                value={newLead.status}
                onChange={(e) => setNewLead({ ...newLead, status: e.target.value })}
              >
                {leadStatuses.slice(0, 3).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Internal Notes / Requirements</label>
            <textarea 
              rows={2} 
              className="form-control"
              value={newLead.notes}
              onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
              placeholder="E.g., Inquired for 3kW Rooftop system under PM Surya Ghar Yojana."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewLeadOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Lead
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        .leads-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .filters-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 16px;
          margin-bottom: 0px;
        }

        @media (max-width: 768px) {
          .filters-card {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .search-box {
          display: flex;
          align-items: center;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          flex: 1;
        }

        .search-icon {
          color: var(--text-muted);
          margin-right: 10px;
        }

        .search-input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          width: 100%;
          font-family: var(--font-primary);
          font-size: 14px;
        }

        .filter-group {
          display: flex;
          gap: 12px;
        }

        .filter-dropdown {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          outline: none;
          font-size: 13px;
          cursor: pointer;
        }

        .crm-main-layout {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 992px) {
          .crm-main-layout {
            grid-template-columns: 1fr;
          }
        }

        .crm-list-pane {
          padding: 0;
          overflow: hidden;
        }

        .lead-row {
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .active-lead-row {
          background-color: rgba(16, 185, 129, 0.08) !important;
          border-left: 3px solid var(--primary);
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color var(--transition-fast), background-color var(--transition-fast);
        }

        .icon-btn:hover {
          color: var(--primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .icon-btn.text-danger-hover:hover {
          color: var(--status-danger);
          background: rgba(239, 68, 68, 0.08);
        }

        .crm-details-pane {
          position: sticky;
          top: 94px;
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
        }

        .pane-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: rgba(27, 35, 54, 0.3);
          border-bottom: 1px solid var(--border-color);
        }

        .pane-header h3 {
          font-size: 16px;
        }

        .pane-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-height: 70vh;
          overflow-y: auto;
        }

        .detail-section {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
        }

        .detail-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .detail-section h4 {
          font-size: 13px;
          color: var(--primary);
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-section p {
          font-size: 13px;
          color: var(--text-primary);
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dms-mini-uploader {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dms-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-tertiary);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 12px;
        }

        .doc-label {
          font-weight: 600;
          color: var(--text-secondary);
        }

        .doc-status-ok {
          color: var(--primary);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .sig-approved {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--primary);
          font-weight: 600;
          font-size: 13px;
          background: rgba(16, 185, 129, 0.05);
          padding: 12px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(16, 185, 129, 0.15);
        }
      `}</style>
    </div>
  );
}
