# LikhaHealth — Project Handoff Document

**Angono Municipal Health Center Patient Management System**

This document provides a comprehensive overview of the LikhaHealth project's current state, recent development updates, technical architecture, and pending tasks to facilitate a smooth handoff for future development or production deployment.

---

## 1. Project Overview

LikhaHealth is a locally-deployed (LAN-only) web application designed to digitize patient management for the Angono Municipal Health Center. It replaces manual paper-based queueing and records with a secure, role-based digital system.

**Core Features:**
- Patient Registration & Demographics Management
- Live Queue Management
- Role-based Access Control (Admin, Doctor, Nurse, Midwife, BHW)
- Medical Records & Consultation Tracking
- Built-in SMS Notification Triggers (Phase 4)

---

## 2. Technology Stack

The project operates as a monorepo utilizing npm workspaces (`client` and `server`).

**Frontend:**
- **Framework:** React 19 + Vite (JSX, no TypeScript)
- **Styling:** Vanilla CSS-in-JS / Custom CSS
- **State Management:** React Context (`useAuth`), local component state
- **Routing:** React Router DOM (with protected route guards)

**Backend:**
- **Runtime:** Node.js (v20 LTS)
- **Framework:** Express.js (CommonJS)
- **Database:** MySQL 8.x (served via XAMPP locally)
- **Authentication:** JWT (`jsonwebtoken`) + bcrypt (`bcryptjs` cost 12)
- **Database Access:** `mysql2` (promise pool)

---

## 3. Repository Structure

```
likhahealth-root/
├── client/                 # React 19 Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # Role-specific views (Receptionist, Doctor, etc.)
│   │   └── App.jsx         # Main router and Auth guard
│   └── package.json
├── server/                 # Express.js Backend
│   ├── controllers/        # Route logic and database queries
│   ├── middleware/         # Auth and error handling
│   ├── routes/             # Express routers
│   ├── server.js           # Express entry point
│   └── package.json
├── database/               # Database definitions
│   ├── schema.sql          # DB schema (14 normalized tables)
│   └── seed.sql            # Initial test data
├── implementation_plan.md  # Detailed system requirements and ERD
├── package.json            # Monorepo root package (concurrently scripts)
└── start.bat               # Windows batch script for easy startup
```

---

## 4. Recent Development Updates

The project has recently completed **Phase 1 (Foundation)** and is currently progressing through **Phase 2 (Patient & Queue Core)** and final QA stabilizing. 

### Key Accomplishments:
1. **Database Normalization & Initialization:**
   - Finalized a fully normalized 14-table MySQL schema.
   - Initialized database with seed data including staff, patients, addresses, and sample appointments.
2. **Authentication Integration:**
   - Implemented JWT-based authentication on the backend with bcrypt hashing.
   - Built a robust frontend `useAuth` hook and protected route middleware to enforce strict Role-Based Access Control (RBAC). 
   - Added portal mismatch guards (e.g., Doctors cannot log into Receptionist portals).
3. **Frontend UI & Layout Stabilization:**
   - Completed standardizing the brand identity (Angono municipality colors: Blue `#0047AB` and Red `#CC0000`).
   - Finalized responsive UI dashboards for Medical Staff (Receptionist) and Doctors.
4. **Patient Registration Workflow Updates:**
   - Conducted functional QA audits.
   - Remedied broken workflows and stubbed buttons in the Doctor and Receptionist interfaces to prepare for real-world LAN testing.

---

## 5. How to Run the Project Locally

Because this is a LAN-based clinical system, it relies on a local XAMPP installation for the database.

### Prerequisites:
1. **Node.js** (v20 LTS recommended)
2. **XAMPP** (Apache & MySQL running on default ports, `3306` for MySQL)

### Setup Steps:
1. **Database Setup:**
   - Start XAMPP and start the **MySQL** module.
   - Create a database named `likhahealth` (or check your `.env` configuration).
   - Import `database/schema.sql` followed by `database/seed.sql` to populate the tables.
2. **Environment Variables:**
   - Ensure the `server/.env` file is properly configured with your MySQL credentials, `JWT_SECRET`, and port information (refer to `server/.env.example` if available).
3. **Install Dependencies:**
   - From the root directory, run:
     ```bash
     npm run install:all
     ```
4. **Start the Application:**
   - To run both the client and server concurrently, execute:
     ```bash
     npm start
     ```
     *(This uses `concurrently` to run the React Vite server and Express backend simultaneously).*
   - Alternatively, you can use the `start.bat` file if on Windows.

---

## 6. Pending Items / Next Steps

According to the `implementation_plan.md`, the following phases require completion:

### Phase 2: Patient & Queue Core (In Progress)
- **Patient Registration:** Fully wire `PatientRegistration.jsx` to `POST /api/patients` with contact and address insertion logic.
- **Queue Management:** Wire real-time polling for `ReceptionistQueue.jsx` and status update actions (`PATCH /api/queue/:id/status`).
- **Appointments:** Connect the scheduling UI to backend CRUD endpoints.

### Phase 3: Doctor Module
- Connect `DoctorDashboard.jsx` to live stats.
- Wire `DoctorQueue.jsx` to show only assigned patients.
- Implement Medical Records creation (`POST /api/medical-records`) and consultation workflows.

### Phase 4: SMS Notifications
- Register Semaphore PH API key in `.env`.
- Implement automated SMS triggers upon registration, queue calls, and appointments.

### Phase 5 & 6: Reports, QA, & Deployment
- Implement dashboard reporting and CSV exports.
- Configure automatic daily MySQL backups via `mysqldump`.
- Conduct final end-to-end load testing.

---

## 7. Known Issues & Important Notes

- **Network Constraints:** The project relies on local hardware and local network connections. Ensure the host machine running XAMPP has a static LAN IP so other computers in the clinic can reliably reach the Vite frontend and Express API.
- **Port Conflicts:** Ensure port `5000` (Backend API) and `5173` (Vite Frontend) are free. Previous development encountered issues with port `3000` being occupied; this is now handled via the specific package.json scripts.
- **Queue Display System:** The public-facing waiting line TV display module is currently **ON HOLD** pending final hardware logistics at the Angono Municipal Health Center.

---
*Generated by Antigravity AI Assistant*
