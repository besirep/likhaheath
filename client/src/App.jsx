import React, { useState, useCallback } from "react";
import { LayoutDashboard, UserPlus, ClipboardList, FolderOpen, MessageSquare, BarChart3, Stethoscope, LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "./lib/api/useAuth.js";
import { consultationsApi } from "./lib/api/consultations.js";

// Auth
import Login from "./screens/auth/Login.jsx";
import ChangePasswordModal from "./components/ChangePasswordModal.jsx";
import ActiveConsultationScreen from "./screens/doctor/ActiveConsultationScreen.jsx";

// Receptionist screens
import ClinicDashboard            from "./screens/receptionist/ClinicDashboard.jsx";
import PatientRegistration        from "./screens/receptionist/PatientRegistration.jsx";
import ReceptionistPatientRecords from "./screens/receptionist/ReceptionistPatientRecords.jsx";
import ReceptionistQueue          from "./screens/receptionist/ReceptionistQueue.jsx";
import ReceptionistReports        from "./screens/receptionist/ReceptionistReports.jsx";
import ReceptionistSMSLogs        from "./screens/receptionist/ReceptionistSMSLogs.jsx";

// Doctor screens
import DoctorConsultations from "./screens/doctor/DoctorConsultations.jsx";
import DoctorDashboard     from "./screens/doctor/DoctorDashboard.jsx";
import DoctorPatientRecords from "./screens/doctor/DoctorPatientRecords.jsx";
import DoctorQueue         from "./screens/doctor/DoctorQueue.jsx";

// Admin screens
import AdminStaffManagement from "./screens/admin/AdminStaffManagement.jsx";
import AdminAuditLogs from "./screens/admin/AdminAuditLogs.jsx";


// ── Role-based screen config ──────────────────────────────────────────────────
const SCREEN_MAP = {
  admin: [
    { id: "admin-dashboard", label: "Dashboard",        Icon: LayoutDashboard, Component: ClinicDashboard },
    { id: "admin-staff",     label: "Staff Management", Icon: UserPlus,        Component: AdminStaffManagement },
    { id: "admin-audit",     label: "Audit Logs",       Icon: ShieldAlert,     Component: AdminAuditLogs },
    { id: "admin-sms",       label: "SMS Logs",         Icon: MessageSquare,   Component: ReceptionistSMSLogs },
    { id: "admin-reports",   label: "Reports",          Icon: BarChart3,       Component: ReceptionistReports },
  ],
  receptionist: [
    { id: "dashboard", label: "Dashboard",        Icon: LayoutDashboard, Component: ClinicDashboard },
    { id: "register",  label: "Register Patient", Icon: UserPlus,        Component: PatientRegistration },
    { id: "queue",     label: "Queue",            Icon: ClipboardList,   Component: ReceptionistQueue },
    { id: "records",   label: "Patient Records",  Icon: FolderOpen,      Component: ReceptionistPatientRecords },
    { id: "reports",   label: "Reports",          Icon: BarChart3,       Component: ReceptionistReports },
  ],
  doctor: [
    { id: "dr-dashboard", label: "Dashboard",       Icon: LayoutDashboard, Component: DoctorDashboard },
    { id: "dr-queue",     label: "My Queue",        Icon: ClipboardList,   Component: DoctorQueue },
    { id: "dr-consult",   label: "Consultations",   Icon: Stethoscope,     Component: DoctorConsultations },
    { id: "dr-records",   label: "Patient Records", Icon: FolderOpen,      Component: DoctorPatientRecords },
    { id: "dr-reports",   label: "Reports",         Icon: BarChart3,       Component: ReceptionistReports },
  ],
};

const ROLE_META = {
  admin:        { label: "Administrator", color: "#6b21a8", accent: "#9333ea",   badge: "ADMIN",        badgeBg: "rgba(107,33,168,0.18)", badgeColor: "#9333ea" },
  receptionist: { label: "Medical Staff", color: "#2a9d8f", accent: "#52c4b8",   badge: "RECEPTIONIST", badgeBg: "rgba(42,157,143,0.18)", badgeColor: "#52c4b8" },
  doctor:       { label: "Doctor",        color: "#0047AB", accent: "#1565D8",   badge: "PHYSICIAN",    badgeBg: "rgba(0,71,171,0.18)",   badgeColor: "#1565D8" },
};

// ── Screen Error Boundary (prevents white screen crashes) ─────────────────────
class ScreenErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[ScreenErrorBoundary]', error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px 32px", maxWidth: 700 }}>
          <div style={{ background: "#fdeee8", border: "1.5px solid #f5c0b0", borderRadius: 16, padding: "28px 24px" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, color: "#CC0000" }}>Something went wrong</h2>
            <p style={{ color: "#7a4030", fontSize: 14, margin: "0 0 16px" }}>This screen crashed unexpectedly. You can try reloading or navigating to another screen.</p>
            <pre style={{ background: "#fff5f0", borderRadius: 10, padding: "14px 16px", fontSize: 12, color: "#993322", overflowX: "auto", whiteSpace: "pre-wrap", margin: "0 0 16px", border: "1px solid #f0d0c0" }}>
              {this.state.error?.toString()}
              {"\n"}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              style={{ background: "#CC0000", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginRight: 10 }}
            >Try Again</button>
            <button
              onClick={() => window.location.reload()}
              style={{ background: "white", color: "#CC0000", border: "1.5px solid #CC0000", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >Reload Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ user, screens, activeId, onSelect, onLogout }) {
  const meta = ROLE_META[user.role];
  const [showChangePassword, setShowChangePassword] = useState(false);

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
              <item.Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }} />
              <span style={{ letterSpacing: 0.1 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${meta.color}88, ${meta.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white", flexShrink: 0 }}>
            {user.initials}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{user.title}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={() => setShowChangePassword(true)}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 9,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          >
            Change Password
          </button>
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
            <LogOut size={14} strokeWidth={2} style={{ flexShrink: 0 }} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  // useAuth hydrates from localStorage on mount — no flash of login screen on refresh
  const { user, login, logout } = useAuth();
  const [activeId, setActiveId] = useState(() => sessionStorage.getItem('lh_active_id') || null);
  const [navState, setNavState] = useState(() => {
    try {
      const s = sessionStorage.getItem('lh_nav_state');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [savingConsultation, setSavingConsultation] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleNavigate = useCallback((id, state = null) => {
    setActiveId(id);
    if (id) sessionStorage.setItem('lh_active_id', id);
    else sessionStorage.removeItem('lh_active_id');

    setNavState(state);
    if (state) sessionStorage.setItem('lh_nav_state', JSON.stringify(state));
    else sessionStorage.removeItem('lh_nav_state');
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('lh_active_id');
    sessionStorage.removeItem('lh_nav_state');
    logout();
  }, [logout]);

  // ── Registration session: persists form draft across tab switches ─────────
  const [registrationDraft, setRegistrationDraft] = useState(null);
  const clearDraft = useCallback(() => setRegistrationDraft(null), []);

  // ── Doctor consultation session: carries active patient from Queue → Consult
  // Persisted in sessionStorage so a page refresh mid-consultation doesn't lose context (Issue #10)
  const [activePatient, setActivePatientState] = useState(() => {
    try {
      const stored = sessionStorage.getItem('lh_active_patient');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const setActivePatient = useCallback((patient) => {
    setActivePatientState(patient);
    if (patient) sessionStorage.setItem('lh_active_patient', JSON.stringify(patient));
    else sessionStorage.removeItem('lh_active_patient');
  }, []);
  const clearActivePatient = useCallback(() => setActivePatient(null), [setActivePatient]);

  const handleSaveConsultation = async (data) => {
    setSavingConsultation(true);
    try {
      await consultationsApi.saveConsultation(data);
      clearActivePatient();
      window.dispatchEvent(new Event('consultationSaved'));
    } catch (e) {
      console.error("Failed to save consultation:", e);
      showToast("Failed to save consultation. Please try again.");
    } finally {
      setSavingConsultation(false);
    }
  };

  // Called by Login after a successful API login
  const handleLogin = (role) => async (username, password) => {
    const userObj = await login(username, password);

    // Guard: ensure the user is signing into the right portal
    if (userObj.role !== role) {
      logout(); // clear the just-stored token
      const portalLabel = userObj.role === 'doctor' ? 'Doctor' : 'Medical Staff';
      throw new Error(`This account belongs to the ${portalLabel} portal.`);
    }

    const defaultId = SCREEN_MAP[userObj.role][0].id;
    setActiveId(defaultId);
    sessionStorage.setItem('lh_active_id', defaultId);
    setNavState(null);
    sessionStorage.removeItem('lh_nav_state');
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
        onSelect={handleNavigate}
        onLogout={handleLogout}
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
        <ScreenErrorBoundary key={resolvedActiveId}>
        {Screen && (
           activeScreen?.id === 'register'
            ? <PatientRegistration
                key="register-persistent"
                onNavigate={handleNavigate}
                user={user}
                draft={registrationDraft}
                onDraftChange={setRegistrationDraft}
                onDraftClear={clearDraft}
                preloadPatientId={navState?.preloadPatientId ?? null}
              />
            : activeScreen?.id === 'dr-dashboard'
            ? <DoctorDashboard
                key="dr-dashboard"
                onNavigate={handleNavigate}
                onStartConsult={setActivePatient}
                user={user}
              />
            : activeScreen?.id === 'dr-queue'
            ? <DoctorQueue
                key="dr-queue"
                onNavigate={handleNavigate}
                onStartConsult={setActivePatient}
                user={user}
              />
            : activeScreen?.id === 'dr-consult'
            ? <DoctorConsultations
                key="dr-consult-persistent"
                activePatient={activePatient}
                onConsultComplete={clearActivePatient}
                onCancelConsult={clearActivePatient}
                onNavigate={handleNavigate}
                user={user}
              />
            : <Screen key={resolvedActiveId} onNavigate={handleNavigate} navState={navState} user={user} />
        )}
        </ScreenErrorBoundary>
      </div>

      {/* Global Active Consultation Overlay */}
      {activePatient && (
        <ActiveConsultationScreen
          patient={activePatient}
          onSave={handleSaveConsultation}
          onCancel={clearActivePatient}
          saving={savingConsultation}
          onNavigate={handleNavigate}
        />
      )}

      {/* Global Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1a2540", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 14, zIndex: 1000, boxShadow: "0 8px 24px rgba(20,40,90,0.28)", animation: "fadeIn 0.3s ease" }}>{toast}</div>
      )}
    </div>
  );
}
