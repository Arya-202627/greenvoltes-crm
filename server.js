// server.js
// Node.js Express server with SQLite database for Greenvoltes CRM
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sqlite3 from 'sqlite3';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure uploads directory exists
const uploadsDir = process.env.UPLOADS_DIR || join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Generate dummy files for pre-seeded mock files to avoid 404 when downloading
const dummyFiles = [
  'aadhaar_ramesh.pdf', 'pan_ramesh.pdf', 'kseb_bill_ramesh.pdf', 'site_photo_1.jpg', 'passbook_ramesh.pdf', 'signature_ramesh.png',
  'aadhaar_anjali.pdf', 'kseb_bill_anjali.pdf', 'site_survey_anjali.jpg', 'prop_tax_anjali.pdf', 'land_tax_anjali.pdf',
  'aadhaar_george.pdf', 'pan_george.pdf', 'kseb_george.pdf', 'roof_george.jpg', 'tax_receipt_george.pdf', 'land_receipt_george.pdf', 'bank_george.pdf', 'sig_george.png',
  'aadhaar_faisal.pdf', 'pan_faisal.pdf', 'kseb_faisal.pdf', 'installed_faisal.jpg', 'tax_faisal.pdf', 'land_faisal.pdf', 'passbook_faisal.pdf', 'sig_faisal.png',
  'aadhaar_suresh.pdf', 'pan_suresh.pdf', 'kseb_suresh.pdf', 'complete_suresh.jpg', 'tax_suresh.pdf', 'land_suresh.pdf', 'bank_suresh.pdf', 'sig_suresh.png'
];

