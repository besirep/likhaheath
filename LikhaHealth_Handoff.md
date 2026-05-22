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
- Built-in SMS Notification Triggers

---

## 2. Technology Stack

The project operates as a monorepo utilizing npm workspaces (`client` and `server`).

**Frontend:**
- **Framework:** React 19 + Vite (JSX, no TypeScript)
- **Styling:** Vanilla CSS-in-JS / Custom CSS (LikhaHealth Design System)
- **State Management:** React Context (`useAuth`), local component state
- **Routing:** React Router DOM (with protected route guards)
- **Icons:** `lucide-react`

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
├── package.json            # Monorepo root package (concurrently scripts)
└── start.bat               # Windows batch script for easy startup
```

---

## 4. Recent Development Updates

The project has made significant strides in completing **Phase 2 (Patient & Queue Core)**, **Phase 3 (Doctor Module)** and **Phase 4 (SMS Notifications)**.

### Key Accomplishments (Latest Handoff Updates):
1. **Receptionist UI Stabilization & Bug Fixes:**
   - **Reports Screen:** Removed redundant nested sidebars that caused rendering collisions with the global App layout. Fixed syntax and JSX structuring errors. Replaced emoji-string icons with proper `lucide-react` components across all statistical cards.
   - **SMS Logs Screen:** Standardized icon rendering by replacing raw strings and emoji tags with proper `lucide-react` components (`Bell`, `Clock`, `Smartphone`). Resolved outer wrapper viewport issues.
   - **Patient Records Screen:** Fixed major React crashes caused by passing component functions instead of JSX elements in timelines and quick-info arrays. Corrected priority badge accessors and finalized the timeline UI.
2. **API Integrations:**
   - Added `queueController.js` and `smsController.js` logic on the backend.
   - Connected the frontend API services (`dashboard.js`, `queue.js`, `sms.js`) to live endpoints, allowing real data to flow into the Receptionist and Doctor views.
3. **Doctor Module Workflow:**
   - The Doctor Dashboard, Queue, Consultations, and Patient Records screens have been aligned to the unified UI layouts. 
4. **Layout Architecture Check:**
   - Standardized all `minHeight: "100vh"` outer wrappers inside individual screen components to `height: "100%"` to properly integrate with `App.jsx`'s routing shell without causing overflow scrolling issues.

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
   - Import any new migration scripts (e.g. `database/migration_sms_notifications.sql`).
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

---

## 6. Pending Items & Unwired Connections

We are currently bridging **Phase 2 & Phase 3**, focusing strictly on **API Data Binding**. While the UI for all screens is finished and the backend controllers exist, the following pages still contain static placeholder arrays or lack `fetch()` calls to the backend:

### 1. Patient Registration (Unwired)
- **`PatientRegistration.jsx`**: The multi-step form manages state perfectly, but the final "Register Patient" button does not yet execute a `POST /api/patients` request. It needs to be connected to insert data into the MySQL `patients` and `addresses` tables.

### 2. Appointments System (Mock Data)
- **`ReceptionistAppointments.jsx` & `DoctorAppointments.jsx`**: Both screens currently render from a hardcoded `const appointments = [...]` array at the top of the file. 
- Needs to be wired to `GET /api/appointments` to fetch live schedules from the database.
- The "Book Appointment" modal needs to trigger `POST /api/appointments`.

### 3. Medical Consultations (Unwired)
- **`DoctorConsultations.jsx`**: The doctor's consultation form (Diagnosis, Prescription, Notes) does not yet submit data to the backend. It needs to be hooked to `POST /api/medical-records`.

### 4. Reports & Analytics (Mock Data)
- **`ReceptionistReports.jsx`**: The charts and statistical cards render successfully but do not pull data from the backend. They need to be wired to `GET /api/dashboard/stats` and `GET /api/reports`.
- "Export as CSV" and "Print Report" buttons are currently stubbed.

### 5. SMS Notifications (Configuration Pending)
- While `smsController.js` and `ReceptionistSMSLogs.jsx` are implemented and communicating, the actual `SMS_API_KEY` for the Semaphore PH gateway is missing from the `.env` file, meaning messages won't actually reach physical mobile phones until configured.

---

## 7. Current Project Phase

> **Current Phase:** We are in **Phase 2.5 (Data Binding & Form Wiring)**. 
> The Database is normalized (Phase 1 ✅), UI dashboards are built, and the Queue logic is wired. The primary focus now is replacing hardcoded frontend state with `fetch()` calls for Registration, Appointments, and Consultations.

## 7. Known Issues & Important Notes

- **Component Icon Constraints:** When adding new status or priority tags, **always** ensure that `icon` configurations map to mounted React elements (e.g., `<Stethoscope size={16} />`) and **NOT** bare component references or strings, which can cause React runtime crashes.
- **Network Constraints:** The project relies on local hardware and local network connections. Ensure the host machine running XAMPP has a static LAN IP so other computers in the clinic can reliably reach the Vite frontend and Express API.
- **Port Conflicts:** Ensure port `5000` (Backend API) and `5173` (Vite Frontend) are free.

---
*Generated by Antigravity AI Assistant*
