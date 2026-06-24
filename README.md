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
- **Patient Registration** — Multi-step form (demographics → address → contacts)
- **Queue Management** — View all patients, call next, update status, send SMS, filter by status
- **Patient Records** — Search, view, and manage patient master records
- **Appointments** — Create, view, confirm, and cancel scheduled appointments
- **SMS Logs** — View history of all outbound SMS notifications with delivery status
- **Reports** — Daily/weekly/monthly patient and queue statistics with CSV/PDF export

### Doctor Portal
- **Dashboard** — Active queue, scheduled appointments, completion stats
- **My Queue** — Assigned patients, vitals view, start consultation
- **Consultations** — Diagnosis form, treatment plan, clinical notes, follow-up scheduling
- **Patient Records** — Full medical history with vitals trends

### Admin Portal
- **Staff Management** — Add, edit, and manage staff accounts and roles
- **Audit Logs** — View all system activity with role and date filters

---

## Project Structure

```
likhahealth/
├── client/       # React frontend (Vite)
│   └── src/
│       ├── lib/api/              # API service modules
│       ├── lib/utils/            # Utility helpers
│       ├── screens/auth/         # Login
│       ├── screens/receptionist/ # Receptionist screens
│       ├── screens/doctor/       # Doctor screens
│       └── screens/admin/        # Admin screens
├── server/       # Node.js + Express backend
│   ├── controllers/  # Business logic
│   ├── middleware/   # JWT auth
│   ├── routes/       # REST endpoints
│   ├── jobs/         # Scheduled background tasks (cron)
│   └── config/       # Database pool
├── database/     # SQL schema and seed files
└── start.bat     # Quick-start script (Windows)
```

---

## Getting Started

### Prerequisites
- **Node.js** v20 LTS
- **XAMPP** (Apache + MySQL running on default ports)

### 1. Database Setup (XAMPP)
1. Start **Apache** and **MySQL** in XAMPP
2. Open `http://localhost/phpmyadmin`
3. Run `database/schema.sql` — creates the database and all tables
4. Run `database/seed.sql` — loads initial staff accounts and sample data

> The schema file is fully consolidated. You do **not** need to run any files from `server/migrations/` separately.

### 2. Environment
```bash
# Copy and configure the server environment file
cp server/.env.example server/.env
# Edit server/.env with your MySQL credentials, JWT_SECRET, Semaphore API key, etc.
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

> **Note:** Default login credentials are defined in `database/seed.sql`. Passwords must meet complexity requirements (min 8 characters, uppercase, lowercase, number, and special character).

---

## Documentation

- [LikhaHealth_Handoff.md](LikhaHealth_Handoff.md) — Detailed project handoff, architecture, and next steps
- [mhc_phase1_diagrams.md](mhc_phase1_diagrams.md) — ERD, DFDs, and role-access matrix

---

## License

This project is developed as a capstone project for academic purposes.
