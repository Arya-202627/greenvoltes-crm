// mockDb.js
// A synchronized database engine representing a Node.js + Express client
// It caches database contents locally and syncs them automatically to the SQLite server.

const API_BASE = window.location.port === '5173'
  ? `http://${window.location.hostname}:5001/api`
  : `/api`;

export function getUploadUrl(filename) {
  if (!filename) return '#';
  if (window.location.port === '5173') {
    return `http://${window.location.hostname}:5001/uploads/${filename}`;
  }
  return `/uploads/${filename}`;
}

const defaultData = {
  leads: [
    {
      id: 'L001',
      name: 'Ramesh Nair',
      age: 52,
      gender: 'Male',
      mobile: '9845612301',
      alternateMobile: '9447812301',
      email: 'ramesh.nair@gmail.com',
      address: 'Nair Villa, Kowdiar',
      district: 'Thiruvananthapuram',
      state: 'Kerala',
      pincode: '695003',
      source: 'Facebook',
      status: 'Site Survey Completed',
      documents: {
        aadhaar: { name: 'aadhaar_ramesh.pdf', uploaded: true },
        pan: { name: 'pan_ramesh.pdf', uploaded: true },
        electricityBill: { name: 'kseb_bill_ramesh.pdf', uploaded: true },
        geotaggedPhotos: { name: 'site_photo_1.jpg', uploaded: true },
        propertyTax: { name: '', uploaded: false },
        landTax: { name: '', uploaded: false },
        bankPassbook: { name: 'passbook_ramesh.pdf', uploaded: true },
        signature: { name: 'signature_ramesh.png', uploaded: true }
      },
      createdAt: '2026-05-15T10:00:00Z',
      notes: 'Customer wants a 3kW system. Eligible for subsidy.'
    },
    {
      id: 'L002',
      name: 'Anjali Menon',
      age: 41,
      gender: 'Female',
      mobile: '9895123456',
      alternateMobile: '',
      email: 'anjali.menon@yahoo.com',
      address: 'Menon Enclave, Kakkanad',
      district: 'Ernakulam',
      state: 'Kerala',
      pincode: '682030',
      source: 'Website',
      status: 'Quotation Sent',
      documents: {
        aadhaar: { name: 'aadhaar_anjali.pdf', uploaded: true },
        pan: { name: '', uploaded: false },
        electricityBill: { name: 'kseb_bill_anjali.pdf', uploaded: true },
        geotaggedPhotos: { name: 'site_survey_anjali.jpg', uploaded: true },
        propertyTax: { name: 'prop_tax_anjali.pdf', uploaded: true },
        landTax: { name: 'land_tax_anjali.pdf', uploaded: true },
        bankPassbook: { name: '', uploaded: false },
        signature: { name: '', uploaded: false }
      },
      createdAt: '2026-05-18T14:30:00Z',
      notes: 'Requires 5kW system. Inquired about solar loans.'
    },
    {
      id: 'L003',
      name: 'George Joseph',
      age: 68,
      gender: 'Male',
      mobile: '9447123456',
      alternateMobile: '9447987654',
      email: 'george.j@hotmail.com',
      address: 'Kanjikuzhy House',
      district: 'Kottayam',
      state: 'Kerala',
      pincode: '686004',
      source: 'Dealer',
      dealerId: 'GVES-DLR-001',
      status: 'Order Confirmed',
      documents: {
        aadhaar: { name: 'aadhaar_george.pdf', uploaded: true },
        pan: { name: 'pan_george.pdf', uploaded: true },
        electricityBill: { name: 'kseb_george.pdf', uploaded: true },
        geotaggedPhotos: { name: 'roof_george.jpg', uploaded: true },
        propertyTax: { name: 'tax_receipt_george.pdf', uploaded: true },
        landTax: { name: 'land_receipt_george.pdf', uploaded: true },
        bankPassbook: { name: 'bank_george.pdf', uploaded: true },
        signature: { name: 'sig_george.png', uploaded: true }
      },
      coApplicant: {
        name: 'Thomas George',
        mobile: '9447556677',
        relationship: 'Son'
      },
      createdAt: '2026-05-20T09:15:00Z',
      notes: 'Co-applicant details added as customer is above 65.'
    },
    {
      id: 'L004',
      name: 'Mohammed Faisal',
      age: 38,
      gender: 'Male',
      mobile: '9037112233',
      alternateMobile: '',
      email: 'faisal.mhd@gmail.com',
      address: 'Faisal Mahal, Kozhikode Town',
      district: 'Kozhikode',
      state: 'Kerala',
      pincode: '673001',
      source: 'Referral',
      status: 'Subsidy Pending',
      documents: {
        aadhaar: { name: 'aadhaar_faisal.pdf', uploaded: true },
        pan: { name: 'pan_faisal.pdf', uploaded: true },
        electricityBill: { name: 'kseb_faisal.pdf', uploaded: true },
        geotaggedPhotos: { name: 'installed_faisal.jpg', uploaded: true },
        propertyTax: { name: 'tax_faisal.pdf', uploaded: true },
        landTax: { name: 'land_faisal.pdf', uploaded: true },
        bankPassbook: { name: 'passbook_faisal.pdf', uploaded: true },
        signature: { name: 'sig_faisal.png', uploaded: true }
      },
      createdAt: '2026-04-10T11:00:00Z',
      notes: '10kW On-grid installation. KSEB commissioning report submitted.'
    },
    {
      id: 'L005',
      name: 'Suresh Kumar',
      age: 50,
      gender: 'Male',
      mobile: '8848123456',
      alternateMobile: '',
      email: 'suresh.k@gmail.com',
      address: 'Suresh Nivas, Kalpetta',
      district: 'Wayanad',
      state: 'Kerala',
      pincode: '673121',
      source: 'Walk-in',
      status: 'Completed',
      documents: {
        aadhaar: { name: 'aadhaar_suresh.pdf', uploaded: true },
        pan: { name: 'pan_suresh.pdf', uploaded: true },
        electricityBill: { name: 'kseb_suresh.pdf', uploaded: true },
        geotaggedPhotos: { name: 'complete_suresh.jpg', uploaded: true },
        propertyTax: { name: 'tax_suresh.pdf', uploaded: true },
        landTax: { name: 'land_suresh.pdf', uploaded: true },
        bankPassbook: { name: 'bank_suresh.pdf', uploaded: true },
        signature: { name: 'sig_suresh.png', uploaded: true }
      },
      createdAt: '2026-03-05T10:00:00Z',
      notes: '3kW system fully commissioned. MNRE subsidy received.'
    }
  ],

  dealers: [
    {
      id: 'GVES-DLR-001',
      name: 'Ruksana C R Solar',
      contactPerson: 'Ruksana C R',
      mobile: '8129900484',
      email: 'gves-dlr-001',
      district: 'Ernakulam',
      state: 'Kerala',
      status: 'Approved',
      assignedTerritory: 'Ernakulam',
      commissionRate: 5,
      earnings: 45000,
      paidAmount: 30000,
      salesCount: 8
    },
    {
      id: 'GVES-DLR-002',
      name: 'Yadhukrishnan Solar',
      contactPerson: 'Yadhukrishnan',
      mobile: '8129920094',
      email: 'gves-dlr-002',
      district: 'Alappuzha',
      state: 'Kerala',
      status: 'Approved',
      assignedTerritory: 'Alappuzha',
      commissionRate: 6,
      earnings: 15000,
      paidAmount: 15000,
      salesCount: 2
    },
    {
      id: 'GVES-DLR-003',
      name: 'Kannan K S Solar',
      contactPerson: 'Kannan K S',
      mobile: '9947762396',
      email: 'gves-dlr-003',
      district: 'Alappuzha',
      state: 'Kerala',
      status: 'Approved',
      assignedTerritory: 'Alappuzha',
      commissionRate: 5,
      earnings: 0,
      paidAmount: 0,
      salesCount: 0
    },
    {
      id: 'GVES-DLR-004',
      name: 'Vyshak Solar',
      contactPerson: 'Vyshak',
      mobile: '7994005973',
      email: 'gves-dlr-004',
      district: 'Alappuzha',
      state: 'Kerala',
      status: 'Approved',
      assignedTerritory: 'Alappuzha',
      commissionRate: 5,
      earnings: 0,
      paidAmount: 0,
      salesCount: 0
    },
    {
      id: 'GVES-DLR-005',
      name: 'Rinku Mathew Solar',
      contactPerson: 'Rinku Mathew',
      mobile: '7907347100',
      email: 'gves-dlr-005',
      district: 'Alappuzha',
      state: 'Kerala',
      status: 'Approved',
      assignedTerritory: 'Alappuzha',
      commissionRate: 5,
      earnings: 0,
      paidAmount: 0,
      salesCount: 0
    },
    {
      id: 'GVES-DLR-006',
      name: 'Anandhu Solar',
      contactPerson: 'Anandhu',
      mobile: '9633591854',
      email: 'gves-dlr-006',
      district: 'Alappuzha',
      state: 'Kerala',
      status: 'Approved',
      assignedTerritory: 'Alappuzha',
      commissionRate: 5,
      earnings: 0,
      paidAmount: 0,
      salesCount: 0
    }
  ],

  surveys: [
    {
      id: 'S001',
      leadId: 'L001',
      roofType: 'Concrete Flat Roof',
      roofArea: 450,
      gpsCoordinates: '8.5241° N, 76.9366° E',
      shadowAnalysis: 'No major shadow obstacles. Clean access from south-facing side.',
      existingLoad: 4.5,
      sanctionedLoad: 5.0,
      phaseType: 'Three Phase',
      engineerRemarks: 'Recommended 3kW system based on shadow-free area and KSEB billing history. Structure height 1.5m to avoid minor shadow of water tank.',
      recommendedCapacity: 3,
      estGeneration: 360,
      bom: [
        { item: 'Solar Panels (550W Mono PERC)', qty: 6, spec: 'Greenvolt Premium' },
        { item: 'Grid-tied Inverter', qty: 1, spec: '3kW On-grid, Three Phase' },
        { item: 'Roof Mount structure (GI)', qty: 1, spec: 'Elevated 1.5m' },
        { item: 'ACDB/DCDB boxes with SPD', qty: 1, spec: 'Dual Protection' },
        { item: 'Solar DC Cable 4sqmm', qty: 80, spec: 'Meters' }
      ],
      createdAt: '2026-05-16T11:00:00Z'
    },
    {
      id: 'S002',
      leadId: 'L003',
      roofType: 'Slanted Tile Roof',
      roofArea: 800,
      gpsCoordinates: '9.5916° N, 76.5222° E',
      shadowAnalysis: 'Moderate shadows from coconut trees on the west side after 4:00 PM.',
      existingLoad: 6.0,
      sanctionedLoad: 8.0,
      phaseType: 'Three Phase',
      engineerRemarks: 'Recommended 5kW system. Need special tile roof hooks. Shadow is minimal during peak sun hours.',
      recommendedCapacity: 5,
      estGeneration: 600,
      bom: [
        { item: 'Solar Panels (550W Mono PERC)', qty: 9, spec: 'Greenvolt Premium' },
        { item: 'Grid-tied Inverter', qty: 1, spec: '5kW On-grid, Three Phase' },
        { item: 'Tile Roof Rail Mount Structure', qty: 1, spec: 'Aluminum Al6005-T5' },
        { item: 'ACDB/DCDB boxes with SPD', qty: 1, spec: 'Dual Protection' },
        { item: 'Solar DC Cable 4sqmm', qty: 120, spec: 'Meters' }
      ],
      createdAt: '2026-05-21T15:00:00Z'
    }
  ],

  quotations: [
    {
      id: 'Q001',
      leadId: 'L001',
      surveyId: 'S001',
      version: 1,
      projectSize: 3,
      inverterBrand: 'Growatt',
      panelBrand: 'Waaree (Mono PERC)',
      basePrice: 165000,
      gstRate: 13.8,
      gstAmount: 22770,
      netPrice: 187770,
      subsidyExpected: 78000,
      customerShare: 109770,
      paymentTerms: '50% Advance, 40% on Delivery, 10% post commissioning',
      status: 'Approved',
      validUntil: '2026-06-15',
      createdAt: '2026-05-17T09:00:00Z'
    },
    {
      id: 'Q002',
      leadId: 'L002',
      surveyId: '',
      version: 1,
      projectSize: 5,
      inverterBrand: 'Solis',
      panelBrand: 'Adani Solar (Mono PERC)',
      basePrice: 240000,
      gstRate: 13.8,
      gstAmount: 33120,
      netPrice: 273120,
      subsidyExpected: 78000,
      customerShare: 195120,
      paymentTerms: '60% Advance, 30% on Delivery, 10% post commissioning',
      status: 'Sent',
      validUntil: '2026-06-20',
      createdAt: '2026-05-19T10:30:00Z'
    },
    {
      id: 'Q003',
      leadId: 'L003',
      surveyId: 'S002',
      version: 2,
      projectSize: 5,
      inverterBrand: 'Growatt',
      panelBrand: 'Waaree (Mono PERC)',
      basePrice: 235000,
      gstRate: 13.8,
      gstAmount: 32430,
      netPrice: 267430,
      subsidyExpected: 78000,
      customerShare: 189430,
      paymentTerms: '50% Advance, 40% on Delivery, 10% post commissioning',
      status: 'Accepted',
      validUntil: '2026-06-10',
      createdAt: '2026-05-22T12:00:00Z'
    }
  ],

  projects: [
    {
      id: 'PRJ001',
      leadId: 'L003',
      customerName: 'George Joseph',
      projectSize: 5,
      currentStage: 6,
      stageHistory: [
        { stage: 1, name: 'Lead', completedAt: '2026-05-20T09:15:00Z' },
        { stage: 2, name: 'Site Survey', completedAt: '2026-05-21T15:00:00Z' },
        { stage: 3, name: 'Design', completedAt: '2026-05-22T10:00:00Z' },
        { stage: 4, name: 'Quotation', completedAt: '2026-05-22T12:00:00Z' },
        { stage: 5, name: 'Order Confirmation', completedAt: '2026-05-23T14:00:00Z' }
      ],
      installationTeam: {
        civilId: 'EMP005',
        electricalId: 'EMP006',
        fabricationId: 'EMP007'
      },
      ksebApplicationNumber: 'KSEB-APP-2026-88029',
      netMeterStatus: 'Pending Application',
      commissioningDate: '',
      subsidyStatus: 'Pending Registration',
      expectedCompletion: '2026-06-25',
      updatedAt: '2026-05-23T14:00:00Z'
    },
    {
      id: 'PRJ002',
      leadId: 'L004',
      customerName: 'Mohammed Faisal',
      projectSize: 10,
      currentStage: 12,
      stageHistory: [
        { stage: 1, name: 'Lead', completedAt: '2026-04-10T11:00:00Z' },
        { stage: 2, name: 'Site Survey', completedAt: '2026-04-12T11:00:00Z' },
        { stage: 3, name: 'Design', completedAt: '2026-04-14T09:00:00Z' },
        { stage: 4, name: 'Quotation', completedAt: '2026-04-15T11:00:00Z' },
        { stage: 5, name: 'Order Confirmation', completedAt: '2026-04-16T15:00:00Z' },
        { stage: 6, name: 'Material Procurement', completedAt: '2026-04-20T10:00:00Z' },
        { stage: 7, name: 'Installation', completedAt: '2026-04-25T17:00:00Z' },
        { stage: 8, name: 'KSEB Application', completedAt: '2026-04-28T11:00:00Z' },
        { stage: 9, name: 'Net Meter Approval', completedAt: '2026-05-05T14:00:00Z' },
        { stage: 10, name: 'Inspection', completedAt: '2026-05-12T11:00:00Z' },
        { stage: 11, name: 'Commissioning', completedAt: '2026-05-18T16:00:00Z' }
      ],
      installationTeam: {
        civilId: 'EMP005',
        electricalId: 'EMP006',
        fabricationId: 'EMP007'
      },
      ksebApplicationNumber: 'KSEB-APP-2026-67011',
      netMeterStatus: 'Approved & Installed',
      commissioningDate: '2026-05-18',
      subsidyStatus: 'Applied - Pending Verification',
      expectedCompletion: '2026-06-15',
      updatedAt: '2026-05-18T16:00:00Z'
    }
  ],

  mnre: [
    {
      id: 'MN001',
      leadId: 'L004',
      consumerId: '10928374656',
      vendorId: 'GV-VEND-KL-021',
      applicationId: 'PM-SG-2026-99120',
      regNumber: 'REG-SG-552091',
      regStatus: 'Completed',
      docVerification: 'Approved',
      inspectionStatus: 'Passed',
      subsidyAmount: 78000,
      subsidyStatus: 'Pending Verification by MNRE',
      alerts: [
        { type: 'Info', msg: 'Awaiting final bank disbursement validation.' }
      ]
    },
    {
      id: 'MN002',
      leadId: 'L003',
      consumerId: '44520938471',
      vendorId: 'GV-VEND-KL-021',
      applicationId: 'PM-SG-2026-44021',
      regNumber: 'REG-SG-109283',
      regStatus: 'In Progress',
      docVerification: 'Pending property tax receipt',
      inspectionStatus: 'Pending Installation',
      subsidyAmount: 78000,
      subsidyStatus: 'Awaiting Documents',
      alerts: [
        { type: 'Warning', msg: 'Missing Document: Upload Property Tax Receipt for Surya Ghar Portal.' }
      ]
    }
  ],

  loans: [
    {
      id: 'LN001',
      leadId: 'L003',
      bankName: 'SBI Solar Loan',
      loanAmount: 150000,
      interestRate: 8.5,
      emiAmount: 3125,
      stage: 'Sanctioned',
      sanctionLetter: 'sbi_sanction_l003.pdf',
      emiSchedule: 'emi_sbi_l003.pdf',
      agreement: 'sbi_agreement_l003.pdf',
      updatedAt: '2026-05-24T10:00:00Z'
    },
    {
      id: 'LN002',
      leadId: 'L001',
      bankName: 'Federal Bank Solar Care',
      loanAmount: 100000,
      interestRate: 8.9,
      emiAmount: 2200,
      stage: 'Under Review',
      sanctionLetter: '',
      emiSchedule: '',
      agreement: '',
      updatedAt: '2026-05-25T11:30:00Z'
    }
  ],

  inventory: [
    { id: 'I001', name: 'Waaree 550W Mono PERC Solar Panel', category: 'Solar Panels', qty: 140, unit: 'Nos', minStock: 50, warehouse: 'Kochi Main', price: 15890 },
    { id: 'I002', name: 'Adani 540W Mono PERC Solar Panel', category: 'Solar Panels', qty: 30, unit: 'Nos', minStock: 40, warehouse: 'Calicut Sub', price: 15500 },
    { id: 'I003', name: 'Growatt 3kW On-Grid Inverter Single Phase', category: 'Inverters', qty: 25, unit: 'Nos', minStock: 10, warehouse: 'Kochi Main', price: 28000 },
    { id: 'I004', name: 'Solis 5kW On-Grid Inverter Three Phase', category: 'Inverters', qty: 18, unit: 'Nos', minStock: 8, warehouse: 'Kochi Main', price: 42000 },
    { id: 'I005', name: 'Growatt 10kW On-Grid Inverter Three Phase', category: 'Inverters', qty: 5, unit: 'Nos', minStock: 6, warehouse: 'Calicut Sub', price: 65000 },
    { id: 'I006', name: 'Al6005-T5 Aluminum Rail (3.2m)', category: 'Structure Materials', qty: 250, unit: 'Meters', minStock: 100, warehouse: 'Kochi Main', price: 850 },
    { id: 'I007', name: 'GI Elevated Structure Leg (1.5m)', category: 'Structure Materials', qty: 80, unit: 'Nos', minStock: 30, warehouse: 'Kochi Main', price: 1200 },
    { id: 'I008', name: 'ACDB Box Single Phase', category: 'ACDB', qty: 40, unit: 'Nos', minStock: 15, warehouse: 'Kochi Main', price: 4500 },
    { id: 'I009', name: 'DCDB Box Dual String', category: 'DCDB', qty: 35, unit: 'Nos', minStock: 15, warehouse: 'Kochi Main', price: 6000 },
    { id: 'I010', name: 'Copper Earthing Rod (1.2m)', category: 'Earthing Kits', qty: 90, unit: 'Nos', minStock: 40, warehouse: 'Kochi Main', price: 1500 },
    { id: 'I011', name: 'Solar DC Cable 4sqmm (Red)', category: 'Cables', qty: 800, unit: 'Meters', minStock: 300, warehouse: 'Kochi Main', price: 65 },
    { id: 'I012', name: 'Solar DC Cable 4sqmm (Black)', category: 'Cables', qty: 950, unit: 'Meters', minStock: 300, warehouse: 'Kochi Main', price: 65 }
  ],

  inventoryLogs: [
    { id: 'IL001', itemId: 'I001', type: 'Stock In', qty: 100, warehouse: 'Kochi Main', notes: 'PO-2026-091 received', date: '2026-05-10' },
    { id: 'IL002', itemId: 'I001', type: 'Stock Out', qty: 9, warehouse: 'Kochi Main', notes: 'Issued for Project George Joseph', date: '2026-05-24' }
  ],

  purchases: [
    {
      id: 'PO-2026-001',
      supplierName: 'Waaree Solar India Ltd',
      materials: [{ itemId: 'I001', name: 'Waaree 550W Panels', qty: 100, unitCost: 15890 }],
      totalCost: 1589000,
      deliveryStatus: 'Delivered',
      grnStatus: 'Completed',
      createdAt: '2026-05-01'
    },
    {
      id: 'PO-2026-002',
      supplierName: 'Growatt New Energy Pvt Ltd',
      materials: [{ itemId: 'I003', name: 'Growatt 3kW Inverter', qty: 15, unitCost: 28000 }],
      totalCost: 420000,
      deliveryStatus: 'Shipped',
      grnStatus: 'Pending Receipt',
      createdAt: '2026-05-25'
    }
  ],

  suppliers: [
    { id: 'SUP001', name: 'Waaree Solar India Ltd', gst: '27AAAAA1111A1Z1', contact: 'sales@waaree.com', terms: '30 Days Credit', rating: 4.8 },
    { id: 'SUP002', name: 'Growatt New Energy Pvt Ltd', gst: '07BBBBB2222B2Z2', contact: 'support@growatt.co.in', terms: 'Advance Payment', rating: 4.5 },
    { id: 'SUP003', name: 'Polycab Cables India', gst: '24CCCCC3333C3Z3', contact: 'sales@polycab.com', terms: '45 Days Credit', rating: 4.7 }
  ],

  installations: [
    {
      id: 'INST001',
      projectId: 'PRJ001',
      customerName: 'George Joseph',
      civilStatus: 'Completed',
      fabricationStatus: 'In Progress',
      electricalStatus: 'Pending',
      workProgress: 45,
      completionPhotos: [],
      materialsUsed: [
        { name: 'GI Elevated Structure Leg', qty: 6 },
        { name: 'Aluminum Rail', qty: 24 }
      ],
      attendance: [
        { date: '2026-06-05', staffId: 'EMP005', staffName: 'Amal Dev', checkIn: '09:00 AM', checkOut: '05:30 PM', gps: '9.5916° N, 76.5222° E (Kottayam)' },
        { date: '2026-06-05', staffId: 'EMP007', staffName: 'Sujith Lal', checkIn: '08:45 AM', checkOut: '05:15 PM', gps: '9.5916° N, 76.5222° E (Kottayam)' }
      ]
    }
  ],

  employees: [
    { id: 'EMP001', name: 'Anoop Krishnan', role: 'Sales Manager', email: 'anoop@greenvoltes.in', phone: '9446001122', attendanceToday: 'Present' },
    { id: 'EMP002', name: 'Deepa Roy', role: 'Sales Executive', email: 'deepa@greenvoltes.in', phone: '9446001123', attendanceToday: 'Present' },
    { id: 'EMP003', name: 'Manu Varghese', role: 'Site Survey Engineer', email: 'manu@greenvoltes.in', phone: '9446001124', attendanceToday: 'Present' },
    { id: 'EMP004', name: 'Devan M.S.', role: 'Design Engineer', email: 'devan@greenvoltes.in', phone: '9446001125', attendanceToday: 'Present' },
    { id: 'EMP005', name: 'Amal Dev', role: 'Installation Team (Civil)', email: 'amal@greenvoltes.in', phone: '9446001126', attendanceToday: 'Present' },
    { id: 'EMP006', name: 'Shaji Mathew', role: 'Installation Team (Electrical)', email: 'shaji@greenvoltes.in', phone: '9446001127', attendanceToday: 'On Leave' },
    { id: 'EMP007', name: 'Sujith Lal', role: 'Installation Team (Fabrication)', email: 'sujith@greenvoltes.in', phone: '9446001128', attendanceToday: 'Present' },
    { id: 'EMP008', name: 'Preetha S.', role: 'MNRE Executive', email: 'preetha@greenvoltes.in', phone: '9446001129', attendanceToday: 'Present' },
    { id: 'EMP009', name: 'Vimal Kumar', role: 'Loan Executive', email: 'vimal@greenvoltes.in', phone: '9446001130', attendanceToday: 'Present' },
    { id: 'EMP010', name: 'Rahul R.', role: 'Accounts Executive', email: 'rahul@greenvoltes.in', phone: '9446001131', attendanceToday: 'Present' },
    { id: 'EMP011', name: 'Gokul Krishna', role: 'Service Engineer', email: 'gokul@greenvoltes.in', phone: '9446001132', attendanceToday: 'Present' }
  ],

  tasks: [
    { id: 'T001', assignedTo: 'EMP003', title: 'Site Survey: Ramesh Nair', desc: 'Perform shadow analysis & confirm sanctioned load.', due: '2026-06-08', status: 'Pending' },
    { id: 'T002', assignedTo: 'EMP004', title: 'Structure Design: George Joseph', desc: 'Create 3D drawing of elevated GI frame.', due: '2026-06-07', status: 'Completed' },
    { id: 'T003', assignedTo: 'EMP008', title: 'Submit Surya Ghar Portal: George Joseph', desc: 'Upload documents & KSEB application proof.', due: '2026-06-09', status: 'Pending' }
  ],

  finance: [
    { id: 'F001', description: 'Advance received Ramesh Nair', type: 'Receivable (In)', amount: 80000, projectSize: 3, date: '2026-05-25', gst: 9820, zohoSynced: true },
    { id: 'F002', description: 'Advance received George Joseph', type: 'Receivable (In)', amount: 120000, projectSize: 5, date: '2026-05-24', gst: 14730, zohoSynced: true },
    { id: 'F003', description: 'Supplier Payment Waaree PO-2026-001', type: 'Payable (Out)', amount: 1589000, projectSize: 0, date: '2026-05-02', gst: 195120, zohoSynced: false }
  ],

  serviceTickets: [
    { id: 'TK001', customerName: 'Suresh Kumar', mobile: '8848123456', topic: 'Inverter Communication Error', desc: 'Inverter WiFi is offline on Solarman App. Grid-feed is normal.', status: 'Open', priority: 'Medium', engineerId: 'EMP011', createdAt: '2026-06-04' }
  ],

  notifications: [
    { id: 'N001', recipient: 'George Joseph (9447123456)', type: 'WhatsApp', text: 'Dear George Joseph, Your 5kW Solar Project has advanced to the Material Procurement stage! - Team Greenvoltes', sentAt: '2026-05-23 02:00 PM' },
    { id: 'N002', recipient: 'Ramesh Nair (9845612301)', type: 'SMS', text: 'Your Greenvoltes Quotation Q001 is ready for approval. Please check your email.', sentAt: '2026-05-17 09:05 AM' }
  ],

  qualityChecks: [
    {
      id: 'QC001',
      projectId: 'PRJ002',
      checklist: {
        earthingVerified: true,
        acdbInstalled: true,
        dcdbInstalled: true,
        spdInstalled: true,
        structureInspected: true,
        generationTestPassed: true
      },
      verifiedBy: 'Gokul Krishna (Service Engineer)',
      signedAt: '2026-05-18'
    }
  ]
};

