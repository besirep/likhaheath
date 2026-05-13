# LikhaHealth — Patient Management System

**Angono Municipal Health Center | Capstone Project**

A full-stack web application that automates patient record-keeping, improves data accuracy, and enhances healthcare service delivery.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite |
| Backend | Node.js + Express.js |
| Database | MySQL (XAMPP) |
| Auth | JWT + bcryptjs |

---

## Project Structure

```
likhaheath/
├── client/       # React frontend
├── server/       # Node.js + Express backend
└── database/     # SQL schema and seed files
```

---

## Getting Started

### 1. Database Setup (XAMPP)
1. Start **Apache** and **MySQL** in XAMPP
2. Open `http://localhost/phpmyadmin`
3. Run `database/schema.sql` to create all tables
4. Run `database/seed.sql` to load sample data

### 2. Backend
```bash
cd server
npm install
npm run dev
# → http://localhost:5000
```

### 3. Frontend
```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

---

