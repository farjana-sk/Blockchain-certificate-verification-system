console.log("🧪 Running Certificate Verification Tests...\n");

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'package.json',
  'server.js',
  'public/index.html',
  'public/admin.html',
  'public/admin-login.html',
  '.env'
];

const requiredDirs = [
  'data',
  'public/qr-codes'
];

console.log("📁 File System Check:");
let allFilesExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

requiredDirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`  ${exists ? '✅' : '❌'} ${dir}/`);
  if (!exists) allFilesExist = false;
});

console.log("\n📦 Dependencies Check:");
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = ['express', 'express-session', 'bcryptjs', 'dotenv', 'qrcode', 'fs-extra'];
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`  ✅ ${dep} is in dependencies`);
    } else {
      console.log(`  ⚠️  ${dep} not found in dependencies`);
    }
  });
} catch (error) {
  console.log("  ❌ Error reading package.json");
}

console.log("\n" + "=".repeat(50));
console.log("📊 TEST SUMMARY:");
console.log("=".repeat(50));

if (allFilesExist) {
  console.log("🎉 All required files and directories are present!");
  console.log("\n🚀 To start your application:");
  console.log("   1. Install dependencies: npm install");
  console.log("   2. Make sure .env file is configured");
  console.log("   3. Start server: node server.js");
  console.log("   4. Open browser: http://localhost:3000");
  console.log("   5. Admin login: http://localhost:3000/admin/login");
  console.log("\n✨ New Features:");
  console.log("   • Persistent Storage - Certificates saved to data/certificates.json");
  console.log("   • QR Code Generation - Unique QR for each certificate");
  console.log("   • QR Code Verification - Scan with camera or upload");
  console.log("   • Full Timestamp Tracking - Creation and modification times");
} else {
  console.log("⚠️  Some files/directories are missing. Please check above.");
}

console.log("\n✅ Test script completed!");