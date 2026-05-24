# LikhaHealth — Project Handoff Document

**Angono Municipal Health Center Patient Management System**

This document provides a comprehensive overview of the LikhaHealth project's current state, recent development updates, technical architecture, and pending tasks to facilitate a smooth handoff for future development or production deployment.

---

## 1. Project Overview

LikhaHealth is a locally-deployed (LAN-only) web application designed to digitize patient management for the Angono Municipal Health Center. It replaces manual paper-based queueing and records with a secure, role-based digital system.

**Core Features:**
- Patient Registration & Demographics Management
- Live Queue Management (receptionist + doctor views)
- Role-based Access Control (Admin, Doctor, Nurse, Midwife, BHW)
- Medical Records & Consultation Tracking
- Built-in SMS Notification Triggers
- Operational Reports & Analytics

---

## 2. Technology Stack

The project operates as a monorepo utilizing npm workspaces (`client` and `server`).

**Frontend:**
- **Framework:** React 19 + Vite (JSX, no TypeScript)
- **Styling:** Vanilla CSS-in-JS / Custom CSS (LikhaHealth Design System)
- **State Management:** React Context (`useAuth`), local component state
- **Routing:** Custom screen-based routing via `App.jsx` (SCREEN_MAP + sidebar navigation)
- **Icons:** `lucide-react`
- **Charts:** `recharts` (Reports & Patient Records vitals trends)

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
│   │   ├── lib/
│   │   │   ├── api/        # API service modules (apiFetch, appointments, consultations, dashboard, patients, queue, sms)
│   │   │   └── utils/      # Utility modules (printUtils)
│   │   ├── screens/
│   │   │   ├── auth/       # Login screen
│   │   │   ├── receptionist/  # ClinicDashboard, PatientRegistration, ReceptionistQueue,
│   │   │   │                  # ReceptionistAppointments, ReceptionistPatientRecords,
│   │   │   │                  # ReceptionistReports, ReceptionistSMSLogs
│   │   │   └── doctor/     # DoctorDashboard, DoctorQueue, DoctorConsultations,
│   │   │                   # DoctorPatientRecords, DoctorAppointments
│   │   └── App.jsx         # Main router, global sidebar, auth guard
│   └── package.json
├── server/                 # Express.js Backend
│   ├── config/             # Database connection pool
│   ├── controllers/        # Route logic (auth, appointments, consultations, dashboard, patients, queue, reports, sms)
│   ├── middleware/         # JWT auth middleware
│   ├── routes/             # Express routers
│   ├── server.js           # Express entry point
│   └── package.json
├── database/               # Database definitions
│   ├── schema.sql          # DB schema (14 normalized tables)
│   └── seed.sql            # Initial test data
├── package.json            # Monorepo root package (concurrently scripts)
├── start.bat               # Windows batch script for easy startup
├── implementation_plan.md  # Full system requirements & implementation plan
└── mhc_phase1_diagrams.md  # Architecture & data flow diagrams
```

---

## 4. Application Architecture

### Routing & Navigation

`App.jsx` manages all routing via a `SCREEN_MAP` object that maps screen IDs to components per role:

| Receptionist Screens | Doctor Screens |
|---------------------|----------------|
| `dashboard` → ClinicDashboard | `dr-dashboard` → DoctorDashboard |
| `register` → PatientRegistration | `dr-queue` → DoctorQueue |
| `queue` → ReceptionistQueue | `dr-consult` → DoctorConsultations |
| `records` → ReceptionistPatientRecords | `dr-records` → DoctorPatientRecords |
| `appts` → ReceptionistAppointments | `dr-appts` → DoctorAppointments |
| `sms` → ReceptionistSMSLogs | `dr-reports` → ReceptionistReports |
| `reports` → ReceptionistReports | — |

All screens receive an `onNavigate` prop (bound to `setActiveId`) for cross-screen navigation. The global `Sidebar` is rendered once by `App.jsx` — individual screens **must not** render their own sidebars.

### Key Data Flows

1. **Patient Registration:** `PatientRegistration` → `POST /api/patients` → creates patient record in DB
2. **Queue Flow:** `ReceptionistQueue` → `GET /api/queue/today` → displays queue → status updates via `PATCH /api/queue/:id/status`
3. **Doctor Consultation:** `DoctorQueue` → "Start Consultation" → `PATCH /api/consultations/queue/:id/status` (In-Progress) → navigates to `DoctorConsultations` → `POST /api/consultations` (saves medical record, marks Done)
4. **Active Patient Persistence:** `activePatient` stored in `sessionStorage` so page refresh during consultation doesn't lose context

---

## 5. Recent Development Updates (May 2026)

### Bug Fixes Completed — Receptionist Side ✅

| # | Screen | Bug | Root Cause | Fix |
|---|--------|-----|------------|-----|
| 1 | Appointments | White screen crash | Component defined as `ApptDrawer`, rendered as `AppointmentDrawer` → `ReferenceError` | Renamed function to `AppointmentDrawer` |
| 2 | Queue | Missing `Check` icon crash | `<Check />` used but not imported from lucide-react | Added `Check` to imports |
| 3 | Reports | "Today" filter showed inflated totals | `periodRows` always kept 7 entries even for "today" | Added `period === "today"` → slice to 1 row |
| 4 | ClinicDashboard | Toast showed raw JSX tags as text | JSX inside template literal strings | Replaced with emoji indicators |
| 5 | Queue | "Call Next" button hidden when no vitals recorded | Condition was `vitalsDone > 0` only | Changed to `(waiting + vitalsDone) > 0` |
| 6 | Queue, PatientRecords | Dead `Sidebar()` functions (53+ lines each) | Orphaned code — `App.jsx` provides global sidebar | Removed from all files |

### Bug Fixes Completed — Doctor Side ✅

| # | Screen | Bug | Root Cause | Fix |
|---|--------|-----|------------|-----|
| 1 | Queue | `TestTubes` icon crash in notifications | Missing import | Added `TestTubes` to imports |
| 2 | Queue | "Start Consultation" buttons crash | `startConsult` out of scope in `DetailPanel` child | Passed as `onStartConsult` prop |
| 3 | Queue | Filter tab showed raw JSX as text | JSX in string literal | Replaced with emoji `🩺` |
| 4 | Queue | Priority badges showed `undefined` | Missing `icon` emoji field in `priorityConfig` | Added emoji field (`👴`, `🤰`, `♿`, `👶`) |
| 5 | Queue | Dead `Sidebar()` function | Orphaned code | Removed |
| 6 | Dashboard | Dead `Sidebar()` + leftover fragments | Orphaned code + garbage from removal | Cleaned up |
| 7 | PatientRecords | White screen — missing `Building2`, `FolderOpen`, `ClipboardList` imports | Used in JSX but never imported → `ReferenceError` | Added all 3 to import line |
| 8 | PatientRecords | Vitals cards showed `[object Object]` | `icon: Heart` (component ref) rendered as `{f.icon}` | Changed to `Icon: Heart`, render as `<f.Icon />` |
| 9 | Consultations | White screen when starting active consultation | `r.patient.name` crashes if `patient` is null; ErrorBoundary too narrow | Added `?.` optional chaining; expanded ErrorBoundary |

---

## 6. How to Run the Project Locally

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

## 7. Current Project Phase

> **Current Phase:** **Phase 3 — QA, Polish & Pre-Deployment** ✅
>
> - ✅ Phase 1: Database Design & Normalization
> - ✅ Phase 2: UI Development (all receptionist + doctor screens)
> - ✅ Phase 2.5: API Data Binding (Registration, Queue, Appointments, Consultations, Reports)
> - ✅ Phase 3a: Bug Fixes & UI Stabilization (all crash bugs resolved, build clean)
> - 🔲 Phase 3b: Final Polish & SMS Gateway Configuration
> - 🔲 Phase 4: Deployment & User Acceptance Testing

---

## 8. Remaining Next Steps

| # | Task | Priority | Description |
|---|------|----------|-------------|
| 1 | **Configure SMS Gateway** | High | Add the actual Semaphore API key to `SMS_API_KEY` in `server/.env` to enable real SMS delivery |
| 2 | **End-to-End Testing** | High | Full walkthrough of patient registration → queue → consultation → medical record save → reports |
| 3 | **Reports Live Data Cleanup** | Medium | Some placeholder values remain in receptionist reports (avg wait time, SMS count) |
| 4 | **Role Access Guards** | Medium | Doctors should not see receptionist-only screens; receptionists should not access consultation records |
| 5 | **Production Build & Deployment** | Low | Build production bundle, configure LAN static IP, set up XAMPP for production use |

---

## 9. Known Issues & Important Notes

- **Component Icon Pattern:** When adding icons, use `Icon: ComponentRef` + render as `<f.Icon size={16} />`. **Never** use bare component refs inside `{f.icon}` (renders `[object Object]`) or JSX inside template literal strings (renders raw text).
- **Sidebar Rule:** The global `Sidebar` is rendered once by `App.jsx`. Individual screen components **must not** define or render their own `Sidebar()` functions — this causes double sidebars and layout collisions.
- **Network Constraints:** The project relies on local hardware and LAN connections. Ensure the host machine has a static LAN IP.
- **Port Configuration:** Backend API runs on port `5000`, Vite frontend on port `5173`. Ensure these ports are free.
- **Active Patient Persistence:** `sessionStorage` stores the active consultation patient. This survives page refresh but **not** tab close, which is the intended behavior.

---

*Last updated: May 25, 2026 — Generated by Antigravity AI Assistant*
