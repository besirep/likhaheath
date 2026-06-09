import React, { useState, useEffect, useCallback } from "react";
import { Search, Stethoscope, Clock, ClipboardList, UserRound, Heart, Thermometer, Wind, User, AlertTriangle, FileText, Activity, Printer, Scale } from "lucide-react";
import { consultationsApi } from "../../lib/api/consultations.js";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", color: "red", background: "#fee" }}>
          <h2>Something went wrong in the Form.</h2>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}


// ── Config ────────────────────────────────────────────────────────────────────
const priorityConfig = {
  elderly:   { label: "Senior Citizen", icon: "👴", color: "#8B5FBF", bg: "#f0eafb", stripe: "#8B5FBF" },
  pregnant:  { label: "Pregnant",       icon: "🤰", color: "#d4709a", bg: "#fce8f4", stripe: "#d4709a" },
  pwd:       { label: "PWD",            icon: "♿", color: "#0047AB", bg: "#EBF0FA", stripe: "#0047AB" },
  pediatric: { label: "Pedia (0–5)",    icon: "👶", color: "#e09040", bg: "#fdf3e8", stripe: "#e09040" },
};

const bpFlag   = bp => { if (!bp || bp === "null") return "normal"; const s = Number(String(bp).split("/")[0]); return s >= 140 ? "high" : s < 90 ? "low" : "normal"; };
const tempFlag = v  => { if (!v || v === "null")  return "normal"; const n = Number(v); return n >= 37.8 ? "high" : n < 36 ? "low" : "normal"; };
const spo2Flag = v  => (!v || v === "null") ? "normal" : Number(v) < 95 ? "low" : "normal";
const flagColor = { high: "#CC0000", low: "#c04080", normal: "#0047AB" };
const flagBg    = { high: "#fdeee8", low: "#fce8f0", normal: "#EBF0FA" };

