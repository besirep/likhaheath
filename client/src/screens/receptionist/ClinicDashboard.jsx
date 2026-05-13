import { useState, useEffect } from "react";

const statusConfig = {
  "in-consultation": { label: "In Consultation", color: "#2a9d8f", bg: "#e8f7f5", dot: "#2a9d8f", pulse: true  },
  "vitals-done":     { label: "Vitals Ready",    color: "#0047AB", bg: "#E5EDF8", dot: "#0047AB", pulse: false },
  "waiting":         { label: "Waiting",          color: "#e09040", bg: "#fdf3e8", dot: "#e09040", pulse: false },
  "done":            { label: "Done",             color: "#8a9bb0", bg: "#f0f3f7", dot: "#8a9bb0", pulse: false },
};

const priorityConfig = {
  elderly:   { label: "Senior Citizen", icon: "👴", color: "#8B5FBF", bg: "#f0eafb" },
  pregnant:  { label: "Pregnant",       icon: "🤰", color: "#d4709a", bg: "#fce8f3" },
  pwd:       { label: "PWD",            icon: "♿", color: "#0047AB", bg: "#EBF0FA" },
  pediatric: { label: "Pedia (0–5)",    icon: "👶", color: "#e09040", bg: "#fdf3e8" },
};

// ── Mock queue data (will be replaced by API) ─────────────────────────────────
const MOCK_PATIENTS = [
  { id: 1, name: "Maria Santos",   queue: "A-001", status: "in-consultation", doctor: "Dr. Reyes",  wait: "0m",  reason: "Hypertension follow-up", priority: "elderly"   },
  { id: 2, name: "Jose Dela Cruz", queue: "A-002", status: "in-consultation", doctor: "Dr. Santos", wait: "0m",  reason: "Diabetes check-up",       priority: null        },
  { id: 3, name: "Elena Cruz",     queue: "A-003", status: "vitals-done",     doctor: null,         wait: "18m", reason: "Chest discomfort",        priority: "elderly"   },
  { id: 4, name: "Luisa Ramos",    queue: "A-004", status: "waiting",         doctor: null,         wait: "28m", reason: "Prenatal check-up",       priority: "pregnant"  },
  { id: 5, name: "Ramon Valdez",   queue: "A-005", status: "waiting",         doctor: null,         wait: "38m", reason: "Back pain",               priority: null        },
  { id: 6, name: "Carlos Mendoza", queue: "A-006", status: "waiting",         doctor: null,         wait: "43m", reason: "Fever & cough",           priority: "pediatric" },
  { id: 7, name: "Pedro Bautista", queue: "B-001", status: "done",            doctor: "Dr. Cruz",   wait: "—",   reason: "Lab Results",             priority: null        },
  { id: 8, name: "Luisa Ramos",    queue: "B-002", status: "done",            doctor: "Dr. Cruz",   wait: "—",   reason: "Vaccination",             priority: null        },
];

function Avatar({ name, size = 36 }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const hue = (name.charCodeAt(0) * 37 + name.charCodeAt(1) * 17) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},45%,72%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: `hsl(${hue},45%,28%)`, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Toast({ msg, onDone }) {
  // auto-dismiss after 2.5s
  const [visible, setVisible] = useState(true);
  useEffect(() => { const t = setTimeout(() => { setVisible(false); onDone(); }, 2500); return () => clearTimeout(t); }, [onDone]);
  if (!visible) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e2d40", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 14, zIndex: 300, boxShadow: "0 8px 24px rgba(30,45,64,0.28)", animation: "fadeUp 0.3s ease" }}>
      {msg}
    </div>
  );
}

