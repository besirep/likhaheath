import { useState, useEffect, useCallback } from "react";
import { consultationsApi } from "../../lib/api/consultations.js";
import { printQueueReport, downloadQueueCSV } from "../../lib/utils/printUtils.js";

// ── Utility: map API status → UI status key ───────────────────────────────────
const mapStatus = s => {
  if (!s) return "waiting";
  const m = { Waiting: "waiting", "In-Progress": "in-consultation", Done: "done", Skipped: "skipped" };
  return m[s] || s.toLowerCase();
};


const statusConfig = {
  "in-consultation": { label: "In Consultation", color: "#0047AB", bg: "#EBF0FA", dot: "#0047AB", pulse: true  },
  "vitals-done":     { label: "Vitals Ready",    color: "#2a9d8f", bg: "#e8f7f5", dot: "#2a9d8f", pulse: false },
  "waiting":         { label: "Waiting",          color: "#e09040", bg: "#fdf3e8", dot: "#e09040", pulse: false },
  "done":            { label: "Done",             color: "#9aabc0", bg: "#f0f4fa", dot: "#9aabc0", pulse: false },
  "skipped":         { label: "Skipped",          color: "#c05080", bg: "#fce8f0", dot: "#c05080", pulse: false },
};

const priorityConfig = {
  elderly:   { label: "Senior Citizen", icon: "👴", color: "#8B5FBF", bg: "#f0eafb", stripe: "#8B5FBF" },
  pregnant:  { label: "Pregnant",       icon: "🤰", color: "#d4709a", bg: "#fce8f4", stripe: "#d4709a" },
  pwd:       { label: "PWD",            icon: "♿", color: "#0047AB", bg: "#EBF0FA", stripe: "#0047AB" },
  pediatric: { label: "Pedia (0–5)",    icon: "👶", color: "#e09040", bg: "#fdf3e8", stripe: "#e09040" },
};

// Vitals flags
function bpFlag(bp)   { if (!bp) return null; const [s] = bp.split("/").map(Number); return s >= 140 ? "high" : s < 90 ? "low" : "normal"; }
function spo2Flag(v)  { return !v ? null : Number(v) < 95 ? "low" : "normal"; }
function tempFlag(v)  { if (!v) return null; const n = Number(v); return n >= 37.8 ? "high" : n < 36 ? "low" : "normal"; }
const flagColor = { high: "#CC0000", low: "#c04080", normal: "#1a2540" };
const flagBg    = { high: "#fdeee8", low: "#fce8f0", normal: "#EBF0FA" };

// ── Helpers ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const hue = (name.charCodeAt(0) * 41 + name.charCodeAt(1) * 19) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},40%,75%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: `hsl(${hue},40%,28%)`, flexShrink: 0, position: "relative" }}>
      {initials}
    </div>
  );
}

