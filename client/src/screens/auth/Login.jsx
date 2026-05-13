import { useState } from "react";

const ROLES = [
  {
    key: "receptionist",
    label: "Medical Staff",
    subtitle: "Receptionist / Front Desk",
    icon: "👩‍💼",
    color: "#2a9d8f",
    bg: "#e8f7f5",
    border: "#b8e4de",
    demo: "ana.bautista",
    demoPass: "LikhaHealth2025!",
    access: ["Queue", "Patient Registration", "Records", "Appointments", "SMS", "Reports"],
  },
  {
    key: "doctor",
    label: "Doctor",
    subtitle: "Licensed Physician",
    icon: "👨‍⚕️",
    color: "#0047AB",
    bg: "#EBF0FA",
    border: "#b8d0f5",
    demo: "ramon.delacruz",
    demoPass: "LikhaHealth2025!",
    access: ["Queue", "Consultations", "Patient Records", "Appointments"],
  },
];

// ── Input component ───────────────────────────────────────────────────────────
function Field({ label, type = "text", value, onChange, placeholder, icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 14, fontWeight: 700, color: "#7a8fb0", textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 7 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, userSelect: "none" }}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: "12px 14px 12px 42px",
            border: `1.5px solid ${focused ? "#2a9d8f" : "#e0e7ef"}`,
            borderRadius: 12,
            fontSize: 14,
            fontFamily: "'Afacad', sans-serif",
            color: "#1e2d40",
            outline: "none",
            background: focused ? "#f8fdfc" : "white",
            transition: "all 0.2s",
            boxSizing: "border-box",
            boxShadow: focused ? "0 0 0 3px rgba(42,157,143,0.1)" : "none",
          }}
        />
      </div>
    </div>
  );
}

