import { useState } from "react";
import { Heart, Thermometer, Activity, Wind, X, Scale, Ruler } from "lucide-react";

export default function VitalsModal({ patient, onClose, onSave }) {
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
