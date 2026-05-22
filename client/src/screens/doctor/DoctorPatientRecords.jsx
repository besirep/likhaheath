import { useState } from "react";
import { Search, Building2, Plus, Stethoscope, ClipboardList, CalendarDays, FolderOpen, Heart, Thermometer, Wind, Scale, User, AlertTriangle, Phone, FileText, LayoutDashboard, Activity, X, Ruler, Droplets, MapPin, TestTubes, Printer, Pencil } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ── Data ──────────────────────────────────────────────────────────────────────
const patients = [
  {
    id: 1, name: "Maria Santos", age: 34, gender: "F", dob: "May 12, 1991",
    contact: "+63 912 345 6789", address: "142 Rizal St., Quezon City",
    bloodType: "A+", allergies: ["Penicillin"], status: "active",
    conditions: ["Hypertension", "Hyperlipidemia"],
    lastVisit: "Mar 1, 2026", totalVisits: 12,
    vitalsHistory: [
      { date: "Sep", bp: 145, hr: 88, weight: 63 },
      { date: "Oct", bp: 142, hr: 85, weight: 63 },
      { date: "Nov", bp: 140, hr: 84, weight: 62 },
      { date: "Dec", bp: 138, hr: 83, weight: 62 },
      { date: "Jan", bp: 136, hr: 82, weight: 62 },
      { date: "Feb", bp: 138, hr: 82, weight: 62 },
    ],
    visits: [
      {
        id: "v1", date: "Mar 1, 2026", time: "9:05 AM", queue: "A-001", duration: "18 min",
        reason: "Hypertension follow-up",
        diagnosis: "Essential Hypertension (I10)",
        notes: "Patient reports occasional morning headaches. BP slightly elevated. Currently on Amlodipine 5mg. Advised to reduce sodium intake and continue daily walks.",
        plan: "Continue Amlodipine 5mg OD. Salt-restricted diet. Follow-up in 2 weeks.",
        vitals: { bp: "138/88", temp: "36.7", hr: "82", spo2: "98", weight: "62", height: "158" },
        labs: ["Lipid Panel", "Creatinine"],
        followUp: "Mar 15, 2026",
      },
      {
        id: "v2", date: "Jan 14, 2026", time: "10:30 AM", queue: "B-003", duration: "15 min",
        reason: "Hypertension check",
        diagnosis: "Essential Hypertension (I10)",
        notes: "BP still elevated at 142/90. Headaches less frequent. Medication compliance confirmed. Discussed dietary modifications again.",
        plan: "Increase Amlodipine to 10mg OD. Recheck BP in 6 weeks.",
        vitals: { bp: "142/90", temp: "36.5", hr: "85", spo2: "97", weight: "62", height: "158" },
        labs: ["Lipid Panel"],
        followUp: "Mar 1, 2026",
      },
      {
        id: "v3", date: "Nov 3, 2025", time: "2:00 PM", queue: "C-007", duration: "12 min",
        reason: "Flu symptoms",
        diagnosis: "Acute upper respiratory infection (J06.9)",
        notes: "Temp 37.9°C. Sore throat, runny nose x 2 days. No dyspnea. Throat mildly erythematous. Lungs clear.",
        plan: "Paracetamol 500mg q6h PRN. Rest and hydration. Return if no improvement in 5 days.",
        vitals: { bp: "136/84", temp: "37.9", hr: "90", spo2: "98", weight: "62", height: "158" },
        labs: [],
        followUp: null,
      },
      {
        id: "v4", date: "Aug 22, 2025", time: "9:00 AM", queue: "A-012", duration: "25 min",
        reason: "Annual physical exam",
        diagnosis: "Routine health examination (Z00.00)",
        notes: "Generally in good health. BP 145/92 — hypertension confirmed and treatment started. BMI 24.8, within normal range. ECG normal.",
        plan: "Start Amlodipine 5mg OD. Salt-restricted diet. Follow-up in 3 months.",
        vitals: { bp: "145/92", temp: "36.6", hr: "88", spo2: "99", weight: "63", height: "158" },
        labs: ["CBC", "Lipid Panel", "FBS", "Urinalysis", "ECG"],
        followUp: "Nov 3, 2025",
      },
    ],
  },
  {
    id: 2, name: "Jose Dela Cruz", age: 57, gender: "M", dob: "Feb 3, 1969",
    contact: "+63 917 234 5678", address: "89 Mabini Ave., Manila",
    bloodType: "O+", allergies: ["Sulfa drugs"], status: "active",
    conditions: ["Type 2 Diabetes", "Hypertension"],
    lastVisit: "Mar 1, 2026", totalVisits: 24,
    vitalsHistory: [
      { date: "Sep", bp: 148, hr: 80, weight: 80 },
      { date: "Oct", bp: 146, hr: 79, weight: 79 },
      { date: "Nov", bp: 145, hr: 80, weight: 79 },
      { date: "Dec", bp: 143, hr: 78, weight: 78 },
      { date: "Jan", bp: 142, hr: 78, weight: 78 },
      { date: "Feb", bp: 142, hr: 78, weight: 78 },
    ],
    visits: [
      {
        id: "v1", date: "Mar 1, 2026", time: "9:28 AM", queue: "A-002", duration: "22 min",
        reason: "Diabetes check-up",
        diagnosis: "Type 2 Diabetes Mellitus (E11)",
        notes: "FBS last week was 148 mg/dL, slightly above target. Patient admits to occasional dietary lapses. Foot exam normal. No signs of peripheral neuropathy.",
        plan: "Metformin 500mg BID. Diet counseling reinforced. HbA1c in 3 months.",
        vitals: { bp: "142/90", temp: "36.5", hr: "78", spo2: "97", weight: "78", height: "165" },
        labs: ["HbA1c", "FBS", "Urinalysis"],
        followUp: "Jun 1, 2026",
      },
      {
        id: "v2", date: "Dec 10, 2025", time: "11:00 AM", queue: "B-005", duration: "18 min",
        reason: "BP monitoring",
        diagnosis: "Essential Hypertension (I10)",
        notes: "BP 143/88. Better controlled since last visit. Metformin continued. Patient reports compliance.",
        plan: "Continue Losartan 50mg OD. Repeat BP check in 3 months.",
        vitals: { bp: "143/88", temp: "36.6", hr: "80", spo2: "98", weight: "79", height: "165" },
        labs: ["Creatinine", "Electrolytes"],
        followUp: "Mar 1, 2026",
      },
      {
        id: "v3", date: "Sep 5, 2025", time: "2:30 PM", queue: "C-002", duration: "20 min",
        reason: "Diabetes follow-up",
        diagnosis: "Type 2 Diabetes Mellitus (E11)",
        notes: "HbA1c result 7.8% — slightly above target of 7%. Dietary recall showed high carb intake. Reinforced meal planning.",
        plan: "Increase Metformin to 1000mg BID. Refer to dietitian. Repeat HbA1c in 3 months.",
        vitals: { bp: "146/90", temp: "36.5", hr: "82", spo2: "97", weight: "80", height: "165" },
        labs: ["HbA1c", "FBS"],
        followUp: "Dec 10, 2025",
      },
    ],
  },
  {
    id: 3, name: "Elena Cruz", age: 66, gender: "F", dob: "Mar 18, 1960",
    contact: "+63 915 999 8877", address: "201 Del Pilar St., Caloocan",
    bloodType: "A-", allergies: ["Ibuprofen", "Contrast dye"], status: "urgent",
    conditions: ["Hypertension", "Type 2 Diabetes", "Coronary artery disease"],
    lastVisit: "Jan 20, 2026", totalVisits: 31,
    vitalsHistory: [
      { date: "Sep", bp: 158, hr: 88, weight: 68 },
      { date: "Oct", bp: 160, hr: 90, weight: 67 },
      { date: "Nov", bp: 155, hr: 87, weight: 67 },
      { date: "Dec", bp: 152, hr: 86, weight: 68 },
      { date: "Jan", bp: 155, hr: 88, weight: 68 },
    ],
    visits: [
      {
        id: "v1", date: "Jan 20, 2026", time: "1:00 PM", queue: "A-005", duration: "30 min",
        reason: "Chest discomfort",
        diagnosis: "Unstable angina (I20.0)",
        notes: "Patient presents with intermittent chest tightness x 3 days, worse on exertion. Radiates to left arm. ECG showed ST-segment changes. Troponin pending.",
        plan: "Admit for observation. Aspirin 300mg stat. Refer to cardiologist. Nitroglycerin PRN.",
        vitals: { bp: "158/95", temp: "36.8", hr: "92", spo2: "95", weight: "68", height: "155" },
        labs: ["Troponin I", "ECG", "CBC", "Coagulation studies"],
        followUp: "Cardiology referral",
      },
      {
        id: "v2", date: "Nov 10, 2025", time: "9:15 AM", queue: "B-002", duration: "25 min",
        reason: "BP + DM check",
        diagnosis: "Hypertension & Type 2 Diabetes (I10, E11)",
        notes: "BP 152/94 despite medication. HbA1c 8.2%. Adjusted medications. ECG normal at this visit.",
        plan: "Add Amlodipine 5mg to Losartan. Increase insulin dose. Follow-up in 6 weeks.",
        vitals: { bp: "152/94", temp: "36.6", hr: "86", spo2: "97", weight: "67", height: "155" },
        labs: ["HbA1c", "FBS", "Lipid Panel", "Creatinine"],
        followUp: "Jan 20, 2026",
      },
    ],
  },
  {
    id: 4, name: "Ana Lim", age: 28, gender: "F", dob: "Oct 9, 1997",
    contact: "+63 918 765 4321", address: "33 Luna St., Pasig City",
    bloodType: "B+", allergies: [], status: "active",
    conditions: [],
    lastVisit: "Feb 25, 2026", totalVisits: 5,
    vitalsHistory: [
      { date: "May", bp: 112, hr: 74, weight: 52 },
      { date: "Aug", bp: 110, hr: 72, weight: 52 },
      { date: "Nov", bp: 114, hr: 75, weight: 52 },
      { date: "Feb", bp: 110, hr: 96, weight: 52 },
    ],
    visits: [
      {
        id: "v1", date: "Feb 25, 2026", time: "11:30 AM", queue: "C-001", duration: "12 min",
        reason: "Fever & cough",
        diagnosis: "Acute URTI (J06.9)",
        notes: "Temp 38.2°C. Productive cough x 3 days. No dyspnea. CBC showed mild leukocytosis.",
        plan: "Paracetamol 500mg q6h PRN. Ambroxol 30mg TID. Return if no improvement in 5 days.",
        vitals: { bp: "110/70", temp: "38.2", hr: "96", spo2: "97", weight: "52", height: "155" },
        labs: ["CBC"],
        followUp: "Mar 2, 2026",
      },
      {
        id: "v2", date: "Aug 14, 2025", time: "10:00 AM", queue: "A-009", duration: "20 min",
        reason: "Annual check-up",
        diagnosis: "Routine exam (Z00.00)",
        notes: "Healthy 27-year-old female. All parameters within normal range. No complaints.",
        plan: "No medications required. Lifestyle maintenance. Annual follow-up.",
        vitals: { bp: "108/68", temp: "36.5", hr: "72", spo2: "99", weight: "52", height: "155" },
        labs: ["CBC", "Urinalysis", "FBS"],
        followUp: "Aug 2026",
      },
    ],
  },
  {
    id: 5, name: "Ramon Valdez", age: 45, gender: "M", dob: "Jun 22, 1980",
    contact: "+63 920 111 2233", address: "77 Bonifacio Rd., Marikina",
    bloodType: "AB-", allergies: ["Aspirin"], status: "active",
    conditions: ["Lumbar strain", "Mild obesity"],
    lastVisit: "Feb 22, 2026", totalVisits: 8,
    vitalsHistory: [
      { date: "Jun", bp: 130, hr: 82, weight: 87 },
      { date: "Sep", bp: 128, hr: 81, weight: 86 },
      { date: "Dec", bp: 126, hr: 80, weight: 85 },
      { date: "Feb", bp: 128, hr: 80, weight: 85 },
    ],
    visits: [
      {
        id: "v1", date: "Feb 22, 2026", time: "3:00 PM", queue: "C-002", duration: "25 min",
        reason: "Back pain",
        diagnosis: "Lumbar muscle strain (M54.5)",
        notes: "Pain started after heavy lifting 1 week ago. Radiates to left buttock. Straight leg raise negative bilaterally.",
        plan: "Mefenamic acid 500mg TID x 5 days. Muscle relaxant. Physical therapy referral.",
        vitals: { bp: "128/82", temp: "36.4", hr: "80", spo2: "98", weight: "85", height: "168" },
        labs: ["Lumbar X-ray"],
        followUp: "Mar 8, 2026",
      },
      {
        id: "v2", date: "Oct 3, 2025", time: "11:45 AM", queue: "B-008", duration: "15 min",
        reason: "Back pain follow-up",
        diagnosis: "Lumbar muscle strain (M54.5)",
        notes: "Patient reports 60% improvement. PT sessions completed. Mild residual stiffness in the morning.",
        plan: "Continue stretching exercises. Warm compress. Return if pain worsens.",
        vitals: { bp: "126/80", temp: "36.5", hr: "81", spo2: "98", weight: "86", height: "168" },
        labs: [],
        followUp: "As needed",
      },
    ],
  },
];

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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #CCDAF0", borderRadius: 10, padding: "8px 12px", boxShadow: "0 4px 16px rgba(20,40,90,0.1)", fontSize: 14 }}>
      <div style={{ color: "#9aabc0", marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: <span style={{ color: "#1a2540" }}>{p.value}{p.name === "BP" ? " mmHg" : p.name === "HR" ? " bpm" : " kg"}</span></div>
      ))}
    </div>
  );
};

