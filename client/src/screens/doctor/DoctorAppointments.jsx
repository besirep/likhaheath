import { useState } from "react";
import { Building2, Plus, Stethoscope, ClipboardList, CalendarDays, FolderOpen, Phone, FileText, LayoutDashboard, X, Pencil, AlertTriangle } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const YEAR = 2026;
const MONTH = 2; // March (0-indexed)

const appointments = [
  {
    id: 1, date: "2026-03-01", time: "09:00", duration: 30, end: "09:30",
    name: "Maria Santos", age: 34, reason: "Hypertension follow-up",
    type: "follow-up", status: "completed", queue: "A-001",
    contact: "+63 912 345 6789", notes: "Bring BP log",
  },
  {
    id: 2, date: "2026-03-01", time: "13:00", duration: 30, end: "13:30",
    name: "Pedro Bautista", age: 51, reason: "Annual physical",
    type: "checkup", status: "scheduled", queue: null,
    contact: "+63 919 444 5566", notes: "",
  },
  {
    id: 3, date: "2026-03-01", time: "14:30", duration: 45, end: "15:15",
    name: "Luisa Ramos", age: 39, reason: "Post-op follow-up",
    type: "follow-up", status: "scheduled", queue: null,
    contact: "+63 921 333 4455", notes: "Wound check needed",
  },
  {
    id: 4, date: "2026-03-01", time: "16:00", duration: 30, end: "16:30",
    name: "Elena Cruz", age: 66, reason: "Chest discomfort review",
    type: "urgent", status: "scheduled", queue: null,
    contact: "+63 915 999 8877", notes: "Post-cardiology referral",
  },
  {
    id: 5, date: "2026-03-03", time: "09:30", duration: 30, end: "10:00",
    name: "Jose Dela Cruz", age: 57, reason: "Diabetes follow-up",
    type: "follow-up", status: "scheduled", queue: null,
    contact: "+63 917 234 5678", notes: "Bring latest FBS result",
  },
  {
    id: 6, date: "2026-03-03", time: "11:00", duration: 20, end: "11:20",
    name: "Ana Lim", age: 28, reason: "URTI check-up",
    type: "follow-up", status: "scheduled", queue: null,
    contact: "+63 918 765 4321", notes: "",
  },
  {
    id: 7, date: "2026-03-05", time: "10:00", duration: 60, end: "11:00",
    name: "Ramon Valdez", age: 45, reason: "Back pain follow-up + PT review",
    type: "follow-up", status: "scheduled", queue: null,
    contact: "+63 920 111 2233", notes: "PT report expected",
  },
  {
    id: 8, date: "2026-03-08", time: "09:00", duration: 30, end: "09:30",
    name: "Celia Marcos", age: 52, reason: "Lab results review",
    type: "checkup", status: "scheduled", queue: null,
    contact: "+63 915 888 7766", notes: "",
  },
  {
    id: 9, date: "2026-03-10", time: "14:00", duration: 45, end: "14:45",
    name: "Maria Santos", age: 34, reason: "BP recheck",
    type: "follow-up", status: "scheduled", queue: null,
    contact: "+63 912 345 6789", notes: "",
  },
  {
    id: 10, date: "2026-03-15", time: "10:30", duration: 30, end: "11:00",
    name: "Jose Dela Cruz", age: 57, reason: "HbA1c review",
    type: "follow-up", status: "scheduled", queue: null,
    contact: "+63 917 234 5678", notes: "",
  },
];

const typeConfig = {
  "follow-up": { label: "Follow-up", color: "#0047AB", bg: "#EBF0FA", dot: "#0047AB" },
  "checkup":   { label: "Check-up",  color: "#2a9d8f", bg: "#e8f7f5", dot: "#2a9d8f" },
  "urgent":    { label: "Urgent",    color: "#CC0000", bg: "#fde8e0", dot: "#CC0000" },
  "new":       { label: "New Visit", color: "#9b72cf", bg: "#f0eafb", dot: "#9b72cf" },
};

const statusConfig = {
  scheduled: { label: "Scheduled", color: "#0047AB", bg: "#EBF0FA" },
  completed: { label: "Completed", color: "#2a9d8f", bg: "#e8f7f5" },
  cancelled: { label: "Cancelled", color: "#9aabc0", bg: "#f0f4fa" },
};

