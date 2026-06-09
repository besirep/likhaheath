import React, { useState } from "react";
import { KeyRound } from "lucide-react";
import { authApi } from "../lib/api/auth";

export default function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      return setError("New passwords do not match.");
    }
    if (newPassword.length < 8) {
      return setError("New password must be at least 8 characters long.");
    }
    
    setSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "white", borderRadius: 16, width: 400, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #edf1f7", display: "flex", alignItems: "center", gap: 10 }}>
          <KeyRound size={20} color="#6b21a8" />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e2d40" }}>Change Password</h2>
        </div>
        
        {success ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40" }}>Password Updated!</div>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 8 }}>Your password has been successfully changed.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            {error && <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#7a8fb0", marginBottom: 6 }}>Current Password <span style={{ color: "#CC0000", marginLeft: 4 }}>*</span></label>
              <div style={{ position: "relative" }}>
                <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
                <div style={{ position: "absolute", top: 1.5, right: 1.5, width: 14, height: 14, background: "#ef4444", clipPath: "polygon(0 0, 100% 0, 100% 100%)", borderTopRightRadius: 8, pointerEvents: "none" }} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#7a8fb0", marginBottom: 6 }}>New Password <span style={{ color: "#CC0000", marginLeft: 4 }}>*</span></label>
              <div style={{ position: "relative" }}>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
                <div style={{ position: "absolute", top: 1.5, right: 1.5, width: 14, height: 14, background: "#ef4444", clipPath: "polygon(0 0, 100% 0, 100% 100%)", borderTopRightRadius: 8, pointerEvents: "none" }} />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#7a8fb0", marginBottom: 6 }}>Confirm New Password <span style={{ color: "#CC0000", marginLeft: 4 }}>*</span></label>
              <div style={{ position: "relative" }}>
                <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
                <div style={{ position: "absolute", top: 1.5, right: 1.5, width: 14, height: 14, background: "#ef4444", clipPath: "polygon(0 0, 100% 0, 100% 100%)", borderTopRightRadius: 8, pointerEvents: "none" }} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" onClick={onClose} style={{ background: "none", border: "none", padding: "10px 16px", fontSize: 14, fontWeight: 600, color: "#7a8fb0", cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: "#6b21a8", color: "white", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
