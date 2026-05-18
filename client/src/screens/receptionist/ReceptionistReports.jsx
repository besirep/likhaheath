import { useState } from "react";
import { printDailyReport } from "../../lib/utils/printUtils.js";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ── Data ──────────────────────────────────────────────────────────────────────
const weeklyQueue = [
  { day: "Mon Feb 23", total: 42, completed: 38, skipped: 4  },
  { day: "Tue Feb 24", total: 37, completed: 35, skipped: 2  },
  { day: "Wed Feb 25", total: 51, completed: 46, skipped: 5  },
  { day: "Thu Feb 26", total: 44, completed: 41, skipped: 3  },
  { day: "Fri Feb 27", total: 39, completed: 36, skipped: 3  },
  { day: "Sat Feb 28", total: 28, completed: 27, skipped: 1  },
  { day: "Sun Mar 1",  total: 14, completed: 11, skipped: 2  },
];

const hourlyFlow = [
  { hour: "8AM",  patients: 6  },
  { hour: "9AM",  patients: 14 },
  { hour: "10AM", patients: 11 },
  { hour: "11AM", patients: 8  },
  { hour: "12PM", patients: 3  },
  { hour: "1PM",  patients: 7  },
  { hour: "2PM",  patients: 9  },
  { hour: "3PM",  patients: 5  },
  { hour: "4PM",  patients: 3  },
];

const priorityBreakdown = [
  { name: "Regular",       value: 28, color: "#0047AB" },
  { name: "Senior Citizen",value: 8,  color: "#8B5FBF" },
  { name: "PWD",           value: 4,  color: "#0047AB" },
  { name: "Pregnant",      value: 5,  color: "#d4709a" },
  { name: "Pediatric",     value: 7,  color: "#e09040" },
];

const smsWeekly = [
  { day: "Mon", sent: 38, failed: 2 },
  { day: "Tue", sent: 33, failed: 4 },
  { day: "Wed", sent: 45, failed: 6 },
  { day: "Thu", sent: 40, failed: 1 },
  { day: "Fri", sent: 35, failed: 3 },
  { day: "Sat", sent: 25, failed: 3 },
  { day: "Sun", sent: 12, failed: 2 },
];

const topReasons = [
  { reason: "Hypertension / BP",      count: 18, pct: 38 },
  { reason: "Diabetes check-up",       count: 12, pct: 26 },
  { reason: "Fever & cough",           count: 9,  pct: 19 },
  { reason: "Prenatal check-up",       count: 5,  pct: 11 },
  { reason: "Annual physical",         count: 3,  pct: 6  },
];

const waitTimeWeek = [
  { day: "Mon", avg: 24 },
  { day: "Tue", avg: 19 },
  { day: "Wed", avg: 31 },
  { day: "Thu", avg: 22 },
  { day: "Fri", avg: 18 },
  { day: "Sat", avg: 14 },
  { day: "Sun", avg: 27 },
];

const doctorLoad = [
  { doctor: "Dr. Reyes",  patients: 19, color: "#2a9d8f" },
  { doctor: "Dr. Santos", patients: 15, color: "#0047AB" },
  { doctor: "Dr. Cruz",   patients: 13, color: "#8B5FBF" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e0e7ef", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(20,40,70,0.1)", fontSize: 14 }}>
      <div style={{ color: "#8a9bb0", marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || "#1e2d40", marginBottom: 2 }}>
          <span style={{ fontWeight: 600 }}>{p.name}:</span> {p.value}
        </div>
      ))}
    </div>
  );
};