function VitalChip({ label, value, flag }) {
  if (!value) return null;
  const f = flag || "normal";
  return (
    <div style={{ background: flagBg[f], borderRadius: 7, padding: "3px 9px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 48 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: flagColor[f], lineHeight: 1.3 }}>{value}</span>
      <span style={{ fontSize: 11, color: "#9aabc0", letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

// ── Vitals Modal ──────────────────────────────────────────────────────────────
function VitalsModal({ patient, onClose }) {
  if (!patient) return null;
  const v = patient.vitals;
  const bmi = v ? (Number(v.weight) / Math.pow(Number(v.height) / 100, 2)).toFixed(1) : null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,35,70,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: 460, padding: 32, boxShadow: "0 24px 64px rgba(20,35,70,0.22)", animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <style>{`@keyframes popIn { from{transform:scale(0.92);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={patient.name} size={44} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1a2540" }}>{patient.name}</div>
              <div style={{ fontSize: 14, color: "#7a8fb0" }}>{patient.age} yrs · {patient.queue} · {patient.reason}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#EBF0FA", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 15, color: "#7a8fb0" }}>✕</button>
        </div>
        {v ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Blood Pressure", value: `${v.bp} mmHg`, flag: bpFlag(v.bp),   icon: "❤️" },
                { label: "Temperature",    value: `${v.temp} °C`,  flag: tempFlag(v.temp), icon: "🌡️" },
                { label: "Heart Rate",     value: `${v.hr} bpm`,   flag: "normal",         icon: "💓" },
                { label: "SpO₂",           value: `${v.spo2}%`,    flag: spo2Flag(v.spo2), icon: "🫁" },
                { label: "Weight",         value: `${v.weight} kg`, flag: "normal",        icon: "⚖️" },
                { label: "Height",         value: `${v.height} cm`, flag: "normal",        icon: "📏" },
              ].map(f => (
                <div key={f.label} style={{ background: flagBg[f.flag], borderRadius: 12, padding: "14px 16px", border: `1.5px solid ${f.flag !== "normal" ? flagColor[f.flag] + "40" : "#e8edf7"}` }}>
                  <div style={{ fontSize: 14, color: "#9aabc0", marginBottom: 4 }}>{f.icon} {f.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: flagColor[f.flag] }}>{f.value}</div>
                  {f.flag !== "normal" && <div style={{ fontSize: 14, color: flagColor[f.flag], marginTop: 3, fontWeight: 600, textTransform: "uppercase" }}>⚠ {f.flag}</div>}
                </div>
              ))}
            </div>
            <div style={{ background: "#EBF0FA", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, color: "#9aabc0" }}>📐 BMI (auto-calculated)</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#1a2540" }}>{bmi}</div>
              </div>
              <div style={{ fontSize: 14, color: "#7a8fb0" }}>
                {Number(bmi) < 18.5 ? "Underweight" : Number(bmi) < 25 ? "Normal weight" : Number(bmi) < 30 ? "Overweight" : "Obese"}
              </div>
            </div>
            <div style={{ marginTop: 14, fontSize: 14, color: "#9aabc0" }}>Recorded by {patient.nurse} · {patient.arrived}</div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#9aabc0" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: 14 }}>Vitals not yet recorded.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar() {
  return (
    <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 220, background: "#1a2540", display: "flex", flexDirection: "column", zIndex: 10, boxShadow: "3px 0 20px rgba(20,40,90,0.18)" }}>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0047AB,#1565D8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏥</div>
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
          { icon: "⊞",  label: "Dashboard"                    },
          { icon: "📋", label: "Queue",        active: true   },
          { icon: "🩺", label: "Consultations", badge: "1"   },
          { icon: "🗂️", label: "Patient Records"              },
          { icon: "📅", label: "Appointments"                 },
        ].map(item => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10, marginBottom: 2, cursor: "pointer",
            background: item.active ? "rgba(0,71,171,0.22)" : "transparent",
            color: item.active ? "#7eb3f5" : "rgba(255,255,255,0.55)",
            fontWeight: item.active ? 600 : 400, fontSize: 14, transition: "background 0.2s",
          }}
            onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; } }}
            onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; } }}
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

// ── Detail Panel ──────────────────────────────────────────────────────────────
function DetailPanel({ selected, onMarkDone, onRequeue, onVitals, onNavigate }) {
  if (!selected) return (
    <div style={{ background: "white", borderLeft: "1px solid #CCDAF0", display: "flex", alignItems: "center", justifyContent: "center", color: "#9aabc0" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>👈</div>
        <div style={{ fontSize: 14 }}>Select a patient to view details</div>
      </div>
    </div>
  );

  const sc = statusConfig[selected.status];
  const pc = selected.priority ? priorityConfig[selected.priority] : null;

  return (
    <div style={{ background: "white", borderLeft: "1px solid #CCDAF0", overflowY: "auto", padding: "24px 22px", display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Patient header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <Avatar name={selected.name} size={56} />
          {pc && <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 16 }}>{pc.icon}</span>}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2540", marginTop: 10 }}>{selected.name}</div>
        <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>{selected.age} yrs · {selected.gender} · {selected.queue}</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
          <span style={{ background: sc.bg, color: sc.color, borderRadius: 8, padding: "3px 12px", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block", animation: sc.pulse ? "pulse 1.4s infinite" : "none" }} />
            {sc.label}
          </span>
          {pc && (
            <span style={{ background: pc.bg, color: pc.color, borderRadius: 8, padding: "3px 12px", fontSize: 14, fontWeight: 600 }}>
              {pc.icon} {pc.label}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ background: "#f7f9fd", borderRadius: 13, padding: "14px 16px" }}>
        {[
          { label: "Chief Complaint", value: selected.reason  },
          { label: "Arrived",          value: selected.arrived },
          { label: "Wait Time",         value: selected.wait   },
          { label: "Nurse",             value: selected.nurse || "—" },
        ].map(r => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #eef1f8" }}>
            <span style={{ fontSize: 14, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.4 }}>{r.label}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1a2540" }}>{r.value}</span>
          </div>
        ))}
      </div>

      {/* Vitals */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#b0bdd6", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Vitals</div>
        {selected.vitals ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Blood Pressure", value: `${selected.vitals.bp} mmHg`, flag: bpFlag(selected.vitals.bp),    icon: "❤️" },
                { label: "Temperature",    value: `${selected.vitals.temp} °C`,  flag: tempFlag(selected.vitals.temp), icon: "🌡️" },
                { label: "Heart Rate",     value: `${selected.vitals.hr} bpm`,   flag: "normal",                       icon: "💓" },
                { label: "SpO₂",           value: `${selected.vitals.spo2}%`,    flag: spo2Flag(selected.vitals.spo2), icon: "🫁" },
              ].map(f => (
                <div key={f.label} style={{ background: flagBg[f.flag], borderRadius: 10, padding: "10px 12px", border: `1px solid ${f.flag !== "normal" ? flagColor[f.flag] + "40" : "#e8edf7"}` }}>
                  <div style={{ fontSize: 14, color: "#9aabc0" }}>{f.icon} {f.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: flagColor[f.flag], marginTop: 3 }}>{f.value}</div>
                  {f.flag !== "normal" && <div style={{ fontSize: 11, color: flagColor[f.flag], marginTop: 2, fontWeight: 700, textTransform: "uppercase" }}>⚠ {f.flag}</div>}
                </div>
              ))}
            </div>
            <button onClick={() => onVitals(selected)} style={{ marginTop: 8, width: "100%", background: "#EBF0FA", border: "1px solid #CCDAF0", borderRadius: 9, padding: "8px", fontSize: 14, color: "#0047AB", cursor: "pointer", fontWeight: 600 }}>
              View Full Vitals + BMI
            </button>
          </>
        ) : (
          <div style={{ background: "#f7f9fd", borderRadius: 10, padding: "16px", textAlign: "center", color: "#9aabc0", fontSize: 14 }}>
            ⏳ Awaiting nurse to record vitals
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
        {selected.status === "in-consultation" && (
          <button onClick={() => startConsult(selected)} style={{ background: "#0047AB", color: "white", border: "none", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,71,171,0.3)" }}>
            🩺 Resume Consultation →
          </button>
        )}
        {(selected.status === "vitals-done" || selected.status === "waiting") && selected.status !== "done" && (
          <button onClick={() => startConsult(selected)} style={{ background: "#0047AB", color: "white", border: "none", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,71,171,0.3)" }}>
            🩺 Start Consultation →
          </button>
        )}
        {selected.status === "waiting" && (
          <button onClick={() => onNavigate && onNavigate("dr-records")} style={{ background: "#EBF0FA", color: "#0047AB", border: "1.5px solid #B0C8E8", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            📋 View Patient Record
          </button>
        )}
        {selected.status === "skipped" && (
          <button onClick={() => onRequeue(selected.id)} style={{ background: "linear-gradient(135deg,#0047AB,#1565D8)", color: "white", border: "none", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,71,171,0.28)" }}>
            ↩ Re-queue Patient
          </button>
        )}
        {(selected.status === "waiting" || selected.status === "vitals-done") && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onNavigate && onNavigate("dr-appts")} style={{ flex: 1, background: "white", color: "#7a8fb0", border: "1px solid #CCDAF0", borderRadius: 9, padding: "9px", fontSize: 14, cursor: "pointer" }}>📅 Reschedule</button>
            <button onClick={() => onMarkDone(selected.id)} style={{ flex: 1, background: "white", color: "#2a9d8f", border: "1px solid #c0e0dc", borderRadius: 9, padding: "9px", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>✓ Mark Done</button>
          </div>
        )}
        {selected.status === "done" && (
          <div style={{ background: "#e8f7f5", borderRadius: 11, padding: "13px", textAlign: "center", color: "#2a9d8f", fontSize: 14, fontWeight: 600 }}>✓ Consultation complete</div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DoctorQueue({ onNavigate, onStartConsult }) {
  const [queue, setQueue]             = useState([]);
  const [filter, setFilter]           = useState("all");
  const [vitalsModal, setVitalsModal] = useState(null);
  const [selectedId, setSelectedId]   = useState(null);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [loading, setLoading]         = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await consultationsApi.getDoctorQueue();
      // Normalize API response to match component shape
      const normalized = data.map(p => ({
        id:         p.queueId,
        queue:      `Q-${String(p.queueNumber).padStart(3, "0")}`,
        name:       p.name,
        age:        p.age,
        gender:     p.sex?.[0] || "—",
        reason:     p.visitReason || "General consultation",
        status:     mapStatus(p.status),
        arrived:    new Date(p.scheduledDate || Date.now()).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
        wait:       "—",
        priority:   null,
        vitals:     p.vitals ? { bp: p.vitals.bp, temp: p.vitals.temp, hr: String(p.vitals.hr), spo2: String(p.vitals.spo2), weight: String(p.vitals.weight), height: String(p.vitals.height) } : null,
        nurse:      p.vitals?.nurse || null,
        // keep raw API fields for API calls
        queueId:       p.queueId,
        appointmentId: p.appointmentId,
        patientId:     p.patientId,
      }));
      setQueue(normalized);
      if (normalized.length > 0 && !selectedId) setSelectedId(normalized[0].id);
    } catch (e) {
      console.error("Failed to load queue:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const selected = queue.find(p => p.id === selectedId);

  const filtered = queue.filter(p => {
    if (filter === "all")              return p.status !== "done" && p.status !== "skipped";
    if (filter === "done")             return p.status === "done";
    if (filter === "skipped")          return p.status === "skipped";
    return p.status === filter;
  });

  const markDone = async id => {
    const p = queue.find(q => q.id === id);
    if (!p) return;
    try {
      await consultationsApi.updateQueueStatus(p.queueId, "Done");
      setQueue(q => q.map(e => e.id === id ? { ...e, status: "done" } : e));
    } catch { /* silent fail – user can reload */ }
  };

  const requeue = async id => {
    const p = queue.find(q => q.id === id);
    if (!p) return;
    try {
      await consultationsApi.updateQueueStatus(p.queueId, "Waiting");
      setQueue(q => q.map(e => e.id === id ? { ...e, status: "waiting" } : e));
    } catch { }
  };

  const startConsult = async (patient) => {
    try {
      await consultationsApi.updateQueueStatus(patient.queueId, "In-Progress");
      setQueue(q => q.map(e => e.id === patient.id ? { ...e, status: "in-consultation" } : e));
      // Pass patient data to parent so DoctorConsultations receives it
      if (onStartConsult) {
        onStartConsult({
          queueId:       patient.queueId,
          appointmentId: patient.appointmentId,
          patientId:     patient.patientId,
          name:          patient.name,
          age:           patient.age,
          sex:           patient.gender,
          queueNumber:   patient.queue,
          visitReason:   patient.reason,
          vitals:        patient.vitals,
        });
      }
      if (onNavigate) onNavigate("dr-consult");
    } catch { }
  };

  const callNext  = () => {
    const next = queue.find(p => p.status === "vitals-done" || p.status === "waiting");
    if (next) setSelectedId(next.id);
  };

  const nowServing  = queue.filter(p => p.status === "in-consultation").length;
  const waiting     = queue.filter(p => p.status === "waiting").length;
  const vitalsDone  = queue.filter(p => p.status === "vitals-done").length;
  const completed   = queue.filter(p => p.status === "done").length;
  const skipped     = queue.filter(p => p.status === "skipped").length;
  const priority    = queue.filter(p => p.priority && p.status !== "done").length;

  return (
    <div style={{ minHeight: "100vh", background: "#EBF0FA", display: "flex" }}>
      
      

      <VitalsModal patient={vitalsModal} onClose={() => setVitalsModal(null)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* ── Top bar ── */}
        <div style={{ background: "#EBF0FA", borderBottom: "1px solid #CCDAF0", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1a2540" }}>Queue Management</h1>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>Room 1 · Dr. Reyes · Sunday, March 1, 2026</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Stat pills — aligned with Dashboard cards */}
            <div style={{ display: "flex", gap: 7 }}>
              {[
                { label: "Serving",   value: nowServing, color: "#0047AB", bg: "#EBF0FA"  },
                { label: "Waiting",   value: waiting,    color: "#e09040", bg: "#fdf3e8"  },
                { label: "Done",      value: completed,  color: "#2a7d5f", bg: "#e8f7f1"  },
                { label: "Skipped",   value: skipped,    color: "#c05080", bg: "#fce8f0"  },
                { label: "Priority",  value: priority,   color: "#8B5FBF", bg: "#f0eafb"  },
              ].map(s => (
                <div key={s.label} onClick={() => s.label === "Skipped" ? setFilter("skipped") : s.label === "Done" ? setFilter("done") : setFilter("all")}
                  style={{ background: s.bg, borderRadius: 10, padding: "6px 14px", textAlign: "center", cursor: "pointer", transition: "transform 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 14, color: s.color, opacity: 0.8, letterSpacing: 0.3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Export buttons */}
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => printQueueReport({ queue, stats: { serving: nowServing, waiting, completed, skipped, priority }, staffName: 'Dr. Reyes' })} style={{ background: "white", border: "1px solid #CCDAF0", borderRadius: 9, padding: "7px 14px", fontSize: 13, color: "#0047AB", cursor: "pointer", fontWeight: 600 }}>🖨 Print</button>
              <button onClick={() => downloadQueueCSV({ queue })} style={{ background: "white", border: "1px solid #CCDAF0", borderRadius: 9, padding: "7px 14px", fontSize: 13, color: "#0047AB", cursor: "pointer", fontWeight: 600 }}>📥 CSV</button>
            </div>

            {/* Bell */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setNotifOpen(o => !o)} style={{ background: "white", border: "1px solid #CCDAF0", borderRadius: 10, width: 40, height: 40, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                🔔
                <div style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: "#CC0000", border: "1.5px solid #EBF0FA" }} />
              </button>
              {notifOpen && (
                <div style={{ position: "absolute", right: 0, top: 48, width: 280, background: "white", borderRadius: 14, border: "1px solid #CCDAF0", boxShadow: "0 12px 40px rgba(20,40,90,0.14)", zIndex: 100, animation: "popIn 0.2s ease" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f3fa", fontSize: 14, fontWeight: 700, color: "#1a2540" }}>Alerts</div>
                  {[
                    { icon: "👴", text: "Elena Cruz — Senior Citizen priority", time: "5m ago"  },
                    { icon: "🧪", text: "Lab results ready: Jose Dela Cruz",    time: "22m ago" },
                    { icon: "✅", text: "A-004 vitals recorded by nurse",        time: "30m ago" },
                  ].map((n, i) => (
                    <div key={i} style={{ padding: "10px 16px", borderBottom: "1px solid #f7f9fd", display: "flex", gap: 10 }}>
                      <span>{n.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, color: "#1a2540" }}>{n.text}</div>
                        <div style={{ fontSize: 14, color: "#b0bdd6" }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Split panel ── */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 360px", overflow: "hidden" }}>

          {/* Queue list */}
          <div style={{ overflowY: "auto", padding: "18px 22px", background: "#EBF0FA" }}>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[
                { key: "all",              label: "Active Queue"    },
                { key: "vitals-done",      label: "✅ Vitals Ready" },
                { key: "in-consultation",  label: "🩺 In Consult"  },
                { key: "skipped",          label: "⏭ Skipped"      },
                { key: "done",             label: "Done Today"      },
              ].map(t => (
                <button key={t.key} onClick={() => setFilter(t.key)} style={{
                  background: filter === t.key ? "#1a2540" : "white",
                  color: filter === t.key ? "white" : "#7a8fb0",
                  border: filter === t.key ? "none" : "1px solid #CCDAF0",
                  borderRadius: 9, padding: "7px 14px", fontSize: 14,
                  fontWeight: filter === t.key ? 600 : 400, cursor: "pointer",
                  fontFamily: "'Afacad', sans-serif", transition: "all 0.18s",
                }}>{t.label}</button>
              ))}
            </div>

            {/* Call Next banner */}
            {vitalsDone > 0 && (
              <div style={{ background: "linear-gradient(135deg,#EBF0FA,#ddeafc)", border: "1.5px solid #B0C8E8", borderRadius: 14, padding: "13px 18px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 14, color: "#1a2540" }}>
                  <strong style={{ color: "#0047AB" }}>{vitalsDone}</strong> patient{vitalsDone > 1 ? "s" : ""} ready — vitals recorded
                </div>
                <button onClick={callNext} style={{ background: "#0047AB", color: "white", border: "none", borderRadius: 9, padding: "8px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,71,171,0.3)" }}>
                  Call Next →
                </button>
              </div>
            )}

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((p, i) => {
                const sc = statusConfig[p.status];
                const pc = p.priority ? priorityConfig[p.priority] : null;
                const isSelected = p.id === selectedId;

                return (
                  <div key={p.id} onClick={() => setSelectedId(p.id)} style={{
                    background: "white",
                    border: `2px solid ${isSelected ? "#0047AB" : pc ? pc.stripe + "55" : "#e8edf7"}`,
                    borderRadius: 14, padding: "15px 18px", cursor: "pointer",
                    boxShadow: isSelected ? "0 4px 20px rgba(0,71,171,0.14)" : "0 2px 8px rgba(60,90,140,0.05)",
                    transition: "all 0.18s",
                    animation: `fadeSlide 0.3s ease ${i * 0.04}s both`,
                    position: "relative", overflow: "hidden",
                  }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,71,171,0.1)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.boxShadow = "0 2px 8px rgba(60,90,140,0.05)"; }}
                  >
                    {/* Priority stripe */}
                    {pc && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: pc.stripe, borderRadius: "14px 0 0 14px" }} />}

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingLeft: pc ? 8 : 0 }}>
                      {/* Avatar with priority overlay */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <Avatar name={p.name} size={40} />
                        {pc && <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 14 }}>{pc.icon}</span>}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 1 }}>
                              <span style={{ fontFamily: "'Afacad', sans-serif", fontWeight: 700, fontSize: 14, color: isSelected ? "#0047AB" : "#1a2540" }}>{p.queue}</span>
                              {pc && <span style={{ background: pc.bg, color: pc.color, borderRadius: 5, padding: "1px 7px", fontSize: 14, fontWeight: 700 }}>{pc.icon} {pc.label}</span>}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2540" }}>{p.name}</div>
                            <div style={{ fontSize: 14, color: "#7a8fb0" }}>{p.age} yrs · {p.gender} · {p.reason}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                              <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot, animation: sc.pulse ? "pulse 1.4s infinite" : "none" }} />
                              <span style={{ fontSize: 14, color: sc.color, fontWeight: 500 }}>{sc.label}</span>
                            </div>
                            <div style={{ fontSize: 14, color: "#b0bdd6", marginTop: 3 }}>Arrived {p.arrived}</div>
                            <div style={{ fontSize: 14, color: "#b0bdd6" }}>{p.wait} wait</div>
                          </div>
                        </div>

                        {/* Vitals strip */}
                        <div style={{ marginTop: 10, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          {p.vitals ? (
                            <>
                              <VitalChip label="BP"   value={p.vitals.bp}        flag={bpFlag(p.vitals.bp)} />
                              <VitalChip label="Temp" value={`${p.vitals.temp}°`} flag={tempFlag(p.vitals.temp)} />
                              <VitalChip label="HR"   value={p.vitals.hr}         flag="normal" />
                              <VitalChip label="SpO₂" value={`${p.vitals.spo2}%`} flag={spo2Flag(p.vitals.spo2)} />
                              <button onClick={e => { e.stopPropagation(); setVitalsModal(p); }} style={{ marginLeft: "auto", background: "none", border: "1px solid #CCDAF0", borderRadius: 7, padding: "3px 10px", fontSize: 14, color: "#0047AB", cursor: "pointer", fontWeight: 600 }}>Full Vitals</button>
                            </>
                          ) : (
                            <span style={{ fontSize: 14, color: "#b0bdd6", background: "#f7f9fd", borderRadius: 7, padding: "3px 10px" }}>⏳ Awaiting vitals from nurse</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#9aabc0" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2540" }}>All clear!</div>
                  <div style={{ fontSize: 14, marginTop: 4 }}>No patients in this category.</div>
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          <DetailPanel selected={selected} onMarkDone={markDone} onRequeue={requeue} onVitals={setVitalsModal} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}
