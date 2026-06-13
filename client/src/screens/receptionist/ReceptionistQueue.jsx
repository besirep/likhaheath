import { useState, useEffect, useCallback } from "react";
import { queueApi } from "../../lib/api/queue.js";
import { patientsApi } from "../../lib/api/patients.js";
import { smsApi } from "../../lib/api/sms.js";
import { dashboardApi } from "../../lib/api/dashboard.js";
import { staffApi } from "../../lib/api/staff.js";
import { Building2, LayoutDashboard, ClipboardList, UserPlus, FolderOpen, CalendarDays, MessageSquare, BarChart3, Bell, Stethoscope, Clock, CheckCircle2, SkipForward, AlertCircle, Megaphone, Smartphone, UserRound, RefreshCw, CheckCheck, AlertTriangle, Heart, Thermometer, Activity, Wind, X, Check, Ruler, Scale } from "lucide-react";

const statusConfig = {
  "in-consultation": { label: "In Consultation", color: "#2a9d8f", bg: "#e8f7f5", dot: "#2a9d8f", pulse: true  },
  "vitals-done":     { label: "Vitals Ready",    color: "#0047AB", bg: "#E5EDF8", dot: "#0047AB", pulse: false },
  "waiting":         { label: "Waiting",          color: "#e09040", bg: "#fdf3e8", dot: "#e09040", pulse: false },
  "skipped":         { label: "Skipped",          color: "#c05080", bg: "#fce8f0", dot: "#c05080", pulse: false },
  "done":            { label: "Done",             color: "#9aabc0", bg: "#f0f4fa", dot: "#9aabc0", pulse: false },
};

const priorityConfig = {
  elderly:   { label: "Senior Citizen", Icon: UserRound, color: "#8B5FBF", bg: "#f0eafb", stripe: "#8B5FBF" },
  pregnant:  { label: "Pregnant",       Icon: UserRound, color: "#d4709a", bg: "#fce8f3", stripe: "#d4709a" },
  pwd:       { label: "PWD",            Icon: UserRound, color: "#0047AB", bg: "#EBF0FA", stripe: "#0047AB" },
  pediatric: { label: "Pedia (0–5)",    Icon: UserRound, color: "#e09040", bg: "#fdf3e8", stripe: "#e09040" },
};

// Vitals flags (for display in drawer)
const bpFlag   = bp => { if (!bp) return "normal"; const s = Number(bp.split("/")[0]); return s >= 140 ? "high" : s < 90 ? "low" : "normal"; };
const tempFlag = v  => { if (!v)  return "normal"; const n = Number(v); return n >= 37.8 ? "high" : n < 36 ? "low" : "normal"; };
const spo2Flag = v  => !v ? "normal" : Number(v) < 95 ? "low" : "normal";
const flagColor = { high: "#CC0000", low: "#c04080", normal: "#2a9d8f" };
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


