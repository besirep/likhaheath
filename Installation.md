# LikhaHealth — Step-by-Step Installation Guide

**Patient Management System | Angono Municipal Health Center**
**Capstone Project Handoff Document**

---

## Overview

LikhaHealth is a full-stack web application for patient record-keeping, queue management, and clinical consultation workflows. It runs locally on a single PC or across a LAN network.

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Backend | Node.js + Express.js |
| Database | MySQL 8.x (via XAMPP) |
| Authentication | JWT + bcryptjs |

---

## Prerequisites

You need to install **two software packages** before running the system:

| Software | Version | Download Link | Notes |
|---------|---------|--------------|-------|
| **XAMPP** | 8.x | https://www.apachefriends.org | Provides Apache + MySQL |
| **Node.js** | v20 LTS | https://nodejs.org | Choose the **LTS** version |

> [!IMPORTANT]
> Install both XAMPP and Node.js **before** proceeding. Restart your PC after installing Node.js to ensure it is added to your system PATH.

---

## Step 1 — Install XAMPP

1. Download and run the **XAMPP installer** from https://www.apachefriends.org
2. During installation, make sure **Apache** and **MySQL** are checked (they are by default)
3. Complete the installation (default install path: `C:\xampp`)
4. Open **XAMPP Control Panel** from the Start Menu or Desktop shortcut
5. Click **Start** next to both **Apache** and **MySQL**
6. Both modules should show a green background — this confirms they are running

