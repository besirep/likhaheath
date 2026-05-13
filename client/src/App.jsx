import { useState, useCallback } from "react";
import { useAuth } from "./lib/api/useAuth.js";

// Auth
import Login from "./screens/auth/Login.jsx";

// Receptionist screens
import ClinicDashboard            from "./screens/receptionist/ClinicDashboard.jsx";
import PatientRegistration        from "./screens/receptionist/PatientRegistration.jsx";
import ReceptionistAppointments   from "./screens/receptionist/ReceptionistAppointments.jsx";
import ReceptionistPatientRecords from "./screens/receptionist/ReceptionistPatientRecords.jsx";
import ReceptionistQueue          from "./screens/receptionist/ReceptionistQueue.jsx";
import ReceptionistReports        from "./screens/receptionist/ReceptionistReports.jsx";
import ReceptionistSMSLogs        from "./screens/receptionist/ReceptionistSMSLogs.jsx";

// Doctor screens
import DoctorAppointments  from "./screens/doctor/DoctorAppointments.jsx";
import DoctorConsultations from "./screens/doctor/DoctorConsultations.jsx";
import DoctorDashboard     from "./screens/doctor/DoctorDashboard.jsx";
import DoctorPatientRecords from "./screens/doctor/DoctorPatientRecords.jsx";
import DoctorQueue         from "./screens/doctor/DoctorQueue.jsx";

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
    { id: "dr-reports",   label: "Reports",         icon: "📊",  Component: ReceptionistReports },
  ],
};

const ROLE_META = {
  receptionist: { label: "Medical Staff", color: "#2a9d8f", accent: "#52c4b8",   badge: "RECEPTIONIST", badgeBg: "rgba(42,157,143,0.18)",  badgeColor: "#52c4b8" },
  doctor:       { label: "Doctor",        color: "#0047AB", accent: "#1565D8",   badge: "PHYSICIAN",    badgeBg: "rgba(0,71,171,0.18)",   badgeColor: "#1565D8" },
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
      {/* Brand wordmark */}
      <div style={{ padding: "0 0 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Municipality red accent stripe at top */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #CC0000 0%, #0047AB 100%)", borderRadius: "0 0 0 0" }} />
        <div style={{ padding: "16px 18px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          {/* Real SVG logo */}
          <img
            src="/logo.svg"
            alt="LikhaHealth logo"
            width={36}
            height={29}
            style={{ flexShrink: 0, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" }}
          />
          <div>
            {/* Wordmark: Likha (white) + Health (red) */}
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1 }}>
              <span style={{ color: "white" }}>Likha</span>
              <span style={{ color: "#FF4444" }}>Health</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.32)", marginTop: 3, letterSpacing: 0.3 }}>Angono MHC · PMS</div>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ padding: "10px 16px" }}>
        <div style={{ background: meta.badgeBg, border: `1px solid ${meta.color}44`, borderRadius: 8, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: meta.accent }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: meta.badgeColor, letterSpacing: 0.6 }}>{meta.badge}</span>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "8px 10px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, textTransform: "uppercase", padding: "0 8px 10px" }}>
          Navigation
        </div>
        {screens.map(item => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 12px", borderRadius: 8, marginBottom: 1,
                cursor: "pointer", border: "none",
                background: isActive
                  ? (user.role === 'doctor' ? "rgba(0,71,171,0.30)" : `${meta.color}28`)
                  : "transparent",
                color: isActive ? "white" : "rgba(255,255,255,0.45)",
                fontSize: 15, fontWeight: isActive ? 600 : 400,
                textAlign: "left", transition: "all 0.14s", outline: "none",
                position: "relative",
                borderLeft: isActive
                  ? `3px solid ${user.role === 'doctor' ? '#1565D8' : meta.accent}`
                  : "3px solid transparent",
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; } }}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: "center", opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
              <span style={{ letterSpacing: 0.1 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${meta.color}88, ${meta.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white", flexShrink: 0 }}>
            {user.initials}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{user.title}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: "100%", padding: "8px 12px", borderRadius: 9,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600,
            cursor: "pointer",
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
  // useAuth hydrates from localStorage on mount — no flash of login screen on refresh
  const { user, login, logout } = useAuth();
  const [activeId, setActiveId] = useState(null);

  // ── Registration session: persists form draft across tab switches ─────────
  const [registrationDraft, setRegistrationDraft] = useState(null);
  const clearDraft = useCallback(() => setRegistrationDraft(null), []);

  // ── Doctor consultation session: carries active patient from Queue → Consult
  const [activePatient, setActivePatient] = useState(null);
  const clearActivePatient = useCallback(() => setActivePatient(null), []);

  // Called by Login after a successful API login
  const handleLogin = (role) => async (username, password) => {
    const userObj = await login(username, password);

    // Guard: ensure the user is signing into the right portal
    if (userObj.role !== role) {
      logout(); // clear the just-stored token
      const portalLabel = userObj.role === 'doctor' ? 'Doctor' : 'Medical Staff';
      throw new Error(`This account belongs to the ${portalLabel} portal.`);
    }

    setActiveId(SCREEN_MAP[userObj.role][0].id);
    return userObj;
  };

  // Set default active screen when user hydrates from token
  const resolvedActiveId = activeId ?? (user ? SCREEN_MAP[user.role]?.[0]?.id : null);

  // ── Route guard: no user → show login ──────────────────────
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const screens      = SCREEN_MAP[user.role] ?? SCREEN_MAP.receptionist;
  const meta         = ROLE_META[user.role]  ?? ROLE_META.receptionist;
  const activeScreen = screens.find(s => s.id === resolvedActiveId);
  const Screen       = activeScreen?.Component;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f4f7fb", overflow: "hidden" }}>

      <Sidebar
        user={user}
        screens={screens}
        activeId={resolvedActiveId}
        onSelect={setActiveId}
        onLogout={logout}
      />

      {/* Page content */}
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        {/* Breadcrumb bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(244,247,251,0.92)", backdropFilter: "blur(8px)",
          borderBottom: "1px solid #dde8e5",
          padding: "8px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 14, color: "#7a8fb0",
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
            <span style={{ fontSize: 14, fontWeight: 700, color: meta.accent, letterSpacing: 0.5 }}>{meta.badge} · {user.name}</span>
          </div>
        </div>

        {/* Screen content — pass onNavigate + registration session */}
        {Screen && (
          activeScreen?.id === 'register'
            ? <PatientRegistration
                key="register-persistent"
                onNavigate={setActiveId}
                user={user}
                draft={registrationDraft}
                onDraftChange={setRegistrationDraft}
                onDraftClear={clearDraft}
              />
            : activeScreen?.id === 'dr-queue'
            ? <DoctorQueue
                key="dr-queue"
                onNavigate={setActiveId}
                onStartConsult={setActivePatient}
                user={user}
              />
            : activeScreen?.id === 'dr-consult'
            ? <DoctorConsultations
                key="dr-consult-persistent"
                activePatient={activePatient}
                onConsultComplete={clearActivePatient}
                onNavigate={setActiveId}
                user={user}
              />
            : <Screen key={resolvedActiveId} onNavigate={setActiveId} user={user} />
        )}
      </div>
    </div>
  );
}
