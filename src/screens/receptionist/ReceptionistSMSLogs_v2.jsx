import { useState } from "react";

const smsLogs = [
  { id: 1,  patient: "Maria Santos",   contact: "+63 912 345 6789", time: "9:05 AM",  date: "Mar 1, 2026",  type: "queue",      status: "sent",    message: "Hi Maria! Your queue number is A-001. Estimated wait: ~5 minutes. Please proceed to Room 1. — CareQueue Health Center" },
  { id: 2,  patient: "Jose Dela Cruz", contact: "+63 917 234 5678", time: "9:10 AM",  date: "Mar 1, 2026",  type: "queue",      status: "sent",    message: "Hi Jose! Your queue number is A-002. Estimated wait: ~15 minutes. — CareQueue Health Center" },
  { id: 3,  patient: "Elena Cruz",     contact: "+63 915 999 8877", time: "9:15 AM",  date: "Mar 1, 2026",  type: "queue",      status: "sent",    message: "Hi Elena! Your queue number is A-003 (Priority Lane). Please be seated near the priority area. — CareQueue Health Center" },
  { id: 4,  patient: "Luisa Ramos",    contact: "+63 921 333 4455", time: "9:20 AM",  date: "Mar 1, 2026",  type: "queue",      status: "failed",  message: "Hi Luisa! Your queue number is A-004 (Priority). Estimated wait: ~25 minutes. — CareQueue Health Center" },
  { id: 5,  patient: "Ramon Valdez",   contact: "+63 920 111 2233", time: "9:32 AM",  date: "Mar 1, 2026",  type: "queue",      status: "sent",    message: "Hi Ramon! Your queue number is A-005. Estimated wait: ~35 minutes. — CareQueue Health Center" },
  { id: 6,  patient: "Pedro Bautista", contact: "+63 919 444 5566", time: "9:45 AM",  date: "Mar 1, 2026",  type: "call-alert", status: "sent",    message: "Hi Pedro! You are now being called. Please proceed to Room 1 for your consultation. Queue: A-008. — CareQueue" },
  { id: 7,  patient: "Ana Lim",        contact: "+63 918 765 4321", time: "10:02 AM", date: "Mar 1, 2026",  type: "queue",      status: "pending", message: "Hi Ana! Your queue number is A-007. Estimated wait: ~45 minutes. — CareQueue Health Center" },
  { id: 8,  patient: "Celia Marcos",   contact: "+63 915 888 7766", time: "8:20 AM",  date: "Mar 1, 2026",  type: "reminder",   status: "sent",    message: "Reminder: You have an appointment with Dr. Cruz today at 9:00 AM. Please arrive 10 minutes early. Reply CANCEL to cancel. — CareQueue" },
  { id: 9,  patient: "Jose Dela Cruz", contact: "+63 917 234 5678", time: "8:15 AM",  date: "Mar 1, 2026",  type: "reminder",   status: "sent",    message: "Reminder: You have an appointment with Dr. Santos today at 9:28 AM. Don't forget to bring your latest FBS result. — CareQueue" },
  { id: 10, patient: "Maria Santos",   contact: "+63 912 345 6789", time: "8:00 AM",  date: "Mar 1, 2026",  type: "reminder",   status: "failed",  message: "Reminder: You have an appointment with Dr. Reyes today at 9:00 AM. Please arrive 10 minutes early. — CareQueue" },
  { id: 11, patient: "Ramon Valdez",   contact: "+63 920 111 2233", time: "2:30 PM",  date: "Feb 28, 2026", type: "follow-up",  status: "sent",    message: "Hi Ramon! Your follow-up appointment with Dr. Reyes is on March 8, 2026 at 9:00 AM. — CareQueue Health Center" },
  { id: 12, patient: "Ana Lim",        contact: "+63 918 765 4321", time: "11:45 AM", date: "Feb 25, 2026", type: "follow-up",  status: "sent",    message: "Hi Ana! Please return for follow-up on March 2, 2026. If symptoms worsen before then, please visit immediately. — CareQueue" },
];

const typeConfig = {
  "queue":      { label: "Queue #",    color: "#2a9d8f", bg: "#e8f7f5", icon: "📋" },
  "call-alert": { label: "Call Alert", color: "#e09040", bg: "#fdf3e8", icon: "📣" },
  "reminder":   { label: "Reminder",   color: "#7b5ea7", bg: "#f0eafb", icon: "🔔" },
  "follow-up":  { label: "Follow-up",  color: "#4a90d9", bg: "#eaf3fc", icon: "📅" },
};

