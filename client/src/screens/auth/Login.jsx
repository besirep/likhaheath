import { useState } from "react";
import { UserCog, Stethoscope, User, Lock, Eye, EyeOff, AlertTriangle, KeyRound } from "lucide-react";
import ConfirmationModal from "../../components/ConfirmationModal";

const ROLES = [
  {
    key: "admin",
    label: "Administrator",
    subtitle: "Municipal Health Officer",
    icon: UserCog,
    color: "#6b21a8",
    bg: "#f3e8ff",
    border: "#d8b4fe",
    access: ["Dashboard", "Staff Management", "Reports"],
  },
  {
    key: "receptionist",
    label: "Medical Staff",
    subtitle: "Receptionist / Front Desk",
    icon: UserCog,
    color: "#2a9d8f",
    bg: "#e8f7f5",
    border: "#b8e4de",
    access: ["Queue", "Patient Registration", "Records", "Appointments", "SMS", "Reports"],
  },
  {
    key: "doctor",
    label: "Doctor",
    subtitle: "Licensed Physician",
    icon: Stethoscope,
    color: "#0047AB",
    bg: "#EBF0FA",
    border: "#b8d0f5",
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
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>{icon}</span>
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

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [showForgotConfirm, setShowForgotConfirm] = useState(false);

  const executeForgotPassword = async () => {
    setShowForgotConfirm(false);
    
    setForgotError("");
    setForgotSuccess(false);
    setForgotLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotUsername, newPassword: forgotPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }
      setForgotSuccess(true);
      setForgotUsername("");
      setForgotPassword("");
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setForgotError("");
    setShowForgotConfirm(true);
  };

  const roleConfig = ROLES.find(r => r.key === selectedRole);

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
          <h1 style={{ fontSize: 52, fontWeight: 700, color: "white", margin: "0 0 24px", lineHeight: 1.1, letterSpacing: -1 }}>
            Better care starts<br />with better tools.
          </h1>
          <p style={{ fontSize: 18, fontWeight: 400, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: "0", maxWidth: 380 }}>
            The integrated patient management system for Angono Municipal Health Center.
          </p>
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
          {!selectedRole && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#7a8fb0", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>I am a</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {ROLES.map(r => {
                  return (
                    <button
                      key={r.key}
                      onClick={() => { 
                        setSelectedRole(r.key); 
                        setUsername(""); setPassword(""); setError(""); 
                      }}
                      style={{
                        padding: "16px 20px",
                        border: "2px solid #e0e7ef",
                        borderRadius: 14,
                        background: "white",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.3s ease",
                        outline: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 16
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "#f4f7fb", flexShrink: 0 }}>
                        <r.icon size={24} strokeWidth={2} color="#8a9bb0" />
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e2d40" }}>{r.label}</div>
                        <div style={{ fontSize: 13, color: "#8a9bb0", marginTop: 2 }}>{r.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 2: Credentials (shown after role selected) ── */}
          {selectedRole && (
            <div style={{ animation: "fadeUp 0.25s ease both" }}>
              
              <button
                type="button"
                onClick={() => { setSelectedRole(null); setUsername(""); setPassword(""); setError(""); }}
                style={{ background: "none", border: "none", color: "#8a9bb0", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}
              >
                ← Back to Role Selection
              </button>

              <form onSubmit={handleSubmit}>
                <Field label="Username" icon={<User size={16} strokeWidth={2} color="#8a9bb0" />} type="text" value={username} onChange={setUsername} placeholder={`e.g. ${roleConfig.demo || "admin"}`} />
                <div style={{ position: "relative" }}>
                  <Field label="Password" icon={<Lock size={16} strokeWidth={2} color="#8a9bb0" />} type={showPass ? "text" : "password"} value={password} onChange={setPassword} placeholder="Enter your password" />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    style={{ position: "absolute", right: 14, top: 36, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#8a9bb0" }}
                  >
                    {showPass ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                  </button>
                </div>

                {error && (
                  <div style={{ background: "#fff0ee", border: "1px solid #f5c6c0", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, animation: "fadeUp 0.2s ease" }}>
                    <AlertTriangle size={16} strokeWidth={2} color="#c0392b" style={{ flexShrink: 0 }} />
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

                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    style={{ background: "none", border: "none", color: roleConfig.color, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0 }}
                  >
                    Forgot password?
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* ── Step 3: Forgot Password Modal ── */}
          {showForgotPassword && (
            <div style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
            }}>
              <div style={{
                background: "white", borderRadius: 16, padding: 32, width: "100%", maxWidth: 400,
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)", animation: "fadeUp 0.3s ease"
              }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "#1e2d40" }}>Reset Password</h3>
                <p style={{ fontSize: 14, color: "#7a8fb0", marginBottom: 24, lineHeight: 1.5 }}>
                  Enter your username and your new password to reset it.
                </p>

                {forgotError && (
                  <div style={{ background: "#fff0ee", border: "1px solid #f5c6c0", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={16} strokeWidth={2} color="#c0392b" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: "#c0392b", fontWeight: 500 }}>{forgotError}</span>
                  </div>
                )}
                
                {forgotSuccess && (
                  <div style={{ background: "#e8f7f5", border: "1px solid #b8e4de", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, color: "#2a9d8f", fontWeight: 500 }}>Password reset successful! You can now log in.</span>
                  </div>
                )}

                <Field label="Username" icon={<User size={16} strokeWidth={2} color="#8a9bb0" />} type="text" value={forgotUsername} onChange={setForgotUsername} placeholder="Enter your username" />
                <div style={{ position: "relative" }}>
                  <Field label="New Password" icon={<Lock size={16} strokeWidth={2} color="#8a9bb0" />} type={showForgotPass ? "text" : "password"} value={forgotPassword} onChange={setForgotPassword} placeholder="Enter new password" />
                  <button
                    type="button"
                    onClick={() => setShowForgotPass(s => !s)}
                    style={{ position: "absolute", right: 14, top: 36, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#8a9bb0" }}
                  >
                    {showForgotPass ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                  </button>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotUsername("");
                      setForgotPassword("");
                      setForgotError("");
                      setForgotSuccess(false);
                    }}
                    style={{
                      flex: 1, padding: "12px", background: "white", color: "#7a8fb0", border: "1.5px solid #e0e7ef",
                      borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleForgotPassword}
                    disabled={forgotLoading || !forgotUsername || !forgotPassword}
                    style={{
                      flex: 1, padding: "12px", background: roleConfig ? roleConfig.color : "#0047AB", color: "white", border: "none",
                      borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: (forgotLoading || !forgotUsername || !forgotPassword) ? "not-allowed" : "pointer",
                      opacity: (forgotLoading || !forgotUsername || !forgotPassword) ? 0.7 : 1
                    }}
                  >
                    {forgotLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Forgot Password Confirmation Modal ── */}
          {showForgotConfirm && (
            <ConfirmationModal
              title="Reset Password"
              message={`Are you sure you want to reset the password for username "${forgotUsername}"?`}
              onConfirm={executeForgotPassword}
              onCancel={() => setShowForgotConfirm(false)}
              confirmText="Reset Password"
              confirmColor="#6b21a8"
            />
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
