import { useState, useEffect, useCallback } from "react";
import { Search, Plus, CalendarDays, Heart, Thermometer, Wind, Scale, User, AlertTriangle, Phone, FileText, Activity, X, Ruler, Droplets, MapPin, TestTubes, Printer, Pencil, Building2, FolderOpen, ClipboardList, Stethoscope } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { patientsApi } from "../../lib/api/patients.js";

// ── Static helpers ────────────────────────────────────────────────────────────
const statusStyle = {
  active:   { color: "#2a9d8f", bg: "#e8f7f5", label: "Active"   },
  urgent:   { color: "#CC0000", bg: "#fde8e0", label: "Urgent"   },
  inactive: { color: "#9aabc0", bg: "#f0f4fa", label: "Inactive" },
};

const bpFlag   = bp => { if (!bp) return "normal"; const s = Number(bp.split("/")[0]); return s >= 140 ? "high" : s < 90 ? "low" : "normal"; };
const tempFlag = v  => { if (!v)  return "normal"; const n = Number(v); return n >= 37.8 ? "high" : n < 36 ? "low" : "normal"; };
const spo2Flag = v  => !v ? "normal" : Number(v) < 95 ? "low" : "normal";
const flagColor = { high: "#CC0000", low: "#c04080", normal: "#0047AB" };
const flagBg    = { high: "#fdeee8", low: "#fce8f0", normal: "#EBF0FA" };

