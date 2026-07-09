import { useState, useEffect } from "react";
import { Search, Building2, Plus, Clock, Bell, ClipboardList, Smartphone, BarChart3, CalendarDays, FolderOpen, AlertTriangle, LayoutDashboard, X, Check, Inbox, RefreshCw } from "lucide-react";
import { smsApi } from "../../lib/api/sms.js";

const typeConfig = {
  "queue":      { label: "Queue #",    color: "#2a9d8f", bg: "#e8f7f5", Icon: ClipboardList },
  "call-alert": { label: "Call Alert", color: "#e09040", bg: "#fdf3e8", Icon: Bell },
  "reminder":   { label: "Reminder",   color: "#8B5FBF", bg: "#f0eafb", Icon: Bell },
  "follow-up":  { label: "Follow-up",  color: "#0047AB", bg: "#E5EDF8", Icon: CalendarDays },
};

const statusConfig = {
  sent:    { label: "Sent",    color: "#2a9d8f", bg: "#e8f7f5", Icon: Check  },
  failed:  { label: "Failed",  color: "#CC0000", bg: "#fde8e0", Icon: X     },
  pending: { label: "Pending", color: "#e09040", bg: "#fdf3e8", Icon: Clock },
};
// Helper: render an Icon from a config entry (handles both Icon= component and icon= string)
function CfgIcon({ cfg, size = 14 }) {
  if (cfg.Icon) return <cfg.Icon size={size} strokeWidth={2} />;
  return cfg.icon ? <span>{cfg.icon}</span> : null;
}


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
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}><Building2 size={18} strokeWidth={2} /></div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40" }}>CareQueue</div>
            <div style={{ fontSize: 14, color: "#8a9bb0" }}>Reception</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "10px 20px" }}>
        <div style={{ background: "#e8f7f5", border: "1px solid #b8e4de", borderRadius: 8, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2a9d8f" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#2a9d8f", letterSpacing: 0.4 }}>RECEPTIONIST MODE</span>
        </div>
      </div>
      <nav style={{ padding: "8px 12px", flex: 1 }}>
        {[
          { Icon: LayoutDashboard,  label: "Dashboard"                        },
          { Icon: ClipboardList, label: "Queue"                             },
          { icon: Plus, label: "Register Patient"                  },
          { Icon: FolderOpen, label: "Patient Records"                   },
          { Icon: CalendarDays, label: "Appointments",   badge: "3"       },
          { icon: "", label: "SMS Logs"                          },
          { Icon: BarChart3, label: "Reports"                           },
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
            {item.badge && <span style={{ marginLeft: "auto", background: "#2a9d8f", color: "white", borderRadius: 10, padding: "1px 8px", fontSize: 14, fontWeight: 700 }}>{item.badge}</span>}
          </div>
        ))}
      </nav>
      <div style={{ padding: "16px 20px", borderTop: "1px solid #f0f3f7", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#a8d5c2,#2a9d8f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white" }}>AR</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>Ana R.</div>
          <div style={{ fontSize: 14, color: "#8a9bb0" }}>Front Desk</div>
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, onDone }) {
  useState(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); });
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e2d40", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 14, zIndex: 300, boxShadow: "0 8px 24px rgba(30,45,64,0.28)", animation: "toastIn 0.3s ease" }}>
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
                <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{log.patient}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{log.contact} · {log.date} {log.time}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: 12 }}>
            <span style={{ background: tc.bg, color: tc.color, borderRadius: 7, padding: "3px 10px", fontSize: 14, fontWeight: 600 }}><CfgIcon cfg={tc} /> {tc.label}</span>
            <span style={{ background: sc.bg, color: sc.color, borderRadius: 7, padding: "3px 10px", fontSize: 14, fontWeight: 600 }}><CfgIcon cfg={sc} /> {sc.label}</span>
          </div>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: 14, color: "#8a9bb0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Message Content</div>
          <div style={{ background: log.status === "failed" ? "#fde8e0" : "#e8f7f5", borderRadius: "4px 16px 16px 16px", padding: "14px 16px", border: `1px solid ${log.status === "failed" ? "#f5c8b0" : "#b8e4de"}` }}>
            <div style={{ fontSize: 14, color: "#1e2d40", lineHeight: 1.7 }}>{log.message}</div>
          </div>
          {log.status === "failed" && (
            <div style={{ marginTop: 10, background: "#fde8e0", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
              <span></span>
              <div style={{ fontSize: 14, color: "#c05040" }}>Delivery failed. Tap Resend to try again.</div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 14, color: "#b0beca" }}>
            <span>{log.message.length} characters</span>
            <span>{segments} SMS segment{segments > 1 ? "s" : ""}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={onClose} style={{ flex: 1, background: "#f4f7fb", border: "1px solid #dde8e5", borderRadius: 10, padding: "10px", fontSize: 14, color: "#7a8fb0", cursor: "pointer" }}>Close</button>
            {log.status === "failed"
              ? <button onClick={() => onResend(log)} style={{ flex: 2, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 10, padding: "10px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(42,157,143,0.3)" }}>Resend Message</button>
              : <button onClick={() => onResend(log)} style={{ flex: 2, background: "#f4f7fb", border: "1px solid #dde8e5", borderRadius: 10, padding: "10px", fontSize: 14, color: "#4a5d75", cursor: "pointer" }}>Send Again</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bulk SMS Modal ─────────────────────────────────────────────────────────
function BulkSMSModal({ patients, onClose, onSend }) {
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');
  const charsLeft = 160 - message.length;

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const allSelected = selected.length === patients.length;
  const toggleAll = () => setSelected(allSelected ? [] : patients.map(p => p.id));

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.5)", zIndex: 250, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(20,40,70,0.22)", animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <style>{`@keyframes popIn { from{transform:scale(0.93);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
        <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "22px 24px", borderRadius: "20px 20px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>Send Bulk SMS</div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14, color: "white" }}><X size={16} strokeWidth={2} /></button>
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Select recipients and compose your message</div>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Recipients */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5 }}>Recipients ({selected.length} selected)</div>
              <button onClick={toggleAll} style={{ background: "none", border: "none", fontSize: 14, color: "#2a9d8f", cursor: "pointer", fontWeight: 600 }}>{allSelected ? "Deselect All" : "Select All"}</button>
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto", border: "1.5px solid #e0e7ef", borderRadius: 12 }}>
              {patients.map(p => (
                <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: "1px solid #f0f3f7", cursor: "pointer", background: selected.includes(p.id) ? "#f0f9f7" : "white" }}>
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#2a9d8f" }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{p.patient}</div>
                    <div style={{ fontSize: 14, color: "#8a9bb0" }}>{p.contact}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {/* Message */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5 }}>Message</div>
              <span style={{ fontSize: 14, color: charsLeft < 20 ? "#CC0000" : "#8a9bb0" }}>{charsLeft} chars left</span>
            </div>
            <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 160))} placeholder="Type your message here..." rows={4}
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e0e7ef", borderRadius: 12, fontSize: 14, resize: "vertical", boxSizing: "border-box", outline: "none" }}
              onFocus={e => e.target.style.borderColor = "#2a9d8f"}
              onBlur={e => e.target.style.borderColor = "#e0e7ef"}
            />
          </div>
          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, background: "#f4f7fb", border: "1px solid #e0e7ef", borderRadius: 10, padding: "11px", fontSize: 14, color: "#7a8fb0", cursor: "pointer" }}>Cancel</button>
            <button
              disabled={selected.length === 0 || !message.trim()}
              onClick={() => onSend(selected, message)}
              style={{ flex: 2, background: selected.length > 0 && message.trim() ? "linear-gradient(135deg,#2a9d8f,#52c4b8)" : "#d0d8e0", color: "white", border: "none", borderRadius: 10, padding: "11px", fontSize: 14, fontWeight: 700, cursor: selected.length > 0 && message.trim() ? "pointer" : "not-allowed", boxShadow: selected.length > 0 ? "0 4px 14px rgba(42,157,143,0.28)" : "none" }}
            >
              Send to {selected.length} recipient{selected.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReceptionistSMSLogs() {

  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter]     = useState("all");
  const [dateFilter, setDateFilter]     = useState("all");
  const [preview, setPreview]     = useState(null);
  const [toast, setToast]         = useState(null);
  const [bulkOpen, setBulkOpen]   = useState(false);

  // ── Fetch live SMS history from API ─────────────────────────────────────────
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await smsApi.getHistory();
      // Map DB rows to the shape the UI expects
      const mapped = (data || []).map(row => {
        const sentDate = new Date(row.sent_at);
        // Detect SMS type from message content
        let type = 'queue';
        const msg = (row.message || '').toLowerCase();
        if (msg.includes("it's your turn") || msg.includes('has been called')) type = 'call-alert';
        else if (msg.includes('reminder') || msg.includes('follow-up appointment is')) type = 'reminder';
        else if (msg.includes('appointment') && msg.includes('scheduled')) type = 'follow-up';

        return {
          id:         row.id,
          patient:    row.patient_name || 'Unknown',
          patient_id: row.patient_id,
          contact:    row.contact_number || row.recipient || '',
          time:       sentDate.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true }),
          date:       sentDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
          rawDate:    sentDate,
          type,
          status:     (row.status || '').toLowerCase() === 'sent' ? 'sent' : 'failed',
          message:    row.message || '',
          semaphore_id: row.semaphore_id,
          error_message: row.error_message,
        };
      });
      setLogs(mapped);
    } catch (err) {
      console.error('[SMSLogs] fetch error:', err);
      setToast('Failed to load SMS history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  // Unique patients derived from logs
  const uniquePatients = Object.values(
    logs.reduce((acc, l) => {
      if (l.patient_id) {
        acc[l.patient_id] = acc[l.patient_id] || { id: l.patient_id, patient: l.patient, contact: l.contact };
      }
      return acc;
    }, {})
  );


  const handleResend = async (log) => {
    try {
      await smsApi.resend(log.id);
      setPreview(null);
      setToast(`Message resent to ${log.patient}`);
      fetchLogs(); // Refresh the list
    } catch (err) {
      setToast(`Resend failed: ${err.message}`);
    }
  };

  const handleBulkSend = async (selectedIds, message) => {
    setBulkOpen(false);
    let sentCount = 0;
    for (const patientId of selectedIds) {
      try {
        await smsApi.send({ patient_id: patientId, message });
        sentCount++;
      } catch { /* skip failed */ }
    }
    setToast(`Bulk SMS sent to ${sentCount} recipient${sentCount !== 1 ? 's' : ''}`);
    fetchLogs();
  };

  // ── Filtering ───────────────────────────────────────────────────────────────
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

  const filtered = logs.filter(l => {
    const matchSearch = l.patient.toLowerCase().includes(search.toLowerCase()) || l.contact.includes(search);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchType   = typeFilter   === "all" || l.type   === typeFilter;
    const matchDate   = dateFilter   === "all"
      || (dateFilter === "today"     && l.date === todayStr)
      || (dateFilter === "yesterday" && l.date === yesterdayStr);
    return matchSearch && matchStatus && matchType && matchDate;
  });

  const sent    = logs.filter(l => l.status === "sent").length;
  const failed  = logs.filter(l => l.status === "failed").length;
  const pending = 0; // Semaphore sends are synchronous — no pending state
  const deliveryRate = (sent + failed) > 0 ? Math.round((sent / (sent + failed)) * 100) : 100;

  return (
    <div style={{ background: "#f4f7fb", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      
      

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      {preview && <MessageModal log={preview} onClose={() => setPreview(null)} onResend={handleResend} />}
      {bulkOpen && <BulkSMSModal patients={uniquePatients} onClose={() => setBulkOpen(false)} onSend={handleBulkSend} />}

      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ background: "#f4f7fb", borderBottom: "1px solid #dde8e5", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e2d40" }}>SMS Logs</h1>
              <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>{logs.length} messages · {deliveryRate}% delivery rate</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={fetchLogs} style={{ background: "white", color: "#4a5d75", border: "1px solid #dde8e5", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <RefreshCw size={14} strokeWidth={2} className={loading ? 'spinning' : ''} /> Refresh
              </button>
              <button onClick={() => setBulkOpen(true)} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.28)" }}>
                Send Bulk SMS
              </button>
            </div>
          </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { key: "all",     label: "Total",    value: logs.length, Icon: Smartphone, color: "#1e2d40", bg: "#EBF0FA" },
              { key: "sent",    label: "Sent",      value: sent,        Icon: Check,  color: "#2a9d8f", bg: "#e8f7f5" },
              { key: "failed",  label: "Failed",    value: failed,      Icon: X,          color: "#CC0000", bg: "#fde8e0" },
              { key: "pending", label: "Pending",   value: pending,     Icon: Clock, color: "#e09040", bg: "#fdf3e8" },
            ].map(s => (
              <div key={s.key} onClick={() => setStatusFilter(statusFilter === s.key ? "all" : s.key)} style={{
                background: s.bg, borderRadius: 14, padding: "16px 20px", cursor: "pointer",
                border: `2px solid ${statusFilter === s.key ? s.color : "transparent"}`,
                boxShadow: statusFilter === s.key ? `0 4px 16px ${s.color}22` : "none",
                transition: "all 0.18s", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 14, color: s.color, opacity: 0.8, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                </div>
                <div style={{ fontSize: 28, opacity: 0.35, display: "flex", alignItems: "center" }}>{s.Icon && <s.Icon size={28} strokeWidth={1.5} />}</div>
              </div>
            ))}
          </div>

          {/* Delivery rate bar */}
          <div style={{ background: "white", borderRadius: 14, padding: "14px 20px", marginBottom: 18, border: "1px solid #e0e7ef", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40", flexShrink: 0 }}>Delivery Rate</div>
            <div style={{ flex: 1, height: 8, background: "#f0f3f7", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${deliveryRate}%`, background: "linear-gradient(90deg,#2a9d8f,#52c4b8)", borderRadius: 8, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#2a9d8f", flexShrink: 0 }}>{deliveryRate}%</div>
            {failed > 0 && (
              <button onClick={() => setStatusFilter("failed")} style={{ background: "#fde8e0", color: "#CC0000", border: "1px solid #f5c8b0", borderRadius: 8, padding: "5px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                <AlertTriangle size={14} strokeWidth={2} /> {failed} failed — Retry all
              </button>
            )}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#8a9bb0" }}><Search size={14} strokeWidth={2} color="#8a9bb0" /></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient or number..."
                style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, color: "#1e2d40", outline: "none", background: "white", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {[{ key: "all", label: "All Types" }, ...Object.entries(typeConfig).map(([k, v]) => ({ key: k, label: v.label }))].map(f => (
                <button key={f.key} onClick={() => setTypeFilter(f.key)} style={{
                  background: typeFilter === f.key ? "#1e2d40" : "white", color: typeFilter === f.key ? "white" : "#7a8fb0",
                  border: typeFilter === f.key ? "none" : "1px solid #e0e7ef", borderRadius: 8, padding: "7px 12px",
                  fontSize: 14, fontWeight: typeFilter === f.key ? 600 : 400, cursor: "pointer", transition: "all 0.15s",
                }}>{f.label}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {[{ key: "all", label: "All Dates" }, { key: "today", label: "Today" }, { key: "yesterday", label: "Yesterday" }].map(f => (
                <button key={f.key} onClick={() => setDateFilter(f.key)} style={{
                  background: dateFilter === f.key ? "#1e2d40" : "white", color: dateFilter === f.key ? "white" : "#7a8fb0",
                  border: dateFilter === f.key ? "none" : "1px solid #e0e7ef", borderRadius: 8, padding: "7px 12px",
                  fontSize: 14, fontWeight: dateFilter === f.key ? 600 : 400, cursor: "pointer", transition: "all 0.15s",
                }}>{f.label}</button>
              ))}
            </div>
          </div>

          {/* Results note */}
          <div style={{ fontSize: 14, color: "#8a9bb0", marginBottom: 12 }}>
            Showing {filtered.length} of {logs.length} messages
            {failed > 0 && statusFilter !== "failed" && (
              <span onClick={() => setStatusFilter("failed")} style={{ marginLeft: 10, color: "#CC0000", fontWeight: 600, cursor: "pointer" }}>
                <AlertTriangle size={14} strokeWidth={2} /> {failed} failed — show only
              </span>
            )}
          </div>

          {/* Table */}
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #e0e7ef", overflow: "hidden", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1fr 2fr 90px", padding: "12px 20px", background: "#f7f9fb", borderBottom: "1px solid #e8edf7" }}>
              {["Patient", "Contact", "Type", "Status", "Message Preview", ""].map((h, i) => (
                <div key={i} style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
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
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{log.patient}</div>
                      <div style={{ fontSize: 14, color: "#8a9bb0" }}>{log.date} · {log.time}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", fontSize: 14, color: "#4a5d75" }}>{log.contact}</div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ background: tc.bg, color: tc.color, borderRadius: 7, padding: "3px 9px", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>{tc.Icon && <tc.Icon size={13} strokeWidth={2} />} {tc.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ background: sc.bg, color: sc.color, borderRadius: 7, padding: "3px 9px", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>{sc.Icon && <sc.Icon size={13} strokeWidth={2} />} {sc.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", fontSize: 14, color: "#7a8fb0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>
                    {log.message.substring(0, 55)}…
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }} onClick={e => e.stopPropagation()}>
                    {log.status === "failed"
                      ? <button onClick={() => handleResend(log)} style={{ background: "#CC0000", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Resend</button>
                      : <button onClick={() => setPreview(log)} style={{ background: "#f4f7fb", color: "#4a5d75", border: "1px solid #e0e7ef", borderRadius: 8, padding: "6px 12px", fontSize: 14, cursor: "pointer" }}>View</button>
                    }
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "#8a9bb0" }}>
                <Inbox size={32} strokeWidth={1.5} color="#8a9bb0" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>No messages found</div>
                <div style={{ fontSize: 14, marginTop: 4 }}>Try adjusting your filters</div>
              </div>
            )}
          </div>

          {filtered.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 4px", fontSize: 14, color: "#8a9bb0" }}>
              <span>{filtered.length} messages shown</span>
              <span>Delivery rate: {deliveryRate}% ({sent} sent / {failed} failed)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
