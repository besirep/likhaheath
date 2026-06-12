import React, { useState, useEffect } from "react";
import { Search, Filter, ShieldAlert, Lock, ArrowRight } from "lucide-react";
import { apiFetch } from "../../lib/api/apiFetch";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    if (isUnlocked) {
      fetchLogs();
    }
  }, [isUnlocked]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/audit-logs');
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const term = search.toLowerCase();
    const staffName = `${log.first_name || ''} ${log.last_name || ''}`.toLowerCase();
    const action = log.action ? log.action.toLowerCase() : '';
    return staffName.includes(term) || action.includes(term);
  });

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!password) return;
    try {
      setVerifying(true);
      setVerifyError("");
      const res = await apiFetch('/auth/verify-password', {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Incorrect password");
      }
      setIsUnlocked(true);
    } catch (err) {
      setVerifyError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", background: "#f8f9fa" }}>
        <div style={{ background: "white", padding: 40, borderRadius: 16, border: "1px solid #e0e7ef", width: 400, textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
          <div style={{ background: "#f0f4fa", width: 64, height: 64, borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", margin: "0 auto 24px" }}>
            <Lock size={32} color="#0047AB" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1a2540", marginBottom: 8 }}>Secure Area</h2>
          <p style={{ color: "#7a8fb0", marginBottom: 32, fontSize: 14 }}>Please confirm your password to view system audit logs.</p>
          
          <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ textAlign: "left" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#4a5b78", marginBottom: 8 }}>Password</label>
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e0e7ef", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                autoFocus
              />
            </div>
            
            {verifyError && <div style={{ color: "#CC0000", fontSize: 13 }}>{verifyError}</div>}
            
            <button 
              type="submit" 
              disabled={verifying || !password}
              style={{ background: "#0047AB", color: "white", border: "none", borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 600, cursor: verifying || !password ? "not-allowed" : "pointer", opacity: verifying || !password ? 0.7 : 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 8 }}
            >
              {verifying ? "Verifying..." : <>Confirm Access <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto", background: "#f8f9fa", animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a2540", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldAlert size={28} color="#0047AB" />
            Audit Logs
          </h1>
          <p style={{ color: "#7a8fb0", margin: 0, fontSize: 15 }}>Track system logins and account modifications.</p>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e0e7ef", padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={18} color="#9aabc0" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
            <input 
              placeholder="Search by admin name or action..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "12px 16px 12px 44px", borderRadius: 10, border: "1px solid #e0e7ef", fontSize: 14, outline: "none" }}
            />
          </div>
          <button style={{ background: "#f0f4fa", border: "1px solid #e0e7ef", borderRadius: 10, padding: "0 16px", display: "flex", alignItems: "center", gap: 8, color: "#4a5b78", fontWeight: 600, cursor: "pointer" }}>
            <Filter size={18} /> Filter
          </button>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 16, border: "1px solid #e0e7ef", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#7a8fb0" }}>Loading logs...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e7ef" }}>
              <tr>
                <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#7a8fb0", textTransform: "uppercase" }}>Date & Time</th>
                <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#7a8fb0", textTransform: "uppercase" }}>User (Admin)</th>
                <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#7a8fb0", textTransform: "uppercase" }}>Action</th>
                <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#7a8fb0", textTransform: "uppercase" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr key={log.id} style={{ borderBottom: i === filteredLogs.length - 1 ? "none" : "1px solid #f0f4fa" }}>
                  <td style={{ padding: "16px 24px", fontSize: 14, color: "#4a5b78" }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 600, color: "#1a2540" }}>
                    {log.first_name} {log.last_name}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{
                      background: log.action === 'LOGIN' ? '#EBF0FA' : log.action.includes('DELETE') ? '#FCE8E8' : '#E8F5E9',
                      color: log.action === 'LOGIN' ? '#0047AB' : log.action.includes('DELETE') ? '#CC0000' : '#2E7D32',
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: 13, color: "#7a8fb0", maxWidth: 300, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {log.details}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#7a8fb0" }}>No audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