// Initialize dbCache in-memory
let dbCache = (() => {
  const local = localStorage.getItem('greenvoltes_crm_db');
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      return defaultData;
    }
  }
  return defaultData;
})();

// Fetch entire database from SQLite backend server
export const fetchDbFromServer = async () => {
  try {
    const res = await fetch(`${API_BASE}/db/all`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        dbCache = data;
        localStorage.setItem('greenvoltes_crm_db', JSON.stringify(data));
        // Dispatch event for any component listening
        window.dispatchEvent(new CustomEvent('db-synced', { detail: data }));
        return data;
      }
    }
  } catch (e) {
    console.error('Failed to load database from server:', e);
  }
  return dbCache;
};

// Expose getDb and saveDb matching sync API
export const getDb = () => {
  return dbCache;
};

export const saveDb = (data) => {
  dbCache = data;
  localStorage.setItem('greenvoltes_crm_db', JSON.stringify(data));
  
  // Async update to Express server
  fetch(`${API_BASE}/db/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => {
    if (res.ok) {
      // Trigger a sync event to let others know
      window.dispatchEvent(new CustomEvent('db-synced', { detail: data }));
    }
  }).catch(err => {
    console.error('Failed to sync changes to Express backend:', err);
  });
};

// General list operations
export const getCollection = (key) => {
  return dbCache[key] || [];
};

export const saveCollectionItem = (key, item) => {
  const db = getDb();
  if (!db[key]) db[key] = [];
  
  const index = db[key].findIndex(i => i.id === item.id);
  if (index !== -1) {
    db[key][index] = { ...db[key][index], ...item };
  } else {
    db[key].push(item);
  }
  saveDb(db);
  return db[key];
};

export const deleteCollectionItem = (key, id) => {
  const db = getDb();
  if (!db[key]) return [];
  db[key] = db[key].filter(i => i.id !== id);
  saveDb(db);
  return db[key];
};

export const uploadFileToServer = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/upload`);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const resData = JSON.parse(xhr.responseText);
          resolve(resData);
        } catch (err) {
          reject(new Error('Invalid JSON response from server'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
};

// Login user API helper
export const loginUserToServer = async (email, password) => {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Login verification failed');
    }
    return await res.json(); // returns { success: true, user: { email, name, role } }
  } catch (e) {
    console.error('Error in loginUserToServer:', e);
    throw e;
  }
};

