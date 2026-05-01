const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== DATA DIRECTORIES ====================
const DATA_DIR = path.join(__dirname, 'data');
const CERTIFICATES_FILE = path.join(DATA_DIR, 'certificates.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const FACES_DIR = path.join(DATA_DIR, 'faces');
const CERT_IMAGES_DIR = path.join(DATA_DIR, 'cert-images');

// Create directories
fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(FACES_DIR);
fs.ensureDirSync(CERT_IMAGES_DIR);

// ==================== LOAD DATA ====================
let certificates = {};
if (fs.existsSync(CERTIFICATES_FILE)) {
    try {
        certificates = fs.readJsonSync(CERTIFICATES_FILE);
        console.log(`✅ Loaded ${Object.keys(certificates).length} certificates`);
    } catch (error) {
        console.error('Error loading certificates:', error);
        certificates = {};
    }
} else {
    // Add sample certificates
    const now = new Date();
    certificates = {
        "CERT001": {
            id: "CERT001",
            recipient: "John Smith",
            issuer: "Certificate Authority",
            certificateHash: crypto.createHash('sha256').update("CERT001|John Smith|University Degree").digest('hex'),
            issueDate: new Date(now.setDate(now.getDate() - 30)).toISOString(),
            verified: true,
            type: "University Degree",
            summary: "Bachelor of Science in Computer Science with Honors",
            fraudScore: 0.02,
            issuedBy: "admin@certificate.com",
            createdAt: new Date().toISOString(),
            faceRegistered: false,
            faceImagePath: null,
            certificateImagePath: null
        },
        "CERT002": {
            id: "CERT002",
            recipient: "Jane Doe",
            issuer: "Certificate Authority",
            certificateHash: crypto.createHash('sha256').update("CERT002|Jane Doe|Professional Certification").digest('hex'),
            issueDate: new Date(now.setDate(now.getDate() - 15)).toISOString(),
            verified: true,
            type: "Professional Certification",
            summary: "Full Stack Development Certification with Distinction",
            fraudScore: 0.01,
            issuedBy: "admin@certificate.com",
            createdAt: new Date().toISOString(),
            faceRegistered: false,
            faceImagePath: null,
            certificateImagePath: null
        }
    };
    saveCertificates();
    console.log('✅ Created sample certificates');
}

let users = {};
if (fs.existsSync(USERS_FILE)) {
    try {
        users = fs.readJsonSync(USERS_FILE);
        console.log(`✅ Loaded ${Object.keys(users).length} users`);
    } catch (error) {
        console.error('Error loading users:', error);
        users = {};
    }
}

// Create ONLY Super Admin account (no signup allowed)
const SUPER_ADMIN_EMAIL = 'batch4@gmail.com';
const SUPER_ADMIN_PASSWORD = 'batch4';

if (!users[SUPER_ADMIN_EMAIL]) {
    const superAdmin = {
        id: 'superadmin_1',
        name: 'Super Admin',
        email: SUPER_ADMIN_EMAIL,
        password: bcrypt.hashSync(SUPER_ADMIN_PASSWORD, 10),
        role: 'superadmin',
        status: 'approved',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString()
    };
    users[SUPER_ADMIN_EMAIL] = superAdmin;
    saveUsers();
    console.log('✅ Created Super Admin account');
}

// Create sample admin account for testing if not exists
if (!users['admin@certificate.com']) {
    const sampleAdmin = {
        id: 'admin_1',
        name: 'Admin User',
        email: 'admin@certificate.com',
        password: bcrypt.hashSync('Admin@123', 10),
        role: 'admin',
        status: 'approved',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString()
    };
    users[sampleAdmin.email] = sampleAdmin;
    saveUsers();
    console.log('✅ Created sample Admin account');
}

// Create sample verifier account for testing if not exists
if (!users['verifier@certificate.com']) {
    const sampleVerifier = {
        id: 'verifier_1',
        name: 'Verifier User',
        email: 'verifier@certificate.com',
        password: bcrypt.hashSync('Verifier@123', 10),
        role: 'verifier',
        status: 'approved',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString()
    };
    users[sampleVerifier.email] = sampleVerifier;
    saveUsers();
    console.log('✅ Created sample Verifier account');
}

function saveUsers() {
    fs.writeJsonSync(USERS_FILE, users, { spaces: 2 });
}

function saveCertificates() {
    fs.writeJsonSync(CERTIFICATES_FILE, certificates, { spaces: 2 });
}

// ==================== HELPER FUNCTIONS ====================
function generateCertificateHash(certificateId, recipient, type) {
    const data = `${certificateId}|${recipient}|${type}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

function generateCertificateImageHash(imageData) {
    if (!imageData) return null;
    return crypto.createHash('sha256').update(imageData).digest('hex');
}

function compareCertificateImages(img1Hash, img2Hash) {
    if (!img1Hash || !img2Hash) return 0;
    let matches = 0;
    const maxLength = Math.max(img1Hash.length, img2Hash.length);
    for (let i = 0; i < maxLength; i++) {
        if (i < img1Hash.length && i < img2Hash.length && img1Hash[i] === img2Hash[i]) matches++;
    }
    return matches / maxLength;
}

function generateFaceDescriptor(imageData) {
    const hash = crypto.createHash('sha256').update(imageData).digest('hex');
    const descriptor = [];
    for (let i = 0; i < 128; i++) {
        const startPos = (i * 4) % (hash.length - 4);
        const segment = hash.substring(startPos, startPos + 4);
        const value = parseInt(segment, 16) / 65535;
        descriptor.push(value);
    }
    return descriptor;
}

function calculateRiskScore(recipient, type, summary = '', certificateImageMatch = 1.0) {
    let riskScore = 0.02;
    if (recipient) {
        if (recipient.length < 3) riskScore += 0.3;
        if (!/[a-zA-Z]/.test(recipient)) riskScore += 0.4;
        if (recipient.toLowerCase().includes('test') || recipient.toLowerCase().includes('fake')) riskScore += 0.5;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(recipient)) riskScore += 0.3;
        if (/\d/.test(recipient)) riskScore += 0.2;
        if (recipient.includes('@')) riskScore += 0.4;
    }
    if (certificateImageMatch < 0.3) riskScore += 0.8;
    else if (certificateImageMatch < 0.7) riskScore += 0.5;
    else if (certificateImageMatch < 0.9) riskScore += 0.2;
    return Math.min(0.98, riskScore);
}

// ==================== MIDDLEWARE ====================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));
app.use('/faces', express.static(FACES_DIR));
app.use('/cert-images', express.static(CERT_IMAGES_DIR));

app.use(session({
    secret: process.env.SESSION_SECRET || 'certichain-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Auth middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.isAuthenticated) {
        return next();
    }
    res.redirect('/');
};

const isSuperAdmin = (req, res, next) => {
    if (req.session.isAuthenticated && req.session.role === 'superadmin') {
        return next();
    }
    res.status(403).json({ success: false, message: 'Unauthorized' });
};

const isAdmin = (req, res, next) => {
    if (req.session.isAuthenticated && (req.session.role === 'admin' || req.session.role === 'superadmin')) {
        return next();
    }
    res.status(403).json({ success: false, message: 'Unauthorized' });
};

// ==================== PUBLIC ROUTES ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== AUTH ROUTES ====================
app.get('/auth/superadmin', (req, res) => {
    if (req.session.isAuthenticated && req.session.role === 'superadmin') {
        return res.redirect('/superadmin/dashboard');
    }
    res.sendFile(path.join(__dirname, 'public', 'auth', 'superadmin-login.html'));
});

app.get('/auth/admin', (req, res) => {
    if (req.session.isAuthenticated && req.session.role === 'admin') {
        return res.redirect('/admin/dashboard');
    }
    res.sendFile(path.join(__dirname, 'public', 'auth', 'admin-login.html'));
});

app.get('/auth/verifier', (req, res) => {
    if (req.session.isAuthenticated && req.session.role === 'verifier') {
        return res.redirect('/verify');
    }
    res.sendFile(path.join(__dirname, 'public', 'auth', 'verifier-login.html'));
});

// Super Admin Login API (No Signup)
app.post('/api/auth/superadmin/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users[email];
    if (user && user.role === 'superadmin' && bcrypt.compareSync(password, user.password)) {
        req.session.isAuthenticated = true;
        req.session.userId = user.id;
        req.session.email = user.email;
        req.session.role = user.role;
        req.session.name = user.name;
        res.json({ success: true, redirect: '/superadmin/dashboard' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Admin Login API
app.post('/api/auth/admin/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users[email];
    if (user && user.role === 'admin' && user.status === 'approved' && bcrypt.compareSync(password, user.password)) {
        req.session.isAuthenticated = true;
        req.session.userId = user.id;
        req.session.email = user.email;
        req.session.role = user.role;
        req.session.name = user.name;
        res.json({ success: true, redirect: '/admin/dashboard' });
    } else if (user && user.role === 'admin' && user.status !== 'approved') {
        res.status(401).json({ success: false, message: 'Account pending approval' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/auth/admin/request', async (req, res) => {
    const { name, email, password } = req.body;
    if (users[email]) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        password: hashedPassword,
        role: 'admin',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    users[email] = newUser;
    saveUsers();
    res.json({ success: true, message: 'Request submitted for approval' });
});

// Verifier Login API
app.post('/api/auth/verifier/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users[email];
    if (user && user.role === 'verifier' && user.status === 'approved' && bcrypt.compareSync(password, user.password)) {
        req.session.isAuthenticated = true;
        req.session.userId = user.id;
        req.session.email = user.email;
        req.session.role = user.role;
        req.session.name = user.name;
        res.json({ success: true, redirect: '/verify' });
    } else if (user && user.role === 'verifier' && user.status !== 'approved') {
        res.status(401).json({ success: false, message: 'Account pending approval' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/auth/verifier/request', async (req, res) => {
    const { name, email, password } = req.body;
    if (users[email]) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        password: hashedPassword,
        role: 'verifier',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    users[email] = newUser;
    saveUsers();
    res.json({ success: true, message: 'Request submitted for approval' });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

app.get('/api/auth/session', (req, res) => {
    res.json({
        authenticated: req.session.isAuthenticated || false,
        user: req.session.isAuthenticated ? {
            id: req.session.userId,
            email: req.session.email,
            role: req.session.role,
            name: req.session.name
        } : null,
        role: req.session.role || null
    });
});

// ==================== SUPER ADMIN ROUTES ====================
app.get('/superadmin/dashboard', isAuthenticated, (req, res) => {
    if (req.session.role !== 'superadmin') return res.redirect('/');
    res.sendFile(path.join(__dirname, 'public', 'superadmin-dashboard.html'));
});

app.get('/api/superadmin/users', isSuperAdmin, (req, res) => {
    const allUsers = Object.values(users).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        approvedAt: u.approvedAt
    }));
    res.json({ success: true, users: allUsers });
});

app.post('/api/superadmin/approve-user', isSuperAdmin, (req, res) => {
    const { email, approve } = req.body;
    if (!users[email]) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (approve) {
        users[email].status = 'approved';
        users[email].approvedAt = new Date().toISOString();
    } else {
        delete users[email];
    }
    saveUsers();
    res.json({ success: true });
});

// UPDATED: Allow deletion of other super admins, only protect primary one
app.post('/api/superadmin/delete-user', isSuperAdmin, (req, res) => {
    const { email } = req.body;
    
    // Prevent deletion of the primary super admin (batch4@gmail.com)
    if (email === 'batch4@gmail.com') {
        return res.status(400).json({ success: false, message: 'Cannot delete the primary Super Admin account' });
    }
    
    // Allow deletion of any other user (including other super admins)
    if (users[email]) {
        delete users[email];
        saveUsers();
        res.json({ success: true, message: `User ${email} deleted successfully` });
    } else {
        res.status(404).json({ success: false, message: 'User not found' });
    }
});

app.get('/api/admin/pending-requests', isSuperAdmin, (req, res) => {
    const pendingUsers = Object.values(users).filter(u => u.status === 'pending');
    const requests = pendingUsers.map(u => ({
        id: u.id,
        username: u.name,
        email: u.email,
        role: u.role,
        requestedAt: u.createdAt
    }));
    res.json({ success: true, requests });
});

app.post('/api/admin/approve-request', isSuperAdmin, (req, res) => {
    const { requestId, approved } = req.body;
    const userEntry = Object.values(users).find(u => u.id === requestId);
    if (!userEntry) {
        return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (approved) {
        userEntry.status = 'approved';
        userEntry.approvedAt = new Date().toISOString();
    } else {
        delete users[userEntry.email];
    }
    saveUsers();
    res.json({ success: true });
});

app.get('/api/admin/revocation-logs', isSuperAdmin, (req, res) => {
    const revokedCerts = Object.values(certificates).filter(c => !c.verified && c.revokedAt);
    const logs = revokedCerts.map(c => ({
        certificateId: c.id,
        reason: c.revocationReason || 'Admin revocation',
        revokedBy: c.revokedBy || 'Admin',
        timestamp: c.revokedAt
    }));
    res.json({ success: true, logs });
});

// ==================== ADMIN ROUTES ====================
app.get('/admin/dashboard', isAuthenticated, (req, res) => {
    if (req.session.role !== 'admin' && req.session.role !== 'superadmin') return res.redirect('/');
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.get('/admin/panel', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/admin/certificates', isAdmin, (req, res) => {
    const certsArray = Object.values(certificates);
    certsArray.sort((a, b) => new Date(b.createdAt || b.issueDate) - new Date(a.createdAt || a.issueDate));
    const sortedCertificates = {};
    certsArray.forEach(cert => { sortedCertificates[cert.id] = cert; });
    res.json({ success: true, certificates: sortedCertificates });
});

app.get('/api/admin/certificates/search', isAdmin, (req, res) => {
    const { query } = req.query;
    if (!query) return res.json({ success: true, certificates: {} });
    const searchTerm = query.toLowerCase();
    const matchingCerts = {};
    Object.values(certificates).forEach(cert => {
        if (cert.id.toLowerCase().includes(searchTerm) ||
            cert.recipient.toLowerCase().includes(searchTerm) ||
            cert.type.toLowerCase().includes(searchTerm)) {
            matchingCerts[cert.id] = cert;
        }
    });
    res.json({ success: true, certificates: matchingCerts });
});

app.get('/api/admin/verifiers', isAdmin, (req, res) => {
    const verifiers = Object.values(users).filter(u => u.role === 'verifier').map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        approvedAt: u.approvedAt
    }));
    res.json({ success: true, verifiers: verifiers });
});

app.post('/api/admin/issue', isAdmin, (req, res) => {
    const { certificateId, recipient, type, summary, faceImage, certificateImage } = req.body;
    
    if (!certificateId || !recipient || !type) {
        return res.status(400).json({ success: false, message: 'Required fields missing' });
    }
    if (!certificateImage) {
        return res.status(400).json({ success: false, message: 'Certificate image is required' });
    }
    if (certificates[certificateId]) {
        return res.status(400).json({ success: false, message: 'ID already exists' });
    }
    
    const hash = generateCertificateHash(certificateId, recipient, type);
    let fraudScore = calculateRiskScore(recipient, type, summary, 1.0);
    let certificateImagePath = null;
    let certificateImageHash = null;
    
    try {
        const certImageBase64 = certificateImage.replace(/^data:image\/\w+;base64,/, '');
        const certImageBuffer = Buffer.from(certImageBase64, 'base64');
        const certImageFileName = `${certificateId}_cert.jpg`;
        const certImageFullPath = path.join(CERT_IMAGES_DIR, certImageFileName);
        fs.writeFileSync(certImageFullPath, certImageBuffer);
        certificateImagePath = `/cert-images/${certImageFileName}`;
        certificateImageHash = generateCertificateImageHash(certificateImage);
        fraudScore = Math.max(0.01, fraudScore - 0.05);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to save certificate image' });
    }
    
    const newCert = {
        id: certificateId,
        recipient,
        issuer: req.session.name || "Certificate Authority",
        certificateHash: hash,
        issueDate: new Date().toISOString(),
        verified: true,
        type,
        summary: summary || null,
        fraudScore: fraudScore,
        issuedBy: req.session.email,
        createdAt: new Date().toISOString(),
        faceRegistered: false,
        faceDescriptor: null,
        faceImagePath: null,
        certificateImagePath: certificateImagePath,
        certificateImageHash: certificateImageHash
    };
    
    if (faceImage) {
        try {
            const faceDescriptor = generateFaceDescriptor(faceImage);
            const faceBase64Data = faceImage.replace(/^data:image\/\w+;base64,/, '');
            const faceImageBuffer = Buffer.from(faceBase64Data, 'base64');
            const facePath = path.join(FACES_DIR, `${certificateId}.jpg`);
            fs.writeFileSync(facePath, faceImageBuffer);
            newCert.faceDescriptor = faceDescriptor;
            newCert.faceImagePath = `/faces/${certificateId}.jpg`;
            newCert.faceRegistered = true;
            newCert.fraudScore = Math.max(0.01, fraudScore - 0.1);
        } catch (error) {
            console.error('Error saving face:', error);
        }
    }
    
    certificates[certificateId] = newCert;
    saveCertificates();
    
    res.json({ 
        success: true, 
        certificate: newCert,
        riskScore: (newCert.fraudScore * 100).toFixed(1) + '%',
        riskLevel: newCert.fraudScore > 0.7 ? 'HIGH' : (newCert.fraudScore > 0.3 ? 'MEDIUM' : 'LOW')
    });
});

app.post('/api/admin/revoke', isAdmin, (req, res) => {
    const { certificateId, reason } = req.body;
    if (!certificates[certificateId]) {
        return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    certificates[certificateId].verified = false;
    certificates[certificateId].revokedAt = new Date().toISOString();
    certificates[certificateId].revokedBy = req.session.email;
    certificates[certificateId].revocationReason = reason || 'No reason provided';
    saveCertificates();
    res.json({ success: true });
});

// ==================== VERIFIER ROUTES ====================
app.get('/verify', isAuthenticated, (req, res) => {
    if (req.session.role !== 'verifier' && req.session.role !== 'admin' && req.session.role !== 'superadmin') {
        return res.redirect('/auth/verifier');
    }
    res.sendFile(path.join(__dirname, 'public', 'verify.html'));
});

app.post('/api/certificates/verify-quick', (req, res) => {
    const { certificateId } = req.body;
    const cert = certificates[certificateId];
    if (!cert) return res.json({ verified: false, message: 'Certificate not found' });
    res.json({
        verified: cert.verified,
        certificate: {
            id: cert.id,
            recipient: cert.recipient,
            issuer: cert.issuer,
            issueDate: cert.issueDate,
            type: cert.type,
            verified: cert.verified,
            faceRegistered: cert.faceRegistered || false,
            faceImagePath: cert.faceImagePath || null,
            certificateImagePath: cert.certificateImagePath || null,
            fraudScore: cert.fraudScore || 0,
            summary: cert.summary || null
        }
    });
});

app.post('/api/certificates/verify-full', (req, res) => {
    const { certificateId, recipient, type } = req.body;
    const cert = certificates[certificateId];
    if (!cert) return res.json({ verified: false, message: 'Certificate not found' });
    const hashMatch = generateCertificateHash(certificateId, recipient, type) === cert.certificateHash;
    const valid = cert.verified && hashMatch && cert.recipient === recipient && cert.type === type;
    res.json({ 
        verified: valid,
        certificate: valid ? {
            id: cert.id,
            recipient: cert.recipient,
            type: cert.type,
            faceRegistered: cert.faceRegistered || false,
            faceImagePath: cert.faceImagePath || null,
            certificateImagePath: cert.certificateImagePath || null,
            fraudScore: cert.fraudScore || 0,
            summary: cert.summary || null
        } : null
    });
});

app.post('/api/verify/ai-enhanced', (req, res) => {
    const { certificateId, recipient, type, imageData } = req.body;
    const certificate = certificates[certificateId];
    if (!certificate) {
        return res.json({ verified: false, message: 'Certificate not found' });
    }
    
    const hashMatch = generateCertificateHash(certificateId, recipient, type) === certificate.certificateHash;
    const recipientMatch = certificate.recipient === recipient;
    const typeMatch = certificate.type === type;
    const blockchainVerified = certificate.verified && hashMatch && recipientMatch && typeMatch;
    
    let certificateImageMatch = 0;
    if (imageData && certificate.certificateImageHash) {
        const uploadedImageHash = generateCertificateImageHash(imageData);
        certificateImageMatch = compareCertificateImages(uploadedImageHash, certificate.certificateImageHash);
    }
    
    let fraudRisk = certificate.fraudScore || 0.02;
    let riskLevel = 'LOW';
    
    if (certificateImageMatch < 0.3) { fraudRisk = 0.95; riskLevel = 'HIGH'; }
    else if (certificateImageMatch < 0.5) { fraudRisk = 0.85; riskLevel = 'HIGH'; }
    else if (certificateImageMatch < 0.7) { fraudRisk = 0.75; riskLevel = 'HIGH'; }
    else if (certificateImageMatch < 0.85) { fraudRisk = 0.55; riskLevel = 'MEDIUM'; }
    else if (certificateImageMatch < 0.95) { fraudRisk = 0.25; riskLevel = 'MEDIUM'; }
    else { fraudRisk = Math.min(fraudRisk, 0.15); riskLevel = 'LOW'; }
    
    const aiConfidence = ((hashMatch ? 0.25 : 0) + (recipientMatch ? 0.2 : 0) + (typeMatch ? 0.15 : 0) + (certificateImageMatch * 0.25) + (certificate.faceRegistered ? 0.15 : 0));
    
    res.json({
        verified: blockchainVerified,
        blockchainVerified,
        aiConfidence: parseFloat(aiConfidence.toFixed(3)),
        fraudRisk: parseFloat(fraudRisk.toFixed(3)),
        nameMatch: recipientMatch ? 1 : 0,
        certificateImageMatch: parseFloat(certificateImageMatch.toFixed(3)),
        faceRegistered: certificate.faceRegistered || false,
        riskLevel: riskLevel,
        message: blockchainVerified ? 'Certificate verified' : 'Verification failed',
        certificate: blockchainVerified ? {
            id: certificate.id,
            recipient: certificate.recipient,
            type: certificate.type,
            issuer: certificate.issuer,
            issueDate: certificate.issueDate,
            faceImagePath: certificate.faceImagePath,
            certificateImagePath: certificate.certificateImagePath,
            fraudScore: certificate.fraudScore || 0,
            summary: certificate.summary || null
        } : null
    });
});

app.post('/api/certificates/:id/save-face', (req, res) => {
    const certificateId = req.params.id;
    const { faceImage } = req.body;
    const certificate = certificates[certificateId];
    if (!certificate) {
        return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    try {
        const faceDescriptor = generateFaceDescriptor(faceImage);
        const base64Data = faceImage.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const facePath = path.join(FACES_DIR, `${certificateId}.jpg`);
        fs.writeFileSync(facePath, imageBuffer);
        certificate.faceDescriptor = faceDescriptor;
        certificate.faceImagePath = `/faces/${certificateId}.jpg`;
        certificate.faceRegistered = true;
        certificate.faceRegisteredAt = new Date().toISOString();
        saveCertificates();
        res.json({ success: true, message: '✅ Face registered successfully', faceImagePath: certificate.faceImagePath });
    } catch (error) {
        console.error('Error saving face:', error);
        res.status(500).json({ success: false, message: 'Failed to save face' });
    }
});

app.get('/api/certificates/:id/face-status', (req, res) => {
    const certificate = certificates[req.params.id];
    if (!certificate) {
        return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    res.json({
        success: true,
        faceRegistered: certificate.faceRegistered || false,
        faceImagePath: certificate.faceImagePath || null,
        registeredAt: certificate.faceRegisteredAt || null
    });
});

app.post('/api/ai/scan-all', (req, res) => {
    const certificatesList = Object.values(certificates);
    const results = certificatesList.map(cert => ({
        id: cert.id,
        fraudProbability: cert.fraudScore || 0.02,
        faceRegistered: cert.faceRegistered || false,
        hasCertificateImage: !!cert.certificateImagePath
    }));
    const avgRisk = results.reduce((sum, r) => sum + r.fraudProbability, 0) / results.length;
    res.json({
        success: true,
        summary: {
            totalScanned: results.length,
            averageRisk: parseFloat(avgRisk.toFixed(3)),
            facesRegistered: results.filter(r => r.faceRegistered).length,
            certificatesWithImages: results.filter(r => r.hasCertificateImage).length
        }
    });
});

app.get('/api/ai/predictions', (req, res) => {
    const allCerts = Object.values(certificates);
    const growthRate = 0.05;
    const predictions = [];
    for (let i = 1; i <= 12; i++) {
        predictions.push({
            month: i,
            predictedIssuance: Math.round(allCerts.length * (1 + growthRate * i))
        });
    }
    res.json({
        success: true,
        currentCount: allCerts.length,
        predictions,
        statistics: {
            growthRate: '5.0%',
            totalPredicted12Months: predictions[11].predictedIssuance
        },
        insights: { trend: 'increasing' }
    });
});

// ==================== SERVER START ====================
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════════╗
    ║           🚀 CERTICHAIN PRO STARTED! 🚀                  ║
    ╠══════════════════════════════════════════════════════════╣
    ║  🌐 Main Page: http://localhost:${PORT}                     ║
    ║                                                          ║
    ║  🔐 Role-Based Access:                                   ║
    ║  📌 Super Admin: http://localhost:${PORT}/auth/superadmin  ║
    ║  📌 Admin: http://localhost:${PORT}/auth/admin            ║
    ║  📌 Verifier: http://localhost:${PORT}/auth/verifier      ║
    ║                                                          ║
    ║  👤 Default Accounts:                                    ║
    ║  ┌────────────────────────────────────────────────────┐  ║
    ║  │ Super Admin: batch4@gmail.com                      │  ║
    ║  │ Password: batch4                                   │  ║
    ║  ├────────────────────────────────────────────────────┤  ║
    ║  │ Admin: admin@certificate.com                       │  ║
    ║  │ Password: Admin@123                                │  ║
    ║  ├────────────────────────────────────────────────────┤  ║
    ║  │ Verifier: verifier@certificate.com                 │  ║
    ║  │ Password: Verifier@123                             │  ║
    ║  └────────────────────────────────────────────────────┘  ║
    ╚══════════════════════════════════════════════════════════╝
    `);
});