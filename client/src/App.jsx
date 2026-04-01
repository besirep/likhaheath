import { useState } from "react";

// Auth
import Login from "./screens/auth/Login.jsx";

// Receptionist screens
import ClinicDashboard from "./screens/receptionist/ClinicDashboard.jsx";
import PatientRegistration from "./screens/receptionist/PatientRegistration.jsx";
import ReceptionistAppointments from "./screens/receptionist/ReceptionistAppointments.jsx";
import ReceptionistPatientRecords from "./screens/receptionist/ReceptionistPatientRecords.jsx";
import ReceptionistQueue from "./screens/receptionist/ReceptionistQueue.jsx";
import ReceptionistReports from "./screens/receptionist/ReceptionistReports.jsx";
import ReceptionistSMSLogs from "./screens/receptionist/ReceptionistSMSLogs.jsx";

// Doctor screens
import DoctorAppointments from "./screens/doctor/DoctorAppointments.jsx";
import DoctorConsultations from "./screens/doctor/DoctorConsultations.jsx";
import DoctorDashboard from "./screens/doctor/DoctorDashboard.jsx";
import DoctorPatientRecords from "./screens/doctor/DoctorPatientRecords.jsx";
import DoctorQueue from "./screens/doctor/DoctorQueue.jsx";

// ── Role-based screen config ──────────────────────────────────────────────────
const SCREEN_MAP = {
  receptionist: [
    { id: "dashboard", label: "Dashboard",        icon: "⊞",  Component: ClinicDashboard },
    { id: "register",  label: "Register Patient", icon: "➕",  Component: PatientRegistration },
    { id: "queue",     label: "Queue",            icon: "📋",  Component: ReceptionistQueue },
    { id: "records",   label: "Patient Records",  icon: "🗂️", Component: ReceptionistPatientRecords },
    { id: "appts",     label: "Appointments",     icon: "📅",  Component: ReceptionistAppointments },
    { id: "sms",       label: "SMS Logs",         icon: "📱",  Component: ReceptionistSMSLogs },
    { id: "reports",   label: "Reports",          icon: "📊",  Component: ReceptionistReports },
  ],
  doctor: [
    { id: "dr-dashboard", label: "Dashboard",       icon: "⊞",  Component: DoctorDashboard },
    { id: "dr-queue",     label: "My Queue",        icon: "📋",  Component: DoctorQueue },
    { id: "dr-consult",   label: "Consultations",   icon: "🩺",  Component: DoctorConsultations },
    { id: "dr-records",   label: "Patient Records", icon: "🗂️", Component: DoctorPatientRecords },
    { id: "dr-appts",     label: "Appointments",    icon: "📅",  Component: DoctorAppointments },
  ],
};

const ROLE_META = {
  receptionist: { label: "Medical Staff", color: "#2a9d8f", accent: "#52c4b8", badge: "RECEPTIONIST", badgeBg: "rgba(42,157,143,0.2)", badgeColor: "#52c4b8" },
  doctor:       { label: "Doctor",        color: "#3b7dd8", accent: "#5a9ae8", badge: "PHYSICIAN",    badgeBg: "rgba(59,125,216,0.2)",  badgeColor: "#5a9ae8" },
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ user, screens, activeId, onSelect, onLogout }) {
  const meta = ROLE_META[user.role];

  return (
    <div style={{
      width: 230, flexShrink: 0,
      background: "#1e2d40",
      display: "flex", flexDirection: "column",
      overflowY: "auto", zIndex: 100,
      boxShadow: "4px 0 20px rgba(0,0,0,0.18)",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${meta.color}, ${meta.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: `0 4px 14px ${meta.color}55` }}>🏥</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "white", fontFamily: "'Fraunces', serif" }}>LikhaHealth</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Angono MHC</div>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ padding: "10px 16px" }}>
        <div style={{ background: meta.badgeBg, border: `1px solid ${meta.color}44`, borderRadius: 8, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: meta.accent }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: meta.badgeColor, letterSpacing: 0.6 }}>{meta.badge}</span>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "4px 10px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 0.8, textTransform: "uppercase", padding: "8px 8px 6px" }}>
          Navigation
        </div>
        {screens.map(item => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                width: "100%", padding: "9px 10px", borderRadius: 9, marginBottom: 2,
                cursor: "pointer", border: "none",
                background: isActive ? `${meta.color}33` : "transparent",
                color: isActive ? meta.accent : "rgba(255,255,255,0.55)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                textAlign: "left", transition: "all 0.15s", outline: "none",
                boxShadow: isActive ? `inset 0 0 0 1px ${meta.color}55` : "none",
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; } }}
            >
              <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${meta.color}88, ${meta.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>
            {user.initials}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{user.title}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: "100%", padding: "8px 12px", borderRadius: 9,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,80,60,0.15)"; e.currentTarget.style.borderColor = "rgba(220,80,60,0.3)"; e.currentTarget.style.color = "#f08080"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
        >
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const handleLogin = account => {
    setUser(account);
    setActiveId(SCREEN_MAP[account.role][0].id);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveId(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const screens = SCREEN_MAP[user.role];
  const meta = ROLE_META[user.role];
  const activeScreen = screens.find(s => s.id === activeId);
  const Screen = activeScreen?.Component;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f4f7fb", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <Sidebar user={user} screens={screens} activeId={activeId} onSelect={setActiveId} onLogout={handleLogout} />

      {/* Page content */}
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        {/* Breadcrumb bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(244,247,251,0.92)", backdropFilter: "blur(8px)",
          borderBottom: "1px solid #dde8e5",
          padding: "8px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 12, color: "#7a8fb0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>LikhaHealth</span>
            <span style={{ color: "#cdd6e0" }}>›</span>
            <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</span>
            <span style={{ color: "#cdd6e0" }}>›</span>
            <span style={{ color: "#1e2d40", fontWeight: 600 }}>{activeScreen?.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: meta.badgeBg || "rgba(42,157,143,0.1)", borderRadius: 8, padding: "4px 10px" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: meta.accent }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: meta.accent, letterSpacing: 0.5 }}>{meta.badge} · {user.name}</span>
          </div>
        </div>

        {/* Screen content — pass onNavigate so screens can cross-navigate */}
        {Screen && <Screen key={activeId} onNavigate={setActiveId} user={user} />}
      </div>
    </div>
  );
}
