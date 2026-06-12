import { useState, useEffect, useCallback } from "react";
import { Search, Building2, Plus, AlertCircle, ClipboardList, Smartphone, BarChart3, CalendarDays, FolderOpen, UserRound, User, LayoutDashboard, Phone, X, Ghost, Pencil } from "lucide-react";
import { appointmentsApi } from "../../lib/api/appointments.js";
import { smsApi } from "../../lib/api/sms.js";
import { staffApi } from "../../lib/api/staff.js";

// ── Helpers ────────────────────────────────────────────────────────────────────
// Map DB status strings → UI status keys
function normalizeStatus(s) {
  if (!s) return "scheduled";
  const l = s.toLowerCase();
  if (l === "completed") return "checked-in";
  if (l === "cancelled") return "cancelled";
  if (l === "no-show" || l === "noshow") return "no-show";
  return "scheduled";
}

// Map API row → component appointment shape
function mapAppt(row) {
  const scheduled = new Date(row.scheduled_date);
  const dateStr = scheduled.toISOString().slice(0, 10);
  const hours   = String(scheduled.getHours()).padStart(2, "0");
  const mins    = String(scheduled.getMinutes()).padStart(2, "0");
  const timeStr = `${hours}:${mins}`;
  return {
    id:       row.id,
    date:     dateStr,
    time:     timeStr,
    end:      timeStr,       // DB doesn't store end-time separately
    duration: 30,
    name:     row.patient_name || "Unknown",
    age:      null,
    contact:  "",
    reason:   row.notes || "",
    doctor:   row.doctor_name || "",
    type:     "follow-up",
    status:   normalizeStatus(row.status),
    queue:    row.queue_number ? `A-${String(row.queue_number).padStart(3, "0")}` : null,
    priority: null,
    // keep original ids for API mutations
    _patientId: row.patient_id,
  };
}

// Default calendar start at current month
const now   = new Date();
const YEAR  = now.getFullYear();
const MONTH = now.getMonth();

const typeConfig = {
  "follow-up": { label: "Follow-up", color: "#2a9d8f", bg: "#e8f7f5", dot: "#2a9d8f" },
  "checkup":   { label: "Check-up",  color: "#0047AB", bg: "#E5EDF8", dot: "#0047AB" },
  "urgent":    { label: "Urgent",    color: "#CC0000", bg: "#fde8e0", dot: "#CC0000" },
  "new":       { label: "New Visit", color: "#8B5FBF", bg: "#f0eafb", dot: "#8B5FBF" },
};

const statusConfig = {
  scheduled:  { label: "Scheduled",  color: "#0047AB", bg: "#E5EDF8" },
  "checked-in": { label: "Checked In", color: "#2a9d8f", bg: "#e8f7f5" },
  cancelled:  { label: "Cancelled",  color: "#9aabc0", bg: "#f0f4fa" },
  "no-show":  { label: "No-show",    color: "#c05080", bg: "#fce8f0" },
};

const priorityConfig = {
  elderly:   { label: "Senior Citizen", Icon: UserRound, color: "#8B5FBF" },
  pregnant:  { label: "Pregnant",       Icon: UserRound, color: "#d4709a" },
  pwd:       { label: "PWD",            Icon: UserRound, color: "#0047AB" },
  pediatric: { label: "Pedia",          Icon: UserRound, color: "#e09040" },
};