function Sidebar() {
  return (
    <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 220, background: "white", borderRight: "1px solid #edf1f7", display: "flex", flexDirection: "column", zIndex: 10, boxShadow: "2px 0 12px rgba(100,120,150,0.07)" }}>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #f0f3f7" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏥</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40" }}>CareQueue</div>
            <div style={{ fontSize: 14, color: "#8a9bb0" }}>Reception</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "10px 20px" }}>
        <div style={{ background: "#e8f7f5", border: "1px solid #b8e4de", borderRadius: 8, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2a9d8f" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#2a9d8f", letterSpacing: 0.4 }}>RECEPTIONIST MODE</span>
        </div>
      </div>
      <nav style={{ padding: "8px 12px", flex: 1 }}>
        {[
          { icon: "⊞",  label: "Dashboard"                        },
          { icon: "📋", label: "Queue"                             },
          { icon: "➕", label: "Register Patient"                  },
          { icon: "🗂️", label: "Patient Records"                   },
          { icon: "📅", label: "Appointments",   badge: "3"       },
          { icon: "📱", label: "SMS Logs"                          },
          { icon: "📊", label: "Reports"                           },
        ].map(item => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10, marginBottom: 2, cursor: "pointer",
            background: item.label === "Reports" ? "#e8f7f5" : "transparent",
            color: item.label === "Reports" ? "#2a9d8f" : "#4a5d75",
            fontWeight: item.label === "Reports" ? 600 : 400, fontSize: 14, transition: "all 0.18s",
          }}
            onMouseEnter={e => { if (item.label !== "Reports") { e.currentTarget.style.background = "#f4f7fb"; e.currentTarget.style.color = "#1e2d40"; }}}
            onMouseLeave={e => { if (item.label !== "Reports") { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4a5d75"; }}}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
            {item.badge && <span style={{ marginLeft: "auto", background: "#2a9d8f", color: "white", borderRadius: 10, padding: "1px 8px", fontSize: 14, fontWeight: 700 }}>{item.badge}</span>}
          </div>
        ))}
      </nav>
      <div style={{ padding: "16px 20px", borderTop: "1px solid #f0f3f7", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#a8d5c2,#2a9d8f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white" }}>AR</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>Ana R.</div>
          <div style={{ fontSize: 14, color: "#8a9bb0" }}>Front Desk</div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, bg, trend }) {
  return (
    <div style={{ background: bg || "white", borderRadius: 16, padding: "18px 20px", border: "1px solid #e0e7ef", boxShadow: "0 2px 8px rgba(100,120,150,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 22 }}>{icon}</div>
        {trend !== undefined && (
          <div style={{ fontSize: 14, fontWeight: 600, color: trend >= 0 ? "#2a9d8f" : "#CC0000", background: trend >= 0 ? "#e8f7f5" : "#fde8e0", borderRadius: 6, padding: "2px 8px" }}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: color || "#1e2d40", lineHeight: 1, marginTop: 10 }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 14, color: "#8a9bb0", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e2d40" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 14, color: "#8a9bb0", marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Reports() {
  const [period, setPeriod] = useState("week");
  const [toast, setToast]   = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const exportCSV = () => {
    const rows = [
      ['Date', 'Total', 'Completed', 'Skipped'],
      ...weeklyQueue.map(r => [r.day, r.total, r.completed, r.skipped]),
      [],
      ['Priority Category', 'Count'],
      ...priorityBreakdown.map(r => [r.name, r.value]),
      [],
      ['Hour', 'Patients'],
      ...hourlyFlow.map(r => [r.hour, r.patients]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `likhahealth-report-${period}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('📊 Report downloaded as CSV');
  };

  const exportPDF = () => {
    showToast('📄 Generating branded PDF...');
    printDailyReport({
      stats: {
        total: todayTotal,
        completed: todayCompleted,
        skipped: todaySkipped,
        waiting: todayTotal - todayCompleted - todaySkipped,
        priority: totalPriority,
        avgWait: `${avgWait}m`,
      },
      queue: weeklyQueue.map(r => ({
        queue: r.day,
        name: `${r.total} patients`,
        age: '—',
        reason: `${r.completed} completed`,
        status: `${r.skipped} skipped`,
        doctor: '—',
      })),
      staffName: 'Ana R. · Front Desk',
    });
  };

  const todayTotal     = 47;
  const todayCompleted = 42;
  const todaySkipped   = 3;
  const avgWait        = 22;
  const smsSent        = 44;
  const smsFailed      = 3;
  const totalPriority  = 24;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb", display: "flex" }}>
      
      

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e2d40", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 14, zIndex: 300, boxShadow: "0 8px 24px rgba(30,45,64,0.28)", animation: "fadeUp 0.3s ease" }}>
          {toast}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ background: "#f4f7fb", borderBottom: "1px solid #dde8e5", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e2d40" }}>Reports</h1>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>Health Center — March 1, 2026</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Period toggle */}
            <div style={{ display: "flex", background: "white", border: "1px solid #e0e7ef", borderRadius: 10, overflow: "hidden" }}>
              {["today", "week", "month"].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding: "8px 16px", border: "none", cursor: "pointer",
                  background: period === p ? "#1e2d40" : "transparent",
                  color: period === p ? "white" : "#7a8fb0",
                  fontSize: 14, fontWeight: period === p ? 600 : 400,
                  transition: "all 0.15s",
                  textTransform: "capitalize",
                }}>{p}</button>
              ))}
            </div>
            <button onClick={exportPDF} style={{ background: "white", color: "#4a5d75", border: "1px solid #e0e7ef", borderRadius: 10, padding: "9px 16px", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
              📄 Export PDF
            </button>
            <button onClick={exportCSV} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.28)" }}>
              📊 Export CSV
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ── Today's KPI cards ── */}
          <div style={{ animation: "fadeUp 0.25s ease" }}>
            <SectionHeader title="Today at a Glance" subtitle="March 1, 2026 · Live data" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <StatCard icon="👥" label="Total Patients"  value={todayTotal}     sub="Registered today"        color="#1e2d40"  trend={12} />
              <StatCard icon="✅" label="Completed"        value={todayCompleted} sub={`${Math.round(todayCompleted/todayTotal*100)}% completion rate`} color="#2a9d8f" bg="#e8f7f5" trend={5} />
              <StatCard icon="⏱️" label="Avg. Wait Time"   value={`${avgWait}m`}  sub="Target: under 30 min"   color="#e09040" bg="#fdf3e8" trend={-8} />
              <StatCard icon="⏭"  label="Skipped"          value={todaySkipped}   sub="Called, no response"    color="#c05080" bg="#fce8f0" trend={0} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
              <StatCard icon="📱" label="SMS Sent"         value={smsSent}        sub={`${smsFailed} failed · ${Math.round(smsSent/(smsSent+smsFailed)*100)}% delivery`} color="#0047AB" bg="#E5EDF8" />
              <StatCard icon="⭐" label="Priority Patients" value={totalPriority}  sub="Elderly, PWD, Pregnant, Pedia" color="#8B5FBF" bg="#f0eafb" />
              <StatCard icon="🩺" label="Active Consultations" value={2}           sub="2 doctors seeing patients"      color="#2a9d8f" bg="#e8f7f5" />
            </div>
          </div>

          {/* ── Queue flow this week ── */}
          <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)", animation: "fadeUp 0.3s ease" }}>
            <SectionHeader
              title="Queue Volume — This Week"
              subtitle="Total patients registered vs completed per day"
              action={
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: "#2a9d8f" }} /><span style={{ fontSize: 14, color: "#7a8fb0" }}>Completed</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: "#e8f2f0" }} /><span style={{ fontSize: 14, color: "#7a8fb0" }}>Total</span></div>
                </div>
              }
            />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyQueue} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f7" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false}
                  tickFormatter={v => v.split(" ")[0]} />
                <YAxis tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total"     name="Total"     fill="#e8f2f0" radius={[6,6,0,0]} />
                <Bar dataKey="completed" name="Completed" fill="#2a9d8f" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Two-column: hourly + priority ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "fadeUp 0.35s ease" }}>

            {/* Hourly flow */}
            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="Hourly Patient Flow" subtitle="Today · patients per hour" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f7" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="patients" name="Patients" radius={[6,6,0,0]}>
                    {hourlyFlow.map((entry, i) => (
                      <Cell key={i} fill={entry.patients === Math.max(...hourlyFlow.map(h => h.patients)) ? "#2a9d8f" : "#d4ede9"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 10, fontSize: 14, color: "#7a8fb0", textAlign: "center" }}>
                Peak hour: <strong style={{ color: "#2a9d8f" }}>9:00 AM</strong> — 14 patients
              </div>
            </div>

            {/* Priority breakdown */}
            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="Patient Classification" subtitle="Today's priority breakdown" />
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={priorityBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                      {priorityBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  {priorityBreakdown.map(p => (
                    <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: "#4a5d75", flex: 1 }}>{p.name}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1e2d40" }}>{p.value}</span>
                      <span style={{ fontSize: 14, color: "#8a9bb0", minWidth: 30 }}>{Math.round(p.value/todayTotal*100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Wait time + SMS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "fadeUp 0.4s ease" }}>

            {/* Avg wait time */}
            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="Average Wait Time" subtitle="Minutes per day this week" />
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={waitTimeWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f7" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false} domain={[0, 40]} />
                  <Tooltip content={<CustomTooltip />} />
                  {/* 30-min target line */}
                  <Line type="monotone" dataKey={() => 30} name="Target (30m)" stroke="#f0c8a0" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
                  <Line type="monotone" dataKey="avg" name="Avg Wait (min)" stroke="#e09040" strokeWidth={2.5} dot={{ r: 4, fill: "#e09040" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 14, marginTop: 8, justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 16, height: 2, background: "#e09040", borderRadius: 2 }} /><span style={{ fontSize: 14, color: "#8a9bb0" }}>Avg wait</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 16, height: 2, background: "#f0c8a0", borderRadius: 2, borderTop: "2px dashed #f0c8a0" }} /><span style={{ fontSize: 14, color: "#8a9bb0" }}>30-min target</span></div>
              </div>
            </div>

            {/* SMS delivery */}
            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="SMS Delivery" subtitle="Sent vs failed this week" />
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={smsWeekly} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f7" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sent"   name="Sent"   fill="#2a9d8f" radius={[5,5,0,0]} stackId="a" />
                  <Bar dataKey="failed" name="Failed" fill="#f5c8b0" radius={[5,5,0,0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 14, marginTop: 8, justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: "#2a9d8f" }} /><span style={{ fontSize: 14, color: "#8a9bb0" }}>Sent</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: "#f5c8b0" }} /><span style={{ fontSize: 14, color: "#8a9bb0" }}>Failed</span></div>
              </div>
            </div>
          </div>

          {/* ── Bottom row: top reasons + doctor load ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "fadeUp 0.45s ease" }}>

            {/* Top visit reasons */}
            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="Top Visit Reasons" subtitle="Today's chief complaints" />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {topReasons.map((r, i) => (
                  <div key={r.reason}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 14, color: "#1e2d40", fontWeight: i === 0 ? 600 : 400 }}>{r.reason}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#2a9d8f" }}>{r.count}</span>
                    </div>
                    <div style={{ height: 7, background: "#f0f3f7", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 10, transition: "width 0.6s ease",
                        width: `${r.pct}%`,
                        background: i === 0 ? "linear-gradient(90deg,#2a9d8f,#52c4b8)"
                          : i === 1 ? "linear-gradient(90deg,#0047AB,#7ab8f5)"
                          : "#d0e8e4",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor workload */}
            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="Doctor Workload" subtitle="Patients seen today per doctor" />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {doctorLoad.map(d => {
                  const maxPts = Math.max(...doctorLoad.map(x => x.patients));
                  return (
                    <div key={d.doctor}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: d.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: d.color }}>
                            {d.doctor.split(" ")[1][0]}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{d.doctor}</span>
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 700, color: d.color }}>{d.patients}</span>
                      </div>
                      <div style={{ height: 8, background: "#f0f3f7", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(d.patients / maxPts) * 100}%`, background: d.color, borderRadius: 10, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 4, paddingTop: 14, borderTop: "1px solid #f0f3f7", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, color: "#8a9bb0" }}>Total patients seen</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#1e2d40" }}>{doctorLoad.reduce((a, d) => a + d.patients, 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Daily summary table ── */}
          <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)", marginBottom: 8, animation: "fadeUp 0.5s ease" }}>
            <SectionHeader
              title="Weekly Summary Table"
              subtitle="Full breakdown for the past 7 days"
              action={
                <button onClick={exportCSV} style={{ background: "#f4f7fb", color: "#4a5d75", border: "1px solid #e0e7ef", borderRadius: 9, padding: "6px 14px", fontSize: 14, cursor: "pointer" }}>
                  ↓ Export CSV
                </button>
              }
            />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f7f9fb" }}>
                    {["Date", "Total", "Completed", "Skipped", "Completion %", "Avg Wait", "SMS Sent", "SMS Failed"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #e8edf7", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeklyQueue.map((row, i) => {
                    const sms = smsWeekly[i];
                    const compPct = Math.round(row.completed / row.total * 100);
                    return (
                      <tr key={row.day} style={{ borderBottom: "1px solid #f0f3f7" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f7f9fb"}
                        onMouseLeave={e => e.currentTarget.style.background = "white"}
                      >
                        <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{row.day}</td>
                        <td style={{ padding: "12px 14px", fontSize: 14, color: "#1e2d40", fontWeight: 700 }}>{row.total}</td>
                        <td style={{ padding: "12px 14px" }}><span style={{ color: "#2a9d8f", fontWeight: 700, fontSize: 14 }}>{row.completed}</span></td>
                        <td style={{ padding: "12px 14px" }}><span style={{ color: row.skipped > 3 ? "#c05080" : "#8a9bb0", fontWeight: row.skipped > 3 ? 700 : 400, fontSize: 14 }}>{row.skipped}</span></td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 50, height: 5, background: "#f0f3f7", borderRadius: 5, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${compPct}%`, background: compPct >= 90 ? "#2a9d8f" : compPct >= 75 ? "#e09040" : "#CC0000", borderRadius: 5 }} />
                            </div>
                            <span style={{ fontSize: 14, color: compPct >= 90 ? "#2a9d8f" : "#e09040", fontWeight: 600 }}>{compPct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 14, color: waitTimeWeek[i]?.avg > 30 ? "#CC0000" : "#1e2d40", fontWeight: waitTimeWeek[i]?.avg > 30 ? 700 : 400 }}>
                            {waitTimeWeek[i]?.avg}m
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 14, color: "#2a9d8f", fontWeight: 600 }}>{sms?.sent}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 14, color: sms?.failed > 3 ? "#CC0000" : "#8a9bb0", fontWeight: sms?.failed > 3 ? 700 : 400 }}>{sms?.failed}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f0f7f5", borderTop: "2px solid #c8e8e0" }}>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 700, color: "#1e2d40" }}>Totals</td>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 700, color: "#1e2d40" }}>{weeklyQueue.reduce((a, r) => a + r.total, 0)}</td>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 700, color: "#2a9d8f" }}>{weeklyQueue.reduce((a, r) => a + r.completed, 0)}</td>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 700, color: "#c05080" }}>{weeklyQueue.reduce((a, r) => a + r.skipped, 0)}</td>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 700, color: "#2a9d8f" }}>
                      {Math.round(weeklyQueue.reduce((a, r) => a + r.completed, 0) / weeklyQueue.reduce((a, r) => a + r.total, 0) * 100)}%
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 700, color: "#1e2d40" }}>
                      {Math.round(waitTimeWeek.reduce((a, r) => a + r.avg, 0) / waitTimeWeek.length)}m avg
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 700, color: "#2a9d8f" }}>{smsWeekly.reduce((a, r) => a + r.sent, 0)}</td>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 700, color: "#CC0000" }}>{smsWeekly.reduce((a, r) => a + r.failed, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
