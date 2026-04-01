import { useState } from "react";

const consultations = [
  {
    id: 1, queue: "A-001", name: "Maria Santos", age: 66, gender: "F",
    date: "Mar 1, 2026", time: "9:05 AM", duration: "18 min",
    reason: "Hypertension follow-up", status: "active",
    diagnosis: "Essential Hypertension (I10)",
    notes: "Patient reports occasional morning headaches. BP slightly elevated. Currently on Amlodipine 5mg. Advised to reduce sodium intake and continue daily walks. BP to be rechecked in 2 weeks.",
    plan: "Continue Amlodipine 5mg OD. Salt-restricted diet. Follow-up in 2 weeks.",
    vitals: { bp: "138/88", temp: "36.7", hr: "82", spo2: "98", weight: "62", height: "158" },
    labOrdered: ["Lipid Panel", "Creatinine"],
    followUp: "Mar 15, 2026",
    priority: "elderly",
  },
  {
    id: 2, queue: "A-004", name: "Jose Dela Cruz", age: 57, gender: "M",
    date: "Mar 1, 2026", time: "9:28 AM", duration: "22 min",
    reason: "Diabetes check-up", status: "completed",
    diagnosis: "Type 2 Diabetes Mellitus (E11)",
    notes: "FBS last week was 148 mg/dL, slightly above target. Patient admits to occasional dietary lapses. Foot exam normal. No signs of peripheral neuropathy.",
    plan: "Metformin 500mg BID. Diet counseling reinforced. HbA1c in 3 months.",
    vitals: { bp: "142/90", temp: "36.5", hr: "78", spo2: "97", weight: "78", height: "165" },
    labOrdered: ["HbA1c", "FBS", "Urinalysis"],
    followUp: "Jun 1, 2026",
    priority: null,
  },
  {
    id: 3, queue: "B-003", name: "Luisa Ramos", age: 28, gender: "F",
    date: "Feb 28, 2026", time: "2:15 PM", duration: "15 min",
    reason: "Prenatal check-up", status: "completed",
    diagnosis: "Normal pregnancy (Z34)",
    notes: "Fundal height appropriate for gestational age. FHT 148 bpm. No contractions. BP within normal limits. Patient reports mild ankle swelling — reassured, normal finding.",
    plan: "Continue prenatal vitamins. Next prenatal check in 4 weeks. Advised light activity only.",
    vitals: { bp: "116/74", temp: "36.6", hr: "72", spo2: "99", weight: "58", height: "162" },
    labOrdered: [],
    followUp: "Mar 28, 2026",
    priority: "pregnant",
  },
  {
    id: 4, queue: "B-004", name: "Pedro Bautista", age: 51, gender: "M",
    date: "Feb 28, 2026", time: "10:00 AM", duration: "20 min",
    reason: "Annual physical exam", status: "completed",
    diagnosis: "Routine health examination (Z00.00)",
    notes: "Generally healthy. BMI slightly elevated at 27.2. Blood pressure normal. Recommended lifestyle modifications. ECG normal. Advised to start light aerobic exercise.",
    plan: "Diet modification counseling. Repeat labs in 6 months. Flu vaccine administered.",
    vitals: { bp: "124/80", temp: "36.5", hr: "76", spo2: "99", weight: "82", height: "173" },
    labOrdered: ["CBC", "Lipid Panel", "FBS", "Urinalysis"],
    followUp: "Aug 28, 2026",
    priority: "pwd",
  },
  {
    id: 5, queue: "C-001", name: "Ana Lim", age: 28, gender: "F",
    date: "Feb 25, 2026", time: "11:30 AM", duration: "12 min",
    reason: "Fever & cough", status: "completed",
    diagnosis: "Acute upper respiratory tract infection (J06.9)",
    notes: "Temp 38.2°C at consult. Productive cough x 3 days. No dyspnea. Lungs clear on auscultation. CBC showed mild leukocytosis.",
    plan: "Paracetamol 500mg q6h PRN. Ambroxol 30mg TID. Increase fluid intake. Return if no improvement in 5 days.",
    vitals: { bp: "110/70", temp: "38.2", hr: "96", spo2: "97", weight: "52", height: "155" },
    labOrdered: ["CBC"],
    followUp: "Mar 2, 2026",
    priority: null,
  },
  {
    id: 6, queue: "C-002", name: "Ramon Valdez", age: 45, gender: "M",
    date: "Feb 22, 2026", time: "3:00 PM", duration: "25 min",
    reason: "Back pain assessment", status: "completed",
    diagnosis: "Lumbar muscle strain (M54.5)",
    notes: "Pain started after heavy lifting 1 week ago. Radiates to left buttock. No saddle anesthesia. Straight leg raise negative bilaterally. X-ray ordered.",
    plan: "Mefenamic acid 500mg TID x 5 days. Muscle relaxant. Avoid heavy lifting. Physical therapy referral.",
    vitals: { bp: "128/82", temp: "36.4", hr: "80", spo2: "98", weight: "85", height: "168" },
    labOrdered: ["Lumbar X-ray"],
    followUp: "Mar 8, 2026",
    priority: null,
  },
];