// Specific helpers for leads
export const getLeads = () => getCollection('leads');
export const saveLead = (lead) => saveCollectionItem('leads', lead);
export const deleteLead = (id) => deleteCollectionItem('leads', id);

// Specific helpers for projects
export const getProjects = () => getCollection('projects');
export const saveProject = (proj) => saveCollectionItem('projects', proj);

// Specific helpers for quotations
export const getQuotations = () => getCollection('quotations');
export const saveQuotation = (quote) => saveCollectionItem('quotations', quote);

// Specific helpers for surveys
export const getSurveys = () => getCollection('surveys');
export const saveSurvey = (survey) => saveCollectionItem('surveys', survey);

// Specific helpers for inventory
export const getInventory = () => getCollection('inventory');
export const saveInventoryItem = (item) => saveCollectionItem('inventory', item);
export const logInventoryTransaction = (log) => {
  const db = getDb();
  db.inventoryLogs = db.inventoryLogs || [];
  const logItem = {
    id: 'IL' + Date.now(),
    ...log,
    date: new Date().toISOString().split('T')[0]
  };
  db.inventoryLogs.push(logItem);
  
  // Adjust actual inventory qty
  const items = db.inventory || [];
  const item = items.find(i => i.id === log.itemId);
  if (item) {
    if (log.type === 'Stock In') {
      item.qty = Number(item.qty) + Number(log.qty);
    } else if (log.type === 'Stock Out') {
      item.qty = Math.max(0, Number(item.qty) - Number(log.qty));
    }
  }
  saveDb(db);
};

// Specific helpers for finance
export const getFinance = () => getCollection('finance');
export const saveFinanceRecord = (record) => saveCollectionItem('finance', record);

// Specific helpers for employees
export const getEmployees = () => getCollection('employees');
export const saveEmployee = (emp) => saveCollectionItem('employees', emp);

// Specific helpers for service
export const getServiceTickets = () => getCollection('serviceTickets');
export const saveServiceTicket = (ticket) => saveCollectionItem('serviceTickets', ticket);

// Specific helpers for notifications
export const getNotifications = () => getCollection('notifications');
export const logNotification = (notif) => {
  const db = getDb();
  db.notifications = db.notifications || [];
  db.notifications.push({
    id: 'N' + Date.now(),
    ...notif,
    sentAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  saveDb(db);
};