![XAMPP Control Panel showing Apache and MySQL running](https://www.apachefriends.org/images/xampp-logo-ac950edf.svg)

> [!NOTE]
> Keep the XAMPP Control Panel open in the background whenever you use LikhaHealth. MySQL must be running for the application to work.

---

## Step 2 — Install Node.js

1. Go to https://nodejs.org and download the **LTS version** (e.g., v20.x.x)
2. Run the installer — accept all defaults
3. **Restart your PC** after installation

### Verify the installation
Open **Command Prompt** (press `Win + R`, type `cmd`, press Enter) and run:

```
node -v
npm -v
```

You should see version numbers like `v20.x.x` and `10.x.x`. If you see an error, reinstall Node.js and restart again.

---

## Step 3 — Get the Project Files

> [!IMPORTANT]
> If you received the project as a **ZIP file**, extract it to a simple path like `C:\likhahealth`. Avoid paths with spaces or special characters (e.g., do **not** use `C:\My Documents\Capstone Project\`).

If you are cloning from Git:
```
git clone <repository-url> C:\likhahealth
```

After extracting/cloning, your folder structure should look like:
```
C:\likhahealth\           ← project root
├── client\               ← React frontend
├── server\               ← Node.js backend
├── database\
│   ├── schema.sql        ← Creates all database tables
│   └── seed.sql          ← Loads initial accounts and sample data
├── adviser-start.bat     ← Quick-start script
└── package.json
```

---

## Step 4 — Set Up the Database

### 4a. Open phpMyAdmin
1. Make sure XAMPP is running (Step 1)
2. Open your browser and go to: **http://localhost/phpmyadmin**
3. You should see the phpMyAdmin dashboard

### 4b. Import the Schema (creates tables)
1. In phpMyAdmin, click the **SQL** tab at the top
2. Click **Choose File** (or the file icon)
3. Navigate to your project folder and select **`database/schema.sql`**
4. Click **Go** / **Execute**
5. Wait for it to finish — you should see a green success message
6. A new database called **`likhahealth`** will appear in the left panel

### 4c. Import the Seed Data (loads initial accounts)
1. Still in phpMyAdmin, click on the **`likhahealth`** database in the left panel
2. Click the **SQL** tab again
3. Click **Choose File** and select **`database/seed.sql`**
4. Click **Go** / **Execute**
5. Wait for the green success message

> [!NOTE]
> The schema file creates all tables from scratch. The seed file loads initial staff accounts and sample patient data. **Always run schema.sql first, then seed.sql.**

---

## Step 5 — Configure the Environment File

The server needs a configuration file to connect to the database.

1. Open the project folder in **File Explorer**
2. Go into the **`server`** folder
3. You should already see a file named **`.env`**

> [!NOTE]
> If `.env` is missing, copy `.env.example` (if present) and rename it to `.env`.

Open `.env` in any text editor (Notepad works) and verify these values:

```env
# Database — matches XAMPP defaults
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          ← Leave blank if you have NOT set a MySQL root password in XAMPP
DB_NAME=likhahealth

# Server
PORT=5000
NODE_ENV=development

# CORS — leave as localhost for same-machine use
CORS_ORIGIN=http://localhost:5173
```

> [!IMPORTANT]
> If you **have** set a MySQL root password in XAMPP, enter it after `DB_PASSWORD=`. Most fresh XAMPP installations have no password (leave it blank).

---

## Step 6 — Install Node.js Dependencies

Open **Command Prompt** and navigate to your project root folder:

```cmd
cd C:\likhahealth
```

Then run:

```cmd
npm run install:all
```

This installs all packages for both the **client** and **server**. It may take a few minutes on the first run. You will see a lot of text scrolling — this is normal.

> [!NOTE]
> You only need to run this once. On future startups, dependencies are already installed.

---

## Step 7 — Start the Application

You have **two options**:

### Option A — Double-click the batch script (Easiest)

In your project folder, **double-click** `adviser-start.bat`

A command prompt window will open automatically and start both the backend server and the frontend. Wait until you see output like:
```
  VITE v8.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### Option B — Run from Command Prompt

```cmd
cd C:\likhahealth
npm start
```

### Access the Application

Once started, open your browser and go to:

| URL | Purpose |
|-----|---------|
| **http://localhost:5173** | Main application (use this) |
| http://localhost:5000/api/health | API health check (should return `{"status":"ok"}`) |

> [!NOTE]
> Keep the command prompt window open while using the app. Closing it will stop the server.

---

## Step 8 — Log In

All default accounts use the same password:

| Role | Username | Password |
|------|----------|----------|
| **Admin (MHO)** | `admin` | `LikhaHealth2025!` |
| **Doctor** | `ramon.delacruz` | `LikhaHealth2025!` |
| **Doctor** | `maria.santos` | `LikhaHealth2025!` |
| **Doctor** | `jose.reyes` | `LikhaHealth2025!` |
| **Nurse** | `ana.bautista` | `LikhaHealth2025!` |
| **Nurse** | `cynthia.flores` | `LikhaHealth2025!` |
| **Midwife** | `luisa.garcia` | `LikhaHealth2025!` |
| **Midwife** | `maribel.torres` | `LikhaHealth2025!` |

> [!WARNING]
> These are development/demo credentials. For any real deployment, change all passwords through the Admin portal immediately after first login.

---

## Stopping the Application

Press **`Ctrl + C`** in the command prompt window, then type `Y` and press Enter.

You can also just close the command prompt window.

---

## Troubleshooting

### ❌ "node is not recognized as an internal or external command"
- Node.js is not installed or not in PATH
- Reinstall Node.js and **restart your PC**

### ❌ "npm run install:all" fails with ENOENT or network errors
- Check your internet connection
- Try running: `npm install` inside the `client` folder, then again inside the `server` folder

### ❌ Browser shows "Cannot connect to server" or blank page
- The backend may still be starting up — wait 10–15 seconds and refresh
- Check that the command prompt window is still open and running

### ❌ "Access denied for user 'root'@'localhost'"
- Your MySQL root password is set but `DB_PASSWORD` in `server/.env` is blank
- Open XAMPP → MySQL → Config to check your root password, then update `.env`

### ❌ phpMyAdmin SQL import fails
- Make sure you ran `schema.sql` first before `seed.sql`
- Try the **Import** tab in phpMyAdmin instead of the SQL tab (File → Choose File → Go)

### ❌ Database tables already exist / conflict
- The `schema.sql` file drops and recreates all tables — it is safe to run again
- In phpMyAdmin, drop the `likhahealth` database first, then re-import both SQL files

---

## Quick Reference Card

```
EVERY TIME you want to use LikhaHealth:

1. Open XAMPP Control Panel → Start Apache + MySQL
2. Double-click adviser-start.bat  (or run: npm start)
3. Open browser → http://localhost:5173
4. Log in with your credentials

TO STOP:
  Press Ctrl+C in the command prompt window, or close it.
```

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Windows 10 | Windows 10/11 |
| RAM | 4 GB | 8 GB |
| Disk Space | 2 GB free | 5 GB free |
| Browser | Chrome 90+ | Latest Chrome / Edge |

---

*LikhaHealth — Capstone Project | Angono Municipal Health Center*
*Prepared for subject adviser handoff — July 2026*