const priorityConfig = {
  elderly:   { label: "Senior Citizen", icon: "👴", color: "#7b5ea7", bg: "#f0eafb", stripe: "#7b5ea7" },
  pregnant:  { label: "Pregnant",       icon: "🤰", color: "#d4709a", bg: "#fce8f4", stripe: "#d4709a" },
  pwd:       { label: "PWD",            icon: "♿", color: "#3b7dd8", bg: "#eef3fc", stripe: "#3b7dd8" },
  pediatric: { label: "Pedia (0–5)",    icon: "👶", color: "#e09040", bg: "#fdf3e8", stripe: "#e09040" },
};

const bpFlag   = bp => { if (!bp) return "normal"; const s = Number(bp.split("/")[0]); return s >= 140 ? "high" : s < 90 ? "low" : "normal"; };
const tempFlag = v  => { if (!v)  return "normal"; const n = Number(v); return n >= 37.8 ? "high" : n < 36 ? "low" : "normal"; };
const spo2Flag = v  => !v ? "normal" : Number(v) < 95 ? "low" : "normal";
const flagColor = { high: "#e07050", low: "#c04080", normal: "#3b7dd8" };
const flagBg    = { high: "#fdeee8", low: "#fce8f0", normal: "#eef3fc" };

function Avatar({ name, size = 36 }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const hue = (name.charCodeAt(0) * 41 + name.charCodeAt(1) * 19) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},40%,75%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: `hsl(${hue},40%,28%)`, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

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
          { icon: "⊞",  label: "Dashboard"                              },
          { icon: "📋", label: "Queue",         badge: "4"              },
          { icon: "🩺", label: "Consultations", active: true            },
          { icon: "🗂️", label: "Patient Records"                        },
          { icon: "📅", label: "Appointments",  badge: "3"              },
        ].map(item => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10, marginBottom: 2, cursor: "pointer",
            background: item.active ? "rgba(59,125,216,0.22)" : "transparent",
            color: item.active ? "#7eb3f5" : "rgba(255,255,255,0.55)",
            fontWeight: item.active ? 600 : 400, fontSize: 14, transition: "all 0.2s",
          }}
            onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}}
            onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}}
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