// ── Main Login ────────────────────────────────────────────────────────────────
// Props:
//   onLogin(role) → async (username, password) → userObj
//   The role is selected in this component and passed up to App.
export default function Login({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [username,    setUsername]    = useState("");
  const [password,    setPassword]    = useState("");
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [showPass,    setShowPass]    = useState(false);

  const roleConfig = ROLES.find(r => r.key === selectedRole);

  const fillDemo = () => {
    if (!roleConfig) return;
    setUsername(roleConfig.demo);
    setPassword(roleConfig.demoPass);
    setError("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // onLogin is curried: onLogin(role) returns async (username, password) => userObj
      await onLogin(selectedRole)(username.toLowerCase().trim(), password);
      // Navigation is handled in App.jsx after login resolves
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>

      {/* ── Left panel ── */}
      <div style={{
        width: "44%", flexShrink: 0,
        background: "linear-gradient(155deg, #001A5E 0%, #0047AB 45%, #003580 75%, #1A0000 100%)",
        display: "flex", flexDirection: "column",
        padding: "52px 48px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(204,0,0,0.14)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(0,71,171,0.18)", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", top: "40%", left: "30%", width: 200, height: 200, borderRadius: "50%", background: "rgba(204,0,0,0.07)", filter: "blur(40px)" }} />

        {/* Brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "auto" }}>
          <img
            src="/logo.svg"
            alt="LikhaHealth"
            width={48}
            height={38}
            style={{ flexShrink: 0, filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.4))" }}
          />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>
              <span style={{ color: "white" }}>Likha</span>
              <span style={{ color: "#FF4444" }}>Health</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.35)", marginTop: 4, letterSpacing: 0.4 }}>Angono Municipal Health Center</div>
          </div>
        </div>

        {/* Hero content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", animation: "fadeUp 0.6s ease both" }}>
          <div style={{ marginBottom: 32 }}>
            <img
              src="/logo.svg"
              alt=""
              aria-hidden="true"
              width={88}
              height={70}
              style={{ opacity: 0.85, filter: "drop-shadow(0 12px 32px rgba(0,71,171,0.5)) drop-shadow(0 4px 12px rgba(204,0,0,0.3))" }}
            />
          </div>

          <h1 style={{ fontSize: 40, fontWeight: 700, color: "white", margin: "0 0 16px", lineHeight: 1.15, letterSpacing: -0.5 }}>
            Better care starts<br />with better tools.
          </h1>
          <p style={{ fontSize: 15, fontWeight: 400, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 40px", maxWidth: 340 }}>
            The integrated patient management system for Angono Municipal Health Center.
          </p>

          {/* Access level cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ROLES.map(r => (
              <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 16px" }}>
                <span style={{ fontSize: 20 }}>{r.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>{r.label}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
                    {r.access.join(" · ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", marginTop: 32 }}>
          © 2025 LikhaHealth · Angono, Rizal · v2.0
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, background: "#f4f7fb", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
        <div style={{ width: "100%", maxWidth: 420, animation: "fadeUp 0.5s 0.1s ease both" }}>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: "#1e2d40", margin: "0 0 6px", letterSpacing: -0.3 }}>
              Sign in to your account
            </h2>
            <p style={{ fontSize: 14, fontWeight: 400, color: "#7a8fb0", margin: 0, letterSpacing: 0.1 }}>
              Select your role to continue
            </p>
          </div>

          {/* ── Step 1: Role selection ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#7a8fb0", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>I am a</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {ROLES.map(r => {
                const isSelected = selectedRole === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => { setSelectedRole(r.key); setUsername(""); setPassword(""); setError(""); }}
                    style={{
                      padding: "16px 14px",
                      border: `2px solid ${isSelected ? r.color : "#e0e7ef"}`,
                      borderRadius: 14,
                      background: isSelected ? r.bg : "white",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.18s",
                      boxShadow: isSelected ? `0 4px 16px ${r.color}22` : "none",
                      outline: "none",
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{r.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? r.color : "#1e2d40" }}>{r.label}</div>
                    <div style={{ fontSize: 14, color: "#8a9bb0", marginTop: 2 }}>{r.subtitle}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Step 2: Credentials (shown after role selected) ── */}
          {selectedRole && (
            <div style={{ animation: "fadeUp 0.25s ease both" }}>
              {/* Role badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: roleConfig.bg, border: `1px solid ${roleConfig.border}`, borderRadius: 10, padding: "9px 14px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15 }}>{roleConfig.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: roleConfig.color }}>Signing in as {roleConfig.label}</span>
                </div>
                <button
                  onClick={fillDemo}
                  style={{ fontSize: 14, fontWeight: 600, color: roleConfig.color, background: "none", border: `1px solid ${roleConfig.border}`, borderRadius: 7, padding: "3px 10px", cursor: "pointer" }}
                >
                  Use Demo
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <Field label="Username" icon="👤" type="text" value={username} onChange={setUsername} placeholder={`e.g. ${roleConfig.demo}`} />
                <div style={{ position: "relative" }}>
                  <Field label="Password" icon="🔒" type={showPass ? "text" : "password"} value={password} onChange={setPassword} placeholder="Enter your password" />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    style={{ position: "absolute", right: 14, top: 36, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#8a9bb0" }}
                  >
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>

                {error && (
                  <div style={{ background: "#fff0ee", border: "1px solid #f5c6c0", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, animation: "fadeUp 0.2s ease" }}>
                    <span style={{ fontSize: 15 }}>⚠️</span>
                    <span style={{ fontSize: 14, color: "#c0392b", fontWeight: 500 }}>{error}</span>
                  </div>
                )}

                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={loading || !username || !password}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: loading || !username || !password
                      ? "#d0dbe8"
                      : `linear-gradient(135deg, ${roleConfig.color}, ${roleConfig.key === "doctor" ? "#1565D8" : "#52c4b8"})`,
                    color: "white",
                    border: "none",
                    borderRadius: 13,
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "'Afacad', sans-serif",
                    cursor: loading || !username || !password ? "not-allowed" : "pointer",
                    boxShadow: !loading && username && password ? `0 6px 20px ${roleConfig.color}44` : "none",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      Signing in...
                    </>
                  ) : (
                    <>Sign In →</>
                  )}
                </button>
              </form>

              {/* Demo hint */}
              <div style={{ background: "white", border: "1px solid #edf1f7", borderRadius: 12, padding: "12px 16px" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>🔑 Demo Credentials</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#4a5d75" }}>
                  <span style={{ color: "#8a9bb0" }}>Username</span>
                  <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{roleConfig.demo}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#4a5d75", marginTop: 4 }}>
                  <span style={{ color: "#8a9bb0" }}>Password</span>
                  <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{roleConfig.demoPass}</span>
                </div>
              </div>
            </div>
          )}

          <style>{`
            @keyframes spin    { to { transform: rotate(360deg); } }
            @keyframes fadeUp  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
          `}</style>
        </div>
      </div>
    </div>
  );
}