export default function ClinicDashboard({ onNavigate, user }) {
  const [time, setTime]           = useState(new Date());
  const [activeTab, setActiveTab] = useState("all");
  const [patients, setPatients]   = useState(MOCK_PATIENTS);
  const [toast, setToast]         = useState(null);

  const showToast = (msg) => { setToast(null); setTimeout(() => setToast(msg), 10); };

  const updateStatus = (id, status) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, status, doctor: status === 'done' ? (p.doctor || '—') : p.doctor } : p));
  };

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const filtered   = activeTab === "all" ? patients : patients.filter(p => p.status === activeTab);
  const timeStr    = time.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr    = time.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // Greeting name: use first name from user prop
  const firstName  = user?.name?.split(" ")[0] ?? "Staff";

  // Greeting by hour
  const hour       = time.getHours();
  const greeting   = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const inConsult  = patients.filter(p => p.status === "in-consultation").length;
  const waiting    = patients.filter(p => p.status === "waiting").length;
  const vitalsDone = patients.filter(p => p.status === "vitals-done").length;
  const done       = patients.filter(p => p.status === "done").length;
  const priority   = patients.filter(p => p.priority && p.status !== "done").length;

  // Current "now serving" (first in-consultation)
  const nowServing = patients.find(p => p.status === "in-consultation");

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb" }}>
      

      <div style={{ padding: "26px 30px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 27, fontWeight: 700, color: "#1e2d40" }}>
              {greeting}, {firstName} 👋
            </h1>
            <div style={{ fontSize: 14, color: "#8a9bb0", marginTop: 3 }}>{dateStr}</div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ background: "white", borderRadius: 12, padding: "10px 16px", border: "1px solid #edf1f7", textAlign: "right", boxShadow: "0 2px 8px rgba(100,120,150,0.07)" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1e2d40", letterSpacing: 1 }}>{timeStr}</div>
              <div style={{ fontSize: 14, color: "#8a9bb0" }}>Current Time</div>
            </div>
            <button onClick={() => onNavigate && onNavigate("register")} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 16px rgba(42,157,143,0.3)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>➕</span> Register Patient
            </button>
          </div>
        </div>

        {/* Stat pills row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "In Consultation", value: inConsult,  color: "#2a9d8f", bg: "#e8f7f5", icon: "🩺", trend: `${inConsult} room${inConsult !== 1 ? "s" : ""} active` },
            { label: "Waiting",         value: waiting,    color: "#e09040", bg: "#fdf3e8", icon: "⏳", trend: "Avg. 28 min" },
            { label: "Vitals Ready",    value: vitalsDone, color: "#0047AB", bg: "#E5EDF8", icon: "✅", trend: "Ready to call" },
            { label: "Completed",       value: done,       color: "#2a7d5f", bg: "#e8f7f1", icon: "☑️", trend: `${patients.length > 0 ? Math.round(done / patients.length * 100) : 0}% of today` },
            { label: "Priority Patients",value: priority,  color: "#CC0000", bg: "#FDEAEA", icon: "⭐", trend: "Need attention" },
          ].map((s, i) => (
            <div key={s.label} style={{ background: "white", borderRadius: 16, padding: "18px 20px", boxShadow: "0 2px 12px rgba(100,120,150,0.08)", border: "1px solid #edf1f7", animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 22px rgba(100,120,150,0.13)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(100,120,150,0.08)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ background: s.bg, borderRadius: 10, padding: "6px 8px", fontSize: 18 }}>{s.icon}</div>
              </div>
              <div style={{ fontSize: 34, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#4a5d75", marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 14, color: "#8a9bb0", marginTop: 2 }}>{s.trend}</div>
            </div>
          ))}
        </div>

        {/* Now Serving Banner — derived from live queue state */}
        {nowServing && (
          <div style={{ background: "linear-gradient(135deg,#0047AB,#003580)", borderRadius: 16, padding: "18px 24px", marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 6px 24px rgba(0,71,171,0.28)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 16px", fontSize: 22, fontWeight: 700, color: "white", letterSpacing: 2 }}>{nowServing.queue}</div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Now Serving</div>
                <div style={{ color: "white", fontSize: 16, fontWeight: 700 }}>{nowServing.name}</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                  {nowServing.doctor ? `with ${nowServing.doctor} · ` : ""}{nowServing.reason}
                </div>
              </div>
              {nowServing.priority && priorityConfig[nowServing.priority] && (
                <div style={{ marginLeft: 12, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF8888", animation: "pulse 1.4s infinite" }} />
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                    {priorityConfig[nowServing.priority].icon} {priorityConfig[nowServing.priority].label}
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => showToast(`📱 SMS sent to ${nowServing.name}`)} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>📱 Send SMS</button>
              <button onClick={() => { updateStatus(nowServing.id, 'done'); showToast(`✓ ${nowServing.name} marked as done`); }} style={{ background: "white", color: "#0047AB", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>✓ Mark Done</button>
            </div>
          </div>
        )}

        {/* Queue Table */}
        <div style={{ background: "white", borderRadius: 16, boxShadow: "0 2px 12px rgba(100,120,150,0.08)", border: "1px solid #edf1f7", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e2d40" }}>Today's Queue</h2>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { key: "all",             label: "All" },
                { key: "waiting",         label: "Waiting" },
                { key: "vitals-done",     label: "Vitals Ready" },
                { key: "in-consultation", label: "In Consult" },
                { key: "done",            label: "Done" },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ background: activeTab === tab.key ? "#e8f7f5" : "transparent", color: activeTab === tab.key ? "#2a9d8f" : "#8a9bb0", border: activeTab === tab.key ? "1px solid #c5ece8" : "1px solid transparent", borderRadius: 8, padding: "5px 12px", fontSize: 14, fontWeight: activeTab === tab.key ? 600 : 400, cursor: "pointer", transition: "all 0.2s" }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 140px 150px 80px 100px", padding: "10px 20px", background: "#f8fafd", borderTop: "1px solid #f0f3f7", borderBottom: "1px solid #f0f3f7" }}>
            {["Queue #", "Patient", "Doctor", "Status", "Wait", "Action"].map(h => (
              <div key={h} style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>

          {filtered.map((p, i) => {
            const sc = statusConfig[p.status];
            const pc = p.priority ? priorityConfig[p.priority] : null;
            return (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr 140px 150px 80px 100px", alignItems: "center", padding: "13px 20px", borderBottom: "1px solid #f3f5f9", transition: "background 0.15s", cursor: "pointer", animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafd"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ fontFamily: "'Afacad', sans-serif", fontWeight: 700, fontSize: 14, color: "#1e2d40" }}>{p.queue}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <Avatar name={p.name} size={32} />
                    {pc && <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 14 }}>{pc.icon}</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{p.name}</div>
                    <div style={{ fontSize: 14, color: "#8a9bb0" }}>{p.reason}</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: "#4a5d75" }}>{p.doctor || "—"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot, animation: sc.pulse ? "pulse 1.4s infinite" : "none" }} />
                  <span style={{ fontSize: 14, color: sc.color, fontWeight: 500 }}>{sc.label}</span>
                </div>
                <div style={{ fontSize: 14, color: "#8a9bb0" }}>{p.wait}</div>
                <div>
                  {p.status === "waiting"         && <button onClick={(e) => { e.stopPropagation(); updateStatus(p.id, 'vitals-done'); showToast(`✅ Vitals recorded for ${p.name}`); }} style={{ background: "#fdf3e8", color: "#e09040", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Vitals</button>}
                  {p.status === "vitals-done"     && <button onClick={(e) => { e.stopPropagation(); updateStatus(p.id, 'in-consultation'); showToast(`📣 ${p.name} called to consultation`); }} style={{ background: "#e8f7f5", color: "#2a9d8f", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Call</button>}
                  {p.status === "in-consultation" && <button onClick={(e) => { e.stopPropagation(); updateStatus(p.id, 'done'); showToast(`✓ ${p.name} marked as done`); }} style={{ background: "#E5EDF8", color: "#0047AB", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: "#8a9bb0", fontSize: 14 }}>No patients in this category</div>}

          <div style={{ padding: "14px 20px", borderTop: "1px solid #f3f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, color: "#8a9bb0" }}>Showing {filtered.length} of {patients.length} patients</div>
            <button onClick={() => onNavigate && onNavigate("queue")} style={{ background: "transparent", border: "1px solid #edf1f7", borderRadius: 8, padding: "6px 14px", fontSize: 14, color: "#4a5d75", cursor: "pointer" }}>View Full Queue →</button>
          </div>

          {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
        </div>
      </div>
    </div>
  );
}
