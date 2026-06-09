import React, { useState, useEffect } from "react";
import { UserPlus, Search, Stethoscope, Building2, Eye, EyeOff, Plus, Key, Copy, Check, ShieldCheck, UserCog, User } from "lucide-react";
import { staffApi } from "../../lib/api/staff.js";

const ROLE_OPTIONS = [
  { value: "Admin", label: "Admin (MHO)" },
  { value: "Doctor", label: "Doctor" },
  { value: "Nurse", label: "Nurse" },
  { value: "Midwife", label: "Midwife" },
  { value: "Receptionist", label: "Receptionist" },
];

export default function AdminStaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // New user credentials display
  const [newUser, setNewUser] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form
  const [form, setForm] = useState({
    first_name: "", last_name: "", suffix: "", position: "Doctor", role: "Doctor",
    prc_license_number: "", prc_expiry_date: ""
  });

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await staffApi.getAll({ search });
      setStaffList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [search]);

  const handleToggle = async (id) => {
    try {
      await staffApi.toggleStatus(id);
      loadStaff();
    } catch (err) {
      console.error(err);
      alert("Failed to toggle status");
    }
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm("Are you sure you want to reset the password for this staff member?")) return;
    try {
      setLoading(true);
      const res = await staffApi.resetPassword(id);
      setNewUser({ username: res.username, password: res.password });
    } catch (err) {
      console.error(err);
      alert("Failed to reset password: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // health_center_id is 1
      const payload = { ...form, health_center_id: 1 };
      const res = await staffApi.create(payload);
      setNewUser({ username: res.username, password: "LikhaHealth2025!" });
      loadStaff();
      setModalOpen(false);
      setForm({ first_name: "", last_name: "", suffix: "", position: "Doctor", role: "Doctor", prc_license_number: "", prc_expiry_date: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to create staff: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyCreds = () => {
    if (!newUser) return;
    navigator.clipboard.writeText(`Username: ${newUser.username}\nPassword: ${newUser.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb", padding: "32px 40px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#1a2540", display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldCheck size={26} color="#6b21a8" /> Staff Management
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#7a8fb0" }}>Manage accounts, access levels, and credentials for clinic personnel</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          style={{ background: "#6b21a8", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(107,33,168,0.2)" }}
        >
          <UserPlus size={16} strokeWidth={2} /> Add New Staff
        </button>
      </div>

      {/* New Credentials Alert */}
      {newUser && (
        <div style={{ background: "white", border: "1px solid #d8b4fe", borderRadius: 14, padding: "20px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 20px rgba(107,33,168,0.06)", animation: "popIn 0.3s ease" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#6b21a8", marginBottom: 4 }}>Staff member registered successfully!</div>
            <div style={{ fontSize: 14, color: "#4a5d75" }}>Please securely share these default credentials with them. They will need this to log in.</div>
            
            <div style={{ display: "flex", gap: 24, marginTop: 16, background: "#f9f5ff", padding: "12px 20px", borderRadius: 10, border: "1px solid #f3e8ff" }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#9333ea", textTransform: "uppercase" }}>Username</span>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1a2540", fontFamily: "monospace" }}>{newUser.username}</div>
              </div>
              <div style={{ width: 1, background: "#d8b4fe" }} />
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#9333ea", textTransform: "uppercase" }}>Temporary Password</span>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1a2540", fontFamily: "monospace" }}>{newUser.password}</div>
              </div>
            </div>
          </div>
          <button 
            onClick={copyCreds}
            style={{ background: copied ? "#2a9d8f" : "#6b21a8", color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            {copied ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={2} />}
            {copied ? "Copied!" : "Copy Details"}
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ background: "white", padding: 16, borderRadius: 16, border: "1px solid #e0e7ef", marginBottom: 24, display: "flex", gap: 16 }}>
        <div style={{ position: "relative", width: 300 }}>
          <Search style={{ position: "absolute", left: 14, top: 11, color: "#8a9bb0" }} size={18} />
          <input 
            type="text" 
            placeholder="Search staff name..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 40px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, boxSizing: "border-box", outline: "none" }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e0e7ef", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8fdfc", borderBottom: "1px solid #e0e7ef" }}>
              <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#7a8fb0", textTransform: "uppercase" }}>Name</th>
              <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#7a8fb0", textTransform: "uppercase" }}>Position</th>
              <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#7a8fb0", textTransform: "uppercase" }}>License No.</th>
              <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#7a8fb0", textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "#7a8fb0", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#8a9bb0" }}>Loading staff...</td></tr>
            ) : staffList.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#8a9bb0" }}>No staff members found.</td></tr>
            ) : (
              staffList.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #e0e7ef", background: s.is_active ? "white" : "#fcfcfd" }}>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8f7f5", color: "#2a9d8f", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                        {s.first_name[0]}{s.last_name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: s.is_active ? "#1a2540" : "#8a9bb0" }}>
                          {s.first_name} {s.last_name} {s.suffix ? s.suffix : ""}
                        </div>
                        <div style={{ fontSize: 13, color: "#8a9bb0", marginTop: 2 }}>ID: {String(s.id).padStart(4, '0')}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: 14, color: "#4a5d75", fontWeight: 500 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {s.position.toLowerCase().includes("doctor") ? <Stethoscope size={14} color="#0047AB" /> : <UserCog size={14} color="#2a9d8f" />}
                      {s.position}
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: 14, color: "#4a5d75" }}>
                    {s.prc_license_number || <span style={{ color: "#b0bdd6", fontStyle: "italic" }}>Not provided</span>}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    {s.is_active ? (
                      <span style={{ background: "#e8f7f5", color: "#2a9d8f", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2a9d8f" }} /> Active
                      </span>
                    ) : (
                      <span style={{ background: "#f0f3f7", color: "#7a8fb0", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7a8fb0" }} /> Inactive
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                      <button 
                        onClick={() => handleResetPassword(s.id)}
                        style={{ background: "none", border: "1px solid #d8b4fe", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "#9333ea", cursor: "pointer" }}
                      >
                        Reset Credentials
                      </button>
                      <button 
                        onClick={() => handleToggle(s.id)}
                        style={{ background: "none", border: `1px solid ${s.is_active ? "#f5c6c0" : "#b8e4de"}`, borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: s.is_active ? "#c0392b" : "#2a9d8f", cursor: "pointer" }}
                      >
                        {s.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,37,64,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }}>
          <div style={{ background: "white", width: "100%", maxWidth: 500, borderRadius: 20, boxShadow: "0 20px 40px rgba(0,0,0,0.15)", overflow: "hidden", animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ padding: "20px 24px", background: "#f8fdfc", borderBottom: "1px solid #e0e7ef", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2540", display: "flex", alignItems: "center", gap: 8 }}>
                <UserPlus size={20} color="#6b21a8" /> Add New Staff
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8a9bb0" }}>
                <EyeOff size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#7a8fb0", marginBottom: 6 }}>First Name <span style={{ color: "#CC0000", marginLeft: 4 }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <input required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
                    <div style={{ position: "absolute", top: 1.5, right: 1.5, width: 14, height: 14, background: "#ef4444", clipPath: "polygon(0 0, 100% 0, 100% 100%)", borderTopRightRadius: 8, pointerEvents: "none" }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#7a8fb0", marginBottom: 6 }}>Last Name <span style={{ color: "#CC0000", marginLeft: 4 }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <input required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
                    <div style={{ position: "absolute", top: 1.5, right: 1.5, width: 14, height: 14, background: "#ef4444", clipPath: "polygon(0 0, 100% 0, 100% 100%)", borderTopRightRadius: 8, pointerEvents: "none" }} />
                  </div>
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#7a8fb0", marginBottom: 6 }}>Suffix</label>
                  <input placeholder="e.g. Jr., MD" value={form.suffix} onChange={e => setForm({...form, suffix: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#7a8fb0", marginBottom: 6 }}>Position <span style={{ color: "#CC0000", marginLeft: 4 }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <input required placeholder="e.g. Head Doctor" value={form.position} onChange={e => setForm({...form, position: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
                    <div style={{ position: "absolute", top: 1.5, right: 1.5, width: 14, height: 14, background: "#ef4444", clipPath: "polygon(0 0, 100% 0, 100% 100%)", borderTopRightRadius: 8, pointerEvents: "none" }} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#7a8fb0", marginBottom: 6 }}>System Role (Access Level) <span style={{ color: "#CC0000", marginLeft: 4 }}>*</span></label>
                <div style={{ position: "relative" }}>
                  <select required value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, boxSizing: "border-box", appearance: "none" }}>
                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <div style={{ position: "absolute", top: 1.5, right: 1.5, width: 14, height: 14, background: "#ef4444", clipPath: "polygon(0 0, 100% 0, 100% 100%)", borderTopRightRadius: 8, pointerEvents: "none" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#7a8fb0", marginBottom: 6 }}>PRC License No.</label>
                  <input value={form.prc_license_number} onChange={e => setForm({...form, prc_license_number: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#7a8fb0", marginBottom: 6 }}>PRC Expiry Date</label>
                  <input type="date" value={form.prc_expiry_date} onChange={e => setForm({...form, prc_expiry_date: e.target.value})} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", padding: "10px 16px", fontSize: 14, fontWeight: 600, color: "#7a8fb0", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ background: "#6b21a8", color: "white", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Registering..." : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}