function Avatar({ name, size = 36 }) {
  if (!name) return <div style={{ width: size, height: size, borderRadius: "50%", background: "#ddd", flexShrink: 0 }} />;
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const hue = (name.charCodeAt(0) * 41 + (name.charCodeAt(1) || 0) * 19) % 360;
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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #CCDAF0", borderRadius: 10, padding: "8px 12px", boxShadow: "0 4px 16px rgba(20,40,90,0.1)", fontSize: 14 }}>
      <div style={{ color: "#9aabc0", marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

// ── Normalize API data into the shape the UI expects ──────────────────────────
function normalizePatient(raw) {
  const dob = raw.date_of_birth ? new Date(raw.date_of_birth) : null;
  const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
  const dobStr = dob ? dob.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—";
  const gender = raw.sex === "Female" ? "F" : raw.sex === "Male" ? "M" : "?";
  const phone = raw.primary_contact || (raw.contacts?.find(c => c.type === "phone")?.value) || "—";
  const addr = raw.barangay ? `${raw.barangay}, ${raw.municipality || ""}` : (raw.street ? `${raw.street}, ${raw.barangay || ""}` : "—");

  return {
    id:         raw.id,
    name:       `${raw.last_name}, ${[raw.first_name, raw.middle_name].filter(Boolean).join(' ')}${raw.suffix ? ` ${raw.suffix}` : ''}`,
    age,
    gender,
    dob:        dobStr,
    contact:    phone,
    address:    addr,
    bloodType:  raw.blood_type || "—",
    allergies:  [],  // Not stored in current schema
    status:     "active",
    conditions: [],  // Will be derived from medical records
    lastVisit:  "—",
    totalVisits: 0,
    visits:     [],
    vitalsHistory: [],
  };
}

function normalizeVisit(row) {
  const date = row.scheduled_date ? new Date(row.scheduled_date) : null;
  const dateStr = date ? date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—";
  const timeStr = date ? date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) : "—";
  const queueStr = row.queue_number ? `Q-${String(row.queue_number).padStart(3, "0")}` : "—";

  return {
    id:        row.appointment_id || row.record_id || Math.random(),
    date:      dateStr,
    time:      timeStr,
    queue:     queueStr,
    duration:  "—",
    reason:    row.notes || "General consultation",
    diagnosis: row.diagnosis || "—",
    notes:     row.treatment || "",
    plan:      row.treatment || "",
    vitals:    row.blood_pressure ? {
      bp: row.blood_pressure, temp: String(row.temperature || ""), hr: String(row.heart_rate || ""),
      spo2: String(row.spo2 || ""), weight: String(row.weight_kg || ""), height: String(row.height_cm || ""),
    } : null,
    labs:      [],
    followUp:  null,
    doctor:    row.doctor_name || null,
    recordDate: row.record_date,
  };
}

// ── VitalCard ─────────────────────────────────────────────────────────────────
function VitalCard({ icon, label, value, unit, flag }) {
  const fc = flag === "high" ? "#CC0000" : flag === "low" ? "#c04080" : "#2a9d8f";
  const bg = flag === "high" ? "#fdeee8" : flag === "low" ? "#fce8f0" : "#e8f7f5";
  return (
    <div style={{ background: "white", borderRadius: 12, padding: "12px 14px", border: `1px solid ${flag ? fc + "40" : "#D8E4F2"}`, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ color: fc }}>{icon}</span>
        <span style={{ fontSize: 12, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: fc }}>{value || "—"}</div>
      <div style={{ fontSize: 12, color: "#9aabc0" }}>{unit}</div>
    </div>
  );
}

// ── Visit Detail Drawer ───────────────────────────────────────────────────────
function VisitDrawer({ visit, patient, onClose }) {
  if (!visit) return null;
  const v = visit.vitals;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.22)", zIndex: 100 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 520, background: "white", boxShadow: "-8px 0 40px rgba(20,40,90,0.18)", zIndex: 101, overflowY: "auto", animation: "slideInRight 0.3s ease" }}>
        <style>{`@keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>
        <div style={{ padding: "22px 24px", borderBottom: "1px solid #f0f3fa", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2540" }}>{visit.diagnosis}</div>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 3 }}>{visit.date} · {visit.queue}</div>
            {visit.doctor && <div style={{ fontSize: 13, color: "#9aabc0", marginTop: 2 }}>Dr. {visit.doctor}</div>}
          </div>
          <button onClick={onClose} style={{ background: "#f0f3fa", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {v && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Vitals</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                <VitalCard icon={<Heart size={14} strokeWidth={2} />} label="BP" value={v.bp} unit="mmHg" flag={bpFlag(v.bp)} />
                <VitalCard icon={<Thermometer size={14} strokeWidth={2} />} label="Temp" value={v.temp ? `${v.temp}°C` : "—"} unit="°C" flag={tempFlag(v.temp)} />
                <VitalCard icon={<Activity size={14} strokeWidth={2} />} label="HR" value={v.hr} unit="bpm" />
                {v.spo2 && <VitalCard icon={<Wind size={14} strokeWidth={2} />} label="SpO₂" value={`${v.spo2}%`} unit="%" flag={spo2Flag(v.spo2)} />}
                {v.weight && <VitalCard icon={<Scale size={14} strokeWidth={2} />} label="Weight" value={v.weight} unit="kg" />}
                {v.height && <VitalCard icon={<Ruler size={14} strokeWidth={2} />} label="Height" value={v.height} unit="cm" />}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Chief Complaint</div>
            <div style={{ fontSize: 14, color: "#1a2540", lineHeight: 1.7 }}>{visit.reason}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Assessment / Diagnosis</div>
            <div style={{ fontSize: 14, color: "#1a2540", fontWeight: 600 }}>{visit.diagnosis}</div>
          </div>
          {visit.notes && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Doctor's Notes / Treatment</div>
              <div style={{ fontSize: 14, color: "#1a2540", lineHeight: 1.7, background: "#f7f9fd", borderRadius: 12, padding: "14px 16px" }}>{visit.notes}</div>
            </div>
          )}
          {visit.plan && visit.plan !== visit.notes && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Treatment Plan</div>
              <div style={{ fontSize: 14, color: "#1a2540", lineHeight: 1.7 }}>{visit.plan}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Profile Panel ─────────────────────────────────────────────────────────────
function ProfilePanel({ patient, visits, visitsLoading, onVisitSelect, selectedVisitId }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!patient) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9aabc0", padding: 40, textAlign: "center" }}>
      <div><FolderOpen size={40} strokeWidth={1.5} /><div style={{ marginTop: 12, fontSize: 16 }}>Select a patient to view records</div></div>
    </div>
  );

  const tabs = [
    { key: "overview", label: "Overview", icon: <User size={14} strokeWidth={2} /> },
    { key: "history",  label: "History",  icon: <ClipboardList size={14} strokeWidth={2} /> },
  ];

  // Build vitals history from visits for charting
  const vitalsHistory = visits
    .filter(v => v.vitals?.bp)
    .slice(0, 10)
    .reverse()
    .map(v => {
      const systolic = v.vitals.bp ? Number(v.vitals.bp.split("/")[0]) : null;
      return {
        date: v.date?.split(",")[0] || "—",
        bp: systolic,
        hr: v.vitals.hr ? Number(v.vitals.hr) : null,
        weight: v.vitals.weight ? Number(v.vitals.weight) : null,
      };
    });

  // Derive conditions from diagnoses
  const conditions = [...new Set(visits.filter(v => v.diagnosis && v.diagnosis !== "—").map(v => v.diagnosis))].slice(0, 5);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "22px 26px", background: "#f7f9fd" }}>
      {/* Patient header */}
      <div style={{ display: "flex", gap: 16, marginBottom: 22 }}>
        <Avatar name={patient.name} size={64} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#1a2540" }}>{patient.name}</div>
          <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 3 }}>{patient.age} yrs · {patient.gender} · Blood Type: {patient.bloodType}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ background: "#EBF0FA", color: "#0047AB", borderRadius: 7, padding: "3px 10px", fontSize: 13, fontWeight: 600 }}>
              <Phone size={12} strokeWidth={2} /> {patient.contact}
            </span>
            <span style={{ background: "#f0f3fa", color: "#7a8fb0", borderRadius: 7, padding: "3px 10px", fontSize: 13 }}>
              <MapPin size={12} strokeWidth={2} /> {patient.address}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, background: "#e8edf7", borderRadius: 10, padding: 3 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
            background: activeTab === t.key ? "white" : "transparent",
            color: activeTab === t.key ? "#0047AB" : "#7a8fb0",
            boxShadow: activeTab === t.key ? "0 2px 8px rgba(20,40,90,0.1)" : "none",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            transition: "all 0.15s",
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Conditions */}
          <div style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #D8E4F2" }}>
            <div style={{ fontSize: 14, color: "#9aabc0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>Diagnoses from Records</div>
            {conditions.length > 0 ? conditions.map(c => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0047AB", flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: "#1a2540", fontWeight: 500 }}>{c}</span>
              </div>
            )) : <div style={{ fontSize: 14, color: "#9aabc0" }}>No records yet</div>}
          </div>

          {/* Personal info */}
          <div style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #D8E4F2" }}>
            <div style={{ fontSize: 14, color: "#9aabc0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 14 }}><User size={16} strokeWidth={2} /> Personal Information</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
              {[
                { label: "Date of Birth", value: patient.dob },
                { label: "Blood Type",    value: patient.bloodType },
                { label: "Gender",        value: patient.gender === "F" ? "Female" : "Male" },
                { label: "Contact",       value: patient.contact },
                { label: "Address",       value: patient.address },
                { label: "Total Visits",  value: `${visits.length} visits` },
              ].map((f, i) => (
                <div key={f.label} style={{ padding: "12px 0", borderBottom: i < 3 ? "1px solid #f0f3fa" : "none", paddingRight: 16 }}>
                  <div style={{ fontSize: 14, color: "#9aabc0", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>{f.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2540" }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Last consultation */}
          {visits[0] && (
            <div style={{ background: "linear-gradient(135deg,#EBF0FA,#e4ecfb)", borderRadius: 14, padding: "18px 20px", border: "1px solid #B0C8E8", cursor: "pointer" }}
              onClick={() => { onVisitSelect(visits[0]); setActiveTab("history"); }}>
              <div style={{ fontSize: 14, color: "#0047AB", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}><Stethoscope size={16} strokeWidth={2} /> Last Consultation — click to view</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1a2540" }}>{visits[0].diagnosis}</div>
              <div style={{ fontSize: 14, color: "#5a6f90", marginTop: 3 }}>{visits[0].date} · {visits[0].reason}</div>
            </div>
          )}

          {/* Vitals chart */}
          {vitalsHistory.length > 1 && (
            <div style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #D8E4F2" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1a2540", marginBottom: 2 }}>Blood Pressure Trend</div>
              <div style={{ fontSize: 14, color: "#9aabc0", marginBottom: 14 }}>Systolic over time (mmHg)</div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={vitalsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f3fa" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9aabc0" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[80, 180]} tick={{ fontSize: 12, fill: "#9aabc0" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="bp" name="BP" stroke="#CC0000" strokeWidth={2.5} dot={{ r: 4, fill: "#CC0000" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Visit History */}
      {activeTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {visitsLoading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9aabc0" }}>Loading visit history...</div>
          ) : visits.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9aabc0" }}>No consultation records yet</div>
          ) : (
            <>
              <div style={{ fontSize: 14, color: "#7a8fb0", marginBottom: 14 }}>
                {visits.length} consultation record{visits.length !== 1 ? "s" : ""} — click any to view full details
              </div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 16, top: 10, bottom: 10, width: 2, background: "#D8E4F2", zIndex: 0 }} />
                {visits.map((v, i) => {
                  const isSelected = selectedVisitId === v.id;
                  return (
                    <div key={v.id} onClick={() => onVisitSelect(v)} style={{
                      display: "flex", gap: 16, marginBottom: 12,
                      cursor: "pointer", position: "relative", zIndex: 1,
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                        background: i === 0 ? "#0047AB" : "white",
                        border: `2px solid ${i === 0 ? "#0047AB" : "#C0D4F0"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, boxShadow: i === 0 ? "0 0 0 4px #ddeafc" : "none", zIndex: 2,
                      }}>
                        {i === 0 ? <span style={{ fontSize: 14 }}><Stethoscope size={16} strokeWidth={2} color="white" /></span> : <span style={{ fontSize: 14, fontWeight: 700, color: "#9aabc0" }}>{visits.length - i}</span>}
                      </div>
                      <div style={{
                        flex: 1, background: "white", borderRadius: 14, padding: "16px 18px",
                        border: `2px solid ${isSelected ? "#0047AB" : "#D8E4F2"}`,
                        boxShadow: isSelected ? "0 4px 20px rgba(0,71,171,0.14)" : "0 2px 8px rgba(20,40,90,0.04)",
                        transition: "all 0.18s",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2540" }}>{v.diagnosis}</div>
                            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 3 }}>{v.reason}</div>
                            {v.vitals && (
                              <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                                {[
                                  { val: `BP ${v.vitals.bp}`, flag: bpFlag(v.vitals.bp) },
                                  v.vitals.temp ? { val: `${v.vitals.temp}°C`, flag: tempFlag(v.vitals.temp) } : null,
                                  v.vitals.hr ? { val: `${v.vitals.hr} bpm`, flag: "normal" } : null,
                                ].filter(Boolean).map(chip => (
                                  <span key={chip.val} style={{
                                    background: flagBg[chip.flag], color: flagColor[chip.flag],
                                    borderRadius: 6, padding: "2px 8px", fontSize: 14, fontWeight: 500,
                                  }}>{chip.val}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: i === 0 ? "#0047AB" : "#7a8fb0" }}>{v.date}</div>
                            <div style={{ fontSize: 14, color: "#b0bdd6", marginTop: 2 }}>{v.queue}</div>
                            <div style={{
                              marginTop: 8, background: isSelected ? "#0047AB" : "#EBF0FA",
                              color: isSelected ? "white" : "#0047AB",
                              border: `1px solid ${isSelected ? "#0047AB" : "#CCDAF0"}`,
                              borderRadius: 7, padding: "4px 12px", fontSize: 14, fontWeight: 600, display: "inline-block",
                            }}>
                              {isSelected ? "Viewing →" : "View Notes →"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DoctorPatientRecords({ onNavigate, navState }) {
  const [patients, setPatients]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selected, setSelected]             = useState(null);
  const [selectedVisits, setSelectedVisits] = useState([]);
  const [visitsLoading, setVisitsLoading]   = useState(false);
  const [search, setSearch]                 = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [activeVisit, setActiveVisit]       = useState(null);
  const [toast, setToast]                   = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // Fetch patient list
  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await patientsApi.getAll({ search, limit: 100 });
      let list = (resp.data || []).map(normalizePatient);
      
      // Handle direct navigation to a specific patient
      if (navState?.patientId && !search) {
        if (!list.find(p => p.id === navState.patientId)) {
          try {
            const single = await patientsApi.getOne(navState.patientId);
            list = [normalizePatient(single), ...list];
          } catch(e) { console.error("Failed to fetch initial patient:", e); }
        }
      }

      setPatients(list);
      
      if (!selected) {
        if (navState?.patientId) {
          const found = list.find(p => p.id === navState.patientId);
          if (found) setSelected(found);
          else if (list.length > 0) setSelected(list[0]);
        } else if (list.length > 0) {
          setSelected(list[0]);
        }
      }
    } catch (e) {
      console.error("[DoctorPatientRecords] loadPatients error:", e);
    } finally {
      setLoading(false);
    }
  }, [search, navState?.patientId]);

  useEffect(() => {
    const debounce = setTimeout(() => loadPatients(), 300);
    return () => clearTimeout(debounce);
  }, [loadPatients]);

  // Fetch visits when a patient is selected
  useEffect(() => {
    if (!selected) { setSelectedVisits([]); return; }
    let cancelled = false;
    const load = async () => {
      setVisitsLoading(true);
      try {
        const resp = await patientsApi.getVisits(selected.id);
        if (!cancelled) {
          const visits = (resp.data || []).map(normalizeVisit);
          setSelectedVisits(visits);
        }
      } catch (e) {
        console.error("[DoctorPatientRecords] loadVisits error:", e);
        if (!cancelled) setSelectedVisits([]);
      } finally {
        if (!cancelled) setVisitsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selected?.id]);

  const handlePatientSelect = (p) => {
    setSelected(p);
    setActiveVisit(null);
  };

  const filtered = patients.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ height: "100%", background: "#EBF0FA", display: "flex", overflow: "hidden" }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1a2540", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 14, zIndex: 300, boxShadow: "0 8px 24px rgba(20,40,90,0.28)", animation: "fadeUp 0.3s ease" }}>{toast}</div>}

      {/* Visit detail drawer */}
      <VisitDrawer visit={activeVisit} patient={selected} onClose={() => setActiveVisit(null)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ background: "#EBF0FA", borderBottom: "1px solid #CCDAF0", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1a2540" }}>Patient Records</h1>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>{patients.length} patients found</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 7 }}>
              {[
                { label: "Patients",  value: patients.length, color: "#0047AB", bg: "#EBF0FA" },
                { label: "Active",    value: patients.filter(p => p.status === "active").length, color: "#2a7d5f", bg: "#e8f7f1" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "6px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 14, color: s.color, opacity: 0.8, letterSpacing: 0.3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Split */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "300px 1fr", overflow: "hidden" }}>

          {/* Patient list */}
          <div style={{ background: "white", borderRight: "1px solid #CCDAF0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #f0f3fa" }}>
              <div style={{ position: "relative", marginBottom: 10 }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9aabc0" }}><Search size={14} strokeWidth={2} color="#8a9bb0" /></span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name..."
                  style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1.5px solid #e8edf7", borderRadius: 10, fontSize: 14, color: "#1a2540", outline: "none", background: "#f7f9fd", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#0047AB"}
                  onBlur={e => e.target.style.borderColor = "#e8edf7"}
                />
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {["all", "active"].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} style={{
                    background: statusFilter === s ? "#1a2540" : "#EBF0FA",
                    color: statusFilter === s ? "white" : "#7a8fb0",
                    border: "none", borderRadius: 7, padding: "4px 10px",
                    fontSize: 14, fontWeight: statusFilter === s ? 600 : 400,
                    cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s",
                  }}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "#9aabc0" }}>Loading patients...</div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "#9aabc0" }}>
                  <Search size={32} strokeWidth={1.5} color="#c0cde0" />
                  <div style={{ fontSize: 14, marginTop: 8 }}>No patients found</div>
                </div>
              ) : filtered.map(p => {
                const ss = statusStyle[p.status] || statusStyle.active;
                const isSelected = selected?.id === p.id;
                return (
                  <div key={p.id} onClick={() => handlePatientSelect(p)} style={{
                    padding: "13px 12px", borderRadius: 12, marginBottom: 6, cursor: "pointer",
                    background: isSelected ? "#EBF0FA" : "transparent",
                    border: `1.5px solid ${isSelected ? "#B0C8E8" : "transparent"}`,
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f7f9fd"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", gap: 10 }}>
                      <Avatar name={p.name} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2540" }}>{p.name}</div>
                          <span style={{ background: ss.bg, color: ss.color, borderRadius: 5, padding: "1px 7px", fontSize: 14, fontWeight: 600, flexShrink: 0, marginLeft: 4 }}>{ss.label}</span>
                        </div>
                        <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 1 }}>{p.age} yrs · {p.gender} · {p.bloodType}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Profile panel */}
          <div style={{ display: "flex", overflow: "hidden" }}>
            <ProfilePanel
              patient={selected}
              visits={selectedVisits}
              visitsLoading={visitsLoading}
              onVisitSelect={setActiveVisit}
              selectedVisitId={activeVisit?.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
