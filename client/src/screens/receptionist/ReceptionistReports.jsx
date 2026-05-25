import { useState, useEffect, useCallback } from "react";
import { Building2, Plus, Stethoscope, AlertCircle, SkipForward, ClipboardList, BarChart3, CalendarDays, FolderOpen, LayoutDashboard, Download, FileText, Clock, Users, CheckCircle, MessageSquare } from "lucide-react";
import { printDailyReport } from "../../lib/utils/printUtils.js";
import { dashboardApi } from "../../lib/api/dashboard.js";
import { reportsApi }   from "../../lib/api/reports.js";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

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

const periodLabel = {
  today: "Today",
  week: "This Week",
  month: "This Month",
};

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });
}

function StatCard({ icon, label, value, sub, color, bg }) {
  return (
    <div style={{ background: bg || "white", borderRadius: 16, padding: "18px 20px", border: "1px solid #e0e7ef", boxShadow: "0 2px 8px rgba(100,120,150,0.06)" }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
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

function EmptyState({ label }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: "#b0bdd0" }}>
      <BarChart3 size={28} strokeWidth={1.5} />
      <div style={{ marginTop: 8, fontSize: 14 }}>No {label} data for this period</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Reports() {
  const [period, setPeriod]       = useState("today");
  const [toast, setToast]         = useState(null);
  const [loading, setLoading]     = useState(true);

  // ── Live KPI state ───────────────────────────────────────────────────────────
  const [kpi, setKpi]             = useState(null);
  const [charts, setCharts]       = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  // Fetch dashboard KPIs (time-filtered)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const days = period === "today" ? 1 : period === "month" ? 30 : 7;
      const [statsData, chartsData] = await Promise.all([
        dashboardApi.getStats(period),
        reportsApi.getWeekly(days),
      ]);
      setKpi(statsData);
      setCharts(chartsData);
    } catch (e) {
      console.error("[Reports] load error:", e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Normalize chart data ──────────────────────────────────────────────────────
  const weeklyQueue = (charts?.dailyQueue || []).map(r => ({
    day: formatDate(r.day),
    total: Number(r.total) || 0,
    completed: Number(r.completed) || 0,
    skipped: Number(r.skipped) || 0,
  }));

  const hourlyFlow = (charts?.hourlyFlow || []).map(r => ({
    hour: `${r.hour > 12 ? r.hour - 12 : r.hour || 12}${r.hour >= 12 ? "PM" : "AM"}`,
    patients: Number(r.patients) || 0,
  }));

  const smsWeekly = (charts?.smsWeekly || []).map(r => ({
    day: formatDate(r.day),
    sent: Number(r.sent) || 0,
    failed: Number(r.failed) || 0,
  }));

  const waitTimeWeek = (charts?.waitTimeWeek || []).map(r => ({
    day: formatDate(r.day),
    avg: Number(r.avg_wait) || 0,
  }));

  const topReasons = (charts?.topReasons || []).map((r, _i, arr) => {
    const total = arr.reduce((s, x) => s + (Number(x.cnt) || 0), 0);
    return {
      reason: r.reason || "Other",
      count: Number(r.cnt) || 0,
      pct: total > 0 ? Math.round((Number(r.cnt) || 0) / total * 100) : 0,
    };
  });

  const doctorLoad = (charts?.doctorLoad || []).map((r, i) => ({
    doctor: r.doctor,
    patients: Number(r.patients) || 0,
    color: ["#2a9d8f", "#0047AB", "#8B5FBF", "#e09040"][i % 4],
  }));

  const priorityBreakdown = (charts?.priorityBreakdown || []).map((r, i) => ({
    name: r.priority === "regular" ? "Regular" : r.priority === "elderly" ? "Senior Citizen" : r.priority === "pregnant" ? "Pregnant" : r.priority === "pwd" ? "PWD" : r.priority === "pediatric" ? "Pediatric" : r.priority || "Regular",
    value: Number(r.value) || 0,
    color: ["#0047AB", "#8B5FBF", "#d4709a", "#e09040", "#2a9d8f"][i % 5],
  }));

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const totalAppts     = kpi?.period_appointments ?? 0;
  const completedAppts = kpi?.completed_appointments ?? 0;
  const skippedCount   = kpi?.skipped ?? 0;
  const avgWait        = kpi?.avg_wait ?? 0;
  const smsSent        = kpi?.sms_sent ?? 0;
  const smsFailed      = kpi?.sms_failed ?? 0;
  const totalPriority  = priorityBreakdown.filter(p => p.name !== "Regular").reduce((s, p) => s + p.value, 0);
  const newPatients    = kpi?.new_patients ?? 0;
  const recordsCount   = kpi?.records_count ?? 0;

  const peakHour = hourlyFlow.length > 0
    ? hourlyFlow.reduce((a, b) => b.patients > a.patients ? b : a, hourlyFlow[0])
    : null;

  const todayStr = new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

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
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `likhahealth-report-${period}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('Report downloaded as CSV');
  };

  const exportPDF = () => {
    showToast('Generating branded PDF...');
    printDailyReport({
      stats: {
        total:     totalAppts,
        completed: completedAppts,
        skipped:   skippedCount,
        waiting:   totalAppts - completedAppts - skippedCount,
        priority:  totalPriority,
        avgWait:   `${avgWait}m`,
      },
      queue: weeklyQueue.map(r => ({
        queue:  r.day,
        name:   `${r.total} patients`,
        age:    '—',
        reason: `${r.completed} completed`,
        status: `${r.skipped} skipped`,
        doctor: '—',
      })),
      staffName: 'Front Desk',
    });
  };

  return (
    <div style={{ background: "#f4f7fb", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e2d40", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 14, zIndex: 300, boxShadow: "0 8px 24px rgba(30,45,64,0.28)", animation: "fadeUp 0.3s ease" }}>
          {toast}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ background: "#f4f7fb", borderBottom: "1px solid #dde8e5", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e2d40" }}>Reports</h1>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>Health Center — {todayStr}</div>
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
              <FileText size={16} strokeWidth={2} /> Export PDF
            </button>
            <button onClick={exportCSV} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.28)" }}>
              <BarChart3 size={16} strokeWidth={2} /> Export CSV
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ── KPI cards ── */}
          <div style={{ animation: "fadeUp 0.25s ease" }}>
            <SectionHeader title={`${periodLabel[period]} at a Glance`} subtitle={`${todayStr} · Live data from database`} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <StatCard icon={<Users size={22} strokeWidth={2} />} label="Total Appointments" value={loading ? "..." : totalAppts} sub={`${periodLabel[period]}`} color="#1e2d40" />
              <StatCard icon={<CheckCircle size={22} strokeWidth={2} />} label="Completed" value={loading ? "..." : completedAppts} sub={totalAppts > 0 ? `${Math.round(completedAppts / totalAppts * 100)}% completion rate` : "—"} color="#2a9d8f" bg="#e8f7f5" />
              <StatCard icon={<Clock size={22} strokeWidth={2} />} label="Avg. Wait Time" value={loading ? "..." : `${avgWait}m`} sub="Target: under 30 min" color="#e09040" bg="#fdf3e8" />
              <StatCard icon={<SkipForward size={22} strokeWidth={2} />} label="Skipped" value={loading ? "..." : skippedCount} sub="Called, no response" color="#c05080" bg="#fce8f0" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
              <StatCard icon={<MessageSquare size={22} strokeWidth={2} />} label="SMS Sent" value={loading ? "..." : smsSent} sub={smsFailed > 0 ? `${smsFailed} failed` : "No failures"} color="#0047AB" bg="#E5EDF8" />
              <StatCard icon={<AlertCircle size={22} strokeWidth={2} />} label="Priority Patients" value={loading ? "..." : totalPriority} sub="Elderly, PWD, Pregnant, Pedia" color="#8B5FBF" bg="#f0eafb" />
              <StatCard icon={<ClipboardList size={22} strokeWidth={2} />} label="Medical Records" value={loading ? "..." : recordsCount} sub={`${periodLabel[period]}`} color="#2a9d8f" bg="#e8f7f5" />
              <StatCard icon={<Stethoscope size={22} strokeWidth={2} />} label="New Patients" value={loading ? "..." : newPatients} sub="Newly registered" color="#0047AB" bg="#EBF0FA" />
            </div>
          </div>

          {/* ── Queue flow ── */}
          <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)", animation: "fadeUp 0.3s ease" }}>
            <SectionHeader
              title={`Queue Volume — ${periodLabel[period]}`}
              subtitle="Total patients registered vs completed per day"
              action={
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: "#2a9d8f" }} /><span style={{ fontSize: 14, color: "#7a8fb0" }}>Completed</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: "#e8f2f0" }} /><span style={{ fontSize: 14, color: "#7a8fb0" }}>Total</span></div>
                </div>
              }
            />
            {weeklyQueue.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyQueue} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f7" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Total" fill="#e8f2f0" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#2a9d8f" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState label="queue" />}
          </div>

          {/* ── Two-column: hourly + priority ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "fadeUp 0.35s ease" }}>

            {/* Hourly flow */}
            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="Hourly Patient Flow" subtitle={`${periodLabel[period]} · patients per hour`} />
              {hourlyFlow.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={hourlyFlow}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f7" vertical={false} />
                      <XAxis dataKey="hour" tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="patients" name="Patients" radius={[6, 6, 0, 0]}>
                        {hourlyFlow.map((entry, i) => (
                          <Cell key={i} fill={entry.patients === Math.max(...hourlyFlow.map(h => h.patients)) ? "#2a9d8f" : "#d4ede9"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {peakHour && (
                    <div style={{ marginTop: 10, fontSize: 14, color: "#7a8fb0", textAlign: "center" }}>
                      Peak hour: <strong style={{ color: "#2a9d8f" }}>{peakHour.hour}</strong> — {peakHour.patients} patients
                    </div>
                  )}
                </>
              ) : <EmptyState label="hourly flow" />}
            </div>

            {/* Priority breakdown */}
            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="Patient Classification" subtitle={`${periodLabel[period]} priority breakdown`} />
              {priorityBreakdown.length > 0 ? (
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
                    {priorityBreakdown.map(p => {
                      const total = priorityBreakdown.reduce((s, x) => s + x.value, 0);
                      return (
                        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 14, color: "#4a5d75", flex: 1 }}>{p.name}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e2d40" }}>{p.value}</span>
                          <span style={{ fontSize: 14, color: "#8a9bb0", minWidth: 30 }}>{total > 0 ? Math.round(p.value / total * 100) : 0}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : <EmptyState label="priority" />}
            </div>
          </div>

          {/* ── Wait time + SMS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "fadeUp 0.4s ease" }}>

            {/* Avg wait time */}
            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="Average Wait Time" subtitle={`Minutes per day — ${periodLabel[period]}`} />
              {waitTimeWeek.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={waitTimeWeek}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f7" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey={() => 30} name="Target (30m)" stroke="#f0c8a0" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
                      <Line type="monotone" dataKey="avg" name="Avg Wait (min)" stroke="#e09040" strokeWidth={2.5} dot={{ r: 4, fill: "#e09040" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", gap: 14, marginTop: 8, justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 16, height: 2, background: "#e09040", borderRadius: 2 }} /><span style={{ fontSize: 14, color: "#8a9bb0" }}>Avg wait</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 16, height: 2, background: "#f0c8a0", borderRadius: 2 }} /><span style={{ fontSize: 14, color: "#8a9bb0" }}>30-min target</span></div>
                  </div>
                </>
              ) : <EmptyState label="wait time" />}
            </div>

            {/* SMS delivery */}
            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="SMS Delivery" subtitle={`${periodLabel[period]} · sent vs failed`} />
              {smsWeekly.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={smsWeekly} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f7" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 14, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="sent" name="Sent" fill="#2a9d8f" radius={[5, 5, 0, 0]} stackId="a" />
                      <Bar dataKey="failed" name="Failed" fill="#f5c8b0" radius={[5, 5, 0, 0]} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", gap: 14, marginTop: 8, justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: "#2a9d8f" }} /><span style={{ fontSize: 14, color: "#8a9bb0" }}>Sent</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: "#f5c8b0" }} /><span style={{ fontSize: 14, color: "#8a9bb0" }}>Failed</span></div>
                  </div>
                </>
              ) : <EmptyState label="SMS" />}
            </div>
          </div>

          {/* ── Bottom row: top reasons + doctor load ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "fadeUp 0.45s ease" }}>

            {/* Top visit reasons */}
            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="Top Visit Reasons" subtitle={`${periodLabel[period]} chief complaints`} />
              {topReasons.length > 0 ? (
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
              ) : <EmptyState label="visit reason" />}
            </div>

            {/* Doctor workload */}
            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="Doctor Workload" subtitle={`Patients seen per doctor — ${periodLabel[period]}`} />
              {doctorLoad.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {doctorLoad.map(d => {
                    const maxPts = Math.max(...doctorLoad.map(x => x.patients));
                    return (
                      <div key={d.doctor}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: "50%", background: d.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: d.color }}>
                              {d.doctor.split(" ").pop()?.[0] || "?"}
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{d.doctor}</span>
                          </div>
                          <span style={{ fontSize: 18, fontWeight: 700, color: d.color }}>{d.patients}</span>
                        </div>
                        <div style={{ height: 8, background: "#f0f3f7", borderRadius: 10, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${maxPts > 0 ? (d.patients / maxPts) * 100 : 0}%`, background: d.color, borderRadius: 10, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 4, paddingTop: 14, borderTop: "1px solid #f0f3f7", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, color: "#8a9bb0" }}>Total patients seen</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#1e2d40" }}>{doctorLoad.reduce((a, d) => a + d.patients, 0)}</span>
                  </div>
                </div>
              ) : <EmptyState label="doctor workload" />}
            </div>
          </div>

          {/* ── Summary table ── */}
          {weeklyQueue.length > 0 && (
            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)", marginBottom: 8, animation: "fadeUp 0.5s ease" }}>
              <SectionHeader
                title={`${periodLabel[period]} Summary Table`}
                subtitle={`Full breakdown for the selected period`}
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
                      {["Date", "Total", "Completed", "Skipped", "Completion %"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #e8edf7", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyQueue.map((row) => {
                      const compPct = row.total > 0 ? Math.round(row.completed / row.total * 100) : 0;
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
                        {weeklyQueue.reduce((a, r) => a + r.total, 0) > 0
                          ? `${Math.round(weeklyQueue.reduce((a, r) => a + r.completed, 0) / weeklyQueue.reduce((a, r) => a + r.total, 0) * 100)}%`
                          : "—"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
