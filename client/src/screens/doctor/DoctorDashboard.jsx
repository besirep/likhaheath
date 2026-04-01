import { useState, useEffect } from "react";

// ── Data ──────────────────────────────────────────────────────────────────────
const myQueue = [
  { id: 1, name: "Maria Santos",   queue: "A-001", age: 34, reason: "Hypertension follow-up", status: "in-consultation", wait: "0m",  priority: null,     vitals: { bp: "138/88", temp: "36.7°C", hr: "82 bpm" } },
  { id: 2, name: "Jose Dela Cruz", queue: "A-004", age: 57, reason: "Diabetes check-up",      status: "waiting",         wait: "12m", priority: null,     vitals: null },
  { id: 3, name: "Ana Lim",        queue: "A-006", age: 28, reason: "Fever & cough",           status: "waiting",         wait: "26m", priority: null,     vitals: null },
  { id: 4, name: "Elena Cruz",     queue: "A-008", age: 66, reason: "Chest discomfort review", status: "waiting",         wait: "40m", priority: "elderly", vitals: null },
  { id: 5, name: "Celia Marcos",   queue: "A-010", age: 62, reason: "Lab results review",      status: "waiting",         wait: "54m", priority: "elderly", vitals: null },
];

// All active consultations across all doctors (shared queue context)
const allConsultations = [
  { doctor: "Dr. Reyes",  room: "Room 1", patient: "Maria Santos",  queue: "A-001", reason: "Hypertension follow-up" },
  { doctor: "Dr. Santos", room: "Room 2", patient: "Ramon Valdez",  queue: "A-002", reason: "Back pain + PT review"  },
  { doctor: "Dr. Cruz",   room: "Room 3", patient: "Luisa Ramos",   queue: "A-003", reason: "Prenatal check-up"      },
];

const appointments = [
  { time: "1:00 PM", name: "Pedro Bautista", age: 51, reason: "Annual physical",     type: "scheduled" },
  { time: "2:30 PM", name: "Luisa Ramos",    age: 39, reason: "Post-op follow-up",   type: "scheduled" },
  { time: "4:00 PM", name: "Elena Cruz",     age: 66, reason: "Hypertension review", type: "urgent"    },
];

const notifications = [
  { id: 1, text: "A-001 vitals recorded by nurse",    time: "2m ago",  type: "info"   },
  { id: 2, text: "Elena Cruz marked as urgent",       time: "18m ago", type: "urgent" },
  { id: 3, text: "Lab results ready: Jose Dela Cruz", time: "34m ago", type: "lab"    },
];

const priorityConfig = {
  elderly:   { icon: "👴", label: "Senior Citizen", color: "#7b5ea7" },
  pregnant:  { icon: "🤰", label: "Pregnant",       color: "#d4709a" },
  pwd:       { icon: "♿", label: "PWD",             color: "#3b7dd8" },
  pediatric: { icon: "👶", label: "Pedia",           color: "#e09040" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
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

function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, []);
  return { opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)", transition: "opacity 0.4s ease, transform 0.4s ease" };
}

