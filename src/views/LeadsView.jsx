// LeadsView.jsx
import React, { useState, useEffect } from 'react';
import { 
  getLeads, saveLead, deleteLead, logNotification, uploadFileToServer, getUploadUrl, getDb, saveDb
} from '../db/mockDb';
import { PDFDocument, rgb } from 'pdf-lib';
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

export default function LeadsView({ userRole, currentUser }) {
  const [leads, setLeads] = useState(getLeads());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [dealerFilter, setDealerFilter] = useState('All');
  
  // Modals state
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  
  // Form fields
  const [newLead, setNewLead] = useState({
    name: '', age: '', gender: 'Male', mobile: '', alternateMobile: '',
    email: '', address: '', district: 'Thiruvananthapuram', state: 'Kerala',
    pincode: '', source: 'Website', status: 'New Lead', notes: ''
  });

  const db = getDb();
  const dealers = db.dealers || [];

  const myEmployee = dealers.find(d => 
    d.email?.toLowerCase() === currentUser?.email?.toLowerCase() || 
    d.id === currentUser?.dealerId || 
    d.id === currentUser?.employeeId || 
    d.contactPerson?.toLowerCase() === currentUser?.name?.toLowerCase() || 
    d.email?.toLowerCase() === currentUser?.id?.toLowerCase()
  );

  const getEmployeeName = (lead) => {
    if (lead.dealerId) {
      const dealer = dealers.find(d => d.id === lead.dealerId);
      return dealer ? (dealer.contactPerson || dealer.name) : `Employee (${lead.dealerId})`;
    }
    return lead.source || 'Direct';
  };



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
    const rawLeads = getLeads();
    const leadId = 'L' + (rawLeads.length + 101);
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

    if (userRole === 'Employee' && myEmployee) {
      leadData.source = 'Employee';
      leadData.dealerId = myEmployee.id;
      leadData.district = myEmployee.district;
      leadData.state = myEmployee.state;
      leadData.notes = `Registered by employee ${myEmployee.name}. ${newLead.notes || ''}`;

      // Update employee sales count and commission
      const fullDb = getDb();
      const dIdx = fullDb.dealers.findIndex(d => d.id === myEmployee.id);
      if (dIdx !== -1) {
        fullDb.dealers[dIdx].salesCount += 1;
        fullDb.dealers[dIdx].earnings += 15000;
        saveDb(fullDb);
      }
    }

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

  const handleDeleteDocument = (docKey) => {
    if (!activeLead) return;
    if (confirm('Are you sure you want to delete this document?')) {
      const updatedLead = {
        ...activeLead,
        documents: {
          ...activeLead.documents,
          [docKey]: { 
            uploaded: false,
            name: '',
            originalName: '',
            url: '',
            uploadedAt: null,
            dataUrl: ''
          }
        }
      };
      saveLead(updatedLead);
      setActiveLead(updatedLead);
      refreshLeads();
    }
  };

  const handleUpdateCustomField = (key, value) => {
    if (!activeLead) return;
    const updatedLead = {
      ...activeLead,
      [key]: value
    };
    saveLead(updatedLead);
    setActiveLead(updatedLead);
    refreshLeads();
  };

  const generateVendorFeasibility = async (lead) => {
    if (!lead) return;
    try {
      // Fetch existing PDF template
      const response = await fetch('/Vendor Feasibility_model.pdf');
      if (!response.ok) throw new Error('Failed to fetch Vendor Feasibility template PDF.');
      const existingPdfBytes = await response.arrayBuffer();

      // Load PDF document
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Draw white rectangles to cover previous text
      // Name coordinates (bottom-left origin): X=304, Y=672, W=250, H=16
      firstPage.drawRectangle({
        x: 304,
        y: 672,
        width: 250,
        height: 16,
        color: rgb(1, 1, 1),
      });
      // Consumer ID coordinates: X=304, Y=647, W=250, H=16
      firstPage.drawRectangle({
        x: 304,
        y: 647,
        width: 250,
        height: 16,
        color: rgb(1, 1, 1),
      });
      // Address coordinates: X=304, Y=542, W=250, H=16
      firstPage.drawRectangle({
        x: 304,
        y: 542,
        width: 250,
        height: 16,
        color: rgb(1, 1, 1),
      });
      // District coordinates: X=304, Y=513, W=250, H=16
      firstPage.drawRectangle({
        x: 304,
        y: 513,
        width: 250,
        height: 16,
        color: rgb(1, 1, 1),
      });
      // Pincode coordinates: X=304, Y=464, W=250, H=16
      firstPage.drawRectangle({
        x: 304,
        y: 464,
        width: 250,
        height: 16,
        color: rgb(1, 1, 1),
      });

      // Jan Samarth ID coordinates: X=304, Y=564, W=250, H=16
      firstPage.drawRectangle({
        x: 304,
        y: 564,
        width: 250,
        height: 16,
        color: rgb(1, 1, 1),
      });

      // RTS Applied coordinates: X=304, Y=307, W=100, H=18
      firstPage.drawRectangle({
        x: 304,
        y: 307,
        width: 100,
        height: 18,
        color: rgb(1, 1, 1),
      });

      // RTS Installed coordinates: X=304, Y=277, W=100, H=18
      firstPage.drawRectangle({
        x: 304,
        y: 277,
        width: 100,
        height: 18,
        color: rgb(1, 1, 1),
      });

      // Cover stray pre-printed 2,25,000/- at Point 17: X=304, Y=224, W=150, H=16
      firstPage.drawRectangle({
        x: 304,
        y: 224,
        width: 150,
        height: 16,
        color: rgb(1, 1, 1),
      });

      // Project Cost coordinates: X=304, Y=210, W=150, H=16
      firstPage.drawRectangle({
        x: 304,
        y: 210,
        width: 150,
        height: 16,
        color: rgb(1, 1, 1),
      });

      // Embed Helvetica font
      const helveticaFont = await pdfDoc.embedFont('Helvetica');

      // Draw new text values
      firstPage.drawText(lead.name || '', {
        x: 306,
        y: 675,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(lead.consumerNumber || lead.id || '1234567890123', {
        x: 306,
        y: 650,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(lead.address || '', {
        x: 306,
        y: 544,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText((lead.district || '').toUpperCase(), {
        x: 306,
        y: 517,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(lead.pincode || '', {
        x: 308,
        y: 468,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      const janSamarthId = lead.janSamarthSuffix ? `ANS-SOLAR-${lead.janSamarthSuffix.trim()}` : 'ANS-SOLAR-13044028-3667576';
      
      const formatCapacity = (val) => {
        if (val === undefined || val === null || val === '') return '3kw';
        const clean = val.toString().trim().toLowerCase();
        if (clean.endsWith('kw')) return clean;
        return clean + 'kw';
      };

      const appliedCapacity = formatCapacity(lead.appliedCapacity);
      const installedCapacity = formatCapacity(lead.installedCapacity);
      const projectCostVal = lead.projectCost !== undefined ? lead.projectCost : '2,25,000/-';

      firstPage.drawText(janSamarthId, {
        x: 306,
        y: 569,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(appliedCapacity, {
        x: 306,
        y: 315,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(installedCapacity, {
        x: 306,
        y: 285,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(projectCostVal, {
        x: 306,
        y: 215,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      // Serialize the PDFDocument to bytes (a Uint8Array)
      const pdfBytes = await pdfDoc.save();

      // Download the PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Feasibility_Report_${lead.id}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error generating feasibility PDF:', error);
      alert('Error generating feasibility PDF: ' + error.message);
    }
  };

  const generateVendorAgreement = async (lead) => {
    if (!lead) return;
    try {
      // Fetch existing PDF template
      const response = await fetch('/Vendor Agreement Letter Head.pdf');
      if (!response.ok) throw new Error('Failed to fetch Vendor Agreement template PDF.');
      const existingPdfBytes = await response.arrayBuffer();

      // Load PDF document
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const fourthPage = pages[3];

      const helveticaFont = await pdfDoc.embedFont('Helvetica');
      const helveticaBoldFont = await pdfDoc.embedFont('Helvetica-Bold');

      // Date calculations
      const date = new Date();
      const daySuffix = (d) => {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
          case 1: return 'st';
          case 2: return 'nd';
          case 3: return 'rd';
          default: return 'th';
        }
      };
      const dayStr = `${date.getDate()}${daySuffix(date.getDate())}`;
      const monthStr = date.toLocaleString('en-US', { month: 'long' });
      const yearStr = 'Six'; // Since the template has "Two Thousand Twenty", we write "Six" to make it "Two Thousand Twenty Six"

      // Write Date on Page 1
      // Date line 1: dayStr at X=272, Y=615. monthStr at X=362, Y=615
      firstPage.drawText(dayStr, {
        x: 272,
        y: 615,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      firstPage.drawText(monthStr, {
        x: 362,
        y: 615,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      // Date line 2: yearStr at X=190, Y=595
      firstPage.drawText(yearStr, {
        x: 190,
        y: 595,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      // Helper function to wrap text by character count
      const wrapText = (text, maxChars) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
          if ((currentLine + ' ' + word).trim().length <= maxChars) {
            currentLine = (currentLine + ' ' + word).trim();
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        });
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      // Helper function to generate deduplicated address lines
      const getCleanAddressLines = (lead, maxChars) => {
        const addressStr = (lead.address || '').trim();
        const districtStr = (lead.district || '').trim();
        const pincodeStr = (lead.pincode || '').trim();
        
        let unified = addressStr;
        
        if (districtStr && !addressStr.toLowerCase().includes(districtStr.toLowerCase())) {
          unified += `, ${districtStr}`;
        }
        
        if (!addressStr.toLowerCase().includes('kerala')) {
          unified += `, KERALA`;
        }
        
        if (pincodeStr && !addressStr.includes(pincodeStr)) {
          unified += `, PIN - ${pincodeStr}`;
        }
        
        unified = unified.replace(/,+/g, ',').replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
        return wrapText(unified, maxChars);
      };

      // Helper function to make signature background transparent
      const makeSignatureTransparent = (dataUrl) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = dataUrl;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            const width = canvas.width;
            const height = canvas.height;
            
            // First pass: find min and max luminance to calculate a dynamic threshold
            let minLuminance = 255;
            let maxLuminance = 0;
            
            for (let i = 0; i < data.length; i += 4) {
              const a = data[i+3];
              if (a < 50) continue; // Skip transparent pixels
              
              const r = data[i];
              const g = data[i+1];
              const b = data[i+2];
              const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
              
              if (luminance < minLuminance) minLuminance = luminance;
              if (luminance > maxLuminance) maxLuminance = luminance;
            }
            
            // Set dynamic threshold at 65% of contrast range
            const threshold = minLuminance + (maxLuminance - minLuminance) * 0.65;
            
            // Second pass: isolate ink pixels and track signature bounding box bounds
            let minX = width;
            let minY = height;
            let maxX = 0;
            let maxY = 0;
            
            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                const a = data[i+3];
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                
                // If pixel is transparent or light background paper, treat as background
                if (a < 50 || luminance > threshold) {
                  data[i+3] = 0; // Make transparent
                } else {
                  // Sharpen contrast for darker ink pixels
                  data[i] = Math.max(0, r - 40);
                  data[i+1] = Math.max(0, g - 40);
                  data[i+2] = Math.max(0, b - 40);
                  
                  // Expand bounding box to fit the signature strokes
                  if (x < minX) minX = x;
                  if (y < minY) minY = y;
                  if (x > maxX) maxX = x;
                  if (y > maxY) maxY = y;
                }
              }
            }
            
            ctx.putImageData(imgData, 0, 0);
            
            // If signature content was found, crop the empty borders
            if (maxX > minX && maxY > minY) {
              const padding = 6; // Add a small padding to prevent clipping edges
              const cropX = Math.max(0, minX - padding);
              const cropY = Math.max(0, minY - padding);
              const cropW = Math.min(width - cropX, (maxX - minX) + padding * 2);
              const cropH = Math.min(height - cropY, (maxY - minY) + padding * 2);
              
              const cropCanvas = document.createElement('canvas');
              cropCanvas.width = cropW;
              cropCanvas.height = cropH;
              const cropCtx = cropCanvas.getContext('2d');
              
              // Draw the cropped region from original canvas to the cropped canvas
              cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
              resolve(cropCanvas.toDataURL('image/png'));
            } else {
              resolve(canvas.toDataURL('image/png'));
            }
          };
          img.onerror = () => {
            resolve(dataUrl);
          };
        });
      };

      // Write Customer Name at X=80, Y=536
      firstPage.drawText((lead.name || '').toUpperCase(), {
        x: 80,
        y: 536,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      // Write Address on Page 1
      const addrLinesPage1 = getCleanAddressLines(lead, 35);
      const addrLine1 = addrLinesPage1[0] || '';
      const addrLine2 = addrLinesPage1.slice(1).join(' ') || '';

      firstPage.drawText(addrLine1.toUpperCase(), {
        x: 285,
        y: 536,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      firstPage.drawText(addrLine2.toUpperCase(), {
        x: 80,
        y: 519,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      // Format and Print Customer Name and Address inside the Page 4 box
      const addrLinesPage4 = getCleanAddressLines(lead, 38);
      const addr4Line1 = addrLinesPage4[0] || '';
      const addr4Line2 = addrLinesPage4[1] || '';
      const addr4Line3 = addrLinesPage4[2] || '';

      fourthPage.drawText((lead.name || '').toUpperCase(), {
        x: 85,
        y: 334,
        size: 9,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0),
      });
      if (addr4Line1) {
        fourthPage.drawText(addr4Line1.toUpperCase(), {
          x: 85,
          y: 318,
          size: 9,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }
      if (addr4Line2) {
        fourthPage.drawText(addr4Line2.toUpperCase(), {
          x: 85,
          y: 301,
          size: 9,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }
      if (addr4Line3) {
        fourthPage.drawText(addr4Line3.toUpperCase(), {
          x: 85,
          y: 285,
          size: 9,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }

      // Draw Customer Signature on Page 4 if uploaded
      if (lead.documents && lead.documents.signature && lead.documents.signature.uploaded) {
        let sigDataUrl = lead.documents.signature.dataUrl;
        if (!sigDataUrl && lead.documents.signature.name) {
          sigDataUrl = await getSignatureImage(lead);
        }
        if (sigDataUrl) {
          try {
            const transparentSigDataUrl = await makeSignatureTransparent(sigDataUrl);
            const signatureBase64 = transparentSigDataUrl.split(',')[1];
            const signatureBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
            const pngImage = await pdfDoc.embedPng(signatureBytes);

            // Draw signature image above "Please Sign Above" (X=85, Y=382, W=80, H=30)
            fourthPage.drawImage(pngImage, {
              x: 85,
              y: 382,
              width: 80,
              height: 30,
            });

            // Draw signature image on Page 1, 2, and 3 footers
            for (let i = 0; i < 3; i++) {
              pages[i].drawImage(pngImage, {
                x: 60,
                y: 92,
                width: 65,
                height: 22,
              });
            }
          } catch (e) {
            console.error('Failed to render signature in PDF:', e);
            fourthPage.drawText('(Signed Digitally)', {
              x: 90,
              y: 405,
              size: 8,
              font: helveticaFont,
              color: rgb(0.5, 0.5, 0.5),
            });
          }
        }
      } else {
        fourthPage.drawText('[Awaiting Signature Capture]', {
          x: 85,
          y: 405,
          size: 8,
          font: helveticaFont,
          color: rgb(0.6, 0.6, 0.6),
        });
      }

      // Serialize the PDFDocument to bytes (a Uint8Array)
      const pdfBytes = await pdfDoc.save();

      // Download the PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Vendor_Agreement_${lead.id}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error generating agreement PDF:', error);
      alert('Error generating agreement PDF: ' + error.message);
    }
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
    // Role-based visibility isolation:
    if (userRole === 'Employee' && myEmployee) {
      if (lead.dealerId !== myEmployee.id) return false;
    }

    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.mobile.includes(searchTerm) || 
                          lead.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchesDistrict = districtFilter === 'All' || lead.district === districtFilter;
    
    // Employee/Source filter for Admin/Office Staff
    const matchesDealer = dealerFilter === 'All' || 
                          (dealerFilter === 'Direct' && !lead.dealerId) || 
                          lead.dealerId === dealerFilter;
                          
    return matchesSearch && matchesStatus && matchesDistrict && matchesDealer;
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
          {userRole !== 'Employee' && (
            <select value={dealerFilter} onChange={(e) => setDealerFilter(e.target.value)} className="filter-dropdown">
              <option value="All">All Employees / Sources</option>
              <option value="Direct">Direct (No Employee)</option>
              {dealers.map(d => (
                <option key={d.id} value={d.id}>{d.contactPerson || d.name}</option>
              ))}
            </select>
          )}
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
                  {userRole !== 'Employee' && <th>Employee / Source</th>}
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
                    {userRole !== 'Employee' && <td>{getEmployeeName(lead)}</td>}
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
                <p><strong>Age:</strong> {activeLead.age} yrs | <strong>Gender:</strong> {activeLead.gender} | <strong>Source:</strong> {activeLead.source} {activeLead.dealerId && `(${getEmployeeName(activeLead)})`}</p>
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
                        <span className="doc-label">
                          {key.toUpperCase()
                            .replace('GEOTAGGEDPHOTOS', 'GEOTAG PHOTOS')
                            .replace('ELECTRICITYBILL', 'KSEB BILL')
                            .replace('PROPERTYTAX', 'PROPERTY TAX')
                            .replace('LANDTAX', 'LAND TAX')
                            .replace('BANKPASSBOOK', 'BANK PASSBOOK')
                            .replace('SIGNATURE', 'CUSTOMER SIGNATURE')}
                        </span>
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
                            <button 
                              className="icon-btn btn-sm" 
                              onClick={() => handleDeleteDocument(key)} 
                              title="Delete document"
                              style={{ border: 'none', padding: '2px', background: 'none' }}
                            >
                              <Trash2 size={12} style={{ color: '#ef4444', cursor: 'pointer' }} />
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



              {/* Feasibility Settings */}
              <div className="detail-section">
                <h4>Feasibility Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '500', minWidth: '130px' }}>Jan Samarth ID:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>ANS-SOLAR-</span>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ flex: 1, padding: '3px 6px', fontSize: '12px', height: 'auto' }}
                      value={activeLead.janSamarthSuffix || ''} 
                      placeholder="e.g. 13044028-3667576"
                      onChange={(e) => handleUpdateCustomField('janSamarthSuffix', e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '500', minWidth: '130px' }}>Applied Capacity (kW):</span>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ flex: 1, padding: '3px 6px', fontSize: '12px', height: 'auto' }}
                      value={activeLead.appliedCapacity !== undefined ? activeLead.appliedCapacity : '3'} 
                      placeholder="e.g. 3"
                      onChange={(e) => handleUpdateCustomField('appliedCapacity', e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '500', minWidth: '130px' }}>Installed Capacity (kW):</span>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ flex: 1, padding: '3px 6px', fontSize: '12px', height: 'auto' }}
                      value={activeLead.installedCapacity !== undefined ? activeLead.installedCapacity : '3'} 
                      placeholder="e.g. 3"
                      onChange={(e) => handleUpdateCustomField('installedCapacity', e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '500', minWidth: '130px' }}>Project Cost (Rs.):</span>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ flex: 1, padding: '3px 6px', fontSize: '12px', height: 'auto' }}
                      value={activeLead.projectCost !== undefined ? activeLead.projectCost : '2,25,000/-'} 
                      placeholder="e.g. 2,25,000/-"
                      onChange={(e) => handleUpdateCustomField('projectCost', e.target.value)}
                    />
                  </div>
                </div>
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
