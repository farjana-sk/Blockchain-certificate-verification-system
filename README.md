# 🔐 Blockchain Certificate Verification System

The Blockchain Certificate Verification System is a secure digital certificate verification platform developed using Node.js, Express.js, HTML, CSS, and JavaScript.

The system helps verify digital certificates and reduce the risk of certificate forgery, duplication, and unauthorized modification.

## ✨ Features

- Secure certificate validation
- Certificate creation and management
- Certificate verification portal
- Super Admin dashboard
- Admin certificate management
- Verifier module
- Role-based access control
- SHA-256 based security
- Tamper detection
- AI-assisted verification
- Face ID authentication

## 🛠️ Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- Express.js

### Data Storage
- JSON-based storage

### Security
- SHA-256 Hashing

## 🏗️ Project Architecture

User
↓
Role-Based Access
↓
Super Admin / Admin / Verifier
↓
Certificate Management
↓
SHA-256 Hashing
↓
Certificate Verification
↓
Verification Result

## 📁 Project Structure

Blockchain-certificate-verification-system/
│
├── models/
├── public/
├── .gitignore
├── CertificateVerification_metadata.json
├── download-models.js
├── package.json
├── server.js
├── test.js
└── README.md

## ⚙️ How to Run the Project

### 1. Clone the repository

git clone https://github.com/farjana-sk/Blockchain-certificate-verification-system.git

### 2. Open the project

cd Blockchain-certificate-verification-system

### 3. Install dependencies

npm install

### 4. Start the application

node server.js

### 5. Open in browser

http://localhost:3000

## 🔄 Application Workflow

1. User accesses the certificate verification system.
2. User selects the appropriate role.
3. Admin manages certificate information.
4. Certificate data is processed using SHA-256 hashing.
5. Verifier submits certificate details for verification.
6. The system validates the certificate information.
7. The system displays the verification result.

## 🗄️ Data Storage

The project uses JSON-based storage for managing certificate-related information.

SHA-256 hashing is used to generate a secure hash for certificate verification and tamper detection.

## 🎯 Project Objectives

- Develop a secure digital certificate verification system.
- Reduce the risk of certificate forgery and duplication.
- Implement secure certificate validation.
- Apply SHA-256 hashing for data integrity.
- Implement role-based access control.
- Develop a practical Node.js and Express.js application.

## 📸 Screenshots

Screenshots of the application can be found in the project repository.

## 🚀 Future Enhancements

- Blockchain-based certificate storage
- Smart contract integration
- QR-code based certificate verification
- Cloud database integration
- Email-based certificate delivery
- Advanced verification history
- Enhanced AI-based document verification
- Improved biometric authentication

## 👩‍💻 Developer

SK Farjana

B.Tech - Computer Science and Engineering
Specialization: Artificial Intelligence & Machine Learning

## 📄 License

This project is developed for educational and portfolio purposes.
