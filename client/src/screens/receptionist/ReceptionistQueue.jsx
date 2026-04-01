import { useState } from "react";

// ── Data ──────────────────────────────────────────────────────────────────────
const initialQueue = [
  { id: 1,  queue: "A-001", name: "Maria Santos",   age: 66, gender: "F", reason: "Hypertension follow-up",  status: "in-consultation", doctor: "Dr. Reyes",  arrived: "8:45 AM", wait: "0m",  priority: "elderly",  contact: "+63 912 345 6789", vitals: { bp: "138/88", temp: "36.7", hr: "82", spo2: "98", weight: "58", height: "155" } },
  { id: 2,  queue: "A-002", name: "Jose Dela Cruz", age: 57, gender: "M", reason: "Diabetes check-up",       status: "in-consultation", doctor: "Dr. Santos", arrived: "9:02 AM", wait: "0m",  priority: null,       contact: "+63 917 234 5678", vitals: { bp: "142/90", temp: "36.5", hr: "78", spo2: "97", weight: "78", height: "165" } },
  { id: 3,  queue: "A-003", name: "Elena Cruz",     age: 66, gender: "F", reason: "Chest discomfort",        status: "vitals-done",     doctor: null,         arrived: "9:10 AM", wait: "18m", priority: "elderly",  contact: "+63 915 999 8877", vitals: { bp: "148/92", temp: "36.9", hr: "88", spo2: "96", weight: "52", height: "152" } },
  { id: 4,  queue: "A-004", name: "Luisa Ramos",    age: 28, gender: "F", reason: "Prenatal check-up",       status: "waiting",         doctor: null,         arrived: "9:20 AM", wait: "28m", priority: "pregnant", contact: "+63 921 333 4455", vitals: null },
  { id: 5,  queue: "A-005", name: "Ramon Valdez",   age: 45, gender: "M", reason: "Back pain",               status: "waiting",         doctor: null,         arrived: "9:30 AM", wait: "38m", priority: null,       contact: "+63 920 111 2233", vitals: null },
  { id: 6,  queue: "A-006", name: "Carlos Mendoza", age: 4,  gender: "M", reason: "Fever & cough",           status: "waiting",         doctor: null,         arrived: "9:35 AM", wait: "43m", priority: "pediatric",contact: "+63 918 444 3322", vitals: null },
  { id: 7,  queue: "A-007", name: "Ana Lim",        age: 28, gender: "F", reason: "URTI follow-up",          status: "waiting",         doctor: null,         arrived: "9:40 AM", wait: "48m", priority: null,       contact: "+63 918 765 4321", vitals: null },
  { id: 8,  queue: "A-008", name: "Pedro Bautista", age: 51, gender: "M", reason: "Annual physical",         status: "skipped",         doctor: null,         arrived: "8:30 AM", wait: "—",   priority: null,       contact: "+63 919 444 5566", vitals: null },
  { id: 9,  queue: "B-001", name: "Celia Marcos",   age: 62, gender: "F", reason: "Lab results review",      status: "done",            doctor: "Dr. Cruz",   arrived: "8:10 AM", wait: "—",   priority: "elderly",  contact: "+63 915 888 7766", vitals: { bp: "120/80", temp: "36.6", hr: "74", spo2: "99", weight: "55", height: "155" } },
  { id: 10, queue: "B-002", name: "Mark Reyes",     age: 33, gender: "M", reason: "Skin rash",               status: "done",            doctor: "Dr. Reyes",  arrived: "8:30 AM", wait: "—",   priority: null,       contact: "+63 923 555 6677", vitals: { bp: "118/76", temp: "36.4", hr: "70", spo2: "99", weight: "70", height: "172" } },
];

const doctors = ["Dr. Reyes", "Dr. Santos", "Dr. Cruz"];

const statusConfig = {
  "in-consultation": { label: "In Consultation", color: "#2a9d8f", bg: "#e8f7f5", dot: "#2a9d8f", pulse: true  },
  "vitals-done":     { label: "Vitals Ready",    color: "#4a90d9", bg: "#eaf3fc", dot: "#4a90d9", pulse: false },
  "waiting":         { label: "Waiting",          color: "#e09040", bg: "#fdf3e8", dot: "#e09040", pulse: false },
  "skipped":         { label: "Skipped",          color: "#c05080", bg: "#fce8f0", dot: "#c05080", pulse: false },
  "done":            { label: "Done",             color: "#9aabc0", bg: "#f0f4fa", dot: "#9aabc0", pulse: false },
};