// ── Vitals Entry Modal ────────────────────────────────────────────────────────
function VitalsModal({ patient, onClose, onSave }) {
  const [vitals, setVitals] = useState({ bp: "", temp: "", hr: "", spo2: "", weight: "", height: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState(null);
  if (!patient) return null;

  const fields = [
    { k: "bp",     label: "Blood Pressure", unit: "mmHg", type: "text",   placeholder: "120/80",  Icon: Heart },
    { k: "temp",   label: "Temperature",    unit: "°C",   type: "number", placeholder: "36.5",   Icon: Thermometer },
    { k: "hr",     label: "Heart Rate",     unit: "bpm",  type: "number", placeholder: "80",     Icon: Activity },
    { k: "spo2",   label: "SpO₂",           unit: "%",    type: "number", placeholder: "98",     Icon: Wind },
    { k: "weight", label: "Weight",         unit: "kg",   type: "number", placeholder: "65",     Icon: Scale },
    { k: "height", label: "Height",         unit: "cm",   type: "number", placeholder: "165",    Icon: Ruler },
  ];

  const wt = parseFloat(vitals.weight), ht = parseFloat(vitals.height) / 100;
  const bmi = (wt && ht) ? (wt / (ht * ht)).toFixed(1) : null;

  const handleSave = async () => {
    if (!vitals.bp && !vitals.temp && !vitals.hr && !vitals.spo2 && !vitals.weight && !vitals.height) {
      setErr("Please enter at least one vital sign.");
      return;
    }
    setSaving(true); setErr(null);
    try {
      await onSave(patient.queueDbId, {
        blood_pressure: vitals.bp    || null,
        temperature:    vitals.temp  ? Number(vitals.temp)   : null,
        heart_rate:     vitals.hr    ? Number(vitals.hr)     : null,
        spo2:           vitals.spo2  ? Number(vitals.spo2)   : null,
        weight_kg:      vitals.weight? Number(vitals.weight) : null,
        height_cm:      vitals.height? Number(vitals.height) : null,
      });
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: 480, padding: "28px 32px", boxShadow: "0 24px 64px rgba(20,40,70,0.22)", animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <style>{`@keyframes popIn { from{transform:scale(0.92);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1e2d40" }}>Record Vitals</div>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>{patient.name} · {patient.queue}</div>
          </div>
          <button onClick={onClose} style={{ background: "#f0f4f8", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {fields.map(f => (
            <div key={f.k}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                <f.Icon size={13} strokeWidth={2} /> {f.label}
              </label>
              <div style={{ position: "relative" }}>
                <input value={vitals[f.k]} onChange={e => setVitals(v => ({ ...v, [f.k]: e.target.value }))} type={f.type} placeholder={f.placeholder} step="0.1"
                  style={{ width: "100%", padding: "9px 40px 9px 12px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, color: "#1e2d40", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#9aabc0" }}>{f.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {bmi && (
          <div style={{ background: "#f0faf8", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#5a8f80" }}>BMI (auto-calculated)</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#2a9d8f" }}>{bmi}</span>
          </div>
        )}

        {err && <div style={{ background: "#fff0ee", border: "1px solid #f5c6c0", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: "#c0392b", marginBottom: 12 }}>Error: {err}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: "#f0f4f8", color: "#7a8fb0", border: "none", borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, background: saving ? "#d0dbe8" : "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : "0 4px 14px rgba(42,157,143,0.3)" }}>
            {saving ? "Saving..." : "Save Vitals & Mark Ready"}
          </button>
        </div>
      </div>
    </div>
  );
}


function Toast({ msg, onDone }) {
  useState(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); });
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e2d40", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 14, zIndex: 300, boxShadow: "0 8px 24px rgba(30,45,64,0.28)", animation: "toastIn 0.3s ease" }}>
      {msg}
    </div>
  );
}



// ── Patient Detail Drawer ─────────────────────────────────────────────────────
function PatientDrawer({ patient, onClose, onAction, onNavigate, availableDoctors, onAssignDoctor }) {
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
                {pc && <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 14 }}><pc.Icon size={14} color="white" /></span>}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>{patient.name}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{patient.age} yrs · {patient.gender} · {patient.queue}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: 14, flexWrap: "wrap" }}>
            <span style={{ background: sc.bg, color: sc.color, borderRadius: 7, padding: "3px 10px", fontSize: 14, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block", marginRight: 5, animation: sc.pulse ? "pulse 1.4s infinite" : "none" }} />
              {sc.label}
            </span>
            {pc && <span style={{ background: pc.bg, color: pc.color, borderRadius: 7, padding: "3px 10px", fontSize: 14, fontWeight: 600 }}><pc.Icon size={14} /> {pc.label}</span>}
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
              { label: "Contact",          value: patient.contact },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #eef1f8" }}>
                <span style={{ fontSize: 14, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.4 }}>{r.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40", textAlign: "right", maxWidth: 200 }}>{r.value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #eef1f8", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.4 }}>Assigned Doctor</span>
              <div style={{ textAlign: "right" }}>
                {availableDoctors?.length > 0 ? (
                  <select 
                    value={availableDoctors.find(d => `${d.first_name} ${d.last_name}` === patient.doctor)?.id || ""}
                    onChange={e => onAssignDoctor(patient, e.target.value ? Number(e.target.value) : null)}
                    style={{ 
                      padding: "6px 28px 6px 12px", 
                      borderRadius: 8, 
                      border: "1.5px solid #e0e7ef", 
                      fontSize: 13, 
                      color: "#1e2d40", 
                      outline: "none", 
                      background: "white", 
                      fontWeight: 600, 
                      cursor: "pointer",
                      appearance: "none",
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a9bb0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 10px center",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={e => e.target.style.borderColor = "#0047AB"}
                    onBlur={e => e.target.style.borderColor = "#e0e7ef"}
                  >
                    <option value="">Unassigned</option>
                    {availableDoctors.map(d => <option key={d.id} value={d.id}>Dr. {d.last_name}</option>)}
                  </select>
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40", maxWidth: 200 }}>{patient.doctor || "Not yet assigned"}</span>
                )}
              </div>
            </div>
          </div>

          {/* Vitals */}
          {patient.vitals ? (
            <div>
              <div style={{ fontSize: 14, color: "#8a9bb0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Vitals Recorded</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Blood Pressure", value: `${patient.vitals.bp} mmHg`, flag: bpFlag(patient.vitals.bp),   Icon: Heart },
                  { label: "Temperature",    value: `${patient.vitals.temp} °C`,  flag: tempFlag(patient.vitals.temp), Icon: Thermometer },
                  { label: "Heart Rate",     value: `${patient.vitals.hr} bpm`,   flag: "normal",                     Icon: Activity },
                  { label: "SpO₂",           value: `${patient.vitals.spo2}%`,    flag: spo2Flag(patient.vitals.spo2), Icon: Wind },
                ].map(f => (
                  <div key={f.label} style={{ background: flagBg[f.flag], borderRadius: 10, padding: "10px 12px", border: `1px solid ${f.flag !== "normal" ? flagColor[f.flag] + "30" : "#D8E4F2"}` }}>
                    <div style={{ fontSize: 14, marginBottom: 3 }}><f.Icon size={16} color={flagColor[f.flag]} /></div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: flagColor[f.flag] }}>{f.value}</div>
                    <div style={{ fontSize: 14, color: "#8a9bb0", marginTop: 1, textTransform: "uppercase" }}>{f.label}</div>
                    {f.flag !== "normal" && <div style={{ fontSize: 11, color: flagColor[f.flag], fontWeight: 700, marginTop: 2 }}><AlertTriangle size={16} strokeWidth={2} /> {f.flag}</div>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: "#fdf3e8", borderRadius: 13, padding: "14px 16px", border: "1px solid #f0d8b8", textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}><Clock size={16} strokeWidth={2} /></div>
              <div style={{ fontSize: 14, color: "#c07030", fontWeight: 600 }}>Vitals not yet recorded</div>
              <div style={{ fontSize: 14, color: "#b0893a", marginTop: 3 }}>Nurse should record before consultation</div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
            {patient.status === "waiting" && (
            <>
              {/* Record Vitals — primary action for triage nurse */}
              <button onClick={() => onAction("vitals", patient)} style={{ width: "100%", background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
                <Activity size={16} strokeWidth={2} /> Record Vitals →
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onAction("skip", patient)} style={{ flex: 1, background: "#fce8f0", color: "#c05080", border: "1px solid #f0c0d8", borderRadius: 10, padding: "9px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><SkipForward size={14} /> Skip</button>
                <button onClick={() => onAction("call", patient)} style={{ flex: 1, background: "#EBF0FA", color: "#0047AB", border: "1px solid #B0C8E8", borderRadius: 10, padding: "9px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}><Megaphone size={14} strokeWidth={2.5} /> Call Directly</button>
              </div>
            </>
          )}
          {patient.status === "vitals-done" && (
            <div style={{ background: "#e8f7f5", borderRadius: 11, padding: "13px", textAlign: "center", color: "#2a9d8f", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <CheckCircle2 size={16} strokeWidth={2} /> Vitals recorded — ready for doctor
            </div>
          )}
            {patient.status === "skipped" && (
              <button onClick={() => onAction("requeue", patient)} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                ↺ Re-queue Patient
              </button>
            )}
            {patient.status === "in-consultation" && (
              <button onClick={() => onAction("done", patient)} style={{ background: "#e8f7f5", color: "#2a9d8f", border: "1.5px solid #b8e4de", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                <Check size={14} strokeWidth={2} /> Mark as Done
              </button>
            )}
            {patient.status === "done" && (
              <div style={{ background: "#e8f7f5", borderRadius: 11, padding: "13px", textAlign: "center", color: "#2a9d8f", fontSize: 14, fontWeight: 600 }}><Check size={14} strokeWidth={2.5} /> Consultation complete</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onAction("sms", patient)} style={{ flex: 1, background: "white", color: "#4a5d75", border: "1px solid #D8E4F2", borderRadius: 10, padding: "9px", fontSize: 14, cursor: "pointer" }}><Smartphone size={16} strokeWidth={2} /> Send SMS</button>
              <button onClick={() => { onClose(); onNavigate && onNavigate('records'); }} style={{ flex: 1, background: "white", color: "#4a5d75", border: "1px solid #D8E4F2", borderRadius: 10, padding: "9px", fontSize: 14, cursor: "pointer" }}><FolderOpen size={16} strokeWidth={2} /> View Record</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Queue Card ────────────────────────────────────────────────────────────────
function QueueCard({ patient, index, onSelect, isSelected }) {
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
          {pc && <div style={{ position: "absolute", bottom: -2, right: -2, fontSize: 14 }}><pc.Icon size={14} color={pc.color} /></div>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontFamily: "'Afacad', sans-serif", fontWeight: 700, fontSize: 15, color: isSelected ? "#2a9d8f" : "#1e2d40" }}>{patient.queue}</span>
                {pc && <span style={{ background: pc.bg, color: pc.color, borderRadius: 5, padding: "1px 7px", fontSize: 14, fontWeight: 700 }}><pc.Icon size={12} /> {pc.label}</span>}
                {patient.status === "skipped" && <span style={{ background: "#fce8f0", color: "#c05080", borderRadius: 5, padding: "1px 7px", fontSize: 14, fontWeight: 700 }}>SKIPPED</span>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40", marginTop: 1 }}>{patient.name}</div>
              <div style={{ fontSize: 14, color: "#7a8fb0" }}>{patient.age} yrs · {patient.gender} · {patient.reason}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot, animation: sc.pulse ? "pulse 1.4s infinite" : "none" }} />
                <span style={{ fontSize: 14, color: sc.color, fontWeight: 500 }}>{sc.label}</span>
              </div>
              <div style={{ fontSize: 14, color: "#b0beca", marginTop: 3 }}>Arrived {patient.arrived}</div>
              {patient.doctor && <div style={{ fontSize: 14, color: "#8a9bb0", marginTop: 2 }}>{patient.doctor}</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReceptionistQueue({ onNavigate }) {
  const [queue, setQueue]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filter, setFilter]       = useState("active");
  const [selected, setSelected]   = useState(null);
  const [vitalsPatient, setVitalsPatient] = useState(null);
  const [toast, setToast]         = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [summaryStats, setSummaryStats] = useState({ avg_wait: 0, sms_sent: 0 });
  const [availableDoctors, setAvailableDoctors] = useState([]);

  const showToast = msg => setToast(msg);

  // ── Fetch queue from API ───────────────────────────────────────────────────
  const fetchQueue = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await queueApi.getToday();
      setQueue(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + 30-second polling
  useEffect(() => {
    fetchQueue();
    dashboardApi.getStats('today').then(s => setSummaryStats({ avg_wait: s.avg_wait ?? 0, sms_sent: s.sms_sent ?? 0 })).catch(() => {});
    staffApi.getAll().then(res => setAvailableDoctors(res.filter(s => s.position?.toLowerCase().includes('doctor') || s.position?.toLowerCase() === 'physician'))).catch(() => {});
    const interval = setInterval(() => { fetchQueue(true); dashboardApi.getStats('today').then(s => setSummaryStats({ avg_wait: s.avg_wait ?? 0, sms_sent: s.sms_sent ?? 0 })).catch(() => {}); }, 30_000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // ── Action handlers (optimistic update + API sync) ─────────────────────────
  const handleAction = async (action, patient) => {
    const statusMap = {
      call:    "in-consultation",
      skip:    "skipped",
      requeue: "waiting",
      done:    "done",
    };

    if (action === "vitals") {
      setVitalsPatient(patient);
      setSelected(null);
      return;
    }

    if (action === "sms") {
      try {
        await smsApi.send({
          patient_id: patient.patientId,
          appointment_id: patient.appointmentId,
          message: `LikhaHealth: You are next in queue (${patient.queue}). Please proceed to the consultation room.`
        });
        showToast(`SMS sent to ${patient.name}`);
      } catch (err) {
        showToast(`SMS failed: ${err.message}`);
      }
      return;
    }

    const newStatus = statusMap[action];
    if (!newStatus) return;

    // Optimistic UI update
    setQueue(q => q.map(p => p.id === patient.id ? { ...p, status: newStatus } : p));
    if (selected?.id === patient.id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);

    const toastMsg = {
      call:    `${patient.name} called — ${patient.queue}`,
      skip:    `${patient.name} marked as skipped`,
      requeue: `${patient.name} re-queued`,
      done:    `${patient.name} marked as done`,
    }[action];
    showToast(toastMsg);
    setSelected(null);

    // Sync to backend (silent — don't block UI)
    try {
      await queueApi.updateStatus(patient.queueDbId, newStatus);
    } catch (err) {
      // Revert optimistic update on failure
      setQueue(q => q.map(p => p.id === patient.id ? { ...p, status: patient.status } : p));
      showToast(`Failed to save — please try again`);
      console.error("[Queue] status update failed:", err.message);
    }
  };

  const handleAssignDoctor = async (patient, doctorId) => {
    const doc = availableDoctors.find(d => d.id === doctorId);
    const doctorName = doc ? `${doc.first_name} ${doc.last_name}` : null;
    try {
      await queueApi.assignDoctor(patient.queueDbId, doctorId);
      setQueue(q => q.map(p => p.id === patient.id ? { ...p, doctor: doctorName } : p));
      if (selected?.id === patient.id) setSelected(prev => prev ? { ...prev, doctor: doctorName } : null);
      showToast(`Doctor updated successfully`);
    } catch (err) {
      showToast(`Doctor assignment failed: ${err.message}`);
    }
  };

  const handleSaveVitals = async (queueDbId, vitalsPayload) => {
    await queueApi.recordVitals(queueDbId, vitalsPayload);
    showToast(`Vitals recorded — patient marked ready for doctor`);
    fetchQueue(true);
  };

  const callNext = () => {
    const next = queue.find(p => p.status === "waiting");
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

  // Auto-rearrange: active statuses at top, done/skipped at bottom, queue_number order within each group
  const statusOrder = { "in-consultation": 0, "vitals-done": 1, "waiting": 2, "skipped": 3, "done": 4 };
  const sorted = [...filtered].sort((a, b) => {
    const orderA = statusOrder[a.status] ?? 99;
    const orderB = statusOrder[b.status] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return (a.queue_number || 0) - (b.queue_number || 0);
  });

  // Derive doctor list from live queue data
  const doctors = [...new Set(queue.map(p => p.doctor).filter(Boolean))];

  return (
    <div style={{ height: "100vh", background: "#f4f7fb", display: "flex", overflow: "hidden" }}>

      {/* Error banner */}
      {error && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "#fde8e0", color: "#CC0000", border: "1px solid #f5c0b0", borderRadius: 10, padding: "10px 20px", zIndex: 400, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 16px rgba(204,0,0,0.1)" }}>
          <AlertTriangle size={16} strokeWidth={2} /> {error} — <button onClick={() => fetchQueue()} style={{ background: "none", border: "none", color: "#CC0000", textDecoration: "underline", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>Retry</button>
        </div>
      )}


      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      <PatientDrawer patient={selected} onClose={() => setSelected(null)} onAction={handleAction} onNavigate={onNavigate} availableDoctors={availableDoctors} onAssignDoctor={handleAssignDoctor} />
      <VitalsModal patient={vitalsPatient} onClose={() => setVitalsPatient(null)} onSave={handleSaveVitals} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ background: "#f4f7fb", borderBottom: "1px solid #dde8e5", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e2d40" }}>Queue Management</h1>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>
              {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · {loading ? "Loading…" : `${queue.length} patient${queue.length !== 1 ? "s" : ""} today`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setNotifOpen(o => !o)} style={{ background: "white", border: "1px solid #dde8e5", borderRadius: 10, width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <Bell size={18} strokeWidth={2} color="#4a5d75" />
                {(skipped > 0 || priority > 0) && <div style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: "#c05080", border: "1.5px solid #f4f7fb" }} />}
              </button>
              {notifOpen && (
                <div style={{ position: "absolute", right: 0, top: 48, width: 280, background: "white", borderRadius: 14, border: "1px solid #dde8e5", boxShadow: "0 12px 40px rgba(30,45,64,0.14)", zIndex: 100 }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f3f7", fontSize: 14, fontWeight: 700, color: "#1e2d40" }}>Alerts</div>
                  {skipped > 0  && <div style={{ padding: "10px 16px", borderBottom: "1px solid #f7f9fd", display: "flex", alignItems: "center", gap: 10 }}><SkipForward size={16} strokeWidth={2} color="#c05080" /><div style={{ fontSize: 14, color: "#1e2d40" }}>{skipped} patient{skipped > 1 ? "s" : ""} skipped</div></div>}
                  {priority > 0 && <div style={{ padding: "10px 16px", borderBottom: "1px solid #f7f9fd", display: "flex", alignItems: "center", gap: 10 }}><AlertCircle size={16} strokeWidth={2} color="#8B5FBF" /><div style={{ fontSize: 14, color: "#1e2d40" }}>{priority} priority patient{priority > 1 ? "s" : ""} waiting</div></div>}
                  {vitalsDone > 0 && <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}><CheckCircle2 size={16} strokeWidth={2} color="#0047AB" /><div style={{ fontSize: 14, color: "#1e2d40" }}>{vitalsDone} patient{vitalsDone > 1 ? "s" : ""} vitals ready</div></div>}
                </div>
              )}
            </div>
            <button onClick={() => onNavigate && onNavigate("register")} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.28)", display: "flex", alignItems: "center", gap: 6 }}>
              <UserPlus size={16} strokeWidth={2} /> Register Patient
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 300px", overflow: "hidden" }}>

          {/* Queue list */}
          <div style={{ overflowY: "auto", padding: "18px 22px" }}>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 18 }}>
              {[
                { label: "In Consult",  value: inConsult,  color: "#2a9d8f", bg: "#e8f7f5", Icon: Stethoscope },
                { label: "Waiting",     value: waiting,    color: "#e09040", bg: "#fdf3e8", Icon: Clock },
                { label: "Vitals Ready",value: vitalsDone, color: "#0047AB", bg: "#E5EDF8", Icon: CheckCircle2 },
                { label: "Skipped",     value: skipped,    color: "#c05080", bg: "#fce8f0", Icon: SkipForward },
                { label: "Priority",    value: priority,   color: "#8B5FBF", bg: "#f0eafb", Icon: AlertCircle },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 13, padding: "13px 14px", border: `1.5px solid ${s.color}20` }}>
                  <div style={{ marginBottom: 3, display: "flex", alignItems: "center" }}><s.Icon size={18} strokeWidth={2} color={s.color} /></div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 14, color: s.color, opacity: 0.8, marginTop: 3, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Active consultations banner */}
            {activeConsultPatients.length > 0 && (
              <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", borderRadius: 14, padding: "13px 18px", marginBottom: 16, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}><Stethoscope size={14} strokeWidth={2} color="rgba(255,255,255,0.6)" /> {activeConsultPatients.length} In Consultation</div>
                {activeConsultPatients.map(p => (
                  <div key={p.id} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 9, padding: "5px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#52c4b8", animation: "pulse 1.4s infinite" }} />
                    <span style={{ fontFamily: "'Afacad', sans-serif", fontWeight: 700, fontSize: 14, color: "white" }}>{p.queue}</span>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{p.name}</span>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.45)" }}>→ {p.doctor}</span>
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
                    borderRadius: 9, padding: "7px 14px", fontSize: 14,
                    fontWeight: filter === f.key ? 600 : 400, cursor: "pointer",
                    fontFamily: "'Afacad', sans-serif", transition: "all 0.18s",
                  }}>
                    {f.label}
                    {f.count > 0 && <span style={{ marginLeft: 6, background: f.key === "priority" ? "#8B5FBF" : "#c05080", color: "white", borderRadius: 10, padding: "0 6px", fontSize: 14, fontWeight: 700 }}>{f.count}</span>}
                  </button>
                ))}
              </div>
              {(waiting + vitalsDone) > 0 && (
                <button onClick={callNext} style={{ background: "#2a9d8f", color: "white", border: "none", borderRadius: 9, padding: "8px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(42,157,143,0.3)" }}>
                  <Megaphone size={14} strokeWidth={2} /> Call Next ({waiting + vitalsDone}) →
                </button>
              )}
            </div>

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sorted.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#8a9bb0" }}>
                  <CheckCheck size={32} strokeWidth={1.5} color="#8a9bb0" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1e2d40" }}>All clear!</div>
                  <div style={{ fontSize: 14, marginTop: 4 }}>No patients in this category.</div>
                </div>
              ) : sorted.map((p, i) => (
                <QueueCard key={p.id} patient={p} index={i} onSelect={setSelected} isSelected={selected?.id === p.id} />
              ))}
            </div>
          </div>

          {/* Right summary panel */}
          <div style={{ background: "white", borderLeft: "1px solid #dde8e5", overflowY: "auto", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Doctor status */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>Doctor Status</div>
              {doctors.map(doc => {
                const docPatient = queue.find(p => p.doctor === doc && p.status === "in-consultation");
                return (
                  <div key={doc} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f0f3f7" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: docPatient ? "#2a9d8f" : "#d0dbe8", animation: docPatient ? "pulse 1.4s infinite" : "none", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{doc}</div>
                      {docPatient ? <div style={{ fontSize: 14, color: "#2a9d8f" }}>Seeing {docPatient.queue} · {docPatient.name}</div> : <div style={{ fontSize: 14, color: "#b0beca" }}>Available</div>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: docPatient ? "#2a9d8f" : "#b0beca" }}>{docPatient ? "Busy" : "Free"}</div>
                  </div>
                );
              })}
            </div>

            {/* Priority waiting */}
            {queue.filter(p => p.priority && ["waiting","vitals-done"].includes(p.status)).length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><AlertCircle size={14} strokeWidth={2} /> Priority Waiting</div>
                {queue.filter(p => p.priority && ["waiting","vitals-done"].includes(p.status)).map(p => {
                  const pc = priorityConfig[p.priority];
                  return (
                    <div key={p.id} onClick={() => setSelected(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: pc.bg, border: `1.5px solid ${pc.color}30`, marginBottom: 8, cursor: "pointer" }}>
                      <span style={{ display: "flex", alignItems: "center" }}><pc.Icon size={18} strokeWidth={2} color={pc.color} /></span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{p.name}</div>
                        <div style={{ fontSize: 14, color: pc.color, fontWeight: 500 }}>{pc.label} · {p.queue}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Skipped */}
            {queue.filter(p => p.status === "skipped").length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><SkipForward size={14} strokeWidth={2} /> Skipped</div>
                {queue.filter(p => p.status === "skipped").map(p => (
                  <div key={p.id} onClick={() => setSelected(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "#fce8f0", border: "1px solid #f0c0d830", marginBottom: 8, cursor: "pointer" }}>
                    <Avatar name={p.name} size={30} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{p.name}</div>
                      <div style={{ fontSize: 14, color: "#c05080" }}>{p.queue} · No response</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleAction("requeue", p); }} style={{ background: "#c05080", color: "white", border: "none", borderRadius: 7, padding: "4px 10px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center" }}><RefreshCw size={14} strokeWidth={2.5} /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div style={{ background: "#f7f9fd", borderRadius: 13, padding: "14px 16px", marginTop: "auto" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Today's Summary</div>
              {[
                { label: "Total Registered", value: queue.length },
                { label: "Consultations Done", value: done },
                { label: "Avg. Wait Time",   value: `${summaryStats.avg_wait}m` },
                { label: "SMS Sent",         value: summaryStats.sms_sent },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #edf1f7" }}>
                  <span style={{ fontSize: 14, color: "#8a9bb0" }}>{r.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1e2d40" }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