function Sidebar() {
  return (
    <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 220, background: "#1a2540", display: "flex", flexDirection: "column", zIndex: 10, boxShadow: "3px 0 20px rgba(20,40,90,0.18)" }}>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0047AB,#1565D8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}><Building2 size={18} strokeWidth={2} /></div>
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
          { Icon: LayoutDashboard,  label: "Dashboard"                              },
          { Icon: ClipboardList, label: "Queue",          badge: "4"             },
          { Icon: Stethoscope, label: "Consultations",  badge: "1"             },
          { Icon: FolderOpen, label: "Patient Records", active: true          },
          { Icon: CalendarDays, label: "Appointments",   badge: "3"             },
        ].map(item => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10, marginBottom: 2, cursor: "pointer",
            background: item.active ? "rgba(0,71,171,0.22)" : "transparent",
            color: item.active ? "#7eb3f5" : "rgba(255,255,255,0.55)",
            fontWeight: item.active ? 600 : 400, fontSize: 14, transition: "all 0.2s",
          }}
            onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}}
            onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}}
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

// ── Visit Drawer ──────────────────────────────────────────────────────────────
function VisitDrawer({ visit, patient, onClose }) {
  const [editMode, setEditMode] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedPlan, setEditedPlan]  = useState('');
  const [saved, setSaved] = useState(false);

  // Reset when visit changes
  useState(() => { setEditMode(false); setSaved(false); }, [visit?.id]);
  const show = !!visit;
  if (!visit && !show) return null;

  const v = visit?.vitals;
  const bmi = v ? (Number(v.weight) / Math.pow(Number(v.height) / 100, 2)).toFixed(1) : null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(20,35,70,0.25)",
        zIndex: 90, opacity: show ? 1 : 0,
        transition: "opacity 0.25s ease",
        pointerEvents: show ? "auto" : "none",
      }} />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 480, background: "white",
        zIndex: 100, overflowY: "auto",
        boxShadow: "-8px 0 40px rgba(20,40,90,0.18)",
        transform: show ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.32s cubic-bezier(0.22,1,0.36,1)",
        display: "flex", flexDirection: "column",
      }}>
        <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>

        {/* Drawer header */}
        <div style={{
          background: "linear-gradient(135deg,#1a2540,#263760)",
          padding: "22px 24px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>Consultation Record</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "white" }}>{visit?.diagnosis}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                {patient?.name} · {visit?.date} · {visit?.time}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.12)", border: "none", width: 34, height: 34,
              borderRadius: 9, cursor: "pointer", fontSize: 15, color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><X size={16} strokeWidth={2} /></button>
          </div>
          {/* Meta row */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {[
              { label: visit?.queue },
              { label: visit?.duration },
              { label: visit?.reason },
            ].map(m => (
              <span key={m.label} style={{
                background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)",
                borderRadius: 7, padding: "3px 10px", fontSize: 14,
              }}>{m.label}</span>
            ))}
          </div>
        </div>

        {/* Drawer body */}
        <div style={{ flex: 1, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Vitals */}
          <div>
            <div style={{ fontSize: 14, color: "#9aabc0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Vitals at This Visit</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {v && [
                { label: "Blood Pressure", value: v.bp,   unit: "mmHg", flag: bpFlag(v.bp),    icon: Heart },
                { label: "Temperature",    value: v.temp, unit: "°C",   flag: tempFlag(v.temp), icon: Thermometer },
                { label: "Heart Rate",     value: v.hr,   unit: "bpm",  flag: "normal",         icon: Activity },
                { label: "SpO₂",          value: v.spo2, unit: "%",    flag: spo2Flag(v.spo2), icon: Wind },
                { label: "Weight",         value: v.weight, unit: "kg", flag: "normal",         icon: Scale },
                { label: "BMI",            value: bmi,    unit: "kg/m²",flag: Number(bmi) > 25 ? "high" : "normal", Icon: Ruler },
              ].map(f => (
                <div key={f.label} style={{
                  background: flagBg[f.flag], borderRadius: 11, padding: "11px 13px",
                  border: `1.5px solid ${f.flag !== "normal" ? flagColor[f.flag] + "35" : "#e8edf7"}`,
                }}>
                  <div style={{ fontSize: 15, marginBottom: 3 }}>{f.icon}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: flagColor[f.flag], lineHeight: 1 }}>{f.value}</div>
                  <div style={{ fontSize: 11, color: "#9aabc0", marginTop: 1 }}>{f.unit}</div>
                  <div style={{ fontSize: 11, color: "#b0bdd6", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.3 }}>{f.label}</div>
                  {f.flag !== "normal" && <div style={{ fontSize: 11, color: flagColor[f.flag], fontWeight: 700, marginTop: 2 }}><AlertTriangle size={14} strokeWidth={2} /> {f.flag}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ background: "#f7f9fd", borderRadius: 13, padding: "16px 18px", border: "1px solid #e8edf7" }}>
            <div style={{ fontSize: 14, color: "#9aabc0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}><FileText size={16} strokeWidth={2} /> Doctor's Notes</div>
            <div style={{ fontSize: 14, color: "#2a3550", lineHeight: 1.75 }}>{visit?.notes}</div>
          </div>

          {/* Treatment plan */}
          <div style={{ background: "#EBF0FA", borderRadius: 13, padding: "16px 18px", border: "1px solid #C0D4F0" }}>
            <div style={{ fontSize: 14, color: "#0047AB", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}><ClipboardList size={16} strokeWidth={2} /> Treatment Plan</div>
            <div style={{ fontSize: 14, color: "#2a3550", lineHeight: 1.75 }}>{visit?.plan}</div>
          </div>

          {/* Labs + follow-up */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "white", borderRadius: 13, padding: "14px 16px", border: "1px solid #D8E4F2" }}>
              <div style={{ fontSize: 14, color: "#9aabc0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}><TestTubes size={16} strokeWidth={2} /> Labs Ordered</div>
              {visit?.labs?.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {visit.labs.map(l => (
                    <span key={l} style={{ background: "#EBF0FA", color: "#0047AB", borderRadius: 7, padding: "3px 10px", fontSize: 14, fontWeight: 500 }}>{l}</span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: "#9aabc0" }}>None ordered</div>
              )}
            </div>
            <div style={{ background: "white", borderRadius: 13, padding: "14px 16px", border: "1px solid #D8E4F2" }}>
              <div style={{ fontSize: 14, color: "#9aabc0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Follow-up</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1a2540" }}>{visit?.followUp || "—"}</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={() => {
              const win = window.open('', '_blank');
              win.document.write(`<html><body style="font-family:sans-serif;padding:24px;max-width:700px">
                <h2>Visit Record &mdash; ${patient?.name}</h2>
                <p><b>Date:</b> ${visit.date} ${visit.time} &nbsp;<b>Queue:</b> ${visit.queue} &nbsp;<b>Duration:</b> ${visit.duration}</p>
                <hr/><p><b>Diagnosis:</b> ${visit.diagnosis}</p>
                <p><b>Chief Complaint:</b> ${visit.reason}</p>
                <p><b>Doctor's Notes:</b><br>${(editMode && saved ? editedNotes : visit.notes).replace(/\n/g,'<br>')}</p>
                <p><b>Treatment Plan:</b><br>${(editMode && saved ? editedPlan : visit.plan).replace(/\n/g,'<br>')}</p>
                <p><b>Follow-up:</b> ${visit.followUp || 'None'}</p>
                <p style="margin-top:32px;color:#888">Printed ${new Date().toLocaleString()}</p>
              </body></html>`);
              win.print(); win.close();
            }} style={{ flex: 1, background: "#EBF0FA", border: "1px solid #CCDAF0", borderRadius: 10, padding: "10px", fontSize: 14, color: "#0047AB", cursor: "pointer", fontWeight: 600 }}><Printer size={16} strokeWidth={2} /> Print Record</button>
            <button onClick={() => { setEditMode(e => !e); setEditedNotes(visit.notes); setEditedPlan(visit.plan); }} style={{ flex: 1, background: editMode ? "#e8f7f5" : "#1a2540", border: "none", borderRadius: 10, padding: "10px", fontSize: 14, color: editMode ? "#2a9d8f" : "white", cursor: "pointer", fontWeight: 600 }}>{editMode ? '<X size={16} strokeWidth={2} /> Cancel Edit' : 'Edit Notes'}</button>
          </div>
          {editMode && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#9aabc0", textTransform: "uppercase", marginBottom: 6 }}>Edit Doctor's Notes</div>
                <textarea value={editedNotes} onChange={e => setEditedNotes(e.target.value)} rows={4} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #CCDAF0", borderRadius: 10, fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#9aabc0", textTransform: "uppercase", marginBottom: 6 }}>Edit Treatment Plan</div>
                <textarea value={editedPlan} onChange={e => setEditedPlan(e.target.value)} rows={3} style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #CCDAF0", borderRadius: 10, fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <button onClick={() => { setSaved(true); setEditMode(false); }} style={{ background: "linear-gradient(135deg,#0047AB,#1565D8)", color: "white", border: "none", borderRadius: 10, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,71,171,0.28)" }}>Save Changes</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Profile Panel ─────────────────────────────────────────────────────────────
function ProfilePanel({ patient, onVisitSelect, selectedVisitId, onSchedule, onEdit }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!patient) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#9aabc0" }}>
      <div style={{ fontSize: 52 }}><FolderOpen size={16} strokeWidth={2} /></div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2540" }}>Select a patient</div>
      <div style={{ fontSize: 14 }}>Click any record to view their profile</div>
    </div>
  );

  const ss = statusStyle[patient.status];

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Profile header */}
      <div style={{ background: "linear-gradient(135deg,#1a2540 0%,#263760 100%)", padding: "28px 28px 22px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Avatar name={patient.name} size={58} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "white" }}>{patient.name}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>{patient.age} yrs · {patient.gender} · DOB: {patient.dob}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <span style={{ background: ss.bg, color: ss.color, borderRadius: 7, padding: "3px 10px", fontSize: 14, fontWeight: 700 }}>{ss.label}</span>
                <span style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", borderRadius: 7, padding: "3px 10px", fontSize: 14 }}><Droplets size={16} strokeWidth={2} /> {patient.bloodType}</span>
                <span style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", borderRadius: 7, padding: "3px 10px", fontSize: 14 }}><ClipboardList size={16} strokeWidth={2} /> {patient.totalVisits} visits</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onSchedule && onSchedule(patient)} style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Schedule</button>
            <button onClick={() => onEdit && onEdit(patient)} style={{ background: "white", color: "#1a2540", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}><Pencil size={14} strokeWidth={2.5} /> Edit</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {[{ icon: Phone, label: patient.contact }, { Icon: MapPin, label: patient.address }, { Icon: CalendarDays, label: `Last visit: ${patient.lastVisit}` }].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
              <span>{item.icon}</span>{item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "white", borderBottom: "1px solid #CCDAF0", padding: "0 28px", display: "flex", flexShrink: 0 }}>
        {["overview", "vitals", "history"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            background: "none", border: "none", padding: "14px 20px",
            fontSize: 14, fontWeight: activeTab === t ? 700 : 400,
            color: activeTab === t ? "#0047AB" : "#7a8fb0",
            borderBottom: activeTab === t ? "2.5px solid #0047AB" : "2.5px solid transparent",
            cursor: "pointer", textTransform: "capitalize", marginBottom: -1,
            transition: "color 0.15s",
          }}>{t === "history" ? `Visit History (${patient.visits.length})` : t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: "24px 28px", background: "#f7f9fd" }}>

        {/* Overview */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #D8E4F2" }}>
                <div style={{ fontSize: 14, color: "#9aabc0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}><Building2 size={18} strokeWidth={2} /> Active Conditions</div>
                {patient.conditions.length > 0 ? patient.conditions.map(c => (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0047AB", flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: "#1a2540", fontWeight: 500 }}>{c}</span>
                  </div>
                )) : <div style={{ fontSize: 14, color: "#9aabc0" }}>No active conditions</div>}
              </div>
              <div style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #D8E4F2" }}>
                <div style={{ fontSize: 14, color: "#9aabc0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>Allergies</div>
                {patient.allergies.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {patient.allergies.map(a => (
                      <span key={a} style={{ background: "#fde8e0", color: "#CC0000", borderRadius: 8, padding: "5px 12px", fontSize: 14, fontWeight: 600, border: "1px solid #f5c8b0" }}><AlertTriangle size={14} strokeWidth={2} /> {a}</span>
                    ))}
                  </div>
                ) : <div style={{ fontSize: 14, color: "#9aabc0" }}>No known allergies</div>}
              </div>
            </div>
            <div style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #D8E4F2" }}>
              <div style={{ fontSize: 14, color: "#9aabc0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 14 }}><User size={16} strokeWidth={2} /> Personal Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
                {[
                  { label: "Date of Birth", value: patient.dob },
                  { label: "Blood Type",    value: patient.bloodType },
                  { label: "Gender",        value: patient.gender === "F" ? "Female" : "Male" },
                  { label: "Contact",       value: patient.contact },
                  { label: "Address",       value: patient.address },
                  { label: "Total Visits",  value: `${patient.totalVisits} visits` },
                ].map((f, i) => (
                  <div key={f.label} style={{ padding: "12px 0", borderBottom: i < 3 ? "1px solid #f0f3fa" : "none", paddingRight: 16 }}>
                    <div style={{ fontSize: 14, color: "#9aabc0", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>{f.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2540" }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {patient.visits[0] && (
              <div style={{ background: "linear-gradient(135deg,#EBF0FA,#e4ecfb)", borderRadius: 14, padding: "18px 20px", border: "1px solid #B0C8E8", cursor: "pointer" }}
                onClick={() => { onVisitSelect(patient.visits[0]); setActiveTab("history"); }}>
                <div style={{ fontSize: 14, color: "#0047AB", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}><Stethoscope size={16} strokeWidth={2} /> Last Consultation — click to view</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1a2540" }}>{patient.visits[0].diagnosis}</div>
                <div style={{ fontSize: 14, color: "#5a6f90", marginTop: 3 }}>{patient.visits[0].date} · {patient.visits[0].reason}</div>
              </div>
            )}
          </div>
        )}

        {/* Vitals */}
        {activeTab === "vitals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "white", borderRadius: 14, padding: "20px 22px", border: "1px solid #D8E4F2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1a2540" }}>Blood Pressure Trend</div>
                  <div style={{ fontSize: 14, color: "#9aabc0", marginTop: 2 }}>Systolic over time (mmHg)</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={patient.vitalsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f3fa" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 14, fill: "#9aabc0" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[80, 180]} tick={{ fontSize: 14, fill: "#9aabc0" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="bp" name="BP" stroke="#CC0000" strokeWidth={2.5} dot={{ r: 4, fill: "#CC0000" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { key: "hr",     name: "HR",     label: "Heart Rate", unit: "bpm",  color: "#0047AB", domain: [60, 110] },
                { key: "weight", name: "Weight", label: "Weight",     unit: "kg",   color: "#2a9d8f", domain: [40, 100] },
              ].map(chart => (
                <div key={chart.key} style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #D8E4F2" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2540", marginBottom: 2 }}>{chart.label}</div>
                  <div style={{ fontSize: 14, color: "#9aabc0", marginBottom: 14 }}>{chart.unit} over time</div>
                  <ResponsiveContainer width="100%" height={130}>
                    <LineChart data={patient.vitalsHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f3fa" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 14, fill: "#9aabc0" }} axisLine={false} tickLine={false} />
                      <YAxis domain={chart.domain} tick={{ fontSize: 14, fill: "#9aabc0" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey={chart.key} name={chart.name} stroke={chart.color} strokeWidth={2.5} dot={{ r: 3, fill: chart.color }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visit History — with drawer trigger */}
        {activeTab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginBottom: 14 }}>
              {patient.visits.length} consultation record{patient.visits.length !== 1 ? "s" : ""} — click any to view full details
            </div>

            {/* Timeline */}
            <div style={{ position: "relative" }}>
              {/* Vertical line */}
              <div style={{ position: "absolute", left: 16, top: 10, bottom: 10, width: 2, background: "#D8E4F2", zIndex: 0 }} />

              {patient.visits.map((v, i) => {
                const isSelected = selectedVisitId === v.id;
                return (
                  <div key={v.id} onClick={() => onVisitSelect(v)} style={{
                    display: "flex", gap: 16, marginBottom: 12,
                    cursor: "pointer", position: "relative", zIndex: 1,
                  }}>
                    {/* Dot */}
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      background: i === 0 ? "#0047AB" : "white",
                      border: `2px solid ${i === 0 ? "#0047AB" : "#C0D4F0"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, boxShadow: i === 0 ? "0 0 0 4px #ddeafc" : "none",
                      zIndex: 2,
                    }}>
                      {i === 0 ? <span style={{ fontSize: 14 }}><Stethoscope size={16} strokeWidth={2} /></span> : <span style={{ fontSize: 14, fontWeight: 700, color: "#9aabc0" }}>{patient.visits.length - i}</span>}
                    </div>

                    {/* Card */}
                    <div style={{
                      flex: 1, background: "white", borderRadius: 14, padding: "16px 18px",
                      border: `2px solid ${isSelected ? "#0047AB" : "#D8E4F2"}`,
                      boxShadow: isSelected ? "0 4px 20px rgba(0,71,171,0.14)" : "0 2px 8px rgba(20,40,90,0.04)",
                      transition: "all 0.18s",
                    }}
                      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = "#b0c8f0"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,71,171,0.1)"; }}}
                      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = "#D8E4F2"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(20,40,90,0.04)"; }}}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2540" }}>{v.diagnosis}</div>
                          <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 3 }}>{v.reason}</div>
                          {/* Vitals preview chips */}
                          {v.vitals && (
                            <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                              {[
                                { val: `BP ${v.vitals.bp}`, flag: bpFlag(v.vitals.bp) },
                                { val: `${v.vitals.temp}°C`, flag: tempFlag(v.vitals.temp) },
                                { val: `${v.vitals.hr} bpm`, flag: "normal" },
                              ].map(chip => (
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
                          <div style={{ fontSize: 14, color: "#b0bdd6", marginTop: 2 }}>{v.queue} · {v.duration}</div>
                          <div style={{
                            marginTop: 8, background: isSelected ? "#0047AB" : "#EBF0FA",
                            color: isSelected ? "white" : "#0047AB",
                            border: `1px solid ${isSelected ? "#0047AB" : "#CCDAF0"}`,
                            borderRadius: 7, padding: "4px 12px", fontSize: 14, fontWeight: 600, display: "inline-block",
                            transition: "all 0.15s",
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
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DoctorPatientRecords({ onNavigate }) {
  const [selected, setSelected]           = useState(patients[0]);
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [activeVisit, setActiveVisit]     = useState(null);
  const [toast, setToast]                 = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handlePatientSelect = (p) => {
    setSelected(p);
    setActiveVisit(null);
  };

  const filtered = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.conditions.some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ height: "100vh", background: "#EBF0FA", display: "flex", overflow: "hidden" }}>
      
      

      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1a2540", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 14, zIndex: 300, boxShadow: "0 8px 24px rgba(20,40,90,0.28)", animation: "fadeUp 0.3s ease" }}>{toast}</div>}

      {/* Visit detail drawer */}
      <VisitDrawer visit={activeVisit} patient={selected} onClose={() => setActiveVisit(null)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ background: "#EBF0FA", borderBottom: "1px solid #CCDAF0", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1a2540" }}>Patient Records</h1>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>{patients.length} patients · {patients.reduce((a, p) => a + p.visits.length, 0)} total consultation records</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 7 }}>
              {[
                { label: "Patients",    value: patients.length,                                       color: "#0047AB", bg: "#EBF0FA" },
                { label: "Active",      value: patients.filter(p => p.status === "active").length,    color: "#2a7d5f", bg: "#e8f7f1" },
                { label: "Consultations", value: patients.reduce((a, p) => a + p.visits.length, 0),  color: "#8B5FBF", bg: "#f0eafb" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "6px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 14, color: s.color, opacity: 0.8, letterSpacing: 0.3 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => showToast('Add Patient feature coming soon — connect to backend')} style={{ background: "linear-gradient(135deg,#0047AB,#1565D8)", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,71,171,0.3)", display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} strokeWidth={2} /> Add Patient</button>
          </div>
        </div>

        {/* Split */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "300px 1fr", overflow: "hidden" }}>

          {/* Patient list */}
          <div style={{ background: "white", borderRight: "1px solid #CCDAF0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #f0f3fa" }}>
              <div style={{ position: "relative", marginBottom: 10 }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9aabc0" }}><Search size={14} strokeWidth={2} color="#8a9bb0" /></span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or condition..."
                  style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1.5px solid #e8edf7", borderRadius: 10, fontSize: 14, color: "#1a2540", outline: "none", background: "#f7f9fd" }}
                  onFocus={e => e.target.style.borderColor = "#0047AB"}
                  onBlur={e => e.target.style.borderColor = "#e8edf7"}
                />
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {["all", "active", "urgent", "inactive"].map(s => (
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
              {filtered.map(p => {
                const ss = statusStyle[p.status];
                const isSelected = selected?.id === p.id;
                return (
                  <div key={p.id} onClick={() => handlePatientSelect(p)} style={{
                    padding: "13px 12px", borderRadius: 12, marginBottom: 6, cursor: "pointer",
                    background: isSelected ? "#EBF0FA" : "transparent",
                    border: `1.5px solid ${isSelected ? "#B0C8E8" : "transparent"}`,
                    transition: "all 0.15s", position: "relative", overflow: "hidden",
                  }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f7f9fd"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    {p.status === "urgent" && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "#CC0000", borderRadius: "12px 0 0 12px" }} />}
                    <div style={{ display: "flex", gap: 10, paddingLeft: p.status === "urgent" ? 6 : 0 }}>
                      <Avatar name={p.name} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2540" }}>{p.name}</div>
                          <span style={{ background: ss.bg, color: ss.color, borderRadius: 5, padding: "1px 7px", fontSize: 14, fontWeight: 600, flexShrink: 0, marginLeft: 4 }}>{ss.label}</span>
                        </div>
                        <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 1 }}>{p.age} yrs · {p.gender} · {p.bloodType}</div>
                        <div style={{ fontSize: 14, color: "#9aabc0", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.conditions.length > 0 ? p.conditions.join(" · ") : "No active conditions"}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                          <div style={{ fontSize: 14, color: "#b0bdd6" }}>Last visit: {p.lastVisit}</div>
                          <div style={{ fontSize: 14, color: "#9aabc0", fontWeight: 500 }}>{p.visits.length} records</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "#9aabc0" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}><Search size={14} strokeWidth={2} color="#8a9bb0" /></div>
                  <div style={{ fontSize: 14 }}>No patients found</div>
                </div>
              )}
            </div>
          </div>

          {/* Profile panel */}
          <div style={{ display: "flex", overflow: "hidden" }}>
            <ProfilePanel
              patient={selected}
              onVisitSelect={setActiveVisit}
              selectedVisitId={activeVisit?.id}
              onSchedule={(p) => showToast(`Scheduling follow-up for ${p.name}`)}
              onEdit={(p) => showToast(`<Pencil size={14} strokeWidth={2.5} /> Edit patient record for ${p.name} — coming soon`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
