import { useState, useEffect } from "react";

const patients = [
  { id: 1, name: "Maria Santos",   queue: "A-001", status: "in-consultation", doctor: "Dr. Reyes",  wait: "0m",  reason: "Hypertension follow-up", priority: "elderly"  },
  { id: 2, name: "Jose Dela Cruz", queue: "A-002", status: "in-consultation", doctor: "Dr. Santos", wait: "0m",  reason: "Diabetes check-up",       priority: null       },
  { id: 3, name: "Elena Cruz",     queue: "A-003", status: "vitals-done",     doctor: null,         wait: "18m", reason: "Chest discomfort",        priority: "elderly"  },
  { id: 4, name: "Luisa Ramos",    queue: "A-004", status: "waiting",         doctor: null,         wait: "28m", reason: "Prenatal check-up",       priority: "pregnant" },
  { id: 5, name: "Ramon Valdez",   queue: "A-005", status: "waiting",         doctor: null,         wait: "38m", reason: "Back pain",               priority: null       },
  { id: 6, name: "Carlos Mendoza", queue: "A-006", status: "waiting",         doctor: null,         wait: "43m", reason: "Fever & cough",           priority: "pediatric"},
  { id: 7, name: "Pedro Bautista", queue: "B-001", status: "done",            doctor: "Dr. Cruz",   wait: "—",   reason: "Lab Results",             priority: null       },
  { id: 8, name: "Luisa Ramos",    queue: "B-002", status: "done",            doctor: "Dr. Cruz",   wait: "—",   reason: "Vaccination",             priority: null       },
];

const statusConfig = {
  "in-consultation": { label: "In Consultation", color: "#2a9d8f", bg: "#e8f7f5", dot: "#2a9d8f", pulse: true  },
  "vitals-done":     { label: "Vitals Ready",    color: "#4a90d9", bg: "#eaf3fc", dot: "#4a90d9", pulse: false },
  "waiting":         { label: "Waiting",          color: "#e09040", bg: "#fdf3e8", dot: "#e09040", pulse: false },
  "done":            { label: "Done",             color: "#8a9bb0", bg: "#f0f3f7", dot: "#8a9bb0", pulse: false },
};

const priorityConfig = {
  elderly:   { label: "Senior Citizen", icon: "👴", color: "#7b5ea7", bg: "#f0eafb" },
  pregnant:  { label: "Pregnant",       icon: "🤰", color: "#d4709a", bg: "#fce8f3" },
  pwd:       { label: "PWD",            icon: "♿", color: "#3b7dd8", bg: "#eef3fc" },
  pediatric: { label: "Pedia (0–5)",    icon: "👶", color: "#e09040", bg: "#fdf3e8" },
};

function Avatar({ name, size = 36 }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const hue = (name.charCodeAt(0) * 37 + name.charCodeAt(1) * 17) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},45%,72%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: `hsl(${hue},45%,28%)`, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Sidebar() {
  return (
    <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 220, background: "white", borderRight: "1px solid #edf1f7", display: "flex", flexDirection: "column", zIndex: 10, boxShadow: "2px 0 12px rgba(100,120,150,0.07)" }}>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #f0f3f7" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏥</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40", fontFamily: "'Fraunces',serif" }}>CareQueue</div>
            <div style={{ fontSize: 11, color: "#8a9bb0" }}>Reception</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "10px 20px" }}>
        <div style={{ background: "#e8f7f5", border: "1px solid #b8e4de", borderRadius: 8, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2a9d8f" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#2a9d8f", letterSpacing: 0.4 }}>RECEPTIONIST MODE</span>
        </div>
      </div>
      <nav style={{ padding: "8px 12px", flex: 1 }}>
        {[
          { icon: "⊞",  label: "Dashboard",        active: true },
          { icon: "📋", label: "Queue"                           },
          { icon: "➕", label: "Register Patient"                },
          { icon: "🗂️", label: "Patient Records"                 },
          { icon: "📅", label: "Appointments",      badge: "3"  },
          { icon: "📱", label: "SMS Logs"                        },
          { icon: "📊", label: "Reports"                         },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, marginBottom: 2, cursor: "pointer", background: item.active ? "#e8f7f5" : "transparent", color: item.active ? "#2a9d8f" : "#4a5d75", fontWeight: item.active ? 600 : 400, fontSize: 14, transition: "all 0.18s" }}
            onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = "#f4f7fb"; e.currentTarget.style.color = "#1e2d40"; }}}
            onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4a5d75"; }}}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
            {item.badge && <span style={{ marginLeft: "auto", background: "#2a9d8f", color: "white", borderRadius: 10, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{item.badge}</span>}
          </div>
        ))}
      </nav>
      <div style={{ padding: "16px 20px", borderTop: "1px solid #f0f3f7", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#a8d5c2,#2a9d8f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>AR</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40" }}>Ana R.</div>
          <div style={{ fontSize: 11, color: "#8a9bb0" }}>Front Desk</div>
        </div>
      </div>
    </div>
  );
}