const priorityConfig = {
  elderly:   { label: "Senior Citizen", icon: "👴", color: "#7b5ea7", bg: "#f0eafb", stripe: "#7b5ea7" },
  pregnant:  { label: "Pregnant",       icon: "🤰", color: "#d4709a", bg: "#fce8f3", stripe: "#d4709a" },
  pwd:       { label: "PWD",            icon: "♿", color: "#3b7dd8", bg: "#eef3fc", stripe: "#3b7dd8" },
  pediatric: { label: "Pedia (0–5)",    icon: "👶", color: "#e09040", bg: "#fdf3e8", stripe: "#e09040" },
};

// Vitals flags (for display in drawer)
const bpFlag   = bp => { if (!bp) return "normal"; const s = Number(bp.split("/")[0]); return s >= 140 ? "high" : s < 90 ? "low" : "normal"; };
const tempFlag = v  => { if (!v)  return "normal"; const n = Number(v); return n >= 37.8 ? "high" : n < 36 ? "low" : "normal"; };
const spo2Flag = v  => !v ? "normal" : Number(v) < 95 ? "low" : "normal";
const flagColor = { high: "#e07050", low: "#c04080", normal: "#2a9d8f" };
const flagBg    = { high: "#fdeee8", low: "#fce8f0", normal: "#e8f7f5" };

function Avatar({ name, size = 34 }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const hue = (name.charCodeAt(0) * 37 + name.charCodeAt(1) * 17) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},45%,72%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: `hsl(${hue},45%,28%)`, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ── Receptionist Sidebar ──────────────────────────────────────────────────────
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
          { icon: "📋", label: "Queue",          active: true     },
          { icon: "➕", label: "Register Patient"                  },
          { icon: "🗂️", label: "Patient Records"                   },
          { icon: "📅", label: "Appointments",   badge: "3"       },
          { icon: "📱", label: "SMS Logs"                          },
          { icon: "📊", label: "Reports"                           },
        ].map(item => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10, marginBottom: 2, cursor: "pointer",
            background: item.active ? "#e8f7f5" : "transparent",
            color: item.active ? "#2a9d8f" : "#4a5d75",
            fontWeight: item.active ? 600 : 400, fontSize: 14, transition: "all 0.18s",
          }}
            onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = "#f4f7fb"; e.currentTarget.style.color = "#1e2d40"; }}}
            onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4a5d75"; }}}
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

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useState(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); });
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e2d40", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 13, zIndex: 300, boxShadow: "0 8px 24px rgba(30,45,64,0.28)", animation: "toastIn 0.3s ease" }}>
      📱 {msg}
    </div>
  );
}