// ── Helpers ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
  const safeName = name || "?";
  const initials = safeName.split(" ").map(n => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "?";
  const hue = (safeName.charCodeAt(0) * 41 + (safeName.charCodeAt(1) || 0) * 19) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue || 0},40%,75%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: `hsl(${hue || 0},40%,28%)`, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function VitalCard({ icon, label, value, unit, flag = "normal" }) {
  if (!value) return null;
  return (
    <div style={{ background: flagBg[flag], borderRadius: 12, padding: "11px 8px", border: `1.5px solid ${flag !== "normal" ? flagColor[flag] + "40" : "#e8edf7"}`, textAlign: "center" }}>
      <div style={{ fontSize: 14, marginBottom: 3 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: flagColor[flag], lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#9aabc0", marginTop: 2 }}>{unit}</div>
      <div style={{ fontSize: 11, color: "#b0bdd6", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      {flag !== "normal" && <div style={{ fontSize: 11, color: flagColor[flag], fontWeight: 700, marginTop: 2 }}>⚠ {flag}</div>}
    </div>
  );
}

// ── History Detail Panel ───────────────────────────────────────────────────────
function HistoryDetail({ record, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ diagnosis: '', treatment: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setEditForm({ diagnosis: record.diagnosis || '', treatment: record.treatment || '', notes: record.notes || '' });
      setIsEditing(false);
    }
  }, [record]);

  if (!record) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9aabc0", flexDirection: "column", gap: 10, background: "#f7f9fd" }}>
      <div style={{ fontSize: 48 }}>🩺</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2540" }}>Select a consultation</div>
      <div style={{ fontSize: 14 }}>Click any record to view details</div>
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await consultationsApi.updateConsultation(record.id, editForm);
      if (onUpdate) onUpdate(editForm);
      setIsEditing(false);
    } catch (e) {
      alert("Failed to update consultation.");
    } finally {
      setSaving(false);
    }
  };

  const v = record.vitals;
  const bmi = v?.weight && v?.height && v.weight !== "null" && v.height !== "null"
    ? (Number(v.weight) / Math.pow(Number(v.height) / 100, 2)).toFixed(1)
    : null;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "26px 28px", background: "#f7f9fd" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <Avatar name={record.patient.name} size={52} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1a2540" }}>{record.patient.name}</div>
          <div style={{ fontSize: 14, color: "#7a8fb0" }}>{record.patient.age} yrs · {record.patient.sex}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {!isEditing ? (
            <>
              <button onClick={() => setIsEditing(true)} style={{ background: "white", border: "1px solid #CCDAF0", borderRadius: 9, padding: "7px 14px", fontSize: 14, color: "#1a2540", cursor: "pointer", fontWeight: 600 }}>
                ✏️ Edit
              </button>
              <button onClick={() => {
                const win = window.open("", "_blank");
                win.document.write(`<html><body style="font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h4 style="margin:0;font-weight:normal">REPUBLIC OF THE PHILIPPINES<br/>PROVINCE OF RIZAL<br/>MUNICIPALITY OF ANGONO</h4>
        <h3 style="margin:10px 0 0 0;">MUNICIPAL HEALTH OFFICE</h3>
      </div>
      <h2 style="text-align:center; font-style: italic; margin-bottom: 30px;">Consultation Record</h2>
      
      <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
        <div>Date: <span style="border-bottom: 1px solid black; display: inline-block; width: 150px; text-align:center;">${new Date(record.date).toLocaleDateString()}</span></div>
      </div>
      
      <div style="margin-bottom: 10px;">
        NAME: <span style="border-bottom: 1px solid black; display: inline-block; width: 400px; padding-left: 10px;">${record.patient.name}</span>
      </div>
      <div style="display: flex; gap: 10px; margin-bottom: 30px;">
        <div style="flex:1">ADD: <span style="border-bottom: 1px solid black; display: inline-block; width: 80%;">—</span></div>
        <div>Age: <span style="border-bottom: 1px solid black; display: inline-block; width: 50px; text-align:center;">${record.patient.age}</span></div>
        <div>Sex: <span style="border-bottom: 1px solid black; display: inline-block; width: 50px; text-align:center;">${record.patient.sex}</span></div>
      </div>

      <div style="margin-bottom: 20px;">
        <div style="font-weight:bold; margin-bottom:5px;">HPI / Chief Complaint:</div>
        <div style="padding-left:10px; min-height: 40px;">${record.visitReason || "—"}</div>
      </div>
      <div style="margin-bottom: 20px;">
        <div style="font-weight:bold; margin-bottom:5px;">Diagnosis:</div>
        <div style="padding-left:10px;">${record.diagnosis || "—"}</div>
      </div>
      <div style="margin-bottom: 40px;">
        <div style="font-weight:bold; margin-bottom:5px;">Doctor's Notes & Treatment:</div>
        <div style="padding-left:10px; white-space: pre-wrap;">${(record.treatment || "") + (record.notes ? "\\n\\n" + record.notes : "")}</div>
      </div>

      <div style="margin-top: 80px; text-align: right;">
        <div style="display: inline-block; text-align: center;">
          <div style="border-bottom: 1px solid black; width: 250px; margin-bottom: 5px;"></div>
          <div>RODOLFO S. NARCISO JR., MD</div>
          <div>MUNICIPAL HEALTH OFFICER</div>
          <div>LIC. NO. 0101763</div>
        </div>
      </div>
    </body></html>`);
                win.document.close();
          setTimeout(() => { win.focus(); win.print(); }, 400);
              }} style={{ background: "white", border: "1px solid #CCDAF0", borderRadius: 9, padding: "7px 14px", fontSize: 14, color: "#0047AB", cursor: "pointer", fontWeight: 600 }}>
                🖨 Print
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} style={{ background: "white", border: "1px solid #CCDAF0", borderRadius: 9, padding: "7px 14px", fontSize: 14, color: "#7a8fb0", cursor: "pointer", fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{ background: "#0047AB", border: "none", borderRadius: 9, padding: "7px 14px", fontSize: 14, color: "white", cursor: "pointer", fontWeight: 600 }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: "#7a8fb0", fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>Diagnosis</div>
            <input value={editForm.diagnosis} onChange={e => setEditForm({ ...editForm, diagnosis: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #C0D4F0", fontSize: 15, fontFamily: "inherit" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#0047AB", fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>Treatment Plan</div>
            <textarea value={editForm.treatment} onChange={e => setEditForm({ ...editForm, treatment: e.target.value })} rows={4} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #C0D4F0", fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#9aabc0", fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>Clinical Notes</div>
            <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={4} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #C0D4F0", fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />
          </div>
        </div>
      ) : (
        <>
          <div style={{ background: "linear-gradient(135deg,#EBF0FA,#e4ecfb)", borderRadius: 14, padding: "16px 20px", marginBottom: 14, border: "1px solid #C0D4F0" }}>
            <div style={{ fontSize: 12, color: "#7a8fb0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 }}>Diagnosis</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1a2540" }}>{record.diagnosis}</div>
            <div style={{ fontSize: 14, color: "#5a6f90", marginTop: 3 }}>Chief complaint: {record.visitReason || "—"}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #e8edf7" }}>
              <div style={{ fontSize: 12, color: "#9aabc0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 9 }}>📝 Clinical Notes</div>
              <div style={{ fontSize: 14, color: "#2a3550", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{record.notes || "No notes recorded."}</div>
            </div>
            <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #C0D4F0" }}>
              <div style={{ fontSize: 12, color: "#0047AB", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 9 }}>📋 Treatment Plan</div>
              <div style={{ fontSize: 14, color: "#2a3550", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{record.treatment}</div>
            </div>
          </div>
        </>
      )}

      {v && (
        <div>
          <div style={{ fontSize: 12, color: "#9aabc0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Vitals at Consultation</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            <VitalCard icon={<Heart size={16} strokeWidth={2} />} label="Blood Pressure" value={v.bp}   unit="mmHg" flag={bpFlag(v.bp)} />
            <VitalCard icon={<Thermometer size={16} strokeWidth={2} />} label="Temperature"    value={v.temp} unit="°C"   flag={tempFlag(v.temp)} />
            <VitalCard icon={<Activity size={16} strokeWidth={2} />} label="Heart Rate"     value={v.hr}   unit="bpm" />
            <VitalCard icon={<Wind size={16} strokeWidth={2} />} label="SpO₂"           value={v.spo2} unit="%"   flag={spo2Flag(v.spo2)} />
            {bmi && <VitalCard icon={<Scale size={16} strokeWidth={2} />} label="BMI" value={bmi} unit="kg/m²" flag={Number(bmi) > 25 ? "high" : "normal"} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DoctorConsultations({ activePatient, onConsultComplete, onCancelConsult, onNavigate }) {
  const [history, setHistory]       = useState([]);
  const [selectedRecord, setRecord] = useState(null);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await consultationsApi.getHistory();
      const arr = Array.isArray(data) ? data : [];
      setHistory(arr);
      if (arr.length > 0) setRecord(arr[0]);
    } catch (e) {
      console.error('[Consultations] loadHistory error:', e);
      setError("Could not load consultation history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const safeHistory = Array.isArray(history) ? history : [];

  const filtered = safeHistory.filter(r => {
    const name = r.patient?.name || "";
    const diag = r.diagnosis || "";
    return name.toLowerCase().includes(search.toLowerCase()) ||
      diag.toLowerCase().includes(search.toLowerCase());
  });

  const grouped = filtered.reduce((acc, r) => {
    const d = new Date(r.date);
    const today = new Date();
    const diff  = Math.floor((today - d) / 86400000);
    const key   = diff === 0 ? "Today" : diff === 1 ? "Yesterday" : d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const todayCount     = safeHistory.filter(r => {
    try { return new Date(r.date).toDateString() === new Date().toDateString(); }
    catch { return false; }
  }).length;
  const completedCount = safeHistory.length;

  return (
    <div style={{ height: "100%", background: "#EBF0FA", display: "flex", overflow: "hidden" }}>
      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn  { from{transform:scale(0.95);opacity:0} to{transform:scale(1);opacity:1} }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.type === "error" ? "#CC0000" : "#1a2540", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 14, zIndex: 300, boxShadow: "0 8px 24px rgba(20,40,90,0.28)", animation: "popIn 0.3s ease" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{ background: "#EBF0FA", borderBottom: "1px solid #CCDAF0", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a2540" }}>
              Consultations
            </h1>
            <div style={{ fontSize: 13, color: "#7a8fb0", marginTop: 2 }}>
              {todayCount} today · {completedCount} total records
            </div>
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            {[
              { label: "Today",     value: todayCount,     color: "#0047AB", bg: "#EBF0FA" },
              { label: "Completed", value: completedCount, color: "#2a7d5f", bg: "#e8f7f1" },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "5px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: s.color, opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Split Panel */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "310px 1fr", overflow: "hidden" }}>

          {/* Left — History List */}
          <div style={{ background: "white", borderRight: "1px solid #CCDAF0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #f0f3fa" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9aabc0" }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient or diagnosis..."
                  style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1.5px solid #e8edf7", borderRadius: 10, fontSize: 14, color: "#1a2540", outline: "none", background: "#f7f9fd", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#0047AB"}
                  onBlur={e => e.target.style.borderColor = "#e8edf7"}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
              {loading && <div style={{ textAlign: "center", padding: "40px 16px", color: "#9aabc0" }}>Loading...</div>}
              {error  && <div style={{ textAlign: "center", padding: "20px 16px", color: "#CC0000", fontSize: 14 }}>{error}</div>}

              {!loading && !error && Object.entries(grouped).map(([groupDate, items]) => (
                <div key={groupDate}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9aabc0", letterSpacing: 0.8, textTransform: "uppercase", padding: "10px 6px 6px" }}>{groupDate}</div>
                  {items.map((r, i) => {
                    const isSel = selectedRecord?.id === r.id;
                    return (
                      <div key={r.id} onClick={() => { setRecord(r); }}
                        style={{ padding: "11px 12px", borderRadius: 12, marginBottom: 4, cursor: "pointer", background: isSel ? "#EBF0FA" : "transparent", border: `1.5px solid ${isSel ? "#B0C8E8" : "transparent"}`, transition: "all 0.15s", animation: `fadeIn 0.3s ease ${i * 0.04}s both` }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "#f7f9fd"; }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <Avatar name={r.patient?.name || "?"} size={34} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2540" }}>{r.patient?.name || "Unknown"}</div>
                            <div style={{ fontSize: 13, color: "#7a8fb0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.diagnosis}</div>
                            <div style={{ fontSize: 12, color: "#b0bdd6", marginTop: 2 }}>{new Date(r.date).toLocaleDateString()}</div>
                          </div>
                          <div style={{ background: "#e8f7f5", color: "#2a9d8f", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>Done</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {!loading && !error && filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "#9aabc0" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontSize: 14 }}>No consultations found</div>
                </div>
              )}
            </div>
          </div>

          {/* Right — Detail */}
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <ErrorBoundary>
              <HistoryDetail 
                record={selectedRecord} 
                onUpdate={(newVals) => {
                  loadHistory();
                  showToast("Record updated successfully");
                  // Update selectedRecord instantly in memory so the detail view shows the new text
                  setRecord(prev => prev ? { ...prev, ...newVals } : prev); 
                }} 
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