export default function ClinicDashboard({ onNavigate }) {
  const [time, setTime]         = useState(new Date());
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const filtered = activeTab === "all" ? patients : patients.filter(p => p.status === activeTab);
  const timeStr  = time.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr  = time.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const inConsult  = patients.filter(p => p.status === "in-consultation").length;
  const waiting    = patients.filter(p => p.status === "waiting").length;
  const vitalsDone = patients.filter(p => p.status === "vitals-done").length;
  const done       = patients.filter(p => p.status === "done").length;
  const priority   = patients.filter(p => p.priority && p.status !== "done").length;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb", fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #c8e0db; border-radius: 4px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <Sidebar />

      <div style={{ marginLeft: 220, padding: "26px 30px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 27, fontFamily: "'Fraunces',serif", fontWeight: 700, color: "#1e2d40" }}>Good morning, Ana 👋</h1>
            <div style={{ fontSize: 13, color: "#8a9bb0", marginTop: 3 }}>{dateStr}</div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ background: "white", borderRadius: 12, padding: "10px 16px", border: "1px solid #edf1f7", textAlign: "right", boxShadow: "0 2px 8px rgba(100,120,150,0.07)" }}>
              <div style={{ fontSize: 20, fontFamily: "'Fraunces',serif", fontWeight: 700, color: "#1e2d40", letterSpacing: 1 }}>{timeStr}</div>
              <div style={{ fontSize: 11, color: "#8a9bb0" }}>Current Time</div>
            </div>
            <button onClick={() => onNavigate && onNavigate("register")} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 16px rgba(42,157,143,0.3)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>➕</span> Register Patient
            </button>
          </div>
        </div>

        {/* Stat pills row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "In Consultation", value: inConsult,  color: "#2a9d8f", bg: "#e8f7f5", icon: "🩺", trend: "2 rooms active" },
            { label: "Waiting",         value: waiting,    color: "#e09040", bg: "#fdf3e8", icon: "⏳", trend: "Avg. 28 min" },
            { label: "Vitals Ready",    value: vitalsDone, color: "#4a90d9", bg: "#eaf3fc", icon: "✅", trend: "Ready to call" },
            { label: "Completed",       value: done,       color: "#2a7d5f", bg: "#e8f7f1", icon: "☑️", trend: `${Math.round(done / patients.length * 100)}% of today` },
            { label: "Priority Patients",value: priority,  color: "#7b5ea7", bg: "#f0eafb", icon: "⭐", trend: "Need attention" },
          ].map((s, i) => (
            <div key={s.label} style={{ background: "white", borderRadius: 16, padding: "18px 20px", boxShadow: "0 2px 12px rgba(100,120,150,0.08)", border: "1px solid #edf1f7", animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 22px rgba(100,120,150,0.13)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(100,120,150,0.08)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ background: s.bg, borderRadius: 10, padding: "6px 8px", fontSize: 18 }}>{s.icon}</div>
              </div>
              <div style={{ fontSize: 34, fontWeight: 700, color: s.color, fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#4a5d75", marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "#8a9bb0", marginTop: 2 }}>{s.trend}</div>
            </div>
          ))}
        </div>

        {/* Now Serving Banner */}
        <div style={{ background: "linear-gradient(135deg,#2a9d8f,#1a7a70)", borderRadius: 16, padding: "18px 24px", marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 6px 24px rgba(42,157,143,0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 16px", fontSize: 22, fontFamily: "'Fraunces',serif", fontWeight: 700, color: "white", letterSpacing: 2 }}>A-001</div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Now Serving</div>
              <div style={{ color: "white", fontSize: 16, fontWeight: 700 }}>Maria Santos</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>with Dr. Reyes · Room 1 · Hypertension follow-up</div>
            </div>
            <div style={{ marginLeft: 12, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a8f5ec", animation: "pulse 1.4s infinite" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>👴 Senior Citizen</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📱 Send SMS</button>
            <button style={{ background: "white", color: "#2a9d8f", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✓ Mark Done</button>
          </div>
        </div>

        {/* Queue Table */}
        <div style={{ background: "white", borderRadius: 16, boxShadow: "0 2px 12px rgba(100,120,150,0.08)", border: "1px solid #edf1f7", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontFamily: "'Fraunces',serif", fontWeight: 700, color: "#1e2d40" }}>Today's Queue</h2>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { key: "all", label: "All" },
                { key: "waiting", label: "Waiting" },
                { key: "vitals-done", label: "Vitals Ready" },
                { key: "in-consultation", label: "In Consult" },
                { key: "done", label: "Done" },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ background: activeTab === tab.key ? "#e8f7f5" : "transparent", color: activeTab === tab.key ? "#2a9d8f" : "#8a9bb0", border: activeTab === tab.key ? "1px solid #c5ece8" : "1px solid transparent", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: activeTab === tab.key ? 600 : 400, cursor: "pointer", transition: "all 0.2s" }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 140px 150px 80px 100px", padding: "10px 20px", background: "#f8fafd", borderTop: "1px solid #f0f3f7", borderBottom: "1px solid #f0f3f7" }}>
            {["Queue #", "Patient", "Doctor", "Status", "Wait", "Action"].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</div>
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
                <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 14, color: "#1e2d40" }}>{p.queue}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <Avatar name={p.name} size={32} />
                    {pc && <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 10 }}>{pc.icon}</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#8a9bb0" }}>{p.reason}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#4a5d75" }}>{p.doctor || "—"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot, animation: sc.pulse ? "pulse 1.4s infinite" : "none" }} />
                  <span style={{ fontSize: 12, color: sc.color, fontWeight: 500 }}>{sc.label}</span>
                </div>
                <div style={{ fontSize: 13, color: "#8a9bb0" }}>{p.wait}</div>
                <div>
                  {p.status === "waiting" && <button style={{ background: "#fdf3e8", color: "#e09040", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Vitals</button>}
                  {p.status === "vitals-done" && <button style={{ background: "#e8f7f5", color: "#2a9d8f", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Call</button>}
                  {p.status === "in-consultation" && <button style={{ background: "#eaf3fc", color: "#4a90d9", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Done</button>}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: "#8a9bb0", fontSize: 14 }}>No patients in this category</div>}

          <div style={{ padding: "14px 20px", borderTop: "1px solid #f3f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: "#8a9bb0" }}>Showing {filtered.length} of {patients.length} patients</div>
            <button onClick={() => onNavigate && onNavigate("queue")} style={{ background: "transparent", border: "1px solid #edf1f7", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#4a5d75", cursor: "pointer" }}>View Full Queue →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