// ── Record Vitals Modal ───────────────────────────────────────────────────────
function RecordVitalsModal({ patient, onClose, onSubmit }) {
  const [form, setForm] = useState({ bp: "", temp: "", hr: "", spo2: "", weight: "", height: "" });
  const [errors, setErrors] = useState({});
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const bmi = form.weight && form.height
    ? (Number(form.weight) / Math.pow(Number(form.height) / 100, 2)).toFixed(1)
    : null;

  const validate = () => {
    const e = {};
    if (!form.bp)     e.bp     = "Required";
    if (!form.temp)   e.temp   = "Required";
    if (!form.hr)     e.hr     = "Required";
    if (!form.spo2)   e.spo2   = "Required";
    if (!form.weight) e.weight = "Required";
    if (!form.height) e.height = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(patient.id, form);
    onClose();
  };

  const fields = [
    { key: "bp",     label: "Blood Pressure",  placeholder: "e.g. 120/80",  unit: "mmHg", icon: "❤️",  half: false },
    { key: "temp",   label: "Temperature",      placeholder: "e.g. 36.5",   unit: "°C",   icon: "🌡️", half: true  },
    { key: "hr",     label: "Heart Rate",       placeholder: "e.g. 78",     unit: "bpm",  icon: "💓",  half: true  },
    { key: "spo2",   label: "SpO₂",             placeholder: "e.g. 98",     unit: "%",    icon: "🫁",  half: true  },
    { key: "weight", label: "Weight",           placeholder: "e.g. 65",     unit: "kg",   icon: "⚖️",  half: true  },
    { key: "height", label: "Height",           placeholder: "e.g. 160",    unit: "cm",   icon: "📏",  half: true  },
  ];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 22, width: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 28px 72px rgba(20,40,70,0.24)", animation: "popIn 0.28s cubic-bezier(0.34,1.56,0.64,1)" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "22px 26px", borderRadius: "22px 22px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>Record Vitals</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "white", fontFamily: "'Fraunces',serif" }}>{patient.name}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{patient.age} yrs · {patient.gender} · {patient.queue}</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 34, height: 34, borderRadius: 9, cursor: "pointer", fontSize: 15, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          {patient.priority && (
            <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 12px" }}>
              <span>{priorityConfig[patient.priority].icon}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{priorityConfig[patient.priority].label}</span>
            </div>
          )}
        </div>

        {/* Form */}
        <div style={{ padding: "22px 26px" }}>
          {/* BP — full width */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              ❤️ Blood Pressure <span style={{ color: "#e07050" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input value={form.bp} onChange={e => update("bp", e.target.value)} placeholder="e.g. 120/80"
                style={{ width: "100%", padding: "11px 14px 11px 14px", paddingRight: 56, border: `1.5px solid ${errors.bp ? "#e07050" : "#e0e7f3"}`, borderRadius: 11, fontSize: 15, fontFamily: "'DM Sans',sans-serif", color: "#1e2d40", outline: "none", boxSizing: "border-box", background: "#fafcff" }}
                onFocus={e => e.target.style.borderColor = "#2a9d8f"}
                onBlur={e => e.target.style.borderColor = errors.bp ? "#e07050" : "#e0e7f3"}
              />
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#8a9bb0", fontWeight: 500 }}>mmHg</span>
            </div>
            {errors.bp && <div style={{ fontSize: 11, color: "#e07050", marginTop: 4 }}>Blood pressure is required</div>}
          </div>

          {/* 2-col grid for rest */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            {fields.filter(f => f.half).map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                  {f.icon} {f.label} <span style={{ color: "#e07050" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input value={form[f.key]} onChange={e => update(f.key, e.target.value)} placeholder={f.placeholder} type="number" step="0.1"
                    style={{ width: "100%", padding: "10px 12px", paddingRight: 44, border: `1.5px solid ${errors[f.key] ? "#e07050" : "#e0e7f3"}`, borderRadius: 11, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: "#1e2d40", outline: "none", boxSizing: "border-box", background: "#fafcff" }}
                    onFocus={e => e.target.style.borderColor = "#2a9d8f"}
                    onBlur={e => e.target.style.borderColor = errors[f.key] ? "#e07050" : "#e0e7f3"}
                  />
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#8a9bb0" }}>{f.unit}</span>
                </div>
                {errors[f.key] && <div style={{ fontSize: 11, color: "#e07050", marginTop: 3 }}>Required</div>}
              </div>
            ))}
          </div>

          {/* BMI auto-calc */}
          {bmi && (
            <div style={{ background: "linear-gradient(135deg,#e8f7f5,#d4f0eb)", borderRadius: 12, padding: "12px 16px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #b8e4de" }}>
              <div>
                <div style={{ fontSize: 11, color: "#2a9d8f", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>📐 BMI (auto-calculated)</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#1e2d40", fontFamily: "'Fraunces',serif", lineHeight: 1.1, marginTop: 2 }}>{bmi}</div>
              </div>
              <div style={{ fontSize: 13, color: "#4a7d70", fontWeight: 500, textAlign: "right" }}>
                {Number(bmi) < 18.5 ? "Underweight" : Number(bmi) < 25 ? "Normal weight" : Number(bmi) < 30 ? "Overweight" : "Obese"}
                <div style={{ fontSize: 11, color: "#8a9bb0", marginTop: 2 }}>kg/m²</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, background: "#f4f7fb", border: "1px solid #e0e7f3", borderRadius: 12, padding: "12px", fontSize: 13, color: "#4a5d75", cursor: "pointer", fontWeight: 500 }}>
              Cancel
            </button>
            <button onClick={handleSubmit} style={{ flex: 2, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(42,157,143,0.32)" }}>
              ✓ Save Vitals & Mark Ready
            </button>
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: "#8a9bb0", marginTop: 10 }}>
            Status will automatically update to <strong>Vitals Ready</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Patient Detail Drawer ─────────────────────────────────────────────────────
function PatientDrawer({ patient, onClose, onAction, onRecordVitals }) {
  if (!patient) return null;
  const sc = statusConfig[patient.status];
  const pc = patient.priority ? priorityConfig[patient.priority] : null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.22)", zIndex: 90 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 400, background: "white", zIndex: 100, overflowY: "auto", boxShadow: "-8px 0 40px rgba(30,45,64,0.14)", animation: "slideIn 0.3s cubic-bezier(0.22,1,0.36,1)", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "22px 24px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Avatar name={patient.name} size={46} />
                {pc && <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 14 }}>{pc.icon}</span>}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "white", fontFamily: "'Fraunces',serif" }}>{patient.name}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{patient.age} yrs · {patient.gender} · {patient.queue}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: 14, flexWrap: "wrap" }}>
            <span style={{ background: sc.bg, color: sc.color, borderRadius: 7, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block", marginRight: 5, animation: sc.pulse ? "pulse 1.4s infinite" : "none" }} />
              {sc.label}
            </span>
            {pc && <span style={{ background: pc.bg, color: pc.color, borderRadius: 7, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{pc.icon} {pc.label}</span>}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Info */}
          <div style={{ background: "#f7f9fd", borderRadius: 13, padding: "14px 16px" }}>
            {[
              { label: "Chief Complaint",  value: patient.reason },
              { label: "Arrived",          value: patient.arrived },
              { label: "Wait Time",        value: patient.wait },
              { label: "Assigned Doctor",  value: patient.doctor || "Not yet assigned" },
              { label: "Contact",          value: patient.contact },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #eef1f8" }}>
                <span style={{ fontSize: 11, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.4 }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40", textAlign: "right", maxWidth: 200 }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Vitals */}
          {patient.vitals ? (
            <div>
              <div style={{ fontSize: 11, color: "#8a9bb0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Vitals Recorded</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Blood Pressure", value: `${patient.vitals.bp} mmHg`, flag: bpFlag(patient.vitals.bp),   icon: "❤️" },
                  { label: "Temperature",    value: `${patient.vitals.temp} °C`,  flag: tempFlag(patient.vitals.temp), icon: "🌡️" },
                  { label: "Heart Rate",     value: `${patient.vitals.hr} bpm`,   flag: "normal",                     icon: "💓" },
                  { label: "SpO₂",           value: `${patient.vitals.spo2}%`,    flag: spo2Flag(patient.vitals.spo2), icon: "🫁" },
                ].map(f => (
                  <div key={f.label} style={{ background: flagBg[f.flag], borderRadius: 10, padding: "10px 12px", border: `1px solid ${f.flag !== "normal" ? flagColor[f.flag] + "30" : "#e0e7f3"}` }}>
                    <div style={{ fontSize: 14, marginBottom: 3 }}>{f.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: flagColor[f.flag], fontFamily: "'Fraunces',serif" }}>{f.value}</div>
                    <div style={{ fontSize: 10, color: "#8a9bb0", marginTop: 1, textTransform: "uppercase" }}>{f.label}</div>
                    {f.flag !== "normal" && <div style={{ fontSize: 9, color: flagColor[f.flag], fontWeight: 700, marginTop: 2 }}>⚠ {f.flag}</div>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: "#fdf3e8", borderRadius: 13, padding: "14px 16px", border: "1px solid #f0d8b8", textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>⏳</div>
              <div style={{ fontSize: 13, color: "#c07030", fontWeight: 600 }}>Vitals not yet recorded</div>
              <div style={{ fontSize: 12, color: "#b0893a", marginTop: 3 }}>Nurse should record before consultation</div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
            {/* Record Vitals — only for waiting patients */}
            {patient.status === "waiting" && (
              <button onClick={() => onRecordVitals(patient)} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.32)" }}>
                📋 Record Vitals
              </button>
            )}
            {patient.status === "vitals-done" && (
              <button onClick={() => onAction("call", patient)} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.32)" }}>
                📣 Call Patient (Vitals Ready)
              </button>
            )}
            {patient.status === "waiting" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onAction("skip", patient)} style={{ flex: 1, background: "#fce8f0", color: "#c05080", border: "1px solid #f0c0d8", borderRadius: 10, padding: "9px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>⏭ Skip</button>
                <button onClick={() => onAction("call", patient)} style={{ flex: 1, background: "#eef3fc", color: "#3b7dd8", border: "1px solid #c0d4f5", borderRadius: 10, padding: "9px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>📣 Call Directly</button>
              </div>
            )}
            {patient.status === "skipped" && (
              <button onClick={() => onAction("requeue", patient)} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                ↺ Re-queue Patient
              </button>
            )}
            {patient.status === "in-consultation" && (
              <button onClick={() => onAction("done", patient)} style={{ background: "#e8f7f5", color: "#2a9d8f", border: "1.5px solid #b8e4de", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                ✓ Mark as Done
              </button>
            )}
            {patient.status === "done" && (
              <div style={{ background: "#e8f7f5", borderRadius: 11, padding: "13px", textAlign: "center", color: "#2a9d8f", fontSize: 13, fontWeight: 600 }}>✓ Consultation complete</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onAction("sms", patient)} style={{ flex: 1, background: "white", color: "#4a5d75", border: "1px solid #e0e7f3", borderRadius: 10, padding: "9px", fontSize: 12, cursor: "pointer" }}>📱 Send SMS</button>
              <button style={{ flex: 1, background: "white", color: "#4a5d75", border: "1px solid #e0e7f3", borderRadius: 10, padding: "9px", fontSize: 12, cursor: "pointer" }}>🗂️ View Record</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Queue Card ────────────────────────────────────────────────────────────────
function QueueCard({ patient, index, onSelect, isSelected, onRecordVitals }) {
  const sc = statusConfig[patient.status];
  const pc = patient.priority ? priorityConfig[patient.priority] : null;

  return (
    <div onClick={() => onSelect(patient)} style={{
      background: "white",
      border: `2px solid ${isSelected ? "#2a9d8f" : pc ? pc.stripe + "50" : "#edf1f7"}`,
      borderRadius: 14, padding: "14px 16px", cursor: "pointer",
      boxShadow: isSelected ? "0 4px 20px rgba(42,157,143,0.15)" : "0 2px 8px rgba(100,120,150,0.06)",
      transition: "all 0.18s",
      animation: `fadeSlide 0.3s ease ${index * 0.04}s both`,
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.boxShadow = "0 4px 16px rgba(42,157,143,0.12)"; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.boxShadow = "0 2px 8px rgba(100,120,150,0.06)"; }}
    >
      {pc && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: pc.stripe, borderRadius: "14px 0 0 14px" }} />}

      <div style={{ paddingLeft: pc ? 8 : 0, display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Avatar name={patient.name} size={38} />
          {pc && <div style={{ position: "absolute", bottom: -2, right: -2, fontSize: 12 }}>{pc.icon}</div>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 15, color: isSelected ? "#2a9d8f" : "#1e2d40" }}>{patient.queue}</span>
                {pc && <span style={{ background: pc.bg, color: pc.color, borderRadius: 5, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{pc.icon} {pc.label}</span>}
                {patient.status === "skipped" && <span style={{ background: "#fce8f0", color: "#c05080", borderRadius: 5, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>SKIPPED</span>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40", marginTop: 1 }}>{patient.name}</div>
              <div style={{ fontSize: 12, color: "#7a8fb0" }}>{patient.age} yrs · {patient.gender} · {patient.reason}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot, animation: sc.pulse ? "pulse 1.4s infinite" : "none" }} />
                <span style={{ fontSize: 12, color: sc.color, fontWeight: 500 }}>{sc.label}</span>
              </div>
              <div style={{ fontSize: 11, color: "#b0beca", marginTop: 3 }}>Arrived {patient.arrived}</div>
              {patient.doctor && <div style={{ fontSize: 11, color: "#8a9bb0", marginTop: 2 }}>{patient.doctor}</div>}
            </div>
          </div>

          {/* Bottom row: vitals chips or Record Vitals button */}
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {patient.vitals ? (
              <>
                {[
                  { v: patient.vitals.bp, label: "BP", flag: bpFlag(patient.vitals.bp) },
                  { v: `${patient.vitals.temp}°C`, label: "T", flag: tempFlag(patient.vitals.temp) },
                  { v: `${patient.vitals.spo2}%`, label: "SpO₂", flag: spo2Flag(patient.vitals.spo2) },
                ].map(c => (
                  <span key={c.label} style={{ background: flagBg[c.flag], color: flagColor[c.flag], borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 500 }}>
                    {c.label}: {c.v}
                  </span>
                ))}
              </>
            ) : patient.status === "waiting" ? (
              <button onClick={e => { e.stopPropagation(); onRecordVitals(patient); }} style={{
                background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none",
                borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(42,157,143,0.3)",
              }}>
                📋 Record Vitals
              </button>
            ) : (
              <span style={{ fontSize: 11, color: "#b0beca", background: "#f4f7fb", borderRadius: 6, padding: "2px 8px" }}>⏳ Awaiting vitals</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReceptionistQueue({ onNavigate }) {
  const [queue, setQueue]               = useState(initialQueue);
  const [filter, setFilter]             = useState("active");
  const [selected, setSelected]         = useState(null);
  const [toast, setToast]               = useState(null);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [vitalsPatient, setVitalsPatient] = useState(null); // patient to record vitals for

  const showToast = msg => setToast(msg);

  const handleAction = (action, patient) => {
    if (action === "call")    { setQueue(q => q.map(p => p.id === patient.id ? { ...p, status: "in-consultation" } : p)); showToast(`${patient.name} called — ${patient.queue}`); setSelected(null); }
    if (action === "skip")    { setQueue(q => q.map(p => p.id === patient.id ? { ...p, status: "skipped"         } : p)); showToast(`${patient.name} marked as skipped`); setSelected(null); }
    if (action === "requeue") { setQueue(q => q.map(p => p.id === patient.id ? { ...p, status: "waiting"         } : p)); showToast(`${patient.name} re-queued`); setSelected(null); }
    if (action === "done")    { setQueue(q => q.map(p => p.id === patient.id ? { ...p, status: "done"            } : p)); showToast(`${patient.name} marked as done`); setSelected(null); }
    if (action === "sms")     { showToast(`SMS sent to ${patient.name}`); }
  };

  const handleRecordVitals = (patient) => {
    setSelected(null); // close drawer
    setVitalsPatient(patient);
  };

  const handleVitalsSubmit = (patientId, vitals) => {
    setQueue(q => q.map(p => p.id === patientId ? { ...p, vitals, status: "vitals-done" } : p));
    const patient = queue.find(p => p.id === patientId);
    showToast(`Vitals recorded for ${patient?.name}`);
  };

  const callNext = () => {
    const next = queue.find(p => p.status === "vitals-done");
    if (next) setSelected(next);
  };

  const inConsult  = queue.filter(p => p.status === "in-consultation").length;
  const waiting    = queue.filter(p => p.status === "waiting").length;
  const vitalsDone = queue.filter(p => p.status === "vitals-done").length;
  const skipped    = queue.filter(p => p.status === "skipped").length;
  const done       = queue.filter(p => p.status === "done").length;
  const priority   = queue.filter(p => p.priority && ["waiting","vitals-done"].includes(p.status)).length;

  const activeConsultPatients = queue.filter(p => p.status === "in-consultation");

  const filtered = queue.filter(p => {
    if (filter === "active")   return ["waiting","vitals-done","in-consultation"].includes(p.status);
    if (filter === "priority") return p.priority && ["waiting","vitals-done"].includes(p.status);
    if (filter === "skipped")  return p.status === "skipped";
    if (filter === "done")     return p.status === "done";
    return true;
  });

  return (
    <div style={{ height: "100vh", background: "#f4f7fb", fontFamily: "'DM Sans',sans-serif", display: "flex", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #c8e0db; border-radius: 4px; }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes fadeSlide { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideIn   { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes popIn     { from{transform:scale(0.92);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes toastIn   { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      {vitalsPatient && <RecordVitalsModal patient={vitalsPatient} onClose={() => setVitalsPatient(null)} onSubmit={handleVitalsSubmit} />}
      <PatientDrawer patient={selected} onClose={() => setSelected(null)} onAction={handleAction} onRecordVitals={handleRecordVitals} />
      <Sidebar />

      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ background: "#f4f7fb", borderBottom: "1px solid #dde8e5", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontFamily: "'Fraunces',serif", fontWeight: 700, color: "#1e2d40" }}>Queue Management</h1>
            <div style={{ fontSize: 13, color: "#7a8fb0", marginTop: 2 }}>Sunday, March 1, 2026 · Shared Queue</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setNotifOpen(o => !o)} style={{ background: "white", border: "1px solid #dde8e5", borderRadius: 10, width: 40, height: 40, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                🔔
                {(skipped > 0 || priority > 0) && <div style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: "#c05080", border: "1.5px solid #f4f7fb" }} />}
              </button>
              {notifOpen && (
                <div style={{ position: "absolute", right: 0, top: 48, width: 280, background: "white", borderRadius: 14, border: "1px solid #dde8e5", boxShadow: "0 12px 40px rgba(30,45,64,0.14)", zIndex: 100 }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f3f7", fontSize: 13, fontWeight: 700, color: "#1e2d40" }}>Alerts</div>
                  {skipped > 0  && <div style={{ padding: "10px 16px", borderBottom: "1px solid #f7f9fd", display: "flex", gap: 10 }}><span>⏭</span><div style={{ fontSize: 13, color: "#1e2d40" }}>{skipped} patient{skipped > 1 ? "s" : ""} skipped</div></div>}
                  {priority > 0 && <div style={{ padding: "10px 16px", borderBottom: "1px solid #f7f9fd", display: "flex", gap: 10 }}><span>⭐</span><div style={{ fontSize: 13, color: "#1e2d40" }}>{priority} priority patient{priority > 1 ? "s" : ""} waiting</div></div>}
                  {vitalsDone > 0 && <div style={{ padding: "10px 16px", display: "flex", gap: 10 }}><span>✅</span><div style={{ fontSize: 13, color: "#1e2d40" }}>{vitalsDone} patient{vitalsDone > 1 ? "s" : ""} vitals ready</div></div>}
                </div>
              )}
            </div>
            <button onClick={() => onNavigate && onNavigate("register")} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.28)", display: "flex", alignItems: "center", gap: 6 }}>
              ➕ Register Patient
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 300px", overflow: "hidden" }}>

          {/* Queue list */}
          <div style={{ overflowY: "auto", padding: "18px 22px" }}>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 18 }}>
              {[
                { label: "In Consult",  value: inConsult,  color: "#2a9d8f", bg: "#e8f7f5", icon: "🩺" },
                { label: "Waiting",     value: waiting,    color: "#e09040", bg: "#fdf3e8", icon: "⏳" },
                { label: "Vitals Ready",value: vitalsDone, color: "#4a90d9", bg: "#eaf3fc", icon: "✅" },
                { label: "Skipped",     value: skipped,    color: "#c05080", bg: "#fce8f0", icon: "⏭" },
                { label: "Priority",    value: priority,   color: "#7b5ea7", bg: "#f0eafb", icon: "⭐" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 13, padding: "13px 14px", border: `1.5px solid ${s.color}20` }}>
                  <div style={{ fontSize: 20, marginBottom: 3 }}>{s.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: s.color, opacity: 0.8, marginTop: 3, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Active consultations banner */}
            {activeConsultPatients.length > 0 && (
              <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", borderRadius: 14, padding: "13px 18px", marginBottom: 16, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>🩺 {activeConsultPatients.length} In Consultation</div>
                {activeConsultPatients.map(p => (
                  <div key={p.id} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 9, padding: "5px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#52c4b8", animation: "pulse 1.4s infinite" }} />
                    <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 13, color: "white" }}>{p.queue}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>→ {p.doctor}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Filters + Call Next */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { key: "active",   label: "Active Queue"  },
                  { key: "priority", label: "Priority",  count: priority },
                  { key: "skipped",  label: "Skipped",   count: skipped  },
                  { key: "done",     label: "Done Today"   },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)} style={{
                    background: filter === f.key ? "#1e2d40" : "white",
                    color: filter === f.key ? "white" : "#7a8fb0",
                    border: filter === f.key ? "none" : "1px solid #dde8e5",
                    borderRadius: 9, padding: "7px 14px", fontSize: 12,
                    fontWeight: filter === f.key ? 600 : 400, cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif", transition: "all 0.18s",
                  }}>
                    {f.label}
                    {f.count > 0 && <span style={{ marginLeft: 6, background: f.key === "priority" ? "#7b5ea7" : "#c05080", color: "white", borderRadius: 10, padding: "0 6px", fontSize: 10, fontWeight: 700 }}>{f.count}</span>}
                  </button>
                ))}
              </div>
              {vitalsDone > 0 && (
                <button onClick={callNext} style={{ background: "#2a9d8f", color: "white", border: "none", borderRadius: 9, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(42,157,143,0.3)" }}>
                  📣 Call Next ({vitalsDone}) →
                </button>
              )}
            </div>

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#8a9bb0" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1e2d40" }}>All clear!</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>No patients in this category.</div>
                </div>
              ) : filtered.map((p, i) => (
                <QueueCard key={p.id} patient={p} index={i} onSelect={setSelected} isSelected={selected?.id === p.id} onRecordVitals={handleRecordVitals} />
              ))}
            </div>
          </div>

          {/* Right summary panel */}
          <div style={{ background: "white", borderLeft: "1px solid #dde8e5", overflowY: "auto", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Doctor status */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>Doctor Status</div>
              {doctors.map(doc => {
                const docPatient = queue.find(p => p.doctor === doc && p.status === "in-consultation");
                return (
                  <div key={doc} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f0f3f7" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: docPatient ? "#2a9d8f" : "#d0dbe8", animation: docPatient ? "pulse 1.4s infinite" : "none", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40" }}>{doc}</div>
                      {docPatient ? <div style={{ fontSize: 11, color: "#2a9d8f" }}>Seeing {docPatient.queue} · {docPatient.name}</div> : <div style={{ fontSize: 11, color: "#b0beca" }}>Available</div>}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: docPatient ? "#2a9d8f" : "#b0beca" }}>{docPatient ? "Busy" : "Free"}</div>
                  </div>
                );
              })}
            </div>

            {/* Priority waiting */}
            {queue.filter(p => p.priority && ["waiting","vitals-done"].includes(p.status)).length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>⭐ Priority Waiting</div>
                {queue.filter(p => p.priority && ["waiting","vitals-done"].includes(p.status)).map(p => {
                  const pc = priorityConfig[p.priority];
                  return (
                    <div key={p.id} onClick={() => setSelected(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: pc.bg, border: `1.5px solid ${pc.color}30`, marginBottom: 8, cursor: "pointer" }}>
                      <span style={{ fontSize: 20 }}>{pc.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: pc.color, fontWeight: 500 }}>{pc.label} · {p.queue}</div>
                      </div>
                      {p.status === "waiting" && !p.vitals && (
                        <button onClick={e => { e.stopPropagation(); handleRecordVitals(p); }} style={{ background: pc.color, color: "white", border: "none", borderRadius: 7, padding: "4px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Vitals</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Skipped */}
            {queue.filter(p => p.status === "skipped").length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>⏭ Skipped</div>
                {queue.filter(p => p.status === "skipped").map(p => (
                  <div key={p.id} onClick={() => setSelected(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "#fce8f0", border: "1px solid #f0c0d830", marginBottom: 8, cursor: "pointer" }}>
                    <Avatar name={p.name} size={30} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#c05080" }}>{p.queue} · No response</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleAction("requeue", p); }} style={{ background: "#c05080", color: "white", border: "none", borderRadius: 7, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>↺</button>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div style={{ background: "#f7f9fd", borderRadius: 13, padding: "14px 16px", marginTop: "auto" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Today's Summary</div>
              {[
                { label: "Total Registered", value: queue.length },
                { label: "Consultations Done", value: done },
                { label: "Avg. Wait Time",   value: "22 min" },
                { label: "SMS Sent",         value: "14" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #edf1f7" }}>
                  <span style={{ fontSize: 12, color: "#8a9bb0" }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1e2d40", fontFamily: "'Fraunces',serif" }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