function Avatar({ name, size = 32 }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const hue = (name.charCodeAt(0) * 37 + name.charCodeAt(1) * 17) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `hsl(${hue},45%,72%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700,
      color: `hsl(${hue},45%,28%)`, flexShrink: 0,
    }}>{initials}</div>
  );
}


// ── Book Modal ────────────────────────────────────────────────────────────────
function BookModal({ defaultDate, onClose, onSubmit, showToast }) {
  const [form, setForm] = useState({
    name: "", age: "", contact: "", reason: "", date: defaultDate || "",
    time: "09:00", duration: "30", doctor: "", type: "follow-up", priority: "", notes: "",
  });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [availableDoctors, setAvailableDoctors] = useState([]);
  useEffect(() => {
    staffApi.getAll()
      .then(res => setAvailableDoctors(res.filter(s => s.position?.toLowerCase().includes('doctor') || s.position?.toLowerCase() === 'physician')))
      .catch(() => {});
  }, []);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(20,40,70,0.24)", animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <style>{`@keyframes popIn { from{transform:scale(0.93);opacity:0} to{transform:scale(1);opacity:1} }`}</style>

        <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "22px 26px", borderRadius: "20px 20px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: 0.8, textTransform: "uppercase" }}>New Appointment</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "white", marginTop: 3 }}>Book a Visit</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 34, height: 34, borderRadius: 9, cursor: "pointer", fontSize: 15, color: "white" }}><X size={16} strokeWidth={2} /></button>
          </div>
        </div>

        <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Patient */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10 }}>
            {[
              { label: "Patient Name *", key: "name", placeholder: "Full name", type: "text" },
              { label: "Age",            key: "age",  placeholder: "Age",       type: "number" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => update(f.key, e.target.value)} placeholder={f.placeholder} type={f.type}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, color: "#1e2d40", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
              </div>
            ))}
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Contact Number</label>
            <input value={form.contact} onChange={e => update("contact", e.target.value)} placeholder="+63 9XX XXX XXXX"
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, color: "#1e2d40", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Reason for Visit *</label>
            <input value={form.reason} onChange={e => update("reason", e.target.value.toLowerCase().replace(/\b\w/g, s => s.toUpperCase()))} placeholder="Chief complaint"
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, color: "#1e2d40", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Date *",    key: "date",     type: "date"   },
              { label: "Time *",    key: "time",     type: "time"   },
              { label: "Duration",  key: "duration", type: "number" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => update(f.key, e.target.value)} type={f.type}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, color: "#1e2d40", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
              </div>
            ))}
          </div>

          {/* Doctor */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 8 }}>Assign Doctor</label>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              <button onClick={() => update("doctor", "")} style={{
                padding: "8px 14px", border: `1.5px solid ${form.doctor === "" ? "#2a9d8f" : "#e0e7ef"}`,
                borderRadius: 9, background: form.doctor === "" ? "#e8f7f5" : "white",
                color: form.doctor === "" ? "#2a9d8f" : "#7a8fb0",
                fontSize: 14, fontWeight: form.doctor === "" ? 600 : 400, cursor: "pointer", transition: "all 0.15s",
              }}>Auto-assign</button>
              {availableDoctors.map(d => {
                const name = `Dr. ${d.first_name} ${d.last_name}`;
                return (
                  <button key={d.id} onClick={() => update("doctor", name)} style={{
                    padding: "8px 14px", border: `1.5px solid ${form.doctor === name ? "#2a9d8f" : "#e0e7ef"}`,
                    borderRadius: 9, background: form.doctor === name ? "#e8f7f5" : "white",
                    color: form.doctor === name ? "#2a9d8f" : "#7a8fb0",
                    fontSize: 14, fontWeight: form.doctor === name ? 600 : 400, cursor: "pointer", transition: "all 0.15s",
                  }}>{name}</button>
                );
              })}
            </div>
          </div>

          {/* Type */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 8 }}>Type</label>
            <div style={{ display: "flex", gap: 7 }}>
              {Object.entries(typeConfig).map(([key, tc]) => (
                <button key={key} onClick={() => update("type", key)} style={{
                  flex: 1, padding: "8px 6px", border: `2px solid ${form.type === key ? tc.color : "#e0e7ef"}`,
                  borderRadius: 9, background: form.type === key ? tc.bg : "white",
                  color: form.type === key ? tc.color : "#7a8fb0",
                  fontSize: 14, fontWeight: form.type === key ? 700 : 400, cursor: "pointer", transition: "all 0.15s",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: tc.dot, margin: "0 auto 4px" }} />
                  {tc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 8 }}>Priority</label>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {[{ key: "", label: "None", icon: "—", color: "#8a9bb0", bg: "#f0f4fa" }, ...Object.entries(priorityConfig).map(([k, v]) => ({ key: k, ...v }))].map(p => (
                <button key={p.key} onClick={() => update("priority", p.key)} style={{
                  padding: "6px 12px", border: `1.5px solid ${form.priority === p.key ? p.color : "#e0e7ef"}`,
                  borderRadius: 8, background: form.priority === p.key ? p.bg : "white",
                  color: form.priority === p.key ? p.color : "#7a8fb0",
                  fontSize: 14, fontWeight: form.priority === p.key ? 600 : 400, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
                }}>
                  <span>{p.icon}</span>{p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, background: "#f4f7fb", border: "1px solid #dde8e5", borderRadius: 11, padding: "12px", fontSize: 14, color: "#7a8fb0", cursor: "pointer" }}>Cancel</button>
            <button onClick={() => {
              if (!form.name.trim() || !form.date || !form.reason.trim()) {
                showToast ? showToast("Please fill in Patient Name, Date, and Reason.") : alert("Please fill in Patient Name, Date, and Reason.");
                return;
              }
              onSubmit(form);
              onClose();
            }} style={{ flex: 2, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.3)" }}>
              Book & Send SMS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Appointment Drawer ────────────────────────────────────────────────────────
function AppointmentDrawer({ appt, onClose, onCheckin, onCancel, onNoShow, onAddToQueue, onReschedule, onSms }) {
  if (!appt) return null;
  const tc = typeConfig[appt.type];
  const sc = statusConfig[appt.status];
  const pc = appt.priority ? priorityConfig[appt.priority] : null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.22)", zIndex: 90 }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 400,
        background: "white", zIndex: 100, overflowY: "auto",
        boxShadow: "-8px 0 40px rgba(30,45,64,0.14)",
        animation: "slideIn 0.3s cubic-bezier(0.22,1,0.36,1)",
        display: "flex", flexDirection: "column",
      }}>
        <style>{`@keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }`}</style>

        <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "22px 24px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Avatar name={appt.name} size={46} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>{appt.name}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{appt.age} yrs · {appt.reason}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
            <span style={{ background: tc.bg, color: tc.color, borderRadius: 7, padding: "3px 10px", fontSize: 14, fontWeight: 600 }}>{tc.label}</span>
            <span style={{ background: sc.bg, color: sc.color, borderRadius: 7, padding: "3px 10px", fontSize: 14, fontWeight: 600 }}>{sc.label}</span>
            {pc && <span style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", borderRadius: 7, padding: "3px 10px", fontSize: 14 }}>{pc.icon} {pc.label}</span>}
          </div>
        </div>

        <div style={{ flex: 1, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Time */}
          <div style={{ background: "#e8f7f5", borderRadius: 13, padding: "14px 16px", border: "1px solid #b8e4de" }}>
            <div style={{ fontSize: 14, color: "#2a9d8f", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Date & Time</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40" }}>
              {new Date(appt.date + "T00:00:00").toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <div style={{ fontSize: 14, color: "#2a9d8f", fontWeight: 600, marginTop: 3 }}>{appt.time} – {appt.end} · {appt.duration} min</div>
          </div>

          {/* Info */}
          <div style={{ background: "#f7f9fd", borderRadius: 13, padding: "14px 16px", border: "1px solid #e0e7ef" }}>
            {[
              { label: "Doctor",  value: appt.doctor  },
              { label: "Contact", value: appt.contact },
              { label: "Queue #", value: appt.queue || "Not yet assigned" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f0f3f7" }}>
                <span style={{ fontSize: 14, color: "#8a9bb0" }}>{r.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
            {appt.status === "scheduled" && (
              <>
                <button onClick={() => onCheckin(appt)} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.3)" }}>
                  Check In Patient
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onReschedule(appt)} style={{ flex: 1, background: "#E5EDF8", color: "#0047AB", border: "1px solid #B0C8E8", borderRadius: 10, padding: "9px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}><Pencil size={14} strokeWidth={2.5} /> Reschedule</button>
                  <button onClick={() => onNoShow(appt)} style={{ flex: 1, background: "#fce8f0", color: "#c05080", border: "1px solid #f0c0d8", borderRadius: 10, padding: "9px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}><Ghost size={16} strokeWidth={2} /> No-show</button>
                </div>
                <button onClick={() => onCancel(appt)} style={{ background: "white", color: "#9aabc0", border: "1px solid #e0e7ef", borderRadius: 10, padding: "9px", fontSize: 14, cursor: "pointer" }}><X size={16} strokeWidth={2} /> Cancel Appointment</button>
              </>
            )}
            {appt.status === "checked-in" && (
              <>
                <div style={{ background: "#e8f7f5", borderRadius: 11, padding: "12px", textAlign: "center", color: "#2a9d8f", fontSize: 14, fontWeight: 600 }}>Patient checked in · {appt.queue}</div>
                <button onClick={() => onAddToQueue(appt)} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}><Plus size={16} strokeWidth={2} /> Add to Queue</button>
              </>
            )}
            <button onClick={() => onSms(appt)} style={{ background: "white", color: "#4a5d75", border: "1px solid #e0e7ef", borderRadius: 10, padding: "9px", fontSize: 14, cursor: "pointer" }}>Send Reminder SMS</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelect, appointments }) {
  const [vm, setVm] = useState(MONTH);
  const [vy, setVy] = useState(YEAR);

  const dim = new Date(vy, vm + 1, 0).getDate();
  const fd  = new Date(vy, vm, 1).getDay();
  const monthName = new Date(vy, vm).toLocaleString("en-PH", { month: "long", year: "numeric" });

  const apptDates   = new Set(appointments.map(a => a.date));
  const urgentDates = new Set(appointments.filter(a => a.type === "urgent").map(a => a.date));
  const pad = n => String(n).padStart(2, "0");

  return (
    <div style={{ background: "white", borderRadius: 16, padding: "16px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => vm === 0 ? (setVm(11), setVy(y => y-1)) : setVm(m => m-1)} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#7a8fb0", padding: "4px 8px" }}>‹</button>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e2d40" }}>{monthName}</div>
        <button onClick={() => vm === 11 ? (setVm(0), setVy(y => y+1)) : setVm(m => m+1)} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#7a8fb0", padding: "4px 8px" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
        {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 14, fontWeight: 600, color: "#b0beca", padding: "2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {Array.from({ length: fd }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: dim }, (_, i) => {
          const day = i + 1;
          const ds = `${vy}-${pad(vm+1)}-${pad(day)}`;
          const isSel   = selectedDate === ds;
          const hasAppt = apptDates.has(ds);
          const isUrg   = urgentDates.has(ds);
          const isToday = ds === new Date().toISOString().slice(0, 10);
          return (
            <div key={day} onClick={() => onSelect(ds)} style={{
              textAlign: "center", padding: "5px 2px", borderRadius: 7, cursor: "pointer",
              background: isSel ? "#2a9d8f" : isToday ? "#e8f7f5" : "transparent",
              color: isSel ? "white" : isToday ? "#2a9d8f" : "#1e2d40",
              fontWeight: isSel || isToday ? 700 : 400, fontSize: 14,
              transition: "background 0.15s",
            }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "#f4f7fb"; }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isToday ? "#e8f7f5" : "transparent"; }}
            >
              {day}
              {hasAppt && <div style={{ width: 4, height: 4, borderRadius: "50%", margin: "1px auto 0", background: isSel ? "rgba(255,255,255,0.8)" : isUrg ? "#CC0000" : "#2a9d8f" }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Day List ──────────────────────────────────────────────────────────────────
function DayList({ date, appointments, onSelect, selectedId }) {
  const dayAppts = appointments.filter(a => a.date === date).sort((a, b) => a.time.localeCompare(b.time));
  const dateLabel = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "Select a date";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "14px 22px", background: "white", borderBottom: "1px solid #e0e7ef", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40" }}>{dateLabel}</div>
          <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 1 }}>{dayAppts.length} appointment{dayAppts.length !== 1 ? "s" : ""}</div>
        </div>
        {dayAppts.filter(a => a.priority).length > 0 && (
          <div style={{ background: "#f0eafb", color: "#8B5FBF", borderRadius: 9, padding: "5px 12px", fontSize: 14, fontWeight: 700 }}>
            <AlertCircle size={14} strokeWidth={2} /> {dayAppts.filter(a => a.priority).length} priority
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", background: "#f7f9fb" }}>
        {date ? (
          dayAppts.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dayAppts.map(appt => {
                const tc = typeConfig[appt.type];
                const sc = statusConfig[appt.status];
                const pc = appt.priority ? priorityConfig[appt.priority] : null;
                const isSelected = selectedId === appt.id;
                return (
                  <div key={appt.id} onClick={() => onSelect(appt)} style={{
                    background: "white", borderRadius: 14, padding: "14px 16px",
                    border: `2px solid ${isSelected ? tc.color : "#e0e7ef"}`,
                    cursor: "pointer", transition: "all 0.18s",
                    boxShadow: isSelected ? `0 4px 16px ${tc.color}25` : "0 2px 8px rgba(100,120,150,0.06)",
                    display: "flex", alignItems: "center", gap: 14,
                  }}
                    onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = "#c8deda"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(42,157,143,0.1)"; }}}
                    onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = "#e0e7ef"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(100,120,150,0.06)"; }}}
                  >
                    {/* Time column */}
                    <div style={{ textAlign: "center", minWidth: 56, flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? tc.color : "#1e2d40" }}>{appt.time}</div>
                      <div style={{ fontSize: 14, color: "#b0beca" }}>{appt.duration}m</div>
                    </div>
                    <div style={{ width: 1, background: "#e8edf7", alignSelf: "stretch" }} />
                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={appt.name} size={28} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e2d40" }}>{appt.name}</div>
                          <div style={{ fontSize: 14, color: "#7a8fb0" }}>{appt.reason}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        <span style={{ background: tc.bg, color: tc.color, borderRadius: 6, padding: "2px 8px", fontSize: 14, fontWeight: 600 }}>{tc.label}</span>
                        <span style={{ background: sc.bg, color: sc.color, borderRadius: 6, padding: "2px 8px", fontSize: 14, fontWeight: 600 }}>{sc.label}</span>
                        {pc && <span style={{ background: "#f0eafb", color: pc.color, borderRadius: 6, padding: "2px 8px", fontSize: 14, fontWeight: 600 }}>{pc.icon} {pc.label}</span>}
                        <span style={{ color: "#8a9bb0", fontSize: 14, display: "flex", alignItems: "center" }}>{appt.doctor}</span>
                      </div>
                    </div>
                    {/* Status indicator */}
                    {appt.status === "checked-in" && (
                      <div style={{ background: "#e8f7f5", borderRadius: 8, padding: "6px 10px", fontSize: 14, color: "#2a9d8f", fontWeight: 700, flexShrink: 0 }}>In</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#8a9bb0" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}><CalendarDays size={16} strokeWidth={2} /></div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>No appointments</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>Nothing scheduled for this day</div>
            </div>
          )
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8a9bb0" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}><CalendarDays size={16} strokeWidth={2} /></div>
            <div style={{ fontSize: 14 }}>Pick a date from the calendar</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Upcoming list ─────────────────────────────────────────────────────────────
function UpcomingList({ appointments, onSelect, selectedId }) {
  const list = appointments.filter(a => a.status === "scheduled").sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40", marginBottom: 14 }}>All Upcoming</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map(appt => {
          const tc = typeConfig[appt.type];
          const pc = appt.priority ? priorityConfig[appt.priority] : null;
          const isSel = selectedId === appt.id;
          return (
            <div key={appt.id} onClick={() => onSelect(appt)} style={{
              background: "white", borderRadius: 12, padding: "12px 14px",
              border: `1.5px solid ${isSel ? tc.color : "#e0e7ef"}`,
              cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 10,
            }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.borderColor = "#c8deda"; }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.borderColor = "#e0e7ef"; }}
            >
              <Avatar name={appt.name} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{appt.name}</div>
                  <span style={{ background: tc.bg, color: tc.color, borderRadius: 5, padding: "1px 7px", fontSize: 14, fontWeight: 600 }}>{tc.label}</span>
                </div>
                <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>{appt.reason}</div>
                <div style={{ fontSize: 14, color: "#b0beca", marginTop: 2 }}>
                  {new Date(appt.date + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" })} · {appt.time} · {appt.doctor}
                  {pc && <span style={{ marginLeft: 6 }}>{pc.icon}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReceptionistAppointments({ onNavigate }) {
  const [appts, setAppts]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [apiError, setApiError]         = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showBook, setShowBook]         = useState(false);
  const [view, setView]                 = useState("day");
  const [toast, setToast]               = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // ── Fetch from live API ──────────────────────────────────────────────────────
  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await appointmentsApi.getAll();
      setAppts((Array.isArray(data) ? data : []).map(mapAppt));
    } catch (e) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const handleSelect = (a) => setSelectedAppt(prev => prev?.id === a.id ? null : a);

  const handleCheckin = async (a) => {
    if (!window.confirm("Are you sure you want to check in this patient?")) return;
    try {
      await appointmentsApi.update(a.id, { status: "Completed" });
      setAppts(q => q.map(x => x.id === a.id ? { ...x, status: "checked-in" } : x));
      setSelectedAppt(null);
    } catch { /* ignore — optimistic UI already set */ }
  };

  const handleCancel = async (a) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await appointmentsApi.cancel(a.id);
      setAppts(q => q.map(x => x.id === a.id ? { ...x, status: "cancelled" } : x));
      setSelectedAppt(null);
    } catch { /* ignore */ }
  };

  const handleNoShow = async (a) => {
    if (!window.confirm("Are you sure you want to mark this patient as a no-show?")) return;
    try {
      await appointmentsApi.update(a.id, { status: "No-show" });
      setAppts(q => q.map(x => x.id === a.id ? { ...x, status: "no-show" } : x));
      setSelectedAppt(null);
    } catch { /* ignore */ }
  };

  const handleReschedule = async (a) => {
    const newDate = window.prompt(`Enter new date (YYYY-MM-DD) for ${a.name}'s appointment:`, a.date);
    if (!newDate) return;
    const newTime = window.prompt(`Enter new time (HH:MM) for ${a.name}'s appointment:`, a.time);
    if (!newTime) return;
    
    try {
      await appointmentsApi.update(a.id, { scheduled_date: `${newDate}T${newTime}:00` });
      setAppts(q => q.map(x => x.id === a.id ? { ...x, date: newDate, time: newTime } : x));
      showToast(`Appointment rescheduled to ${newDate} ${newTime}`);
      setSelectedAppt(null);
    } catch (e) {
      showToast(`Failed to reschedule: ${e.message}`);
    }
  };

  const handleSms = async (a) => {
    try {
      showToast(`Sending SMS to ${a.name}...`);
      await smsApi.send({
        patient_id: a._patientId, 
        appointment_id: a.id, 
        message: `LikhaHealth: Reminder for your appointment on ${a.date} at ${a.time}.` 
      });
      showToast(`SMS sent to ${a.name}`);
    } catch (err) {
      showToast(`SMS failed: ${err.message}`);
    }
  };

  const handleAddToQueue = () => { if (onNavigate) onNavigate("queue"); };

  const handleNewAppt = async (f) => {
    // Build a minimal POST body — patient lookup would be needed for a full flow;
    // for now we optimistically add to local state and let the user manage
    // patient_id assignment through PatientRegistration in production.
    const newLocal = {
      id: Date.now(), date: f.date, time: f.time, end: f.time,
      duration: parseInt(f.duration) || 30, name: f.name, age: f.age || null,
      contact: f.contact || "", reason: f.reason, doctor: f.doctor || "",
      type: f.type || "follow-up", status: "scheduled", queue: null, priority: f.priority || null,
    };
    setAppts(old => [newLocal, ...old]);
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const today    = appts.filter(a => a.date === todayStr);
  const upcoming = appts.filter(a => a.status === "scheduled").length;
  const priority = appts.filter(a => a.priority && a.priority !== "regular" && a.status === "scheduled").length;

  return (
    <div style={{ height: "100vh", display: "flex", background: "#f4f7fb", overflow: "hidden" }}>
      {showBook && <BookModal defaultDate={selectedDate} onClose={() => setShowBook(false)} onSubmit={handleNewAppt} showToast={showToast} />}
      <AppointmentDrawer appt={selectedAppt} onClose={() => setSelectedAppt(null)} onCheckin={handleCheckin} onCancel={handleCancel} onNoShow={handleNoShow} onAddToQueue={handleAddToQueue} onReschedule={handleReschedule} onSms={handleSms} />
      
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e2d40", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 14, zIndex: 400, boxShadow: "0 8px 24px rgba(30,45,64,0.28)", animation: "slideIn 0.3s ease" }}>{toast}</div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ background: "#f4f7fb", borderBottom: "1px solid #dde8e5", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e2d40" }}>Appointments</h1>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>{today.length} today · {upcoming} upcoming · {priority} priority</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", background: "white", border: "1px solid #e0e7ef", borderRadius: 10, overflow: "hidden" }}>
              {[{ key: "day", label: "Day" }, { key: "upcoming", label: <><ClipboardList size={16} strokeWidth={2} /> Upcoming</> }].map(v => (
                <button key={v.key} onClick={() => setView(v.key)} style={{
                  padding: "8px 16px", border: "none", cursor: "pointer",
                  background: view === v.key ? "#1e2d40" : "transparent",
                  color: view === v.key ? "white" : "#7a8fb0",
                  fontSize: 14, fontWeight: view === v.key ? 600 : 400,
                  transition: "all 0.15s",
                }}>{v.label}</button>
              ))}
            </div>
            <button onClick={() => setShowBook(true)} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.28)" }}>
              <Plus size={16} strokeWidth={2} /> Book Appointment
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "220px 1fr", overflow: "hidden" }}>

          {/* Left panel */}
          <div style={{ background: "white", borderRight: "1px solid #e0e7ef", padding: "16px 14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
            <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} appointments={appts} />

            {/* Stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Today",     value: today.length,  color: "#2a9d8f", bg: "#e8f7f5" },
                { label: "Upcoming",  value: upcoming,      color: "#0047AB", bg: "#E5EDF8" },
                { label: "Priority",  value: priority,      color: "#8B5FBF", bg: "#f0eafb" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, color: s.color }}>{s.label}</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ background: "#f7f9fb", borderRadius: 12, padding: "12px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#b0beca", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Legend</div>
              {Object.entries(typeConfig).map(([key, tc]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: tc.dot }} />
                  <span style={{ fontSize: 14, color: "#4a5d75" }}>{tc.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {view === "day"
              ? <DayList date={selectedDate} appointments={appts} onSelect={handleSelect} selectedId={selectedAppt?.id} />
              : <UpcomingList appointments={appts} onSelect={handleSelect} selectedId={selectedAppt?.id} />
            }
          </div>
        </div>
      </div>
    </div>
  );
}