dummyFiles.forEach(file => {
  const filePath = join(uploadsDir, file);
  if (!fs.existsSync(filePath)) {
    const isImage = file.endsWith('.jpg') || file.endsWith('.png');
    const content = isImage 
      ? 'DUMMY IMAGE CONTENT FOR ' + file 
      : '%PDF-1.4\n%... Dummy PDF file content for Greenvoltes CRM ...\n' + file;
    fs.writeFileSync(filePath, content);
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Multer storage configuration for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and prepend timestamp to avoid collisions
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});
const upload = multer({ storage });

// Password hashing helpers
const defaultSalt = 'greenvoltes_salt_2026';

function hashPassword(password, salt) {
  const hash = crypto.createHash('sha256');
  hash.update(password + salt);
  return hash.digest('hex');
}

// Initialize SQLite database
const dbPath = process.env.DATABASE_FILE || join(__dirname, 'database.sqlite');
const dbDir = dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

// Database Initialization
function initializeDatabase() {
  db.serialize(() => {
    // Create the generic collections table
    db.run(`
      CREATE TABLE IF NOT EXISTS collections (
        key TEXT,
        id TEXT,
        data TEXT,
        PRIMARY KEY (key, id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating collections table:', err);
      } else {
        checkAndSeedData();
      }
    });
  });
}

// Sync and update users and dealers to ensure latest credentials and profiles are active
function syncUsersAndDealersOnStartup() {
  console.log('Synchronizing users and dealer profiles with latest server codebase...');
  db.serialize(() => {
    // 1. Clear and reload all users to ensure passwords/roles match server.js source code
    db.run("DELETE FROM collections WHERE key = 'users'", (err) => {
      if (err) console.error('Error clearing users:', err);
    });
    const stmtUser = db.prepare('INSERT OR REPLACE INTO collections (key, id, data) VALUES (?, ?, ?)');
    defaultData.users.forEach((user) => {
      stmtUser.run('users', user.id, JSON.stringify(user));
    });
    stmtUser.finalize((err) => {
      if (err) console.error('Error finalising user insertion:', err);
      else console.log('Successfully synchronized user credentials database table.');
    });

    // 2. Synchronize dealers: update existing properties or insert if missing
    defaultData.dealers.forEach((dealer) => {
      db.get("SELECT data FROM collections WHERE key = 'dealers' AND id = ?", [dealer.id], (err, row) => {
        if (!err) {
          if (row) {
            try {
              const existing = JSON.parse(row.data);
              const merged = {
                ...existing,
                name: dealer.name,
                contactPerson: dealer.contactPerson,
                mobile: dealer.mobile,
                email: dealer.email,
                district: dealer.district,
                state: dealer.state,
                assignedTerritory: dealer.assignedTerritory,
                commissionRate: dealer.commissionRate
              };
              db.run("UPDATE collections SET data = ? WHERE key = 'dealers' AND id = ?", [JSON.stringify(merged), dealer.id]);
            } catch (e) {
              console.error('Error parsing dealer data:', e);
            }
          } else {
            db.run("INSERT INTO collections (key, id, data) VALUES ('dealers', ?, ?)", [dealer.id, JSON.stringify(dealer)]);
          }
        }
      });
    });
  });
}

// Pre-populate database with default Kerala-specific data from mockDb if empty
function checkAndSeedData() {
  db.get('SELECT COUNT(*) as count FROM collections', (err, row) => {
    if (err) {
      console.error('Error checking database count:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('Database empty. Seeding default Kerala-specific mock data...');
      seedDefaultData();
    } else {
      console.log(`Database already contains ${row.count} records. Performing user & dealer sync...`);
      syncUsersAndDealersOnStartup();
    }
  });
}

// Default mock data to seed database
const defaultData = {
  users: [
    { id: 'admin@greenvoltes.in', email: 'admin@greenvoltes.in', name: 'Arya Rajagopal', role: 'Admin', passwordHash: hashPassword('admin123', defaultSalt), salt: defaultSalt },
    { id: 'dinesh', email: 'dinesh', name: 'Dinesh', role: 'Dealer', dealerId: 'D001', passwordHash: hashPassword('8714889721', defaultSalt), salt: defaultSalt },
    { id: 'ganesh', email: 'ganesh', name: 'Ganesh', role: 'Dealer', dealerId: 'D002', passwordHash: hashPassword('9633223787', defaultSalt), salt: defaultSalt },
    { id: 'ruksana', email: 'ruksana', name: 'Ruksana C R.', role: 'Dealer', dealerId: 'D003', passwordHash: hashPassword('8129900484', defaultSalt), salt: defaultSalt },
    { id: 'yadu', email: 'yadu', name: 'Yadhu krishnan S', role: 'Dealer', dealerId: 'D004', passwordHash: hashPassword('8129920094', defaultSalt), salt: defaultSalt },
    { id: 'vyshak', email: 'vyshak', name: 'Vyshak', role: 'Dealer', dealerId: 'D005', passwordHash: hashPassword('7994005973', defaultSalt), salt: defaultSalt },
    { id: 'kannan', email: 'kannan', name: 'Kannan K S', role: 'Dealer', dealerId: 'D006', passwordHash: hashPassword('9947762396', defaultSalt), salt: defaultSalt },
    { id: 'rinku', email: 'rinku', name: 'Rinku Mathew', role: 'Dealer', dealerId: 'D007', passwordHash: hashPassword('7907347100', defaultSalt), salt: defaultSalt },
    { id: 'aswin', email: 'aswin', name: 'Aswin', role: 'Dealer', dealerId: 'D008', passwordHash: hashPassword('8590544311', defaultSalt), salt: defaultSalt },
    { id: 'anandu', email: 'anandu', name: 'Anandu L', role: 'Dealer', dealerId: 'D009', passwordHash: hashPassword('9633591854', defaultSalt), salt: defaultSalt },
    { id: 'customer@greenvoltes.in', email: 'customer@greenvoltes.in', name: 'George Joseph', role: 'Customer', passwordHash: hashPassword('customer123', defaultSalt), salt: defaultSalt },
    { id: 'anoop@greenvoltes.in', email: 'anoop@greenvoltes.in', name: 'Anoop Krishnan', role: 'Sales Manager', passwordHash: hashPassword('sales123', defaultSalt), salt: defaultSalt },
    { id: 'manu@greenvoltes.in', email: 'manu@greenvoltes.in', name: 'Manu Varghese', role: 'Site Survey Engineer', passwordHash: hashPassword('survey123', defaultSalt), salt: defaultSalt },
    { id: 'devan@greenvoltes.in', email: 'devan@greenvoltes.in', name: 'Devan M.S.', role: 'Design Engineer', passwordHash: hashPassword('design123', defaultSalt), salt: defaultSalt },
    { id: 'preetha@greenvoltes.in', email: 'preetha@greenvoltes.in', name: 'Preetha S.', role: 'MNRE Executive', passwordHash: hashPassword('mnre123', defaultSalt), salt: defaultSalt },
    { id: 'vimal@greenvoltes.in', email: 'vimal@greenvoltes.in', name: 'Vimal Kumar', role: 'Loan Executive', passwordHash: hashPassword('loan123', defaultSalt), salt: defaultSalt },
    { id: 'rahul@greenvoltes.in', email: 'rahul@greenvoltes.in', name: 'Rahul R.', role: 'Accounts Executive', passwordHash: hashPassword('accounts123', defaultSalt), salt: defaultSalt },
    { id: 'gokul@greenvoltes.in', email: 'gokul@greenvoltes.in', name: 'Gokul Krishna', role: 'Service Engineer', passwordHash: hashPassword('service123', defaultSalt), salt: defaultSalt },
    { id: 'amal@greenvoltes.in', email: 'amal@greenvoltes.in', name: 'Amal Dev', role: 'Installation Team', passwordHash: hashPassword('install123', defaultSalt), salt: defaultSalt },
    { id: 'staff', email: 'staff', name: 'Office Staff', role: 'Office Staff', passwordHash: hashPassword('staff123', defaultSalt), salt: defaultSalt }
  ],

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
      dealerId: 'D003',
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
      id: 'D001',
      name: 'Dinesh Solar',
      contactPerson: 'Dinesh',
      mobile: '8714889721',
      email: 'dinesh',
      district: 'Alappuzha',
      state: 'Kerala',
      status: 'Approved',
      assignedTerritory: 'Alappuzha & Ernakulam',
      commissionRate: 5,
      earnings: 0,
      paidAmount: 0,
      salesCount: 0
    },
    {
      id: 'D002',
      name: 'Ganesh Solar',
      contactPerson: 'Ganesh',
      mobile: '9633223787',
      email: 'ganesh',
      district: 'Ernakulam',
      state: 'Kerala',
      status: 'Approved',
      assignedTerritory: 'Alappuzha & Ernakulam',
      commissionRate: 5,
      earnings: 0,
      paidAmount: 0,
      salesCount: 0
    },
    {
      id: 'D003',
      name: 'Ruksana C R Solar',
      contactPerson: 'Ruksana C R.',
      mobile: '8129900484',
      email: 'ruksana',
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
      id: 'D004',
      name: 'Yadhu krishnan S Solar',
      contactPerson: 'Yadhu krishnan S',
      mobile: '8129920094',
      email: 'yadu',
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
      id: 'D005',
      name: 'Vyshak Solar',
      contactPerson: 'Vyshak',
      mobile: '7994005973',
      email: 'vyshak',
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
      id: 'D006',
      name: 'Kannan K S Solar',
      contactPerson: 'Kannan K S',
      mobile: '9947762396',
      email: 'kannan',
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
      id: 'D007',
      name: 'Rinku Mathew Solar',
      contactPerson: 'Rinku Mathew',
      mobile: '7907347100',
      email: 'rinku',
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
      id: 'D008',
      name: 'Aswin Solar',
      contactPerson: 'Aswin',
      mobile: '8590544311',
      email: 'aswin',
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
      id: 'D009',
      name: 'Anandu L Solar',
      contactPerson: 'Anandu L',
      mobile: '9633591854',
      email: 'anandu',
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

// Seed default data helper
function seedDefaultData() {
  db.serialize(() => {
    const stmt = db.prepare('INSERT INTO collections (key, id, data) VALUES (?, ?, ?)');
    
    Object.keys(defaultData).forEach((key) => {
      const items = defaultData[key];
      items.forEach((item) => {
        stmt.run(key, item.id, JSON.stringify(item));
      });
    });
    
    stmt.finalize((err) => {
      if (err) {
        console.error('Error seeding default data:', err);
      } else {
        console.log('Successfully seeded default data!');
      }
    });
  });
}

// Seed users only (if database is populated but users aren't yet)
function seedUsersOnly() {
  db.serialize(() => {
    const stmt = db.prepare('INSERT INTO collections (key, id, data) VALUES (?, ?, ?)');
    defaultData.users.forEach((user) => {
      stmt.run('users', user.id, JSON.stringify(user));
    });
    stmt.finalize((err) => {
      if (err) {
        console.error('Error seeding user credentials:', err);
      } else {
        console.log('Successfully seeded user credentials!');
      }
    });
  });
}

// REST API Endpoints

// Authentication API: login handler
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  
  db.get('SELECT data FROM collections WHERE key = ? AND id = ?', ['users', normalizedEmail], (err, row) => {
    if (err) {
      console.error('Database query error in login API:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }
    
    try {
      const user = JSON.parse(row.data);
      const computedHash = hashPassword(password, user.salt);
      
      if (computedHash === user.passwordHash) {
        // Remove sensitive columns before returning
        const { passwordHash, salt, ...profile } = user;
        return res.json({ success: true, user: profile });
      } else {
        return res.status(401).json({ error: 'Incorrect email or password' });
      }
    } catch (parseErr) {
      console.error('Error parsing user JSON from db:', parseErr);
      return res.status(500).json({ error: 'Internal server processing error' });
    }
  });
});

// Get entire database
app.get('/api/db/all', (req, res) => {
  db.all('SELECT key, data FROM collections', [], (err, rows) => {
    if (err) {
      console.error('Error fetching entire database:', err);
      return res.status(500).json({ error: err.message });
    }
    const fullDb = {};
    rows.forEach(row => {
      if (!fullDb[row.key]) {
        fullDb[row.key] = [];
      }
      try {
        fullDb[row.key].push(JSON.parse(row.data));
      } catch (e) {
        console.error(`Error parsing row data for key ${row.key}:`, e);
      }
    });
    
    // Ensure all keys from defaultData exist
    Object.keys(defaultData).forEach(key => {
      if (!fullDb[key]) {
        fullDb[key] = [];
      }
    });
    
    res.json(fullDb);
  });
});

// Save entire database
app.post('/api/db/save', (req, res) => {
  const fullDb = req.body;
  if (!fullDb || typeof fullDb !== 'object') {
    return res.status(400).json({ error: 'Database object is required' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('DELETE FROM collections', [], (err) => {
      if (err) {
        db.run('ROLLBACK');
        console.error('Error clearing collections:', err);
        return res.status(500).json({ error: err.message });
      }
      
      const stmt = db.prepare('INSERT INTO collections (key, id, data) VALUES (?, ?, ?)');
      let hasError = false;
      
      Object.keys(fullDb).forEach(key => {
        if (Array.isArray(fullDb[key])) {
          fullDb[key].forEach(item => {
            if (item && item.id) {
              stmt.run(key, item.id, JSON.stringify(item), (stmtErr) => {
                if (stmtErr) {
                  hasError = true;
                  console.error(`Error inserting item under key ${key}:`, stmtErr);
                }
              });
            }
          });
        }
      });
      
      stmt.finalize((finalizeErr) => {
        if (finalizeErr || hasError) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to save database transaction' });
        }
        db.run('COMMIT', (commitErr) => {
          if (commitErr) {
            console.error('Commit error:', commitErr);
            return res.status(500).json({ error: commitErr.message });
          }
          res.json({ success: true });
        });
      });
    });
  });
});

// 1. Get all items in a collection
app.get('/api/db/:key', (req, res) => {
  const { key } = req.params;
  db.all('SELECT data FROM collections WHERE key = ?', [key], (err, rows) => {
    if (err) {
      console.error(`Error fetching key ${key}:`, err);
      return res.status(500).json({ error: err.message });
    }
    const items = rows.map(row => JSON.parse(row.data));
    res.json(items);
  });
});

// 2. Insert or update an item in a collection
app.post('/api/db/:key', (req, res) => {
  const { key } = req.params;
  const item = req.body;
  
  if (!item || !item.id) {
    return res.status(400).json({ error: 'Item body and ID are required' });
  }
  
  db.run(
    'INSERT OR REPLACE INTO collections (key, id, data) VALUES (?, ?, ?)',
    [key, item.id, JSON.stringify(item)],
    function(err) {
      if (err) {
        console.error(`Error saving to key ${key}:`, err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id: item.id });
    }
  );
});

// 3. Delete an item from a collection
app.delete('/api/db/:key/:id', (req, res) => {
  const { key, id } = req.params;
  db.run(
    'DELETE FROM collections WHERE key = ? AND id = ?',
    [key, id],
    function(err) {
      if (err) {
        console.error(`Error deleting from key ${key}:`, err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, deletedCount: this.changes });
    }
  );
});

// 4. File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Return file information
  res.json({
    name: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`
  });
});

// Serve static assets of the built React frontend (dist/) if it exists
const distDir = join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/.*/, (req, res) => {
    // Prevent overriding API or uploads routes
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return res.status(404).json({ error: 'Not Found' });
    }
    res.sendFile(join(distDir, 'index.html'));
  });
}

// Start listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
