import { useState, useEffect, useCallback } from "react";
import { consultationsApi } from "../../lib/api/consultations.js";

// ── Config ────────────────────────────────────────────────────────────────────
const priorityConfig = {
  elderly:   { label: "Senior Citizen", icon: "👴", color: "#8B5FBF", bg: "#f0eafb", stripe: "#8B5FBF" },
  pregnant:  { label: "Pregnant",       icon: "🤰", color: "#d4709a", bg: "#fce8f4", stripe: "#d4709a" },
  pwd:       { label: "PWD",            icon: "♿", color: "#0047AB", bg: "#EBF0FA", stripe: "#0047AB" },
  pediatric: { label: "Pedia (0–5)",    icon: "👶", color: "#e09040", bg: "#fdf3e8", stripe: "#e09040" },
};

const bpFlag   = bp => { if (!bp) return "normal"; const s = Number(String(bp).split("/")[0]); return s >= 140 ? "high" : s < 90 ? "low" : "normal"; };
const tempFlag = v  => { if (!v)  return "normal"; const n = Number(v); return n >= 37.8 ? "high" : n < 36 ? "low" : "normal"; };
const spo2Flag = v  => !v ? "normal" : Number(v) < 95 ? "low" : "normal";
const flagColor = { high: "#CC0000", low: "#c04080", normal: "#0047AB" };
const flagBg    = { high: "#fdeee8", low: "#fce8f0", normal: "#EBF0FA" };

// ── Helpers ───────────────────────────────────────────────────────────────────
function Avatar({ name = "?", size = 36 }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const hue = (name.charCodeAt(0) * 41 + (name.charCodeAt(1) || 0) * 19) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},40%,75%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: `hsl(${hue},40%,28%)`, flexShrink: 0 }}>
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

