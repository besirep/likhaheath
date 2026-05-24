# LikhaHealth — Patient Management System

**Angono Municipal Health Center | Capstone Project**

A full-stack web application that automates patient record-keeping, queue management, and clinical consultation workflows for the Angono Municipal Health Center.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Backend | Node.js + Express.js |
| Database | MySQL 8.x (XAMPP) |
| Auth | JWT + bcryptjs |
| Icons | lucide-react |
| Charts | recharts |

---

## Features

### Receptionist Portal
- **Dashboard** — Live queue overview, stats, now-serving banner
- **Patient Registration** — Multi-step form (demographics → address → contacts → cluster)
- **Queue Management** — View all patients, call next, update status, send SMS, filter by status
- **Patient Records** — Search, view, and manage patient master records
- **Appointments** — Create, view, confirm, and cancel scheduled appointments
- **SMS Logs** — View history of all outbound SMS notifications with delivery status
- **Reports** — Daily/weekly/monthly patient and queue statistics

### Doctor Portal
- **Dashboard** — Active queue, scheduled appointments, completion stats
- **My Queue** — Assigned patients, vitals view, start consultation
- **Consultations** — Diagnosis form, treatment plan, clinical notes, follow-up scheduling
- **Patient Records** — Full medical history with vitals trends
- **Appointments** — Personal schedule management

---

## Project Structure

```
likhahealth/
├── client/       # React frontend (Vite)
│   └── src/
│       ├── lib/api/         # API service modules
│       ├── lib/utils/       # Utility helpers
│       ├── screens/auth/    # Login
│       ├── screens/receptionist/  # 7 receptionist screens
│       └── screens/doctor/        # 5 doctor screens
├── server/       # Node.js + Express backend
│   ├── controllers/  # Business logic
│   ├── middleware/    # JWT auth
│   ├── routes/        # REST endpoints
│   └── config/        # Database pool
├── database/     # SQL schema and seed files
└── start.bat     # Quick-start script (Windows)
```

---

## Getting Started

### 1. Database Setup (XAMPP)
1. Start **Apache** and **MySQL** in XAMPP
2. Open `http://localhost/phpmyadmin`
3. Create database `likhahealth`
4. Run `database/schema.sql` to create all tables
5. Run `database/seed.sql` to load sample data

### 2. Environment
```bash
# Copy and configure server environment
cp server/.env.example server/.env
# Edit server/.env with your MySQL credentials, JWT_SECRET, etc.
```

### 3. Install & Run
```bash
# Install all dependencies (client + server)
npm run install:all

# Start both client and server concurrently
npm start
# → Frontend: http://localhost:5173
# → Backend:  http://localhost:5000
```

Or use the Windows batch script:
```bash
start.bat
```

---

## Default Credentials (Seed Data)

| Role | Username | Password |
|------|----------|----------|
| Doctor | `drreyes` | `password123` |
| Receptionist | `ana.staff` | `password123` |

---

## Current Phase

> ✅ Phase 1: Database Design & Normalization  
> ✅ Phase 2: UI Development (all screens)  
> ✅ Phase 2.5: API Data Binding  
> ✅ Phase 3a: Bug Fixes & UI Stabilization  
> 🔲 Phase 3b: SMS Gateway & Final Polish  
> 🔲 Phase 4: Deployment & UAT

See [LikhaHealth_Handoff.md](LikhaHealth_Handoff.md) for detailed documentation.

---

## License

This project is developed as a capstone project for academic purposes.
