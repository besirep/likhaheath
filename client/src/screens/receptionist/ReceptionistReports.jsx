import { useState, useEffect, useCallback, useRef } from "react";
import {
  Building2, Plus, Stethoscope, AlertCircle, SkipForward, ClipboardList,
  BarChart3, FolderOpen, LayoutDashboard, Download, FileText, Clock,
  Users, CheckCircle, MessageSquare, X, Search, ChevronDown, ArrowUpDown,
  TrendingUp, Inbox, RefreshCw,
} from "lucide-react";
import { printDailyReport } from "../../lib/utils/printUtils.js";
import { dashboardApi } from "../../lib/api/dashboard.js";
import { reportsApi }   from "../../lib/api/reports.js";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toTitle = str =>
  str ? str.replace(/\b\w/g, c => c.toUpperCase()) : "—";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e0e7ef", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(20,40,70,0.1)", fontSize: 13 }}>
      <div style={{ color: "#8a9bb0", marginBottom: 5, fontWeight: 600 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color || "#1e2d40", marginBottom: 2 }}><span style={{ fontWeight: 600 }}>{p.name}:</span> {p.value}</div>)}
    </div>
  );
};

const periodLabel = { today: "Today", week: "This Week", month: "This Month" };

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" });
}

function StatCard({ icon, label, value, sub, color, bg }) {
  return (
    <div style={{ background: bg || "white", borderRadius: 16, padding: "18px 20px", border: "1px solid #e0e7ef", boxShadow: "0 2px 8px rgba(100,120,150,0.06)" }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: color || "#1e2d40", lineHeight: 1, marginTop: 10 }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 13, color: "#8a9bb0", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, subtitle, onViewMore }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e2d40" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: "#8a9bb0", marginTop: 2 }}>{subtitle}</div>}
      </div>
      {onViewMore && (
        <button onClick={onViewMore}
          style={{ background: "#f4f7fb", border: "1px solid #e0e7ef", borderRadius: 9, padding: "6px 14px", fontSize: 13, color: "#4a5d75", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 500, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#e8f7f5"; e.currentTarget.style.color = "#2a9d8f"; e.currentTarget.style.borderColor = "#b8e4de"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#f4f7fb"; e.currentTarget.style.color = "#4a5d75"; e.currentTarget.style.borderColor = "#e0e7ef"; }}>
          View More <ChevronDown size={13} />
        </button>
      )}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: "#b0bdd0" }}>
      <Inbox size={28} strokeWidth={1.5} />
      <div style={{ marginTop: 8, fontSize: 13 }}>No {label} data for this period</div>
    </div>
  );
}