// ── Consultation Form (Active Consult) ────────────────────────────────────────
function ConsultationForm({ patient, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    diagnosis: "",
    treatment: "",
    notes:     "",
    followUpDate: "",
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.diagnosis.trim() || !form.treatment.trim()) return;
    onSave({
      appointmentId: patient.appointmentId,
      patientId:     patient.patientId,
      ...form,
    });
  };

  const v = patient.vitals;
  const bmi = v?.weight && v?.height
    ? (Number(v.weight) / Math.pow(Number(v.height) / 100, 2)).toFixed(1)
    : null;

  const inputStyle = {
    width: "100%", padding: "10px 14px", border: "1.5px solid #e8edf7",
    borderRadius: 10, fontSize: 14, boxSizing: "border-box",
    fontFamily: "inherit", background: "#fafbff", outline: "none",
    transition: "border-color 0.2s",
  };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 6 };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", background: "#f7f9fd" }}>
      {/* Patient Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <Avatar name={patient.name} size={52} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1a2540" }}>{patient.name}</div>
          <div style={{ fontSize: 14, color: "#7a8fb0" }}>{patient.age} yrs · {patient.sex} · Queue #{patient.queueNumber}</div>
          <div style={{ fontSize: 13, color: "#9aabc0", marginTop: 3 }}>Chief Complaint: {patient.visitReason || "—"}</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EBF0FA", border: "1px solid #B0C8E8", borderRadius: 9, padding: "6px 14px" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#0047AB", animation: "pulse 1.4s infinite" }} />
            <span style={{ fontSize: 13, color: "#0047AB", fontWeight: 600 }}>Active Consult</span>
          </div>
        </div>
      </div>

      {/* Vitals Strip */}
      {v ? (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Vitals from Nurse</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            <VitalCard icon="❤️" label="Blood Pressure" value={v.bp} unit="mmHg" flag={bpFlag(v.bp)} />
            <VitalCard icon="🌡️" label="Temperature"    value={v.temp} unit="°C" flag={tempFlag(v.temp)} />
            <VitalCard icon="💓" label="Heart Rate"     value={v.hr}   unit="bpm" />
            <VitalCard icon="🫁" label="SpO₂"           value={v.spo2} unit="%"   flag={spo2Flag(v.spo2)} />
            {bmi && <VitalCard icon="📐" label="BMI" value={bmi} unit="kg/m²" flag={Number(bmi) > 25 ? "high" : "normal"} />}
          </div>
        </div>
      ) : (
        <div style={{ background: "#fff8e8", border: "1px solid #f0d080", borderRadius: 12, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
          <span>⏳</span>
          <span style={{ fontSize: 14, color: "#a07820" }}>Vitals not yet recorded by nurse. You can proceed with the consultation.</span>
        </div>
      )}

      {/* Consultation Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ background: "white", borderRadius: 16, padding: "20px 22px", border: "1px solid #e8edf7", marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a2540", marginBottom: 16 }}>📋 Consultation Findings</div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Diagnosis *</label>
            <input
              style={inputStyle}
              value={form.diagnosis}
              onChange={e => set("diagnosis", e.target.value)}
              placeholder="e.g. Essential Hypertension (I10)"
              required
              onFocus={e => e.target.style.borderColor = "#0047AB"}
              onBlur={e => e.target.style.borderColor = "#e8edf7"}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Treatment Plan *</label>
            <textarea
              style={{ ...inputStyle, height: 90, resize: "vertical" }}
              value={form.treatment}
              onChange={e => set("treatment", e.target.value)}
              placeholder="Medications, dosage, lifestyle modifications..."
              required
              onFocus={e => e.target.style.borderColor = "#0047AB"}
              onBlur={e => e.target.style.borderColor = "#e8edf7"}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Clinical Notes</label>
            <textarea
              style={{ ...inputStyle, height: 100, resize: "vertical" }}
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="History of present illness, physical examination findings..."
              onFocus={e => e.target.style.borderColor = "#0047AB"}
              onBlur={e => e.target.style.borderColor = "#e8edf7"}
            />
          </div>

          <div>
            <label style={labelStyle}>📅 Follow-up Date (optional)</label>
            <input
              type="date"
              style={{ ...inputStyle, width: "220px" }}
              value={form.followUpDate}
              onChange={e => set("followUpDate", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              onFocus={e => e.target.style.borderColor = "#0047AB"}
              onBlur={e => e.target.style.borderColor = "#e8edf7"}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onCancel}
            style={{ flex: 1, background: "white", border: "1.5px solid #e0e7ef", borderRadius: 11, padding: "12px", fontSize: 14, color: "#7a8fb0", cursor: "pointer", fontWeight: 600 }}>
            Cancel
          </button>
          <button type="submit" disabled={saving || !form.diagnosis.trim() || !form.treatment.trim()}
            style={{
              flex: 3, borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: saving ? "wait" : "pointer", border: "none",
              background: saving ? "#7a8fb0" : "linear-gradient(135deg,#0047AB,#1565D8)",
              color: "white", boxShadow: saving ? "none" : "0 4px 16px rgba(0,71,171,0.3)",
              transition: "all 0.2s",
            }}>
            {saving ? "Saving..." : "✓ Complete & Save Consultation"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── History Detail Panel ───────────────────────────────────────────────────────
function HistoryDetail({ record, onSchedule }) {
  if (!record) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9aabc0", flexDirection: "column", gap: 10, background: "#f7f9fd" }}>
      <div style={{ fontSize: 48 }}>🩺</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2540" }}>Select a consultation</div>
      <div style={{ fontSize: 14 }}>Click any record to view details</div>
    </div>
  );

  const v = record.vitals;
  const bmi = v?.weight && v?.height
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
        <button onClick={() => {
          const win = window.open("", "_blank");
          win.document.write(`<html><body style="font-family:sans-serif;padding:24px"><h2>Consultation Record — ${record.patient.name}</h2><p><b>Date:</b> ${new Date(record.date).toLocaleDateString()}</p><hr/><p><b>Diagnosis:</b> ${record.diagnosis}</p><p><b>Treatment:</b><br/>${record.treatment}</p><p><b>Notes:</b><br/>${record.notes || "—"}</p><p style="margin-top:32px;color:#888">Printed on ${new Date().toLocaleString()}</p></body></html>`);
          win.print(); win.close();
        }} style={{ marginLeft: "auto", background: "white", border: "1px solid #CCDAF0", borderRadius: 9, padding: "7px 14px", fontSize: 14, color: "#0047AB", cursor: "pointer", fontWeight: 600 }}>
          🖨 Print
        </button>
      </div>

      <div style={{ background: "linear-gradient(135deg,#EBF0FA,#e4ecfb)", borderRadius: 14, padding: "16px 20px", marginBottom: 14, border: "1px solid #C0D4F0" }}>
        <div style={{ fontSize: 12, color: "#7a8fb0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 }}>Diagnosis</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#1a2540" }}>{record.diagnosis}</div>
        <div style={{ fontSize: 14, color: "#5a6f90", marginTop: 3 }}>Chief complaint: {record.visitReason || "—"}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #e8edf7" }}>
          <div style={{ fontSize: 12, color: "#9aabc0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 9 }}>📝 Clinical Notes</div>
          <div style={{ fontSize: 14, color: "#2a3550", lineHeight: 1.75 }}>{record.notes || "No notes recorded."}</div>
        </div>
        <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #C0D4F0" }}>
          <div style={{ fontSize: 12, color: "#0047AB", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 9 }}>📋 Treatment Plan</div>
          <div style={{ fontSize: 14, color: "#2a3550", lineHeight: 1.75 }}>{record.treatment}</div>
        </div>
      </div>

      {v && (
        <div>
          <div style={{ fontSize: 12, color: "#9aabc0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Vitals at Consultation</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            <VitalCard icon="❤️" label="Blood Pressure" value={v.bp}   unit="mmHg" flag={bpFlag(v.bp)} />
            <VitalCard icon="🌡️" label="Temperature"    value={v.temp} unit="°C"   flag={tempFlag(v.temp)} />
            <VitalCard icon="💓" label="Heart Rate"     value={v.hr}   unit="bpm" />
            <VitalCard icon="🫁" label="SpO₂"           value={v.spo2} unit="%"   flag={spo2Flag(v.spo2)} />
            {bmi && <VitalCard icon="📐" label="BMI" value={bmi} unit="kg/m²" flag={Number(bmi) > 25 ? "high" : "normal"} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DoctorConsultations({ activePatient, onConsultComplete }) {
  const [mode, setMode]             = useState("history"); // "history" | "active"
  const [history, setHistory]       = useState([]);
  const [selectedRecord, setRecord] = useState(null);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
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
      setHistory(data);
      if (data.length > 0) setRecord(data[0]);
    } catch (e) {
      setError("Could not load consultation history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // If a patient is passed in as "active", switch to active consult mode
  useEffect(() => {
    if (activePatient) setMode("active");
  }, [activePatient]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      await consultationsApi.saveConsultation(data);
      showToast(`✓ Consultation saved for ${activePatient?.name || "patient"}`);
      setMode("history");
      await loadHistory();
      if (onConsultComplete) onConsultComplete();
    } catch (e) {
      showToast("Failed to save consultation. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const filtered = history.filter(r =>
    r.patient.name.toLowerCase().includes(search.toLowerCase()) ||
    r.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, r) => {
    const d = new Date(r.date);
    const today = new Date();
    const diff  = Math.floor((today - d) / 86400000);
    const key   = diff === 0 ? "Today" : diff === 1 ? "Yesterday" : d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const todayCount     = history.filter(r => new Date(r.date).toDateString() === new Date().toDateString()).length;
  const completedCount = history.length;

  return (
    <div style={{ height: "100vh", background: "#EBF0FA", display: "flex", overflow: "hidden" }}>
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

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{ background: "#EBF0FA", borderBottom: "1px solid #CCDAF0", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a2540" }}>
              {mode === "active" && activePatient ? `🩺 Consulting — ${activePatient.name}` : "Consultations"}
            </h1>
            <div style={{ fontSize: 13, color: "#7a8fb0", marginTop: 2 }}>
              {mode === "active" ? "Fill in findings and save to complete the visit." : `${todayCount} today · ${completedCount} total records`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            {mode === "active" && (
              <button onClick={() => setMode("history")} style={{ background: "white", border: "1px solid #CCDAF0", borderRadius: 9, padding: "7px 16px", fontSize: 13, color: "#7a8fb0", cursor: "pointer", fontWeight: 600 }}>
                ← Back to History
              </button>
            )}
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
                      <div key={r.id} onClick={() => { setRecord(r); setMode("history"); }}
                        style={{ padding: "11px 12px", borderRadius: 12, marginBottom: 4, cursor: "pointer", background: isSel ? "#EBF0FA" : "transparent", border: `1.5px solid ${isSel ? "#B0C8E8" : "transparent"}`, transition: "all 0.15s", animation: `fadeIn 0.3s ease ${i * 0.04}s both` }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "#f7f9fd"; }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <Avatar name={r.patient.name} size={34} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2540" }}>{r.patient.name}</div>
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

          {/* Right — Detail or Active Form */}
          <div style={{ display: "flex", overflow: "hidden" }}>
            {mode === "active" && activePatient ? (
              <ConsultationForm
                patient={activePatient}
                onSave={handleSave}
                onCancel={() => setMode("history")}
                saving={saving}
              />
            ) : (
              <HistoryDetail record={selectedRecord} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
