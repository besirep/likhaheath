import { useState, useEffect, useCallback } from "react";
import { Building2, Stethoscope, Clock, AlertCircle, SkipForward, Bell, ClipboardList, CalendarDays, FolderOpen, UserRound, User, Download, LayoutDashboard, CheckCircle2, CircleCheckBig, X, TestTubes, Printer, AlertTriangle, Info } from "lucide-react";
import { consultationsApi } from "../../lib/api/consultations.js";
import { printConsultationSummary, printQueueReport, downloadQueueCSV } from "../../lib/utils/printUtils.js";

// Status mapping: API → UI key
const mapStatus = s => {
  if (!s) return "waiting";
  const m = { Waiting: "waiting", "In-Progress": "in-consultation", Done: "done", Skipped: "skipped" };
  return m[s] || s.toLowerCase();
};

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
  elderly:   { Icon: UserRound, label: "Senior Citizen", color: "#8B5FBF" },
  pregnant:  { Icon: UserRound, label: "Pregnant",       color: "#d4709a" },
  pwd:       { Icon: UserRound, label: "PWD",             color: "#0047AB" },
  pediatric: { Icon: UserRound, label: "Pedia",           color: "#e09040" },
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

// ── Mini-Modals (Add to Record, Lab Request, Schedule Follow-up) ──────────────
function MiniModal({ title, icon, children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: 440, boxShadow: "0 24px 64px rgba(20,40,70,0.22)", overflow: "hidden", animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ background: "linear-gradient(135deg,#1a2540,#243560)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{icon} {title}</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 15, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
        </div>
        <div style={{ padding: "22px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Consultation Modal ─────────────────────────────────────────────────────────
function ConsultationModal({ patient, onClose, onNavigate, queue = [], onEndConsult }) {
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [modal, setModal] = useState(null); // 'record' | 'lab' | 'followup'
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(null); setTimeout(() => setToast(msg), 10); };

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  if (!patient) return null;

  const handlePrint = () => {
    printConsultationSummary({
      patient,
      diagnosis,
      notes,
      vitals: patient.vitals || null,
      staffName: 'Dr. Reyes',
    });
  };

  const handleEndConsult = async () => {
    try {
      // 1. Save the consultation record (diagnosis + notes) so it appears in history
      if (diagnosis.trim() || notes.trim()) {
        await consultationsApi.saveConsultation({
          appointmentId: patient.appointmentId,
          patientId:     patient.patientId,
          diagnosis:     diagnosis.trim() || 'General consultation',
          treatment:     notes.trim() || 'See doctor notes',
          notes:         notes.trim() || null,
        });
      } else {
        // No diagnosis/notes entered — just mark queue as Done
        await consultationsApi.updateQueueStatus(patient.id, 'Done');
      }
      showToast("\u2713 Consultation ended & saved");
      if (onEndConsult) onEndConsult();
      setTimeout(onClose, 400);
    } catch (e) {
      console.error('[Dashboard] End consult failed:', e);
      showToast("Failed to end consultation");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#EBF0FA", display: "flex", flexDirection: "column", animation: "slideIn 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes popIn  { from{transform:scale(0.93);opacity:0} to{transform:scale(1);opacity:1} }
        textarea:focus { outline:none; border-color:#0047AB !important; }
        input:focus { outline:none; border-color:#0047AB !important; }
      `}</style>

      {/* Sub-modal: Add to Record */}
      {modal === 'record' && (
        <MiniModal title="Add to Medical Record" icon={<ClipboardList size={16} strokeWidth={2} />} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 14, color: "#4a5d75" }}>Recording consultation for <b>{patient.name}</b></div>
            <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Diagnosis / ICD-10..." style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D8E4F2", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Doctor's notes..." rows={4} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D8E4F2", borderRadius: 10, fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
            <button onClick={() => { setModal(null); showToast("Added to medical records"); }} style={{ background: "linear-gradient(135deg,#0047AB,#1565D8)", color: "white", border: "none", borderRadius: 10, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Save to Record</button>
          </div>
        </MiniModal>
      )}

      {/* Sub-modal: Lab Request */}
      {modal === 'lab' && (
        <MiniModal title="Request Laboratory" icon={<TestTubes size={16} strokeWidth={2} />} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 14, color: "#4a5d75" }}>Patient: <b>{patient.name}</b></div>
            {["CBC (Complete Blood Count)","Blood Chemistry","Urinalysis","Lipid Profile","FBS (Fasting Blood Sugar)","ECG","Chest X-ray"].map(test => (
              <label key={test} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer", padding: "6px 0", borderBottom: "1px solid #f0f3f7" }}>
                <input type="checkbox" style={{ width: 16, height: 16, cursor: "pointer" }} />
                {test}
              </label>
            ))}
            <button onClick={() => { setModal(null); showToast(<><TestTubes size={16} strokeWidth={2} /> Lab request submitted</>); }} style={{ marginTop: 8, background: "linear-gradient(135deg,#0047AB,#1565D8)", color: "white", border: "none", borderRadius: 10, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Submit Lab Request</button>
          </div>
        </MiniModal>
      )}

      {/* Sub-modal: Schedule Follow-up */}
      {modal === 'followup' && (
        <MiniModal title="Schedule Follow-up" icon={<CalendarDays size={16} strokeWidth={2} />} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 14, color: "#4a5d75" }}>Schedule follow-up for <b>{patient.name}</b></div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Date</label>
              <input type="date" style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D8E4F2", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Time</label>
              <input type="time" style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D8E4F2", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Notes</label>
              <input placeholder="Reason for follow-up..." style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #D8E4F2", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <button onClick={() => { setModal(null); showToast("Follow-up scheduled"); }} style={{ background: "linear-gradient(135deg,#0047AB,#1565D8)", color: "white", border: "none", borderRadius: 10, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Confirm Schedule</button>
          </div>
        </MiniModal>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e2d40", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 14, zIndex: 400, boxShadow: "0 8px 24px rgba(30,45,64,0.28)", animation: "slideIn 0.3s ease" }}>{toast}</div>
      )}


      {/* Top bar */}
      <div style={{ background: "white", borderBottom: "1px solid #D8E4F2", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: "0 2px 12px rgba(60,90,140,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ background: "linear-gradient(135deg,#0047AB,#1565D8)", borderRadius: 10, padding: "6px 14px", fontWeight: 700, fontSize: 16, color: "white", letterSpacing: 1 }}>{patient.queue}</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1a2540" }}>{patient.name}</div>
            <div style={{ fontSize: 14, color: "#7a8fb0" }}>{patient.age} yrs · {patient.reason}</div>
          </div>
          <div style={{ marginLeft: 12, background: "#fff4f0", border: "1px solid #f5d0c0", borderRadius: 8, padding: "5px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#CC0000", animation: "pulse 1.4s infinite" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#CC0000", fontFamily: "monospace" }}>{fmt(elapsed)}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handlePrint} style={{ background: "#EBF0FA", color: "#0047AB", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}><Printer size={16} strokeWidth={2} /> Print Summary</button>
          <button onClick={handleEndConsult} style={{ background: "#0047AB", color: "white", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,71,171,0.3)" }}>End Consultation</button>
          <button onClick={onClose} style={{ background: "#f0f3fa", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 14, color: "#7a8fb0", cursor: "pointer" }}><X size={16} strokeWidth={2} /></button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr 280px", overflow: "hidden" }}>
        {/* Left */}
        <div style={{ background: "white", borderRight: "1px solid #e8edf7", padding: "24px 20px", overflowY: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Avatar name={patient.name} size={56} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a2540", marginTop: 10 }}>{patient.name}</div>
            <div style={{ fontSize: 14, color: "#7a8fb0" }}>Patient ID · #CQ-{String(patient.id).padStart(4, "0")}</div>
          </div>
          {patient.vitals && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#b0bdd6", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Vitals</div>
              {Object.entries(patient.vitals).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f3fa" }}>
                  <span style={{ fontSize: 14, color: "#7a8fb0", textTransform: "uppercase", letterSpacing: 0.5 }}>{k === "bp" ? "Blood Pressure" : k === "temp" ? "Temperature" : "Heart Rate"}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1a2540" }}>{v}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 14, fontWeight: 600, color: "#b0bdd6", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Last Visits</div>
          {[{ date: "Jan 14, 2026", reason: "Hypertension check" }, { date: "Nov 3, 2025", reason: "Flu symptoms" }, { date: "Aug 22, 2025", reason: "Annual physical" }].map(v => (
            <div key={v.date} style={{ padding: "8px 0", borderBottom: "1px solid #f0f3fa" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2540" }}>{v.reason}</div>
              <div style={{ fontSize: 14, color: "#b0bdd6" }}>{v.date}</div>
            </div>
          ))}
          <button onClick={() => { onNavigate && onNavigate('dr-records'); onClose(); }} style={{ marginTop: 12, width: "100%", background: "#EBF0FA", border: "1px solid #D8E4F2", borderRadius: 8, padding: "8px", fontSize: 14, color: "#0047AB", cursor: "pointer", fontWeight: 600 }}>View Full Record →</button>
        </div>

        {/* Center */}
        <div style={{ padding: "28px 32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#7a8fb0", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Chief Complaint / HPI</label>
            <div style={{ background: "#EBF0FA", borderRadius: 12, padding: "14px 16px", fontSize: 14, color: "#1a2540", lineHeight: 1.6 }}>
              Patient presents with elevated blood pressure during last visit. Reports occasional headaches in the mornings. Currently on Amlodipine 5mg. Requesting medication review.
            </div>
          </div>
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#7a8fb0", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Assessment / Diagnosis</label>
            <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Enter diagnosis or ICD-10 code..."
              style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #D8E4F2", borderRadius: 12, fontSize: 14, color: "#1a2540", background: "white", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#7a8fb0", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Doctor's Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Record findings, observations, and treatment plan..."
              style={{ flex: 1, minHeight: 200, padding: "14px 16px", border: "1.5px solid #D8E4F2", borderRadius: 12, fontSize: 14, color: "#1a2540", background: "white", resize: "none", lineHeight: 1.7 }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: <><ClipboardList size={16} strokeWidth={2} /> Add to Records</>, key: "record" },
              { label: <><TestTubes size={16} strokeWidth={2} /> Request Lab</>,    key: "lab"    },
              { label: "Schedule Follow-up", key: "followup" },
            ].map(({ label, key }) => (
              <button key={key} onClick={() => setModal(key)} style={{ flex: 1, background: "#EBF0FA", color: "#0047AB", border: "1.5px solid #C0D4F0", borderRadius: 10, padding: "11px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Right */}
        <div style={{ background: "white", borderLeft: "1px solid #e8edf7", padding: "24px 20px", overflowY: "auto" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#b0bdd6", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>Up Next</div>
          {queue.filter(p => p.status === "waiting").map((p, i) => (
            <div key={p.id} style={{ padding: "12px 14px", borderRadius: 12, marginBottom: 8, background: i === 0 ? "#EBF0FA" : "#f7f9fd", border: i === 0 ? "1.5px solid #B8CCEC" : "1.5px solid transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0047AB" }}>{p.queue}</span>
                <span style={{ fontSize: 14, color: "#b0bdd6" }}>{p.wait} wait</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2540" }}>{p.name}</div>
              <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>{p.reason}</div>
            </div>
          ))}
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
          <span style={{ fontSize: 14, fontWeight: 600, color: trendUp ? "#0047AB" : trendUp === false ? "#CC0000" : "#8a9bb0", background: trendUp ? "#EBF0FA" : trendUp === false ? "#fde8e0" : "#f4f7fb", borderRadius: 6, padding: "2px 8px" }}>
            {trendUp ? "↑" : trendUp === false ? "↓" : "·"} {trend}
          </span>
        )}
      </div>
      <div style={{ fontSize: 34, fontWeight: 700, color: color || "#1a2540", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2540", marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 14, color: "#8a9bb0", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Now Serving Banner ────────────────────────────────────────────────────────
function NowServingBanner({ consultations, onResume, fade, displayName }) {
  const [expanded, setExpanded] = useState(false);
  const count = consultations.length;
  const myConsult = consultations.find(c => c.doctor === displayName);

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
          <div style={{ background: "rgba(0,71,171,0.25)", border: "1.5px solid rgba(91,154,240,0.45)", borderRadius: 14, padding: "10px 18px", textAlign: "center", minWidth: 70 }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: "white", lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>Active</div>
          </div>

          <div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Now Serving</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>
              {count} Consultation{count !== 1 ? "s" : ""} In Progress
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
              {consultations.map(c => c.doctor).join(" · ")}
            </div>
          </div>

          {/* My patient vitals — only if Dr. Reyes is consulting */}
          {myConsult && (
            <div style={{ marginLeft: 16, display: "flex", gap: 8 }}>
              {["138/88 mmHg", "36.7°C", "82 bpm"].map(v => (
                <div key={v} style={{ background: "rgba(255,255,255,0.09)", borderRadius: 9, padding: "6px 12px", fontSize: 14, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{v}</div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setExpanded(e => !e)} style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "9px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}>
            {expanded ? "Hide" : "View All"} {expanded ? "↑" : "↓"}
          </button>
          {myConsult && (
            <button onClick={onResume} style={{ background: "white", color: "#1a2540", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>
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
              background: c.doctor === displayName ? "rgba(0,71,171,0.2)" : "rgba(255,255,255,0.07)",
              border: `1px solid ${c.doctor === displayName ? "rgba(91,154,240,0.4)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 12, padding: "12px 16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: c.doctor === displayName ? "#7eb3f5" : "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.5 }}>{c.room}</span>
                <span style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)", borderRadius: 5, padding: "1px 8px", fontSize: 14, fontWeight: 600 }}>{c.queue}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{c.patient}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{c.reason}</div>
              <div style={{ fontSize: 14, color: c.doctor === displayName ? "#7eb3f5" : "rgba(255,255,255,0.4)", marginTop: 6, fontWeight: 600 }}>{c.doctor}</div>
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
      <div style={{ fontFamily: "'Afacad', sans-serif", fontWeight: 700, fontSize: 14, color: isActive ? "#0047AB" : "#7a8fb0" }}>{patient.queue}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative" }}>
          <Avatar name={patient.name} size={32} />
          {pc && <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 14 }}>{pc.icon}</span>}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2540", display: "flex", alignItems: "center", gap: 6 }}>
            {patient.name}
            {pc && <span style={{ fontSize: 11, fontWeight: 700, color: pc.color, background: pc.color + "18", borderRadius: 4, padding: "1px 6px", textTransform: "uppercase" }}>{pc.label}</span>}
          </div>
          <div style={{ fontSize: 14, color: "#7a8fb0" }}>{patient.age} yrs · {patient.reason}</div>
        </div>
      </div>

      <div>
        {patient.vitals ? (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {Object.values(patient.vitals).map(v => (
              <span key={v} style={{ background: "#EBF0FA", color: "#0047AB", borderRadius: 6, padding: "2px 7px", fontSize: 14, fontWeight: 500 }}>{v}</span>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: 14, color: "#c0cde0", fontStyle: "italic" }}>Awaiting vitals</span>
        )}
      </div>

      <div style={{ fontSize: 14, color: "#8a9bb0" }}>{patient.wait}</div>

      <div>
        {isActive ? (
          <button onClick={() => onStartConsult(patient)} style={{ background: "#0047AB", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(0,71,171,0.3)" }}>Resume →</button>
        ) : (
          <button onClick={() => onStartConsult(patient)} style={{ background: "#EBF0FA", color: "#0047AB", border: "1px solid #C0D4F0", borderRadius: 8, padding: "6px 14px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Start</button>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DoctorDashboard({ user, onNavigate, onStartConsult }) {
  const [time, setTime]             = useState(new Date());
  const [notifOpen, setNotifOpen]   = useState(false);
  const [myQueue, setMyQueue]       = useState([]);

  // Shared consultation start: updates queue status → sets active patient in App → navigates to Consultations
  const handleStartConsult = async (patient) => {
    try {
      await consultationsApi.updateQueueStatus(patient.id, "In-Progress");
      setMyQueue(q => q.map(e => e.id === patient.id ? { ...e, status: "in-consultation" } : e));
      if (onStartConsult) {
        onStartConsult({
          queueId:       patient.id,
          appointmentId: patient.appointmentId,
          patientId:     patient.patientId,
          name:          patient.name,
          age:           patient.age,
          sex:           patient.gender || '?',
          queueNumber:   patient.queue,
          visitReason:   patient.reason,
          vitals:        patient.vitals,
        });
      }
      if (onNavigate) onNavigate("dr-consult");
    } catch (e) {
      console.error("[DoctorDashboard] Failed to start consultation:", e);
    }
  };

  // Derive display name: "Dr. Dela Cruz" from full name
  const lastName   = user?.name?.split(" ").slice(-1)[0] ?? "Doctor";
  const displayName = user?.title === 'Doctor' ? `Dr. ${lastName}` : (user?.name ?? "Doctor");
  const firstName  = user?.name?.split(" ")[0] ?? "Doctor";

  const headerFade   = useFadeIn(80);
  const bannerFade   = useFadeIn(300);
  const queueFade    = useFadeIn(420);
  const apptFade     = useFadeIn(450);

  // ── Live queue fetch (same API as DoctorQueue) ──────────────────────────────
  const loadQueue = useCallback(async () => {
    try {
      const data = await consultationsApi.getDoctorQueue();
      const normalized = data.map(p => ({
        id:            p.queueId,
        appointmentId: p.appointmentId,
        patientId:     p.patientId,
        queue:    `Q-${String(p.queueNumber).padStart(3, "0")}`,
        name:     p.name,
        age:      p.age,
        reason:   p.visitReason || "General consultation",
        status:   mapStatus(p.status),
        wait:     "—",
        priority: null,
        vitals:   p.vitals ? { bp: p.vitals.bp, temp: `${p.vitals.temp}°C`, hr: `${p.vitals.hr} bpm` } : null,
      }));
      setMyQueue(normalized);
    } catch (e) {
      console.error("[DoctorDashboard] Failed to load queue:", e);
    }
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);
  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(loadQueue, 30_000);
    return () => clearInterval(t);
  }, [loadQueue]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr  = time.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr  = time.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const hour     = time.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Queue stats derived from live data
  const inConsult  = myQueue.filter(p => p.status === "in-consultation");
  const nowServing = inConsult.length;
  const waiting    = myQueue.filter(p => p.status === "waiting").length;
  const completed  = myQueue.filter(p => p.status === "done").length;
  const skipped    = myQueue.filter(p => p.status === "skipped").length;
  const priority   = myQueue.filter(p => p.priority).length;

  // Build allConsultations from live in-consultation entries
  const allConsultations = inConsult.map(p => ({
    doctor: displayName, room: "Room 1", patient: p.name, queue: p.queue, reason: p.reason,
  }));


  return (
    <div style={{ minHeight: "100vh", background: "#EBF0FA" }}>
      
      



      <div style={{ padding: "0 28px 32px" }}>

        {/* ── Top bar ── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "#EBF0FA", borderBottom: "1px solid #dde8f5",
          padding: "14px 0", marginBottom: 22,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={headerFade}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#1a2540" }}>
              {greeting}, {displayName} 
            </h1>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>{dateStr}</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ background: "white", borderRadius: 12, padding: "9px 16px", border: "1px solid #D8E4F2", textAlign: "right", boxShadow: "0 2px 8px rgba(60,90,140,0.07)" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2540", letterSpacing: 1 }}>{timeStr}</div>
              <div style={{ fontSize: 14, color: "#b0bdd6" }}>Current Time</div>
            </div>

            <div style={{ position: "relative" }}>
              <button onClick={() => setNotifOpen(o => !o)} style={{ background: "white", border: "1px solid #D8E4F2", borderRadius: 12, width: 44, height: 44, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(60,90,140,0.07)", position: "relative" }}>
                <Bell size={18} strokeWidth={2} />
                <div style={{ position: "absolute", top: 9, right: 9, width: 7, height: 7, borderRadius: "50%", background: "#CC0000", border: "2px solid white" }} />
              </button>
              {notifOpen && (
                <div style={{ position: "absolute", right: 0, top: 52, width: 300, background: "white", borderRadius: 14, border: "1px solid #D8E4F2", boxShadow: "0 12px 40px rgba(20,40,90,0.16)", zIndex: 100, animation: "popIn 0.2s ease" }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f3fa", fontSize: 14, fontWeight: 700, color: "#1a2540" }}>
                    Notifications <span style={{ background: "#EBF0FA", color: "#0047AB", borderRadius: 6, padding: "1px 8px", fontSize: 14, marginLeft: 6 }}>3</span>
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid #f0f3fa", display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 16 }}>{n.type === "urgent" ? <AlertTriangle size={16} strokeWidth={2} /> : n.type === "lab" ? <TestTubes size={16} strokeWidth={2} /> : <Info size={16} strokeWidth={2} />}</span>
                      <div>
                        <div style={{ fontSize: 14, color: "#1a2540" }}>{n.text}</div>
                        <div style={{ fontSize: 14, color: "#b0bdd6", marginTop: 2 }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: "10px 16px", textAlign: "center" }}>
                    <button onClick={() => setNotifOpen(false)} style={{ background: "none", border: "none", fontSize: 14, color: "#0047AB", cursor: "pointer", fontWeight: 600 }}>Dismiss all</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 22 }}>
          <StatCard index={0}
            icon={<Stethoscope size={22} strokeWidth={2} />} label="Now Serving"   value={nowServing}
            sub={`${nowServing} doctor${nowServing !== 1 ? "s" : ""} in session`}
            color="#0047AB" bg="#EBF0FA" border="#C0D4F0"
            trend={null}
          />
          <StatCard index={1}
            icon={<ClipboardList size={22} strokeWidth={2} />} label="Waiting"        value={waiting}
            sub={`In queue for ${displayName}`}
            color="#1a2540"
            trend="2 priority" trendUp={null}
          />
          <StatCard index={2}
            icon={<CircleCheckBig size={22} strokeWidth={2} />} label="Completed"      value={completed}
            sub="consultations today"
            color="#2a7d5f" bg="#e8f7f1" border="#c0e4d6"
            trend="+2 vs yesterday" trendUp={true}
          />
          <StatCard index={3}
            icon={<SkipForward size={22} strokeWidth={2} />}  label="Skipped"        value={skipped}
            sub="called, no response"
            color="#CC0000" bg="#fce8ec" border="#f0c8d0"
            trend="down from 4" trendUp={true}
          />
          <StatCard index={4}
            icon={<AlertCircle size={22} strokeWidth={2} />} label="Priority Queue"  value={priority}
            sub="Elderly, PWD, Pregnant"
            color="#8B5FBF" bg="#f0eafb" border="#d8c8f0"
            trend={null}
          />
        </div>

        {/* ── Now Serving Banner ── */}
        <NowServingBanner
          consultations={allConsultations}
          onResume={() => { const p = myQueue.find(q => q.status === 'in-consultation') || myQueue[0]; if (p) handleStartConsult(p); }}
          fade={bannerFade}
          displayName={displayName}
        />

        {/* ── Two-column: Queue + Appointments ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>

          {/* My Queue */}
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #D8E4F2", overflow: "hidden", boxShadow: "0 2px 10px rgba(60,90,140,0.07)", ...queueFade }}>
            <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f3fa" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1a2540" }}>My Queue Today</h2>
                <div style={{ fontSize: 14, color: "#8a9bb0", marginTop: 2 }}>Room 1 · {displayName}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ background: "#EBF0FA", color: "#0047AB", borderRadius: 8, padding: "4px 12px", fontSize: 14, fontWeight: 600 }}>{myQueue.filter(p => p.status === "waiting").length} waiting</div>
                <button onClick={() => onNavigate && onNavigate('dr-queue')} style={{ background: "linear-gradient(135deg,#0047AB,#1565D8)", color: "white", border: "none", borderRadius: 9, padding: "7px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(0,71,171,0.28)" }}>Call Next →</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 170px 80px 110px", padding: "8px 20px", background: "#f7f9fd", borderBottom: "1px solid #f0f3fa" }}>
              {["#", "Patient", "Vitals", "Wait", ""].map(h => (
                <div key={h} style={{ fontSize: 14, fontWeight: 600, color: "#b0bdd6", letterSpacing: 0.6, textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>

            {myQueue.map((p, i) => <QueueRow key={p.id} patient={p} index={i} onStartConsult={handleStartConsult} />)}

            <div style={{ padding: "11px 20px", borderTop: "1px solid #f0f3fa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "#b0bdd6" }}>{myQueue.filter(p => p.status === "waiting").length} patients waiting</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => printQueueReport({ queue: myQueue, stats: { serving: nowServing, waiting, completed, skipped, priority }, staffName: displayName })} style={{ background: "none", border: "1px solid #D8E4F2", borderRadius: 7, padding: "4px 10px", fontSize: 13, color: "#0047AB", cursor: "pointer", fontWeight: 600 }}><Printer size={16} strokeWidth={2} /> PDF</button>
                <button onClick={() => downloadQueueCSV({ queue: myQueue })} style={{ background: "none", border: "1px solid #D8E4F2", borderRadius: 7, padding: "4px 10px", fontSize: 13, color: "#0047AB", cursor: "pointer", fontWeight: 600 }}><Download size={16} strokeWidth={2} /> CSV</button>
                <button onClick={() => onNavigate && onNavigate('dr-queue')} style={{ background: "none", border: "none", fontSize: 14, color: "#0047AB", cursor: "pointer", fontWeight: 600 }}>Full Queue View →</button>
              </div>
            </div>
          </div>

          {/* Appointments + quick stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* This afternoon */}
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #D8E4F2", overflow: "hidden", boxShadow: "0 2px 10px rgba(60,90,140,0.07)", ...apptFade }}>
              <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f0f3fa" }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1a2540" }}>This Afternoon</h2>
                <div style={{ fontSize: 14, color: "#8a9bb0", marginTop: 2 }}>Scheduled appointments</div>
              </div>
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                {appointments.map((a, i) => (
                  <div key={i} style={{
                    padding: "12px 14px", borderRadius: 12,
                    background: a.type === "urgent" ? "#FFF0F0" : "#f7f9fd",
                    border: `1.5px solid ${a.type === "urgent" ? "#F5BCBC" : "#e8edf7"}`,
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{ textAlign: "center", minWidth: 44 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: a.type === "urgent" ? "#CC0000" : "#0047AB" }}>{a.time.split(" ")[0]}</div>
                      <div style={{ fontSize: 14, color: "#b0bdd6" }}>{a.time.split(" ")[1]}</div>
                    </div>
                    <div style={{ width: 1, height: 32, background: a.type === "urgent" ? "#F5BCBC" : "#e8edf7" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#1a2540" }}>{a.name}</span>
                        {a.type === "urgent" && <span style={{ background: "#FDEAEA", color: "#CC0000", borderRadius: 5, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>URGENT</span>}
                      </div>
                      <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 1 }}>{a.age} yrs · {a.reason}</div>
                    </div>
                    <button onClick={() => onNavigate && onNavigate('dr-appts')} style={{ background: "none", border: "1px solid #D8E4F2", borderRadius: 8, padding: "4px 10px", fontSize: 14, color: "#0047AB", cursor: "pointer", fontWeight: 600 }}>View</button>
                  </div>
                ))}
              </div>
              <div style={{ padding: "10px 20px", borderTop: "1px solid #f0f3fa" }}>
                <button onClick={() => onNavigate && onNavigate('dr-appts')} style={{ background: "none", border: "none", fontSize: 14, color: "#0047AB", cursor: "pointer", fontWeight: 600 }}>View Full Schedule →</button>
              </div>
            </div>

            {/* Quick stats pill row */}
            <div style={{ background: "white", borderRadius: 14, border: "1px solid #D8E4F2", padding: "14px 18px", boxShadow: "0 2px 8px rgba(60,90,140,0.06)", ...useFadeIn(500) }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#b0bdd6", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Today's Progress</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Completion rate", value: `${Math.round(completed / (completed + waiting) * 100)}%`, color: "#2a7d5f", pct: Math.round(completed / (completed + waiting) * 100) },
                  { label: "Avg. consult time", value: "18 min", color: "#0047AB", pct: 60 },
                  { label: "SMS delivery", value: "96%", color: "#8B5FBF", pct: 96 },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 14, color: "#4a5d75" }}>{s.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</span>
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