// ── Consultation Modal (unchanged logic, kept intact) ─────────────────────────
function ConsultationModal({ patient, onClose }) {
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  if (!patient) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#f0f4fb", display: "flex", flexDirection: "column", animation: "slideIn 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        textarea:focus { outline:none; border-color:#3b7dd8 !important; }
        input:focus { outline:none; border-color:#3b7dd8 !important; }
      `}</style>

      {/* Top bar */}
      <div style={{ background: "white", borderBottom: "1px solid #e0e7f3", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: "0 2px 12px rgba(60,90,140,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ background: "linear-gradient(135deg,#3b7dd8,#5b9af0)", borderRadius: 10, padding: "6px 14px", fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 16, color: "white", letterSpacing: 1 }}>{patient.queue}</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1a2540", fontFamily: "'Fraunces',serif" }}>{patient.name}</div>
            <div style={{ fontSize: 13, color: "#7a8fb0" }}>{patient.age} yrs · {patient.reason}</div>
          </div>
          <div style={{ marginLeft: 12, background: "#fff4f0", border: "1px solid #f5d0c0", borderRadius: 8, padding: "5px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#e07050", animation: "pulse 1.4s infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#e07050", fontFamily: "monospace" }}>{fmt(elapsed)}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ background: "#eef3fc", color: "#3b7dd8", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🖨 Print Summary</button>
          <button style={{ background: "#3b7dd8", color: "white", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(59,125,216,0.3)" }}>✓ End Consultation</button>
          <button onClick={onClose} style={{ background: "#f0f3fa", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 14, color: "#7a8fb0", cursor: "pointer" }}>✕</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr 280px", overflow: "hidden" }}>
        {/* Left */}
        <div style={{ background: "white", borderRight: "1px solid #e8edf7", padding: "24px 20px", overflowY: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Avatar name={patient.name} size={56} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a2540", marginTop: 10, fontFamily: "'Fraunces',serif" }}>{patient.name}</div>
            <div style={{ fontSize: 12, color: "#7a8fb0" }}>Patient ID · #CQ-{String(patient.id).padStart(4, "0")}</div>
          </div>
          {patient.vitals && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#b0bdd6", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Vitals</div>
              {Object.entries(patient.vitals).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f3fa" }}>
                  <span style={{ fontSize: 11, color: "#7a8fb0", textTransform: "uppercase", letterSpacing: 0.5 }}>{k === "bp" ? "Blood Pressure" : k === "temp" ? "Temperature" : "Heart Rate"}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2540" }}>{v}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, fontWeight: 600, color: "#b0bdd6", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Last Visits</div>
          {[{ date: "Jan 14, 2026", reason: "Hypertension check" }, { date: "Nov 3, 2025", reason: "Flu symptoms" }, { date: "Aug 22, 2025", reason: "Annual physical" }].map(v => (
            <div key={v.date} style={{ padding: "8px 0", borderBottom: "1px solid #f0f3fa" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1a2540" }}>{v.reason}</div>
              <div style={{ fontSize: 11, color: "#b0bdd6" }}>{v.date}</div>
            </div>
          ))}
          <button style={{ marginTop: 12, width: "100%", background: "#f0f4fb", border: "1px solid #e0e7f3", borderRadius: 8, padding: "8px", fontSize: 12, color: "#3b7dd8", cursor: "pointer", fontWeight: 600 }}>View Full Record →</button>
        </div>

        {/* Center */}
        <div style={{ padding: "28px 32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#7a8fb0", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Chief Complaint / HPI</label>
            <div style={{ background: "#eef3fc", borderRadius: 12, padding: "14px 16px", fontSize: 14, color: "#1a2540", lineHeight: 1.6 }}>
              Patient presents with elevated blood pressure during last visit. Reports occasional headaches in the mornings. Currently on Amlodipine 5mg. Requesting medication review.
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#7a8fb0", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Assessment / Diagnosis</label>
            <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Enter diagnosis or ICD-10 code..."
              style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #e0e7f3", borderRadius: 12, fontSize: 14, color: "#1a2540", background: "white", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#7a8fb0", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Doctor's Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Record findings, observations, and treatment plan..."
              style={{ flex: 1, minHeight: 200, padding: "14px 16px", border: "1.5px solid #e0e7f3", borderRadius: 12, fontSize: 14, color: "#1a2540", background: "white", fontFamily: "'DM Sans',sans-serif", resize: "none", lineHeight: 1.7 }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {["📋 Add to Records", "🧪 Request Lab", "📅 Schedule Follow-up"].map(label => (
              <button key={label} style={{ flex: 1, background: "#f0f4fb", color: "#3b7dd8", border: "1.5px solid #d0ddf5", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Right */}
        <div style={{ background: "white", borderLeft: "1px solid #e8edf7", padding: "24px 20px", overflowY: "auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#b0bdd6", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>Up Next</div>
          {myQueue.filter(p => p.status === "waiting").map((p, i) => (
            <div key={p.id} style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 8, background: i === 0 ? "#eef3fc" : "#f7f9fd", border: i === 0 ? "1.5px solid #c8d9f5" : "1.5px solid transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#3b7dd8", fontFamily: "'Fraunces',serif" }}>{p.queue}</span>
                <span style={{ fontSize: 11, color: "#b0bdd6" }}>{p.wait} wait</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2540" }}>{p.name}</div>
              <div style={{ fontSize: 12, color: "#7a8fb0", marginTop: 2 }}>{p.reason}</div>
            </div>
          ))}
        </div>
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
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#3b7dd8,#5b9af0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏥</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "white", fontFamily: "'Fraunces',serif" }}>CareQueue</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Doctor Portal</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 20px" }}>
        <div style={{ background: "rgba(59,125,216,0.18)", border: "1px solid rgba(59,125,216,0.35)", borderRadius: 8, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5b9af0" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#7eb3f5", letterSpacing: 0.4 }}>PHYSICIAN MODE</span>
        </div>
      </div>
      <nav style={{ padding: "8px 12px", flex: 1 }}>
        {[
          { icon: "⊞",  label: "Dashboard",      active: true },
          { icon: "📋", label: "Queue"                        },
          { icon: "🩺", label: "Consultations",  badge: "1"  },
          { icon: "🗂️", label: "Patient Records"             },
          { icon: "📅", label: "Appointments"                },
        ].map(item => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10, marginBottom: 2, cursor: "pointer",
            background: item.active ? "rgba(59,125,216,0.22)" : "transparent",
            color: item.active ? "#7eb3f5" : "rgba(255,255,255,0.55)",
            fontWeight: item.active ? 600 : 400, fontSize: 14, transition: "background 0.2s, color 0.2s",
          }}
            onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; } }}
            onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; } }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
            {item.badge && <span style={{ marginLeft: "auto", background: "#3b7dd8", color: "white", borderRadius: 10, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{item.badge}</span>}
          </div>
        ))}
      </nav>
      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#5b9af0,#3b7dd8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white" }}>DR</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>Dr. Reyes</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Internal Medicine</div>
        </div>
      </div>
    </div>
  );
}

// ── Stat Cards ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, bg, border, trend, trendUp, index }) {
  const fade = useFadeIn(index * 80 + 150);
  return (
    <div style={{
      background: bg || "white", borderRadius: 16, padding: "18px 20px",
      border: `1px solid ${border || "#e8edf7"}`,
      boxShadow: "0 2px 10px rgba(60,90,140,0.07)", cursor: "default", ...fade,
      transition: "box-shadow 0.2s, transform 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 22px rgba(60,90,140,0.13)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(60,90,140,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        {trend && (
          <span style={{ fontSize: 11, fontWeight: 600, color: trendUp ? "#3b7dd8" : trendUp === false ? "#e07050" : "#8a9bb0", background: trendUp ? "#eef3fc" : trendUp === false ? "#fde8e0" : "#f4f7fb", borderRadius: 6, padding: "2px 8px" }}>
            {trendUp ? "↑" : trendUp === false ? "↓" : "·"} {trend}
          </span>
        )}
      </div>
      <div style={{ fontSize: 34, fontWeight: 700, color: color || "#1a2540", fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2540", marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#8a9bb0", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Now Serving Banner ────────────────────────────────────────────────────────
function NowServingBanner({ consultations, onResume, fade }) {
  const [expanded, setExpanded] = useState(false);
  const count = consultations.length;
  const myConsult = consultations.find(c => c.doctor === "Dr. Reyes");

  return (
    <div style={{
      background: "linear-gradient(135deg,#1a2540 0%,#243560 100%)",
      borderRadius: 18, padding: "0", marginBottom: 22,
      boxShadow: "0 8px 32px rgba(20,40,90,0.22)",
      overflow: "hidden", ...fade,
    }}>
      {/* Main row */}
      <div style={{ padding: "20px 26px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* Count badge */}
          <div style={{ background: "rgba(59,125,216,0.25)", border: "1.5px solid rgba(91,154,240,0.45)", borderRadius: 14, padding: "10px 18px", textAlign: "center", minWidth: 70 }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: "white", fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>Active</div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Now Serving</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "white", fontFamily: "'Fraunces',serif" }}>
              {count} Consultation{count !== 1 ? "s" : ""} In Progress
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
              {consultations.map(c => c.doctor).join(" · ")}
            </div>
          </div>

          {/* My patient vitals — only if Dr. Reyes is consulting */}
          {myConsult && (
            <div style={{ marginLeft: 16, display: "flex", gap: 8 }}>
              {["138/88 mmHg", "36.7°C", "82 bpm"].map(v => (
                <div key={v} style={{ background: "rgba(255,255,255,0.09)", borderRadius: 9, padding: "6px 12px", fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{v}</div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setExpanded(e => !e)} style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "9px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}>
            {expanded ? "Hide" : "View All"} {expanded ? "↑" : "↓"}
          </button>
          {myConsult && (
            <button onClick={onResume} style={{ background: "white", color: "#1a2540", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>
              Resume My Consult →
            </button>
          )}
        </div>
      </div>

      {/* Expanded: all doctors' patients */}
      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "14px 26px 18px", display: "grid", gridTemplateColumns: `repeat(${Math.min(count, 3)}, 1fr)`, gap: 12 }}>
          {consultations.map(c => (
            <div key={c.doctor} style={{
              background: c.doctor === "Dr. Reyes" ? "rgba(59,125,216,0.2)" : "rgba(255,255,255,0.07)",
              border: `1px solid ${c.doctor === "Dr. Reyes" ? "rgba(91,154,240,0.4)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 12, padding: "12px 16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: c.doctor === "Dr. Reyes" ? "#7eb3f5" : "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.5 }}>{c.room}</span>
                <span style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)", borderRadius: 5, padding: "1px 8px", fontSize: 10, fontWeight: 600 }}>{c.queue}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{c.patient}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{c.reason}</div>
              <div style={{ fontSize: 11, color: c.doctor === "Dr. Reyes" ? "#7eb3f5" : "rgba(255,255,255,0.4)", marginTop: 6, fontWeight: 600 }}>{c.doctor}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Queue Row ─────────────────────────────────────────────────────────────────
function QueueRow({ patient, index, onStartConsult }) {
  const fade = useFadeIn(index * 55 + 600);
  const isActive = patient.status === "in-consultation";
  const pc = patient.priority ? priorityConfig[patient.priority] : null;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "60px 1fr 170px 80px 110px",
      alignItems: "center", padding: "12px 20px",
      borderBottom: "1px solid #f0f3fa",
      background: isActive ? "#f0f5ff" : "transparent",
      cursor: "pointer", ...fade, transition: "background 0.15s",
    }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f7f9fd"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 13, color: isActive ? "#3b7dd8" : "#7a8fb0" }}>{patient.queue}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative" }}>
          <Avatar name={patient.name} size={32} />
          {pc && <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 10 }}>{pc.icon}</span>}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2540", display: "flex", alignItems: "center", gap: 6 }}>
            {patient.name}
            {pc && <span style={{ fontSize: 9, fontWeight: 700, color: pc.color, background: pc.color + "18", borderRadius: 4, padding: "1px 6px", textTransform: "uppercase" }}>{pc.label}</span>}
          </div>
          <div style={{ fontSize: 11, color: "#7a8fb0" }}>{patient.age} yrs · {patient.reason}</div>
        </div>
      </div>

      <div>
        {patient.vitals ? (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {Object.values(patient.vitals).map(v => (
              <span key={v} style={{ background: "#eef3fc", color: "#3b7dd8", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 500 }}>{v}</span>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: 11, color: "#c0cde0", fontStyle: "italic" }}>Awaiting vitals</span>
        )}
      </div>

      <div style={{ fontSize: 12, color: "#8a9bb0" }}>{patient.wait}</div>

      <div>
        {isActive ? (
          <button onClick={() => onStartConsult(patient)} style={{ background: "#3b7dd8", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(59,125,216,0.3)" }}>Resume →</button>
        ) : (
          <button onClick={() => onStartConsult(patient)} style={{ background: "#eef3fc", color: "#3b7dd8", border: "1px solid #d0ddf5", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Start</button>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const [time, setTime]             = useState(new Date());
  const [activeConsult, setActiveConsult] = useState(null);
  const [notifOpen, setNotifOpen]   = useState(false);

  const headerFade   = useFadeIn(80);
  const bannerFade   = useFadeIn(300);
  const queueFade    = useFadeIn(420);
  const apptFade     = useFadeIn(450);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = time.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // Queue stats derived from data
  const nowServing = allConsultations.length;
  const waiting    = myQueue.filter(p => p.status === "waiting").length;
  const completed  = 13;
  const skipped    = 2;
  const priority   = myQueue.filter(p => p.priority).length;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4fb", fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #c8d9f5; border-radius: 4px; }
        @keyframes popIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
      `}</style>

      {activeConsult && <ConsultationModal patient={activeConsult} onClose={() => setActiveConsult(null)} />}

      <Sidebar />

      <div style={{ marginLeft: 220, padding: "0 28px 32px" }}>

        {/* ── Top bar ── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "#f0f4fb", borderBottom: "1px solid #dde8f5",
          padding: "14px 0", marginBottom: 22,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={headerFade}>
            <h1 style={{ margin: 0, fontSize: 26, fontFamily: "'Fraunces',serif", fontWeight: 700, color: "#1a2540" }}>
              Good morning, Dr. Reyes 👋
            </h1>
            <div style={{ fontSize: 13, color: "#7a8fb0", marginTop: 2 }}>{dateStr}</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ background: "white", borderRadius: 12, padding: "9px 16px", border: "1px solid #e0e7f3", textAlign: "right", boxShadow: "0 2px 8px rgba(60,90,140,0.07)" }}>
              <div style={{ fontSize: 18, fontFamily: "'Fraunces',serif", fontWeight: 700, color: "#1a2540", letterSpacing: 1 }}>{timeStr}</div>
              <div style={{ fontSize: 10, color: "#b0bdd6" }}>Current Time</div>
            </div>

            <div style={{ position: "relative" }}>
              <button onClick={() => setNotifOpen(o => !o)} style={{ background: "white", border: "1px solid #e0e7f3", borderRadius: 12, width: 44, height: 44, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(60,90,140,0.07)", position: "relative" }}>
                🔔
                <div style={{ position: "absolute", top: 9, right: 9, width: 7, height: 7, borderRadius: "50%", background: "#e07050", border: "2px solid white" }} />
              </button>
              {notifOpen && (
                <div style={{ position: "absolute", right: 0, top: 52, width: 300, background: "white", borderRadius: 14, border: "1px solid #e0e7f3", boxShadow: "0 12px 40px rgba(20,40,90,0.16)", zIndex: 100, animation: "popIn 0.2s ease" }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f3fa", fontSize: 13, fontWeight: 700, color: "#1a2540" }}>
                    Notifications <span style={{ background: "#eef3fc", color: "#3b7dd8", borderRadius: 6, padding: "1px 8px", fontSize: 11, marginLeft: 6 }}>3</span>
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid #f0f3fa", display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 16 }}>{n.type === "urgent" ? "🚨" : n.type === "lab" ? "🧪" : "ℹ️"}</span>
                      <div>
                        <div style={{ fontSize: 13, color: "#1a2540" }}>{n.text}</div>
                        <div style={{ fontSize: 11, color: "#b0bdd6", marginTop: 2 }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: "10px 16px", textAlign: "center" }}>
                    <button style={{ background: "none", border: "none", fontSize: 12, color: "#3b7dd8", cursor: "pointer", fontWeight: 600 }}>View all</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 22 }}>
          <StatCard index={0}
            icon="🩺" label="Now Serving"   value={nowServing}
            sub={`${nowServing} doctor${nowServing !== 1 ? "s" : ""} in session`}
            color="#3b7dd8" bg="#eef3fc" border="#d0ddf5"
            trend={null}
          />
          <StatCard index={1}
            icon="⏳" label="Waiting"        value={waiting}
            sub="In queue for Dr. Reyes"
            color="#1a2540"
            trend="2 priority" trendUp={null}
          />
          <StatCard index={2}
            icon="✅" label="Completed"      value={completed}
            sub="consultations today"
            color="#2a7d5f" bg="#e8f7f1" border="#c0e4d6"
            trend="+2 vs yesterday" trendUp={true}
          />
          <StatCard index={3}
            icon="⏭"  label="Skipped"        value={skipped}
            sub="called, no response"
            color="#c05060" bg="#fce8ec" border="#f0c8d0"
            trend="down from 4" trendUp={true}
          />
          <StatCard index={4}
            icon="⭐" label="Priority Queue"  value={priority}
            sub="Elderly, PWD, Pregnant"
            color="#7b5ea7" bg="#f0eafb" border="#d8c8f0"
            trend={null}
          />
        </div>

        {/* ── Now Serving Banner ── */}
        <NowServingBanner
          consultations={allConsultations}
          onResume={() => setActiveConsult(myQueue[0])}
          fade={bannerFade}
        />

        {/* ── Two-column: Queue + Appointments ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>

          {/* My Queue */}
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #e0e7f3", overflow: "hidden", boxShadow: "0 2px 10px rgba(60,90,140,0.07)", ...queueFade }}>
            <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f3fa" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontFamily: "'Fraunces',serif", fontWeight: 700, color: "#1a2540" }}>My Queue Today</h2>
                <div style={{ fontSize: 12, color: "#8a9bb0", marginTop: 2 }}>Room 1 · Dr. Reyes</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ background: "#eef3fc", color: "#3b7dd8", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>{myQueue.filter(p => p.status === "waiting").length} waiting</div>
                <button style={{ background: "linear-gradient(135deg,#3b7dd8,#5b9af0)", color: "white", border: "none", borderRadius: 9, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(59,125,216,0.28)" }}>Call Next →</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 170px 80px 110px", padding: "8px 20px", background: "#f7f9fd", borderBottom: "1px solid #f0f3fa" }}>
              {["#", "Patient", "Vitals", "Wait", ""].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#b0bdd6", letterSpacing: 0.6, textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>

            {myQueue.map((p, i) => <QueueRow key={p.id} patient={p} index={i} onStartConsult={setActiveConsult} />)}

            <div style={{ padding: "11px 20px", borderTop: "1px solid #f0f3fa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#b0bdd6" }}>{myQueue.filter(p => p.status === "waiting").length} patients waiting</span>
              <button style={{ background: "none", border: "none", fontSize: 12, color: "#3b7dd8", cursor: "pointer", fontWeight: 600 }}>Full Queue View →</button>
            </div>
          </div>

          {/* Appointments + quick stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* This afternoon */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #e0e7f3", overflow: "hidden", boxShadow: "0 2px 10px rgba(60,90,140,0.07)", ...apptFade }}>
              <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f0f3fa" }}>
                <h2 style={{ margin: 0, fontSize: 16, fontFamily: "'Fraunces',serif", fontWeight: 700, color: "#1a2540" }}>This Afternoon</h2>
                <div style={{ fontSize: 12, color: "#8a9bb0", marginTop: 2 }}>Scheduled appointments</div>
              </div>
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                {appointments.map((a, i) => (
                  <div key={i} style={{
                    padding: "12px 14px", borderRadius: 12,
                    background: a.type === "urgent" ? "#fff5f2" : "#f7f9fd",
                    border: `1.5px solid ${a.type === "urgent" ? "#f5c8bc" : "#e8edf7"}`,
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{ textAlign: "center", minWidth: 44 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: a.type === "urgent" ? "#e07050" : "#3b7dd8", fontFamily: "'Fraunces',serif" }}>{a.time.split(" ")[0]}</div>
                      <div style={{ fontSize: 10, color: "#b0bdd6" }}>{a.time.split(" ")[1]}</div>
                    </div>
                    <div style={{ width: 1, height: 32, background: a.type === "urgent" ? "#f5c8bc" : "#e8edf7" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2540" }}>{a.name}</span>
                        {a.type === "urgent" && <span style={{ background: "#fde8e2", color: "#e07050", borderRadius: 5, padding: "1px 6px", fontSize: 9, fontWeight: 700 }}>URGENT</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#7a8fb0", marginTop: 1 }}>{a.age} yrs · {a.reason}</div>
                    </div>
                    <button style={{ background: "none", border: "1px solid #e0e7f3", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#3b7dd8", cursor: "pointer", fontWeight: 600 }}>View</button>
                  </div>
                ))}
              </div>
              <div style={{ padding: "10px 20px", borderTop: "1px solid #f0f3fa" }}>
                <button style={{ background: "none", border: "none", fontSize: 12, color: "#3b7dd8", cursor: "pointer", fontWeight: 600 }}>View Full Schedule →</button>
              </div>
            </div>

            {/* Quick stats pill row */}
            <div style={{ background: "white", borderRadius: 14, border: "1px solid #e0e7f3", padding: "14px 18px", boxShadow: "0 2px 8px rgba(60,90,140,0.06)", ...useFadeIn(500) }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#b0bdd6", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Today's Progress</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Completion rate", value: `${Math.round(completed / (completed + waiting) * 100)}%`, color: "#2a7d5f", pct: Math.round(completed / (completed + waiting) * 100) },
                  { label: "Avg. consult time", value: "18 min", color: "#3b7dd8", pct: 60 },
                  { label: "SMS delivery", value: "96%", color: "#7b5ea7", pct: 96 },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "#4a5d75" }}>{s.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: "'Fraunces',serif" }}>{s.value}</span>
                    </div>
                    <div style={{ height: 5, background: "#f0f3f7", borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: 8, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