function Avatar({ name, size = 32 }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const hue = (name.charCodeAt(0) * 41 + name.charCodeAt(1) * 19) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `hsl(${hue},40%,75%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700,
      color: `hsl(${hue},40%,28%)`, flexShrink: 0,
    }}>{initials}</div>
  );
}

function Sidebar() {
  return (
    <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 220, background: "#1a2540", display: "flex", flexDirection: "column", zIndex: 10, boxShadow: "3px 0 20px rgba(20,40,90,0.18)" }}>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0047AB,#1565D8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}><Building2 size={18} strokeWidth={2} /></div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>CareQueue</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Doctor Portal</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 20px" }}>
        <div style={{ background: "rgba(0,71,171,0.18)", border: "1px solid rgba(0,71,171,0.35)", borderRadius: 8, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1565D8" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#7eb3f5", letterSpacing: 0.4 }}>PHYSICIAN MODE</span>
        </div>
      </div>
      <nav style={{ padding: "8px 12px", flex: 1 }}>
        {[
          { Icon: LayoutDashboard,  label: "Dashboard"                             },
          { Icon: ClipboardList, label: "Queue",         badge: "4"             },
          { Icon: Stethoscope, label: "Consultations", badge: "1"             },
          { Icon: FolderOpen, label: "Patient Records"                       },
          { Icon: CalendarDays, label: "Appointments",  active: true           },
        ].map(item => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10, marginBottom: 2, cursor: "pointer",
            background: item.active ? "rgba(0,71,171,0.22)" : "transparent",
            color: item.active ? "#7eb3f5" : "rgba(255,255,255,0.55)",
            fontWeight: item.active ? 600 : 400, fontSize: 14, transition: "all 0.2s",
          }}
            onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}}
            onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
            {item.badge && <span style={{ marginLeft: "auto", background: "#0047AB", color: "white", borderRadius: 10, padding: "1px 8px", fontSize: 14, fontWeight: 700 }}>{item.badge}</span>}
          </div>
        ))}
      </nav>
      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#1565D8,#0047AB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white" }}>DR</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>Dr. Reyes</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Internal Medicine</div>
        </div>
      </div>
    </div>
  );
}

// ── Appointment Detail Drawer ─────────────────────────────────────────────────
function AppointmentDrawer({ appt, onClose, onCancel }) {
  if (!appt) return null;
  const tc = typeConfig[appt.type];
  const sc = statusConfig[appt.status];

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(20,35,70,0.25)",
        zIndex: 90, transition: "opacity 0.2s",
      }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 420,
        background: "white", zIndex: 100, overflowY: "auto",
        boxShadow: "-8px 0 40px rgba(20,40,90,0.18)",
        animation: "slideIn 0.3s cubic-bezier(0.22,1,0.36,1)",
        display: "flex", flexDirection: "column",
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#1a2540,#263760)", padding: "24px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>Appointment Detail</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>{appt.name}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>{appt.age} yrs · {appt.reason}</div>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.12)", border: "none", width: 34, height: 34,
              borderRadius: 9, cursor: "pointer", fontSize: 15, color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><X size={16} strokeWidth={2} /></button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <span style={{ background: tc.bg, color: tc.color, borderRadius: 7, padding: "3px 10px", fontSize: 14, fontWeight: 600 }}>{tc.label}</span>
            <span style={{ background: sc.bg, color: sc.color, borderRadius: 7, padding: "3px 10px", fontSize: 14, fontWeight: 600 }}>{sc.label}</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Time block */}
          <div style={{ background: "#EBF0FA", borderRadius: 14, padding: "16px 18px", border: "1px solid #C0D4F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, color: "#7a8fb0", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Date & Time</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#1a2540" }}>
                  {new Date(appt.date).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}
                </div>
                <div style={{ fontSize: 15, color: "#0047AB", fontWeight: 600, marginTop: 4 }}>
                  {appt.time} – {appt.end}
                  <span style={{ fontSize: 14, color: "#7a8fb0", fontWeight: 400, marginLeft: 8 }}>({appt.duration} min)</span>
                </div>
              </div>
              <div style={{ fontSize: 40 }}><CalendarDays size={16} strokeWidth={2} /></div>
            </div>
          </div>

          {/* Patient info */}
          <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #D8E4F2" }}>
            <div style={{ fontSize: 14, color: "#9aabc0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>Patient Info</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <Avatar name={appt.name} size={44} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1a2540" }}>{appt.name}</div>
                <div style={{ fontSize: 14, color: "#7a8fb0" }}>{appt.age} years old</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#4a5d75" }}>
              <span><Phone size={16} strokeWidth={2} /></span>{appt.contact}
            </div>
          </div>

          {/* Notes */}
          {appt.notes && (
            <div style={{ background: "#f7f9fd", borderRadius: 14, padding: "16px 18px", border: "1px solid #D8E4F2" }}>
              <div style={{ fontSize: 14, color: "#9aabc0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}><FileText size={16} strokeWidth={2} /> Notes</div>
              <div style={{ fontSize: 14, color: "#2a3550", lineHeight: 1.7 }}>{appt.notes}</div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
            {appt.status === "scheduled" && (
              <>
                <button onClick={() => { if(typeof onNavigate === 'function') onNavigate('dr-consult'); else if(typeof setShowBook === 'function') {} }} style={{
                  background: "linear-gradient(135deg,#0047AB,#1565D8)", color: "white", border: "none",
                  borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(0,71,171,0.3)",
                }}><Stethoscope size={16} strokeWidth={2} /> Start Consultation</button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowBook(true)} style={{
                    flex: 1, background: "#EBF0FA", color: "#0047AB", border: "1px solid #CCDAF0",
                    borderRadius: 10, padding: "10px", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}><Pencil size={14} strokeWidth={2.5} /> Reschedule</button>
                  <button onClick={() => onCancel(appt)} style={{
                    flex: 1, background: "#fff0ee", color: "#CC0000", border: "1px solid #f5c8b0",
                    borderRadius: 10, padding: "10px", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}><X size={16} strokeWidth={2} /> Cancel</button>
                </div>
                <button onClick={() => { onClose(); alert('SMS reminder sent to ' + appt.name); }} style={{
                  background: "white", color: "#7a8fb0", border: "1px solid #CCDAF0",
                  borderRadius: 10, padding: "10px", fontSize: 14, cursor: "pointer",
                }}>Send Reminder SMS</button>
              </>
            )}
            {appt.status === "completed" && (
              <div style={{ background: "#e8f7f5", borderRadius: 11, padding: "13px", textAlign: "center", color: "#2a9d8f", fontSize: 14, fontWeight: 600 }}>
                Consultation completed · {appt.queue}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Book Modal ────────────────────────────────────────────────────────────────
function BookModal({ defaultDate, onClose }) {
  const [form, setForm] = useState({
    name: "", age: "", contact: "", reason: "",
    date: defaultDate || "", time: "09:00", duration: "30", type: "follow-up", notes: "",
  });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(20,35,70,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, backdropFilter: "blur(4px)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: 20, width: 500, maxHeight: "88vh",
        overflowY: "auto", boxShadow: "0 24px 64px rgba(20,40,90,0.24)",
        animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <style>{`@keyframes popIn { from{transform:scale(0.93);opacity:0} to{transform:scale(1);opacity:1} }`}</style>

        <div style={{ background: "linear-gradient(135deg,#1a2540,#263760)", padding: "22px 26px", borderRadius: "20px 20px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: 0.8, textTransform: "uppercase" }}>New Appointment</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "white", marginTop: 3 }}>Book a Visit</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 34, height: 34, borderRadius: 9, cursor: "pointer", fontSize: 15, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
          </div>
        </div>

        <div style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Patient */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10 }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Patient Name</label>
              <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Full name"
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D8E4F2", borderRadius: 10, fontSize: 14, color: "#1a2540", outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "#0047AB"} onBlur={e => e.target.style.borderColor = "#D8E4F2"} />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Age</label>
              <input value={form.age} onChange={e => update("age", e.target.value)} placeholder="Age" type="number"
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D8E4F2", borderRadius: 10, fontSize: 14, color: "#1a2540", outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "#0047AB"} onBlur={e => e.target.style.borderColor = "#D8E4F2"} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Contact Number</label>
            <input value={form.contact} onChange={e => update("contact", e.target.value)} placeholder="+63 9XX XXX XXXX"
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D8E4F2", borderRadius: 10, fontSize: 14, color: "#1a2540", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#0047AB"} onBlur={e => e.target.style.borderColor = "#D8E4F2"} />
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Reason for Visit</label>
            <input value={form.reason} onChange={e => update("reason", e.target.value)} placeholder="Chief complaint or visit reason"
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D8E4F2", borderRadius: 10, fontSize: 14, color: "#1a2540", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#0047AB"} onBlur={e => e.target.style.borderColor = "#D8E4F2"} />
          </div>

          {/* Date + Time + Duration */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Date", key: "date", type: "date" },
              { label: "Time", key: "time", type: "time" },
              { label: "Duration (min)", key: "duration", type: "number" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => update(f.key, e.target.value)} type={f.type}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D8E4F2", borderRadius: 10, fontSize: 14, color: "#1a2540", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#0047AB"} onBlur={e => e.target.style.borderColor = "#D8E4F2"} />
              </div>
            ))}
          </div>

          {/* Type */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 8 }}>Appointment Type</label>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(typeConfig).map(([key, tc]) => (
                <button key={key} onClick={() => update("type", key)} style={{
                  flex: 1, padding: "8px 6px", border: `2px solid ${form.type === key ? tc.color : "#D8E4F2"}`,
                  borderRadius: 10, background: form.type === key ? tc.bg : "white",
                  color: form.type === key ? tc.color : "#7a8fb0",
                  fontSize: 14, fontWeight: form.type === key ? 700 : 400,
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: tc.dot, margin: "0 auto 4px" }} />
                  {tc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Notes (optional)</label>
            <textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Any prep instructions or reminders for the patient..."
              rows={3} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D8E4F2", borderRadius: 10, fontSize: 14, color: "#1a2540", outline: "none", resize: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#0047AB"} onBlur={e => e.target.style.borderColor = "#D8E4F2"} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, background: "#EBF0FA", border: "1px solid #CCDAF0", borderRadius: 11, padding: "12px", fontSize: 14, color: "#7a8fb0", cursor: "pointer", fontWeight: 500 }}>Cancel</button>
            <button onClick={() => { if(!form.name.trim()||!form.reason.trim()){ alert('Please fill in Patient Name and Reason for Visit'); return; } onClose(); }} style={{ flex: 2, background: "linear-gradient(135deg,#0047AB,#1565D8)", color: "white", border: "none", borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,71,171,0.3)" }}>
              Book Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelect, appointments }) {
  const [viewMonth, setViewMonth] = useState(MONTH);
  const [viewYear,  setViewYear]  = useState(YEAR);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const monthName   = new Date(viewYear, viewMonth).toLocaleString("en-PH", { month: "long", year: "numeric" });

  const apptDates = new Set(appointments.map(a => a.date));
  const urgentDates = new Set(appointments.filter(a => a.type === "urgent").map(a => a.date));

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const pad = n => String(n).padStart(2, "0");

  return (
    <div style={{ background: "white", borderRadius: 16, padding: "18px", border: "1px solid #D8E4F2", boxShadow: "0 2px 10px rgba(20,40,90,0.06)" }}>
      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#7a8fb0", padding: "4px 8px" }}>‹</button>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2540" }}>{monthName}</div>
        <button onClick={nextMonth} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#7a8fb0", padding: "4px 8px" }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 14, fontWeight: 600, color: "#b0bdd6", padding: "2px 0" }}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const isSelected = selectedDate === dateStr;
          const hasAppt = apptDates.has(dateStr);
          const isUrgent = urgentDates.has(dateStr);
          const isToday = dateStr === "2026-03-01";

          return (
            <div key={day} onClick={() => onSelect(dateStr)} style={{
              textAlign: "center", padding: "5px 2px", borderRadius: 8, cursor: "pointer",
              background: isSelected ? "#0047AB" : isToday ? "#EBF0FA" : "transparent",
              color: isSelected ? "white" : isToday ? "#0047AB" : "#1a2540",
              fontWeight: isSelected || isToday ? 700 : 400,
              fontSize: 14, position: "relative", transition: "background 0.15s",
            }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#EBF0FA"; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? "#EBF0FA" : "transparent"; }}
            >
              {day}
              {hasAppt && (
                <div style={{
                  width: 4, height: 4, borderRadius: "50%", margin: "1px auto 0",
                  background: isSelected ? "rgba(255,255,255,0.8)" : isUrgent ? "#CC0000" : "#0047AB",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Day Schedule ──────────────────────────────────────────────────────────────
function DaySchedule({ date, appointments, onSelect, selectedId }) {
  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8AM–6PM
  const pad = n => String(n).padStart(2, "0");

  const dayAppts = appointments
    .filter(a => a.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));

  const timeToY = (time) => {
    const [h, m] = time.split(":").map(Number);
    return ((h - 8) * 60 + m) * (52 / 60); // 52px per hour
  };

  const dateLabel = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "Select a date";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Day header */}
      <div style={{ padding: "16px 22px", borderBottom: "1px solid #D8E4F2", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1a2540" }}>{dateLabel}</div>
          <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>{dayAppts.length} appointment{dayAppts.length !== 1 ? "s" : ""} scheduled</div>
        </div>
        {dayAppts.filter(a => a.type === "urgent").length > 0 && (
          <div style={{ background: "#fde8e0", color: "#CC0000", borderRadius: 9, padding: "5px 12px", fontSize: 14, fontWeight: 700 }}>
            <AlertTriangle size={16} strokeWidth={2} /> {dayAppts.filter(a => a.type === "urgent").length} urgent
          </div>
        )}
      </div>

      {/* Time grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 22px", background: "#f7f9fd" }}>
        {date ? (
          <div style={{ position: "relative", minHeight: `${11 * 52}px` }}>
            {/* Hour lines */}
            {hours.map(h => (
              <div key={h} style={{ position: "absolute", left: 0, right: 0, top: `${(h - 8) * 52}px`, display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ fontSize: 14, color: "#b0bdd6", width: 40, flexShrink: 0, paddingTop: 2, textAlign: "right" }}>
                  {h > 12 ? `${h - 12}PM` : h === 12 ? "12PM" : `${h}AM`}
                </div>
                <div style={{ flex: 1, height: 1, background: "#e8edf7", marginTop: 8 }} />
              </div>
            ))}

            {/* Appointment blocks */}
            {dayAppts.map(appt => {
              const tc = typeConfig[appt.type];
              const top = timeToY(appt.time) + 52; // offset for first hour line
              const height = Math.max((appt.duration / 60) * 52, 40);
              const isSelected = selectedId === appt.id;

              return (
                <div key={appt.id} onClick={() => onSelect(appt)} style={{
                  position: "absolute", left: 60, right: 0,
                  top: `${top}px`, height: `${height}px`,
                  background: isSelected ? tc.color : `${tc.color}18`,
                  border: `2px solid ${tc.color}`,
                  borderRadius: 10, padding: "8px 12px", cursor: "pointer",
                  transition: "all 0.18s", overflow: "hidden",
                  boxShadow: isSelected ? `0 4px 16px ${tc.color}40` : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar name={appt.name} size={22} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? "white" : tc.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {appt.name}
                      </div>
                      {height > 45 && (
                        <div style={{ fontSize: 14, color: isSelected ? "rgba(255,255,255,0.8)" : "#7a8fb0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {appt.time}–{appt.end} · {appt.reason}
                        </div>
                      )}
                    </div>
                    <div style={{ marginLeft: "auto", fontSize: 14, fontWeight: 600, color: isSelected ? "rgba(255,255,255,0.8)" : tc.color, flexShrink: 0 }}>
                      {appt.duration}m
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9aabc0" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}><CalendarDays size={16} strokeWidth={2} /></div>
            <div style={{ fontSize: 14 }}>Pick a date from the calendar</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Upcoming list ─────────────────────────────────────────────────────────────
function UpcomingList({ appointments, onSelect, selectedId }) {
  const upcoming = appointments
    .filter(a => a.status === "scheduled")
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {upcoming.map(appt => {
        const tc = typeConfig[appt.type];
        const isSelected = selectedId === appt.id;
        return (
          <div key={appt.id} onClick={() => onSelect(appt)} style={{
            background: "white", borderRadius: 12, padding: "12px 14px",
            border: `1.5px solid ${isSelected ? tc.color : "#D8E4F2"}`,
            cursor: "pointer", transition: "all 0.15s",
            boxShadow: isSelected ? `0 3px 12px ${tc.color}25` : "none",
          }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = "#b0c8f0"; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = "#D8E4F2"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={appt.name} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2540" }}>{appt.name}</div>
                  <span style={{ background: tc.bg, color: tc.color, borderRadius: 5, padding: "1px 7px", fontSize: 14, fontWeight: 600, flexShrink: 0, marginLeft: 6 }}>{tc.label}</span>
                </div>
                <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>{appt.reason}</div>
                <div style={{ fontSize: 14, color: "#b0bdd6", marginTop: 3 }}>
                  {new Date(appt.date + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" })} · {appt.time}–{appt.end}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DoctorAppointments({ onNavigate }) {
  const [selectedDate, setSelectedDate] = useState("2026-03-01");
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showBook, setShowBook]         = useState(false);
  const [view, setView]                 = useState("day"); // "day" | "upcoming"

  const handleSelectAppt = (appt) => setSelectedAppt(a => a?.id === appt.id ? null : appt);

  const today = appointments.filter(a => a.date === "2026-03-01");

  return (
    <div style={{ height: "100vh", background: "#EBF0FA", display: "flex", overflow: "hidden" }}>
      
      

      {showBook && <BookModal defaultDate={selectedDate} onClose={() => setShowBook(false)} />}
      <AppointmentDrawer appt={selectedAppt} onClose={() => setSelectedAppt(null)} onCancel={() => setSelectedAppt(null)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ background: "#EBF0FA", borderBottom: "1px solid #CCDAF0", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1a2540" }}>Appointments</h1>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>
              {today.length} today · {appointments.filter(a => a.status === "scheduled").length} upcoming
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Stat pills */}
            <div style={{ display: "flex", gap: 7 }}>
              {[
                { label: "Today",     value: today.length,                                                color: "#0047AB", bg: "#EBF0FA" },
                { label: "Upcoming",  value: appointments.filter(a => a.status === "scheduled").length,   color: "#e09040", bg: "#fdf3e8" },
                { label: "Completed", value: appointments.filter(a => a.status === "completed").length,   color: "#2a7d5f", bg: "#e8f7f1" },
                { label: "Urgent",    value: appointments.filter(a => a.type === "urgent").length,        color: "#CC0000", bg: "#fde8e0" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "6px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 14, color: s.color, opacity: 0.8, letterSpacing: 0.3 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* View toggle */}
            <div style={{ display: "flex", background: "white", border: "1px solid #D8E4F2", borderRadius: 10, overflow: "hidden" }}>
              {[{ key: "day", label: "Day View" }, { key: "upcoming", label: <><ClipboardList size={16} strokeWidth={2} /> Upcoming</> }].map(v => (
                <button key={v.key} onClick={() => setView(v.key)} style={{
                  padding: "8px 14px", border: "none", cursor: "pointer",
                  background: view === v.key ? "#1a2540" : "transparent",
                  color: view === v.key ? "white" : "#7a8fb0",
                  fontSize: 14, fontWeight: view === v.key ? 600 : 400,
                  transition: "all 0.15s",
                }}>{v.label}</button>
              ))}
            </div>
            <button onClick={() => setShowBook(true)} style={{ background: "linear-gradient(135deg,#0047AB,#1565D8)", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,71,171,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={16} strokeWidth={2} /> Book Appointment
            </button>
          </div>
        </div>

        {/* Main 3-column layout */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "220px 1fr", overflow: "hidden" }}>

          {/* Left: Mini calendar + stats */}
          <div style={{ background: "white", borderRight: "1px solid #D8E4F2", padding: "16px 14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
            <MiniCalendar
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              appointments={appointments}
            />

            {/* Quick stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "This Week",  value: appointments.filter(a => a.date >= "2026-03-01" && a.date <= "2026-03-07").length, color: "#0047AB", bg: "#EBF0FA" },
                { label: "Urgent",     value: appointments.filter(a => a.type === "urgent").length,                               color: "#CC0000", bg: "#fde8e0" },
                { label: "Completed",  value: appointments.filter(a => a.status === "completed").length,                          color: "#2a9d8f", bg: "#e8f7f5" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, color: s.color }}>{s.label}</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Type legend */}
            <div style={{ background: "#f7f9fd", borderRadius: 12, padding: "12px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#b0bdd6", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Legend</div>
              {Object.entries(typeConfig).map(([key, tc]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: tc.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "#4a5d75" }}>{tc.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Day schedule or Upcoming list */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {view === "day" ? (
              <DaySchedule
                date={selectedDate}
                appointments={appointments}
                onSelect={handleSelectAppt}
                selectedId={selectedAppt?.id}
              />
            ) : (
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1a2540", marginBottom: 16 }}>
                  Upcoming Appointments
                </div>
                <UpcomingList
                  appointments={appointments}
                  onSelect={handleSelectAppt}
                  selectedId={selectedAppt?.id}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