const statusConfig = {
  sent:    { label: "Sent",    color: "#2a9d8f", bg: "#e8f7f5", icon: "✓"  },
  failed:  { label: "Failed",  color: "#e07050", bg: "#fde8e0", icon: "✕"  },
  pending: { label: "Pending", color: "#e09040", bg: "#fdf3e8", icon: "⏳" },
};

function Avatar({ name, size = 32 }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const hue = (name.charCodeAt(0) * 37 + name.charCodeAt(1) * 17) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},45%,72%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: `hsl(${hue},45%,28%)`, flexShrink: 0 }}>{initials}</div>
  );
}

function Sidebar() {
  return (
    <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 220, background: "white", borderRight: "1px solid #edf1f7", display: "flex", flexDirection: "column", zIndex: 10, boxShadow: "2px 0 12px rgba(100,120,150,0.07)" }}>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #f0f3f7" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏥</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40", fontFamily: "'Fraunces',serif" }}>CareQueue</div>
            <div style={{ fontSize: 11, color: "#8a9bb0" }}>Reception</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "10px 20px" }}>
        <div style={{ background: "#e8f7f5", border: "1px solid #b8e4de", borderRadius: 8, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2a9d8f" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#2a9d8f", letterSpacing: 0.4 }}>RECEPTIONIST MODE</span>
        </div>
      </div>
      <nav style={{ padding: "8px 12px", flex: 1 }}>
        {[
          { icon: "⊞",  label: "Dashboard"                        },
          { icon: "📋", label: "Queue"                             },
          { icon: "➕", label: "Register Patient"                  },
          { icon: "🗂️", label: "Patient Records"                   },
          { icon: "📅", label: "Appointments",   badge: "3"       },
          { icon: "📱", label: "SMS Logs"                          },
          { icon: "📊", label: "Reports"                           },
        ].map(item => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10, marginBottom: 2, cursor: "pointer",
            background: item.label === "SMS Logs" ? "#e8f7f5" : "transparent",
            color: item.label === "SMS Logs" ? "#2a9d8f" : "#4a5d75",
            fontWeight: item.label === "SMS Logs" ? 600 : 400, fontSize: 14, transition: "all 0.18s",
          }}
            onMouseEnter={e => { if (item.label !== "SMS Logs") { e.currentTarget.style.background = "#f4f7fb"; e.currentTarget.style.color = "#1e2d40"; }}}
            onMouseLeave={e => { if (item.label !== "SMS Logs") { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4a5d75"; }}}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
            {item.badge && <span style={{ marginLeft: "auto", background: "#2a9d8f", color: "white", borderRadius: 10, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{item.badge}</span>}
          </div>
        ))}
      </nav>
      <div style={{ padding: "16px 20px", borderTop: "1px solid #f0f3f7", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#a8d5c2,#2a9d8f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>AR</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40" }}>Ana R.</div>
          <div style={{ fontSize: 11, color: "#8a9bb0" }}>Front Desk</div>
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, onDone }) {
  useState(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); });
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e2d40", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 13, zIndex: 300, boxShadow: "0 8px 24px rgba(30,45,64,0.28)", animation: "toastIn 0.3s ease" }}>
      <style>{`@keyframes toastIn { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>
      {msg}
    </div>
  );
}

function MessageModal({ log, onClose, onResend }) {
  if (!log) return null;
  const tc = typeConfig[log.type];
  const sc = statusConfig[log.status];
  const segments = Math.ceil(log.message.length / 160);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: 460, boxShadow: "0 24px 64px rgba(20,40,70,0.24)", animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)", overflow: "hidden" }}>
        <style>{`@keyframes popIn { from{transform:scale(0.93);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
        <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Avatar name={log.patient} size={42} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "white", fontFamily: "'Fraunces',serif" }}>{log.patient}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{log.contact} · {log.date} {log.time}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: 12 }}>
            <span style={{ background: tc.bg, color: tc.color, borderRadius: 7, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{tc.icon} {tc.label}</span>
            <span style={{ background: sc.bg, color: sc.color, borderRadius: 7, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{sc.icon} {sc.label}</span>
          </div>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: 11, color: "#8a9bb0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Message Content</div>
          <div style={{ background: log.status === "failed" ? "#fde8e0" : "#e8f7f5", borderRadius: "4px 16px 16px 16px", padding: "14px 16px", border: `1px solid ${log.status === "failed" ? "#f5c8b0" : "#b8e4de"}` }}>
            <div style={{ fontSize: 14, color: "#1e2d40", lineHeight: 1.7 }}>{log.message}</div>
          </div>
          {log.status === "failed" && (
            <div style={{ marginTop: 10, background: "#fde8e0", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
              <span>⚠️</span>
              <div style={{ fontSize: 12, color: "#c05040" }}>Delivery failed. Tap Resend to try again.</div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: "#b0beca" }}>
            <span>{log.message.length} characters</span>
            <span>{segments} SMS segment{segments > 1 ? "s" : ""}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={onClose} style={{ flex: 1, background: "#f4f7fb", border: "1px solid #dde8e5", borderRadius: 10, padding: "10px", fontSize: 13, color: "#7a8fb0", cursor: "pointer" }}>Close</button>
            {log.status === "failed"
              ? <button onClick={() => onResend(log)} style={{ flex: 2, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(42,157,143,0.3)" }}>📱 Resend Message</button>
              : <button style={{ flex: 2, background: "#f4f7fb", border: "1px solid #dde8e5", borderRadius: 10, padding: "10px", fontSize: 13, color: "#4a5d75", cursor: "pointer" }}>📱 Send Again</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReceptionistSMSLogs() {
  const [logs, setLogs]           = useState(smsLogs);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter]     = useState("all");
  const [dateFilter, setDateFilter]     = useState("all");
  const [preview, setPreview]     = useState(null);
  const [toast, setToast]         = useState(null);

  const handleResend = (log) => {
    setLogs(l => l.map(x => x.id === log.id ? { ...x, status: "sent" } : x));
    setPreview(null);
    setToast(`📱 Message resent to ${log.patient}`);
  };

  const filtered = logs.filter(l => {
    const matchSearch = l.patient.toLowerCase().includes(search.toLowerCase()) || l.contact.includes(search);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchType   = typeFilter   === "all" || l.type   === typeFilter;
    const matchDate   = dateFilter   === "all"
      || (dateFilter === "today"     && l.date === "Mar 1, 2026")
      || (dateFilter === "yesterday" && l.date === "Feb 28, 2026");
    return matchSearch && matchStatus && matchType && matchDate;
  });

  const sent    = logs.filter(l => l.status === "sent").length;
  const failed  = logs.filter(l => l.status === "failed").length;
  const pending = logs.filter(l => l.status === "pending").length;
  const deliveryRate = Math.round((sent / (sent + failed)) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb", fontFamily: "'DM Sans',sans-serif", display: "flex" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #c8deda; border-radius: 4px; } @keyframes fadeSlide { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      {preview && <MessageModal log={preview} onClose={() => setPreview(null)} onResend={handleResend} />}
      <Sidebar />

      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ background: "#f4f7fb", borderBottom: "1px solid #dde8e5", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontFamily: "'Fraunces',serif", fontWeight: 700, color: "#1e2d40" }}>SMS Logs</h1>
            <div style={{ fontSize: 13, color: "#7a8fb0", marginTop: 2 }}>{logs.length} messages · {deliveryRate}% delivery rate</div>
          </div>
          <button style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.28)" }}>
            📱 Send Bulk SMS
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { key: "all",     label: "Total",    value: logs.length, icon: "📱", color: "#1e2d40", bg: "#f0f4fb" },
              { key: "sent",    label: "Sent",      value: sent,        icon: "✓",  color: "#2a9d8f", bg: "#e8f7f5" },
              { key: "failed",  label: "Failed",    value: failed,      icon: "✕",  color: "#e07050", bg: "#fde8e0" },
              { key: "pending", label: "Pending",   value: pending,     icon: "⏳", color: "#e09040", bg: "#fdf3e8" },
            ].map(s => (
              <div key={s.key} onClick={() => setStatusFilter(statusFilter === s.key ? "all" : s.key)} style={{
                background: s.bg, borderRadius: 14, padding: "16px 20px", cursor: "pointer",
                border: `2px solid ${statusFilter === s.key ? s.color : "transparent"}`,
                boxShadow: statusFilter === s.key ? `0 4px 16px ${s.color}22` : "none",
                transition: "all 0.18s", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: s.color, opacity: 0.8, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                </div>
                <div style={{ fontSize: 28, opacity: 0.35 }}>{s.icon}</div>
              </div>
            ))}
          </div>

          {/* Delivery rate bar */}
          <div style={{ background: "white", borderRadius: 14, padding: "14px 20px", marginBottom: 18, border: "1px solid #e0e7ef", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40", flexShrink: 0 }}>Delivery Rate</div>
            <div style={{ flex: 1, height: 8, background: "#f0f3f7", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${deliveryRate}%`, background: "linear-gradient(90deg,#2a9d8f,#52c4b8)", borderRadius: 8, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#2a9d8f", fontFamily: "'Fraunces',serif", flexShrink: 0 }}>{deliveryRate}%</div>
            {failed > 0 && (
              <button onClick={() => setStatusFilter("failed")} style={{ background: "#fde8e0", color: "#e07050", border: "1px solid #f5c8b0", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                ⚠ {failed} failed — Retry all
              </button>
            )}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#8a9bb0" }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient or number..."
                style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: "#1e2d40", outline: "none", background: "white", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {[{ key: "all", label: "All Types" }, ...Object.entries(typeConfig).map(([k, v]) => ({ key: k, label: v.label }))].map(f => (
                <button key={f.key} onClick={() => setTypeFilter(f.key)} style={{
                  background: typeFilter === f.key ? "#1e2d40" : "white", color: typeFilter === f.key ? "white" : "#7a8fb0",
                  border: typeFilter === f.key ? "none" : "1px solid #e0e7ef", borderRadius: 8, padding: "7px 12px",
                  fontSize: 11, fontWeight: typeFilter === f.key ? 600 : 400, cursor: "pointer", transition: "all 0.15s",
                }}>{f.label}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {[{ key: "all", label: "All Dates" }, { key: "today", label: "Today" }, { key: "yesterday", label: "Yesterday" }].map(f => (
                <button key={f.key} onClick={() => setDateFilter(f.key)} style={{
                  background: dateFilter === f.key ? "#1e2d40" : "white", color: dateFilter === f.key ? "white" : "#7a8fb0",
                  border: dateFilter === f.key ? "none" : "1px solid #e0e7ef", borderRadius: 8, padding: "7px 12px",
                  fontSize: 11, fontWeight: dateFilter === f.key ? 600 : 400, cursor: "pointer", transition: "all 0.15s",
                }}>{f.label}</button>
              ))}
            </div>
          </div>

          {/* Results note */}
          <div style={{ fontSize: 12, color: "#8a9bb0", marginBottom: 12 }}>
            Showing {filtered.length} of {logs.length} messages
            {failed > 0 && statusFilter !== "failed" && (
              <span onClick={() => setStatusFilter("failed")} style={{ marginLeft: 10, color: "#e07050", fontWeight: 600, cursor: "pointer" }}>
                ⚠ {failed} failed — show only
              </span>
            )}
          </div>

          {/* Table */}
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #e0e7ef", overflow: "hidden", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1fr 2fr 90px", padding: "12px 20px", background: "#f7f9fb", borderBottom: "1px solid #e8edf7" }}>
              {["Patient", "Contact", "Type", "Status", "Message Preview", ""].map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
              ))}
            </div>

            {filtered.length > 0 ? filtered.map((log, i) => {
              const tc = typeConfig[log.type];
              const sc = statusConfig[log.status];
              return (
                <div key={log.id} onClick={() => setPreview(log)} style={{
                  display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1fr 2fr 90px",
                  padding: "14px 20px", borderBottom: "1px solid #f0f3f7",
                  cursor: "pointer", transition: "background 0.15s",
                  animation: `fadeSlide 0.25s ease ${i * 0.03}s both`,
                  background: log.status === "failed" ? "#fffaf9" : "white",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f7f9fb"}
                  onMouseLeave={e => e.currentTarget.style.background = log.status === "failed" ? "#fffaf9" : "white"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={log.patient} size={30} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40" }}>{log.patient}</div>
                      <div style={{ fontSize: 11, color: "#8a9bb0" }}>{log.date} · {log.time}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#4a5d75" }}>{log.contact}</div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ background: tc.bg, color: tc.color, borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 600 }}>{tc.icon} {tc.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ background: sc.bg, color: sc.color, borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 600 }}>{sc.icon} {sc.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#7a8fb0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>
                    {log.message.substring(0, 55)}…
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }} onClick={e => e.stopPropagation()}>
                    {log.status === "failed"
                      ? <button onClick={() => handleResend(log)} style={{ background: "#e07050", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Resend</button>
                      : <button onClick={() => setPreview(log)} style={{ background: "#f4f7fb", color: "#4a5d75", border: "1px solid #e0e7ef", borderRadius: 8, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>View</button>
                    }
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "#8a9bb0" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>No messages found</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters</div>
              </div>
            )}
          </div>

          {filtered.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 4px", fontSize: 12, color: "#8a9bb0" }}>
              <span>{filtered.length} messages shown</span>
              <span>Delivery rate: {deliveryRate}% ({sent} sent / {failed} failed)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