function DetailPanel({ consult }) {
  if (!consult) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9aabc0", flexDirection: "column", gap: 10, background: "#f7f9fd" }}>
      <div style={{ fontSize: 48 }}>🩺</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2540" }}>Select a consultation</div>
      <div style={{ fontSize: 13 }}>Click any record to view details</div>
    </div>
  );

  const v = consult.vitals;
  const bmi = v ? (Number(v.weight) / Math.pow(Number(v.height) / 100, 2)).toFixed(1) : null;
  const pc = consult.priority ? priorityConfig[consult.priority] : null;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "26px 28px", background: "#f7f9fd" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar name={consult.name} size={54} />
            {pc && <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 16 }}>{pc.icon}</span>}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1a2540", fontFamily: "'Fraunces',serif" }}>{consult.name}</div>
            <div style={{ fontSize: 13, color: "#7a8fb0", marginTop: 2 }}>{consult.age} yrs · {consult.gender} · {consult.queue}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#9aabc0", background: "white", border: "1px solid #e8edf7", borderRadius: 6, padding: "2px 8px" }}>{consult.date} · {consult.time} · {consult.duration}</span>
              {pc && <span style={{ background: pc.bg, color: pc.color, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>{pc.icon} {pc.label}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {consult.status === "active" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#eef3fc", border: "1px solid #c0d4f5", borderRadius: 9, padding: "6px 14px" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3b7dd8", animation: "pulse 1.4s infinite" }} />
              <span style={{ fontSize: 12, color: "#3b7dd8", fontWeight: 600 }}>Active</span>
            </div>
          )}
          {consult.status === "completed" && (
            <div style={{ background: "#e8f7f5", borderRadius: 9, padding: "6px 14px", fontSize: 12, color: "#2a9d8f", fontWeight: 600 }}>✓ Completed</div>
          )}
          <button style={{ background: "white", border: "1px solid #dce5f3", borderRadius: 9, padding: "7px 14px", fontSize: 12, color: "#3b7dd8", cursor: "pointer", fontWeight: 600 }}>🖨 Print</button>
        </div>
      </div>

      {/* Diagnosis */}
      <div style={{ background: "linear-gradient(135deg,#eef3fc,#e4ecfb)", borderRadius: 14, padding: "16px 20px", marginBottom: 14, border: "1px solid #d0ddf5" }}>
        <div style={{ fontSize: 11, color: "#7a8fb0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 }}>Diagnosis</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#1a2540", fontFamily: "'Fraunces',serif" }}>{consult.diagnosis}</div>
        <div style={{ fontSize: 13, color: "#5a6f90", marginTop: 3 }}>Chief complaint: {consult.reason}</div>
      </div>

      {/* Notes + Plan */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #e8edf7" }}>
          <div style={{ fontSize: 11, color: "#9aabc0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 9 }}>📝 Doctor's Notes</div>
          <div style={{ fontSize: 13, color: "#2a3550", lineHeight: 1.75 }}>{consult.notes}</div>
        </div>
        <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #d0ddf5" }}>
          <div style={{ fontSize: 11, color: "#3b7dd8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 9 }}>📋 Treatment Plan</div>
          <div style={{ fontSize: 13, color: "#2a3550", lineHeight: 1.75 }}>{consult.plan}</div>
        </div>
      </div>

      {/* Vitals */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "#9aabc0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Vitals at Consultation</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {[
            { label: "Blood Pressure", value: v.bp,   unit: "mmHg",  flag: bpFlag(v.bp),    icon: "❤️" },
            { label: "Temperature",    value: v.temp,  unit: "°C",    flag: tempFlag(v.temp), icon: "🌡️" },
            { label: "Heart Rate",     value: v.hr,    unit: "bpm",   flag: "normal",         icon: "💓" },
            { label: "SpO₂",           value: v.spo2,  unit: "%",     flag: spo2Flag(v.spo2), icon: "🫁" },
            { label: "BMI",            value: bmi,     unit: "kg/m²", flag: Number(bmi) > 25 ? "high" : "normal", icon: "📐" },
          ].map(f => (
            <div key={f.label} style={{ background: flagBg[f.flag], borderRadius: 12, padding: "11px 8px", border: `1.5px solid ${f.flag !== "normal" ? flagColor[f.flag] + "40" : "#e8edf7"}`, textAlign: "center" }}>
              <div style={{ fontSize: 14, marginBottom: 3 }}>{f.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: flagColor[f.flag], fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{f.value}</div>
              <div style={{ fontSize: 9, color: "#9aabc0", marginTop: 2 }}>{f.unit}</div>
              <div style={{ fontSize: 9, color: "#b0bdd6", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.3 }}>{f.label}</div>
              {f.flag !== "normal" && <div style={{ fontSize: 9, color: flagColor[f.flag], fontWeight: 700, marginTop: 2 }}>⚠ {f.flag}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Labs + Follow-up */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #e8edf7" }}>
          <div style={{ fontSize: 11, color: "#9aabc0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 9 }}>🧪 Labs Ordered</div>
          {consult.labOrdered.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {consult.labOrdered.map(l => <span key={l} style={{ background: "#eef3fc", color: "#3b7dd8", borderRadius: 7, padding: "4px 12px", fontSize: 12, fontWeight: 500 }}>{l}</span>)}
            </div>
          ) : <div style={{ fontSize: 13, color: "#9aabc0" }}>No labs ordered</div>}
        </div>
        <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #e8edf7" }}>
          <div style={{ fontSize: 11, color: "#9aabc0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 9 }}>📅 Follow-up</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1a2540", fontFamily: "'Fraunces',serif" }}>{consult.followUp}</div>
          <button style={{ marginTop: 10, background: "#f0f4fb", border: "1px solid #dce5f3", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#3b7dd8", cursor: "pointer", fontWeight: 600 }}>Add to Schedule</button>
        </div>
      </div>
    </div>
  );
}

export default function DoctorConsultations() {
  const [selected, setSelected]     = useState(consultations[0]);
  const [search, setSearch]         = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [notifOpen, setNotifOpen]   = useState(false);

  const today     = "Mar 1, 2026";
  const yesterday = "Feb 28, 2026";

  const filtered = consultations.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.diagnosis.toLowerCase().includes(search.toLowerCase());
    const matchDate = dateFilter === "all" ? true : dateFilter === "today" ? c.date === today : c.date === yesterday;
    return matchSearch && matchDate;
  });

  const grouped = filtered.reduce((acc, c) => {
    const key = c.date === today ? "Today" : c.date === yesterday ? "Yesterday" : c.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const todayCount     = consultations.filter(c => c.date === today).length;
  const activeCount    = consultations.filter(c => c.status === "active").length;
  const completedCount = consultations.filter(c => c.status === "completed").length;
  const priorityCount  = consultations.filter(c => c.priority).length;

  return (
    <div style={{ height: "100vh", background: "#f0f4fb", fontFamily: "'DM Sans',sans-serif", display: "flex", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #c8d9f5; border-radius: 4px; }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn  { from{transform:scale(0.93);opacity:0} to{transform:scale(1);opacity:1} }
      `}</style>

      <Sidebar />

      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ background: "#f0f4fb", borderBottom: "1px solid #dce5f3", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontFamily: "'Fraunces',serif", fontWeight: 700, color: "#1a2540" }}>Consultations</h1>
            <div style={{ fontSize: 13, color: "#7a8fb0", marginTop: 2 }}>{todayCount} today · {consultations.length} total records</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 7 }}>
              {[
                { label: "Today",     value: todayCount,     color: "#3b7dd8", bg: "#eef3fc" },
                { label: "Active",    value: activeCount,    color: "#e09040", bg: "#fdf3e8" },
                { label: "Completed", value: completedCount, color: "#2a7d5f", bg: "#e8f7f1" },
                { label: "Priority",  value: priorityCount,  color: "#7b5ea7", bg: "#f0eafb" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "6px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: s.color, opacity: 0.8, letterSpacing: 0.3 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setNotifOpen(o => !o)} style={{ background: "white", border: "1px solid #dce5f3", borderRadius: 10, width: 40, height: 40, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                🔔
                <div style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: "#e07050", border: "1.5px solid #f0f4fb" }} />
              </button>
              {notifOpen && (
                <div style={{ position: "absolute", right: 0, top: 48, width: 280, background: "white", borderRadius: 14, border: "1px solid #dce5f3", boxShadow: "0 12px 40px rgba(20,40,90,0.14)", zIndex: 100, animation: "popIn 0.2s ease" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f3fa", fontSize: 13, fontWeight: 700, color: "#1a2540" }}>Alerts</div>
                  {[
                    { icon: "🧪", text: "Lab results ready: Jose Dela Cruz", time: "22m ago" },
                    { icon: "📅", text: "Follow-up reminder: Ana Lim (Mar 2)", time: "1h ago" },
                  ].map((n, i) => (
                    <div key={i} style={{ padding: "10px 16px", borderBottom: "1px solid #f7f9fd", display: "flex", gap: 10 }}>
                      <span>{n.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, color: "#1a2540" }}>{n.text}</div>
                        <div style={{ fontSize: 11, color: "#b0bdd6" }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Split */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "320px 1fr", overflow: "hidden" }}>
          {/* List */}
          <div style={{ background: "white", borderRight: "1px solid #dce5f3", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #f0f3fa" }}>
              <div style={{ position: "relative", marginBottom: 10 }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#9aabc0" }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient or diagnosis..."
                  style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1.5px solid #e8edf7", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: "#1a2540", outline: "none", background: "#f7f9fd" }}
                  onFocus={e => e.target.style.borderColor = "#3b7dd8"}
                  onBlur={e => e.target.style.borderColor = "#e8edf7"}
                />
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {["all", "today", "yesterday"].map(d => (
                  <button key={d} onClick={() => setDateFilter(d)} style={{ background: dateFilter === d ? "#1a2540" : "#f0f4fb", color: dateFilter === d ? "white" : "#7a8fb0", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: dateFilter === d ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                    {d === "all" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
              {Object.entries(grouped).map(([groupDate, items]) => (
                <div key={groupDate}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#9aabc0", letterSpacing: 0.8, textTransform: "uppercase", padding: "10px 6px 6px" }}>{groupDate}</div>
                  {items.map((c, i) => {
                    const isActive = c.status === "active";
                    const isSel    = selected?.id === c.id;
                    const pc = c.priority ? priorityConfig[c.priority] : null;
                    return (
                      <div key={c.id} onClick={() => setSelected(c)} style={{
                        padding: "11px 12px", borderRadius: 12, marginBottom: 4, cursor: "pointer",
                        background: isSel ? "#eef3fc" : "transparent",
                        border: `1.5px solid ${isSel ? "#c0d4f5" : "transparent"}`,
                        transition: "all 0.15s", animation: `fadeIn 0.3s ease ${i * 0.04}s both`,
                        position: "relative", overflow: "hidden",
                      }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "#f7f9fd"; }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                      >
                        {pc && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: pc.stripe, borderRadius: "12px 0 0 12px" }} />}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, paddingLeft: pc ? 7 : 0 }}>
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <Avatar name={c.name} size={34} />
                            {pc && <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 11 }}>{pc.icon}</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2540" }}>{c.name}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                {isActive && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b7dd8", animation: "pulse 1.4s infinite" }} />}
                                <span style={{ fontSize: 11, color: isActive ? "#3b7dd8" : "#9aabc0", fontWeight: isActive ? 600 : 400 }}>{c.time}</span>
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: "#7a8fb0", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.diagnosis}</div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                              <span style={{ fontSize: 11, color: "#b0bdd6" }}>{c.queue} · {c.duration}</span>
                              {isActive && <span style={{ background: "#eef3fc", color: "#3b7dd8", borderRadius: 5, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>ACTIVE</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "#9aabc0" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontSize: 14 }}>No consultations found</div>
                </div>
              )}
            </div>
          </div>

          {/* Detail */}
          <div style={{ display: "flex", overflow: "hidden" }}>
            <DetailPanel consult={selected} />
          </div>
        </div>
      </div>
    </div>
  );
}