// ─── Generic View More Modal ──────────────────────────────────────────────────
function ViewMoreModal({ title, subtitle, children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: "min(860px, 96vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(20,40,70,0.22)", animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <style>{`@keyframes popIn { from{transform:scale(0.94);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
        <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "22px 28px", borderRadius: "20px 20px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "white" }}>{title}</div>
              {subtitle && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>{subtitle}</div>}
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 34, height: 34, borderRadius: 9, cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px 28px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Table helper ─────────────────────────────────────────────────────────────
function DataTable({ headers, rows, emptyLabel = "data" }) {
  if (!rows.length) return <EmptyState label={emptyLabel} />;
  return (
    <div style={{ border: "1px solid #e0e7ef", borderRadius: 12, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f7f9fb" }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: "10px 14px", textAlign: i === 0 ? "left" : "right", fontSize: 12, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #e8edf7", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: "1px solid #f0f3f7" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f7f9fb"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: "11px 14px", fontSize: 13, textAlign: ci === 0 ? "left" : "right", color: "#1e2d40" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Visit Reasons Modal ──────────────────────────────────────────────────────
function ReasonsModal({ days, onClose }) {
  const [search, setSearch] = useState("");
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchReasons = useCallback(async (q) => {
    setLoading(true);
    try {
      const data = await reportsApi.getReasons({ days, search: q, limit: 100 });
      setRows(data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { fetchReasons(""); }, [fetchReasons]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchReasons(val), 350);
  };

  const total = rows.reduce((s, r) => s + Number(r.cnt), 0);

  return (
    <ViewMoreModal title="Visit Reasons — Full List" subtitle="Case-normalized · HYPERTENSION = hypertension" onClose={onClose}>
      <div style={{ marginBottom: 14, position: "relative" }}>
        <Search size={14} color="#8a9bb0" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
        <input placeholder="Search reason…" value={search} onChange={e => handleSearch(e.target.value)}
          style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", color: "#1e2d40" }}
          onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#8a9bb0", fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r, i) => {
            const pct = total > 0 ? Math.round(r.cnt / total * 100) : 0;
            const colors = ["#2a9d8f", "#0047AB", "#8B5FBF", "#e09040", "#c05080"];
            const c = colors[i % colors.length];
            return (
              <div key={r.reason} style={{ background: "#f7f9fb", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{toTitle(r.reason)}</span>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#8a9bb0" }}>{pct}%</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: c }}>{r.cnt}</span>
                  </div>
                </div>
                <div style={{ height: 6, background: "#e8edf7", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: c, borderRadius: 6, transition: "width 0.5s ease" }} />
                </div>
              </div>
            );
          })}
          {rows.length === 0 && <EmptyState label="matching reasons" />}
        </div>
      )}
    </ViewMoreModal>
  );
}

// ─── Queue Detail Modal ───────────────────────────────────────────────────────
function QueueModal({ rows, period, onClose }) {
  return (
    <ViewMoreModal title="Queue Volume — Full Breakdown" subtitle={`${periodLabel[period]} · all days`} onClose={onClose}>
      <DataTable
        headers={["Date", "Total", "Completed", "Skipped", "Completion %"]}
        emptyLabel="queue"
        rows={rows.map(r => {
          const pct = r.total > 0 ? Math.round(r.completed / r.total * 100) : 0;
          return [
            r.day,
            <strong style={{ color: "#1e2d40" }}>{r.total}</strong>,
            <span style={{ color: "#2a9d8f", fontWeight: 700 }}>{r.completed}</span>,
            <span style={{ color: r.skipped > 3 ? "#c05080" : "#8a9bb0", fontWeight: r.skipped > 3 ? 700 : 400 }}>{r.skipped}</span>,
            <span style={{ color: pct >= 90 ? "#2a9d8f" : "#e09040", fontWeight: 700 }}>{pct}%</span>,
          ];
        })}
      />
      {rows.length > 0 && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#f0f7f5", borderRadius: 10, display: "flex", gap: 24, fontSize: 13, color: "#4a5d75" }}>
          <span>Totals:</span>
          <span><strong>{rows.reduce((a, r) => a + r.total, 0)}</strong> total</span>
          <span style={{ color: "#2a9d8f" }}><strong>{rows.reduce((a, r) => a + r.completed, 0)}</strong> completed</span>
          <span style={{ color: "#c05080" }}><strong>{rows.reduce((a, r) => a + r.skipped, 0)}</strong> skipped</span>
        </div>
      )}
    </ViewMoreModal>
  );
}

// ─── Hourly Modal ─────────────────────────────────────────────────────────────
function HourlyModal({ rows, period, onClose }) {
  const fmt = h => `${h > 12 ? h - 12 : h || 12}:00 ${h >= 12 ? "PM" : "AM"}`;
  return (
    <ViewMoreModal title="Hourly Patient Flow" subtitle={`${periodLabel[period]} · patients per hour`} onClose={onClose}>
      <DataTable
        headers={["Hour", "Patients"]}
        emptyLabel="hourly flow"
        rows={rows.map(r => [fmt(r.hour), <strong style={{ color: "#2a9d8f" }}>{r.patients}</strong>])}
      />
    </ViewMoreModal>
  );
}

// ─── Doctor Workload Modal ────────────────────────────────────────────────────
function DoctorModal({ rows, period, onClose }) {
  const total = rows.reduce((a, d) => a + d.patients, 0);
  return (
    <ViewMoreModal title="Doctor Workload" subtitle={`${periodLabel[period]} · patients per doctor`} onClose={onClose}>
      <DataTable
        headers={["Doctor", "Patients", "Share"]}
        emptyLabel="doctor workload"
        rows={rows.map(d => [
          d.doctor,
          <strong style={{ color: "#1e2d40" }}>{d.patients}</strong>,
          <span style={{ color: "#8a9bb0" }}>{total > 0 ? Math.round(d.patients / total * 100) : 0}%</span>,
        ])}
      />
    </ViewMoreModal>
  );
}

// ─── SMS Modal ────────────────────────────────────────────────────────────────
function SmsModal({ rows, period, onClose }) {
  const totalSent   = rows.reduce((a, r) => a + Number(r.sent), 0);
  const totalFailed = rows.reduce((a, r) => a + Number(r.failed), 0);
  return (
    <ViewMoreModal title="SMS Delivery Log" subtitle={`${periodLabel[period]} · per day breakdown`} onClose={onClose}>
      <DataTable
        headers={["Date", "Sent", "Failed", "Delivery %"]}
        emptyLabel="SMS"
        rows={rows.map(r => {
          const t = Number(r.sent) + Number(r.failed);
          const pct = t > 0 ? Math.round(Number(r.sent) / t * 100) : 100;
          return [
            fmtDate(r.day),
            <span style={{ color: "#2a9d8f", fontWeight: 700 }}>{r.sent}</span>,
            <span style={{ color: r.failed > 0 ? "#CC0000" : "#8a9bb0", fontWeight: r.failed > 0 ? 700 : 400 }}>{r.failed}</span>,
            <span style={{ color: pct >= 95 ? "#2a9d8f" : "#e09040", fontWeight: 700 }}>{pct}%</span>,
          ];
        })}
      />
      {rows.length > 0 && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#f0f7f5", borderRadius: 10, display: "flex", gap: 24, fontSize: 13, color: "#4a5d75" }}>
          <span style={{ color: "#2a9d8f" }}><strong>{totalSent}</strong> sent</span>
          <span style={{ color: "#CC0000" }}><strong>{totalFailed}</strong> failed</span>
          <span><strong>{totalSent + totalFailed > 0 ? Math.round(totalSent / (totalSent + totalFailed) * 100) : 100}%</strong> overall delivery</span>
        </div>
      )}
    </ViewMoreModal>
  );
}

// ─── Wait Time Modal ──────────────────────────────────────────────────────────
function WaitModal({ rows, period, onClose }) {
  return (
    <ViewMoreModal title="Average Wait Time" subtitle={`${periodLabel[period]} · minutes per day`} onClose={onClose}>
      <DataTable
        headers={["Date", "Avg Wait (min)", "vs Target (30m)"]}
        emptyLabel="wait time"
        rows={rows.map(r => [
          fmtDate(r.day),
          <strong style={{ color: r.avg > 30 ? "#CC0000" : "#2a9d8f" }}>{r.avg}m</strong>,
          <span style={{ color: r.avg > 30 ? "#CC0000" : "#2a9d8f", fontSize: 12 }}>{r.avg > 30 ? `+${r.avg - 30}m over` : `${30 - r.avg}m under`}</span>,
        ])}
      />
    </ViewMoreModal>
  );
}

// ─── Priority Modal ───────────────────────────────────────────────────────────
function PriorityModal({ rows, period, onClose }) {
  const nameMap = { regular: "Regular", elderly: "Senior Citizen", pregnant: "Pregnant", pwd: "PWD", pediatric: "Pediatric", solo_parent: "Solo Parent" };
  const total = rows.reduce((s, r) => s + Number(r.value), 0);
  return (
    <ViewMoreModal title="Patient Classification" subtitle={`${periodLabel[period]} · priority breakdown`} onClose={onClose}>
      <DataTable
        headers={["Category", "Count", "Percentage"]}
        emptyLabel="priority data"
        rows={rows.map(r => [
          nameMap[r.priority] || r.priority,
          <strong style={{ color: "#1e2d40" }}>{r.value}</strong>,
          <span style={{ color: "#2a9d8f", fontWeight: 700 }}>{total > 0 ? Math.round(Number(r.value) / total * 100) : 0}%</span>,
        ])}
      />
    </ViewMoreModal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Reports() {
  const [period, setPeriod]   = useState("today");
  const [toast, setToast]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi]         = useState(null);
  const [charts, setCharts]   = useState(null);

  // Which modal is open
  const [modal, setModal] = useState(null); // "queue" | "hourly" | "reasons" | "doctor" | "sms" | "wait" | "priority"

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2800); };

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

  // ── Normalize chart data ──────────────────────────────────────────────────
  const weeklyQueue = (charts?.dailyQueue || []).map(r => ({
    day: fmtDate(r.day), total: Number(r.total) || 0,
    completed: Number(r.completed) || 0, skipped: Number(r.skipped) || 0,
  }));

  const hourlyFlow = (charts?.hourlyFlow || []).map(r => ({
    hour: `${r.hour > 12 ? r.hour - 12 : r.hour || 12}${r.hour >= 12 ? "PM" : "AM"}`,
    hourNum: Number(r.hour),
    patients: Number(r.patients) || 0,
  }));

  const smsWeekly = (charts?.smsWeekly || []).map(r => ({
    day: fmtDate(r.day), sent: Number(r.sent) || 0, failed: Number(r.failed) || 0,
  }));

  const waitTimeWeek = (charts?.waitTimeWeek || []).map(r => ({
    day: fmtDate(r.day), avg: Number(r.avg_wait) || 0,
  }));

  const topReasons = (charts?.topReasons || []).map((r, _i, arr) => {
    const total = arr.reduce((s, x) => s + (Number(x.cnt) || 0), 0);
    return { reason: toTitle(r.reason), count: Number(r.cnt) || 0, pct: total > 0 ? Math.round((Number(r.cnt) || 0) / total * 100) : 0 };
  });

  const doctorLoad = (charts?.doctorLoad || []).map((r, i) => ({
    doctor: r.doctor, patients: Number(r.patients) || 0,
    color: ["#2a9d8f", "#0047AB", "#8B5FBF", "#e09040"][i % 4],
  }));

  const priorityBreakdown = (charts?.priorityBreakdown || []).map((r, i) => ({
    name: r.priority === "regular" ? "Regular" : r.priority === "elderly" ? "Senior Citizen" : r.priority === "pregnant" ? "Pregnant" : r.priority === "pwd" ? "PWD" : r.priority === "pediatric" ? "Pediatric" : r.priority === "solo_parent" ? "Solo Parent" : r.priority || "Regular",
    priority: r.priority,
    value: Number(r.value) || 0,
    color: ["#0047AB", "#8B5FBF", "#d4709a", "#e09040", "#2a9d8f"][i % 5],
  }));

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalAppts     = kpi?.period_appointments ?? 0;
  const completedAppts = kpi?.completed_appointments ?? 0;
  const skippedCount   = kpi?.skipped ?? 0;
  const avgWait        = kpi?.avg_wait ?? 0;
  const smsSent        = kpi?.sms_sent ?? 0;
  const smsFailed      = kpi?.sms_failed ?? 0;
  const totalPriority  = priorityBreakdown.filter(p => p.name !== "Regular").reduce((s, p) => s + p.value, 0);
  const newPatients    = kpi?.new_patients ?? 0;
  const recordsCount   = kpi?.records_count ?? 0;
  const peakHour       = hourlyFlow.length > 0 ? hourlyFlow.reduce((a, b) => b.patients > a.patients ? b : a, hourlyFlow[0]) : null;
  const todayStr       = new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const days           = period === "today" ? 1 : period === "month" ? 30 : 7;

  const exportCSV = () => {
    const rows = [
      ["LikhaHealth Dashboard Report - " + periodLabel[period].toUpperCase()],
      ["Generated On", new Date().toLocaleString()],
      [],
      ["--- KEY PERFORMANCE INDICATORS ---"],
      ["Metric", "Value"],
      ["Total Patients Seen", totalAppts],
      ["Completed", completedAppts],
      ["Avg. Wait Time (min)", avgWait],
      ["Skipped", skippedCount],
      ["New Patients", newPatients],
      ["SMS Sent", smsSent],
      ["SMS Failed", smsFailed],
      ["Priority Patients", totalPriority],
      ["Medical Records Updated", recordsCount],
      [],
      ["--- QUEUE VOLUME BY DAY ---"],
      ["Date", "Total", "Completed", "Skipped", "Completion %"],
      ...weeklyQueue.map(r => [r.day, r.total, r.completed, r.skipped, r.total > 0 ? Math.round(r.completed / r.total * 100) + "%" : "0%"]),
      [],
      ["--- HOURLY PATIENT FLOW ---"],
      ["Hour", "Patients"],
      ...hourlyFlow.map(r => [r.hour, r.patients]),
      [],
      ["--- PATIENT CLASSIFICATION ---"],
      ["Category", "Count"],
      ...priorityBreakdown.map(r => [r.name, r.value]),
      [],
      ["--- TOP VISIT REASONS ---"],
      ["Reason", "Count", "Percentage"],
      ...topReasons.map(r => [r.reason, r.count, r.pct + "%"]),
      [],
      ["--- DOCTOR WORKLOAD ---"],
      ["Doctor", "Patients Seen"],
      ...doctorLoad.map(r => [r.doctor, r.patients]),
      [],
      ["--- AVERAGE WAIT TIME BY DAY ---"],
      ["Date", "Avg Wait (min)"],
      ...waitTimeWeek.map(r => [r.day, r.avg]),
      [],
      ["--- SMS DELIVERY LOG ---"],
      ["Date", "Sent", "Failed", "Delivery %"],
      ...smsWeekly.map(r => {
         const t = r.sent + r.failed;
         const pct = t > 0 ? Math.round(r.sent / t * 100) : 100;
         return [r.day, r.sent, r.failed, pct + "%"];
      }),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `likhahealth-report-${period}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast("Report downloaded as CSV");
  };

  const exportPDF = () => {
    showToast("Generating branded PDF...");
    printDailyReport({
      stats: { total: totalAppts, completed: completedAppts, skipped: skippedCount, waiting: totalAppts - completedAppts - skippedCount, priority: totalPriority, avgWait: `${avgWait}m` },
      queue: weeklyQueue.map(r => ({ queue: r.day, name: `${r.total} patients`, age: "—", reason: `${r.completed} completed`, status: `${r.skipped} skipped`, doctor: "—" })),
      staffName: "Front Desk",
    });
  };

  return (
    <div style={{ background: "#f4f7fb", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Modals */}
      {modal === "queue"    && <QueueModal    rows={weeklyQueue}                           period={period} onClose={() => setModal(null)} />}
      {modal === "hourly"   && <HourlyModal   rows={charts?.hourlyFlow || []}              period={period} onClose={() => setModal(null)} />}
      {modal === "reasons"  && <ReasonsModal  days={days}                                  onClose={() => setModal(null)} />}
      {modal === "doctor"   && <DoctorModal   rows={charts?.doctorLoad || []}              period={period} onClose={() => setModal(null)} />}
      {modal === "sms"      && <SmsModal      rows={charts?.smsWeekly || []}               period={period} onClose={() => setModal(null)} />}
      {modal === "wait"     && <WaitModal     rows={charts?.waitTimeWeek || []}            period={period} onClose={() => setModal(null)} />}
      {modal === "priority" && <PriorityModal rows={charts?.priorityBreakdown || []}       period={period} onClose={() => setModal(null)} />}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e2d40", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 14, zIndex: 400, boxShadow: "0 8px 24px rgba(30,45,64,0.28)", animation: "fadeUp 0.3s ease" }}>
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
            <div style={{ display: "flex", background: "white", border: "1px solid #e0e7ef", borderRadius: 10, overflow: "hidden" }}>
              {["today", "week", "month"].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{ padding: "8px 16px", border: "none", cursor: "pointer", background: period === p ? "#1e2d40" : "transparent", color: period === p ? "white" : "#7a8fb0", fontSize: 14, fontWeight: period === p ? 600 : 400, transition: "all 0.15s", textTransform: "capitalize" }}>{p}</button>
              ))}
            </div>
            <button onClick={loadData} style={{ background: "white", color: "#4a5d75", border: "1px solid #e0e7ef", borderRadius: 10, padding: "9px 13px", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <RefreshCw size={14} strokeWidth={2} /> Refresh
            </button>
            <button onClick={exportPDF} style={{ background: "white", color: "#4a5d75", border: "1px solid #e0e7ef", borderRadius: 10, padding: "9px 16px", fontSize: 14, cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
              <FileText size={15} strokeWidth={2} /> PDF
            </button>
            <button onClick={exportCSV} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.28)", display: "flex", alignItems: "center", gap: 5 }}>
              <BarChart3 size={15} strokeWidth={2} /> CSV
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* KPI cards */}
          <div style={{ animation: "fadeUp 0.25s ease" }}>
            <SectionHeader title={`${periodLabel[period]} at a Glance`} subtitle={`${todayStr} · Live data`} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <StatCard icon={<Users size={22} strokeWidth={2} />} label="Total Patients Seen" value={loading ? "…" : totalAppts} sub={periodLabel[period]} color="#1e2d40" />
              <StatCard icon={<CheckCircle size={22} strokeWidth={2} />} label="Completed" value={loading ? "…" : completedAppts} sub={totalAppts > 0 ? `${Math.round(completedAppts / totalAppts * 100)}% rate` : "—"} color="#2a9d8f" bg="#e8f7f5" />
              <StatCard icon={<Clock size={22} strokeWidth={2} />} label="Avg. Wait Time" value={loading ? "…" : `${avgWait}m`} sub="Target: under 30 min" color="#e09040" bg="#fdf3e8" />
              <StatCard icon={<SkipForward size={22} strokeWidth={2} />} label="Skipped" value={loading ? "…" : skippedCount} sub="Called, no response" color="#c05080" bg="#fce8f0" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
              <StatCard icon={<MessageSquare size={22} strokeWidth={2} />} label="SMS Sent" value={loading ? "…" : smsSent} sub={smsFailed > 0 ? `${smsFailed} failed` : "No failures"} color="#0047AB" bg="#E5EDF8" />
              <StatCard icon={<AlertCircle size={22} strokeWidth={2} />} label="Priority Patients" value={loading ? "…" : totalPriority} sub="Elderly, PWD, Pregnant, Pedia" color="#8B5FBF" bg="#f0eafb" />
              <StatCard icon={<ClipboardList size={22} strokeWidth={2} />} label="Medical Records" value={loading ? "…" : recordsCount} sub={periodLabel[period]} color="#2a9d8f" bg="#e8f7f5" />
              <StatCard icon={<Stethoscope size={22} strokeWidth={2} />} label="New Patients" value={loading ? "…" : newPatients} sub="Newly registered" color="#0047AB" bg="#EBF0FA" />
            </div>
          </div>

          {/* Queue Volume */}
          <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)", animation: "fadeUp 0.3s ease" }}>
            <SectionHeader title={`Queue Volume — ${periodLabel[period]}`} subtitle="Total patients vs completed per day" onViewMore={() => setModal("queue")} />
            {weeklyQueue.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyQueue} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f7" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Total" fill="#e8f2f0" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#2a9d8f" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState label="queue" />}
          </div>

          {/* Two-column: Hourly + Priority */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "fadeUp 0.35s ease" }}>

            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="Hourly Patient Flow" subtitle={`${periodLabel[period]} · patients per hour`} onViewMore={() => setModal("hourly")} />
              {hourlyFlow.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={hourlyFlow}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f7" vertical={false} />
                      <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="patients" name="Patients" radius={[6, 6, 0, 0]}>
                        {hourlyFlow.map((entry, i) => (
                          <Cell key={i} fill={entry.patients === Math.max(...hourlyFlow.map(h => h.patients)) ? "#2a9d8f" : "#d4ede9"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {peakHour && <div style={{ marginTop: 8, fontSize: 13, color: "#7a8fb0", textAlign: "center" }}>Peak: <strong style={{ color: "#2a9d8f" }}>{peakHour.hour}</strong> — {peakHour.patients} patients</div>}
                </>
              ) : <EmptyState label="hourly flow" />}
            </div>

            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="Patient Classification" subtitle={`${periodLabel[period]} priority breakdown`} onViewMore={() => setModal("priority")} />
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
                          <span style={{ fontSize: 13, color: "#4a5d75", flex: 1 }}>{p.name}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e2d40" }}>{p.value}</span>
                          <span style={{ fontSize: 12, color: "#8a9bb0", minWidth: 30 }}>{priorityBreakdown.reduce((s, x) => s + x.value, 0) > 0 ? Math.round(p.value / priorityBreakdown.reduce((s, x) => s + x.value, 0) * 100) : 0}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : <EmptyState label="priority" />}
            </div>
          </div>

          {/* Two-column: Wait time + SMS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "fadeUp 0.4s ease" }}>

            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="Average Wait Time" subtitle={`Minutes per day — ${periodLabel[period]}`} onViewMore={() => setModal("wait")} />
              {waitTimeWeek.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={waitTimeWeek}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f7" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#8a9bb0" }} axisLine={false} tickLine={false} domain={[0, "auto"]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey={() => 30} name="Target (30m)" stroke="#f0c8a0" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
                      <Line type="monotone" dataKey="avg" name="Avg Wait (min)" stroke="#e09040" strokeWidth={2.5} dot={{ r: 4, fill: "#e09040" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", gap: 14, marginTop: 8, justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 16, height: 2, background: "#e09040", borderRadius: 2 }} /><span style={{ fontSize: 12, color: "#8a9bb0" }}>Avg wait</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 16, height: 2, background: "#f0c8a0", borderRadius: 2 }} /><span style={{ fontSize: 12, color: "#8a9bb0" }}>30-min target</span></div>
                  </div>
                </>
              ) : <EmptyState label="wait time" />}
            </div>

            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="SMS Delivery" subtitle={`${periodLabel[period]} · sent vs failed`} onViewMore={() => setModal("sms")} />
              {smsWeekly.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={smsWeekly} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f7" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#8a9bb0" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="sent" name="Sent" fill="#2a9d8f" radius={[5, 5, 0, 0]} stackId="a" />
                      <Bar dataKey="failed" name="Failed" fill="#f5c8b0" radius={[5, 5, 0, 0]} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", gap: 14, marginTop: 8, justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: "#2a9d8f" }} /><span style={{ fontSize: 12, color: "#8a9bb0" }}>Sent</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: "#f5c8b0" }} /><span style={{ fontSize: 12, color: "#8a9bb0" }}>Failed</span></div>
                  </div>
                </>
              ) : <EmptyState label="SMS" />}
            </div>
          </div>

          {/* Two-column: Visit Reasons + Doctor Load */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animation: "fadeUp 0.45s ease" }}>

            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="Top Visit Reasons" subtitle={`Case-normalized · ${periodLabel[period]}`} onViewMore={() => setModal("reasons")} />
              {topReasons.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {topReasons.slice(0, 5).map((r, i) => (
                    <div key={r.reason}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 14, color: "#1e2d40", fontWeight: i === 0 ? 600 : 400 }}>{r.reason}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#2a9d8f" }}>{r.count}</span>
                      </div>
                      <div style={{ height: 7, background: "#f0f3f7", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 10, transition: "width 0.6s ease", width: `${r.pct}%`, background: i === 0 ? "linear-gradient(90deg,#2a9d8f,#52c4b8)" : i === 1 ? "linear-gradient(90deg,#0047AB,#7ab8f5)" : "#d0e8e4" }} />
                      </div>
                    </div>
                  ))}
                  {topReasons.length > 5 && (
                    <button onClick={() => setModal("reasons")} style={{ background: "none", border: "none", cursor: "pointer", color: "#2a9d8f", fontSize: 13, fontWeight: 600, textAlign: "left", padding: "2px 0" }}>
                      +{topReasons.length - 5} more reasons — View all →
                    </button>
                  )}
                </div>
              ) : <EmptyState label="visit reason" />}
            </div>

            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1px solid #e0e7ef", boxShadow: "0 2px 10px rgba(100,120,150,0.06)" }}>
              <SectionHeader title="Doctor Workload" subtitle={`Patients seen — ${periodLabel[period]}`} onViewMore={() => setModal("doctor")} />
              {doctorLoad.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {doctorLoad.map(d => {
                    const maxPts = Math.max(...doctorLoad.map(x => x.patients));
                    return (
                      <div key={d.doctor}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: "50%", background: d.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: d.color }}>
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
                    <span style={{ fontSize: 13, color: "#8a9bb0" }}>Total patients seen</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40" }}>{doctorLoad.reduce((a, d) => a + d.patients, 0)}</span>
                  </div>
                </div>
              ) : <EmptyState label="doctor workload" />}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
