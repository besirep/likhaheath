import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Building2, Plus, Stethoscope, Clock, ClipboardList, BarChart3, CalendarDays, FolderOpen, UserRound, User, Lock, AlertTriangle, Phone, LayoutDashboard, Users, Smartphone, X, Droplets, MapPin } from "lucide-react";
import { patientsApi } from "../../lib/api/patients.js";
import { smsApi } from "../../lib/api/sms.js";

/** Normalize a backend patient row to the shape the UI expects */
function normalizePatient(p) {
  const dob = p.date_of_birth ? new Date(p.date_of_birth) : null;
  const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25*24*60*60*1000)) : null;
  const dobStr = dob ? dob.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : "—";

  // Derive a rough "status" — priority patients get 'priority', else 'active'
  const priority = p.priority_tag || null;
  const status   = priority ? "priority" : "active";

  const address = [p.barangay, p.municipality].filter(Boolean).join(", ") || "—";

  return {
    id:          p.id,
    name:        `${p.first_name} ${p.last_name}${p.suffix ? ` ${p.suffix}` : ""}`.trim(),
    age,
    gender:      p.sex === "Female" ? "F" : p.sex === "Male" ? "M" : "?",
    dob:         dobStr,
    contact:     p.primary_contact || "—",
    address,
    bloodType:   p.blood_type || "—",
    allergies:   [],
    status,
    philhealth:  p.philhealth_no || "—",
    conditions:  [],
    lastVisit:   "—",
    totalVisits: 0,
    priority,
    visits:      [],
    visitsLoaded: false,
  };
}


/** Normalize a backend visit/appointment row */
function normalizeVisit(v) {
  const d = v.scheduled_date ? new Date(v.scheduled_date) : null;
  return {
    id:        `v${v.appointment_id}`,
    date:      d ? d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—",
    time:      d ? d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) : "—",
    queue:     v.queue_number ? `Q-${String(v.queue_number).padStart(3, "0")}` : "—",
    reason:    v.notes || "—",
    diagnosis: v.diagnosis || "(no diagnosis recorded)",
    doctor:    v.doctor_name || "—",
    duration:  "—",
    status:    v.appointment_status === "Completed" ? "completed" : "scheduled",
  };
}


// Placeholder start-of-data array (replaced immediately by API)
const _placeholder = [
  {
    id: 1, name: "Maria Santos", age: 34, gender: "F", dob: "May 12, 1991",
    contact: "+63 912 345 6789", address: "142 Rizal St., Quezon City",
    bloodType: "A+", allergies: ["Penicillin"], status: "active",
    philhealth: "PH-1234-5678-9", conditions: ["Hypertension", "Hyperlipidemia"],
    lastVisit: "Mar 1, 2026", totalVisits: 12, priority: null,
    visits: [
      { id: "v1", date: "Mar 1, 2026",  time: "9:05 AM", queue: "A-001", reason: "Hypertension follow-up", diagnosis: "Essential Hypertension (I10)", doctor: "Dr. Reyes",  duration: "18 min", status: "completed" },
      { id: "v2", date: "Jan 14, 2026", time: "10:30 AM", queue: "B-003", reason: "Hypertension check",    diagnosis: "Essential Hypertension (I10)", doctor: "Dr. Reyes",  duration: "15 min", status: "completed" },
      { id: "v3", date: "Nov 3, 2025",  time: "2:00 PM",  queue: "C-007", reason: "Flu symptoms",          diagnosis: "Acute URTI (J06.9)",          doctor: "Dr. Santos", duration: "12 min", status: "completed" },
      { id: "v4", date: "Aug 22, 2025", time: "9:00 AM",  queue: "A-012", reason: "Annual physical exam",  diagnosis: "Routine exam (Z00.00)",        doctor: "Dr. Reyes",  duration: "25 min", status: "completed" },
    ],
  },
  {
    id: 2, name: "Jose Dela Cruz", age: 57, gender: "M", dob: "Feb 3, 1969",
    contact: "+63 917 234 5678", address: "89 Mabini Ave., Manila",
    bloodType: "O+", allergies: ["Sulfa drugs"], status: "active",
    philhealth: "PH-9876-5432-1", conditions: ["Type 2 Diabetes", "Hypertension"],
    lastVisit: "Mar 1, 2026", totalVisits: 24, priority: null,
    visits: [
      { id: "v1", date: "Mar 1, 2026",  time: "9:28 AM",  queue: "A-002", reason: "Diabetes check-up",   diagnosis: "Type 2 Diabetes Mellitus (E11)", doctor: "Dr. Santos", duration: "22 min", status: "completed" },
      { id: "v2", date: "Dec 10, 2025", time: "11:00 AM", queue: "B-005", reason: "BP monitoring",        diagnosis: "Essential Hypertension (I10)",   doctor: "Dr. Santos", duration: "18 min", status: "completed" },
      { id: "v3", date: "Sep 5, 2025",  time: "2:30 PM",  queue: "C-002", reason: "Diabetes follow-up",  diagnosis: "Type 2 Diabetes Mellitus (E11)", doctor: "Dr. Santos", duration: "20 min", status: "completed" },
    ],
  },
  {
    id: 3, name: "Elena Cruz", age: 66, gender: "F", dob: "Mar 18, 1960",
    contact: "+63 915 999 8877", address: "201 Del Pilar St., Caloocan",
    bloodType: "A-", allergies: ["Ibuprofen", "Contrast dye"], status: "priority",
    philhealth: "PH-1122-3344-5", conditions: ["Hypertension", "Type 2 Diabetes", "Coronary artery disease"],
    lastVisit: "Jan 20, 2026", totalVisits: 31, priority: "elderly",
    visits: [
      { id: "v1", date: "Jan 20, 2026", time: "1:00 PM",  queue: "A-005", reason: "Chest discomfort",     diagnosis: "Unstable angina (I20.0)",            doctor: "Dr. Reyes",  duration: "30 min", status: "completed" },
      { id: "v2", date: "Nov 10, 2025", time: "9:15 AM",  queue: "B-002", reason: "BP + DM check",         diagnosis: "Hypertension & Type 2 Diabetes",     doctor: "Dr. Reyes",  duration: "25 min", status: "completed" },
      { id: "v3", date: "Aug 5, 2025",  time: "10:00 AM", queue: "C-014", reason: "Cardiology follow-up", diagnosis: "Coronary artery disease",              doctor: "Dr. Cruz",   duration: "35 min", status: "completed" },
    ],
  },
  {
    id: 4, name: "Luisa Ramos", age: 28, gender: "F", dob: "Jul 4, 1997",
    contact: "+63 921 333 4455", address: "55 Katipunan Ave., Quezon City",
    bloodType: "B+", allergies: [], status: "active",
    philhealth: "PH-5566-7788-9", conditions: ["Pregnancy (2nd trimester)"],
    lastVisit: "Feb 20, 2026", totalVisits: 6, priority: "pregnant",
    visits: [
      { id: "v1", date: "Feb 20, 2026", time: "10:00 AM", queue: "B-004", reason: "Prenatal check-up",    diagnosis: "Normal pregnancy (Z34)",              doctor: "Dr. Cruz",   duration: "20 min", status: "completed" },
      { id: "v2", date: "Jan 10, 2026", time: "2:00 PM",  queue: "C-009", reason: "Prenatal check-up",    diagnosis: "Normal pregnancy (Z34)",              doctor: "Dr. Cruz",   duration: "18 min", status: "completed" },
    ],
  },
  {
    id: 5, name: "Ana Lim", age: 28, gender: "F", dob: "Oct 9, 1997",
    contact: "+63 918 765 4321", address: "33 Luna St., Pasig City",
    bloodType: "B+", allergies: [], status: "active",
    philhealth: "PH-6677-8899-0", conditions: [],
    lastVisit: "Feb 25, 2026", totalVisits: 5, priority: null,
    visits: [
      { id: "v1", date: "Feb 25, 2026", time: "11:30 AM", queue: "C-001", reason: "Fever & cough",        diagnosis: "Acute URTI (J06.9)",                  doctor: "Dr. Santos", duration: "12 min", status: "completed" },
      { id: "v2", date: "Aug 14, 2025", time: "10:00 AM", queue: "A-009", reason: "Annual check-up",      diagnosis: "Routine exam (Z00.00)",               doctor: "Dr. Santos", duration: "20 min", status: "completed" },
    ],
  },
  {
    id: 6, name: "Ramon Valdez", age: 45, gender: "M", dob: "Jun 22, 1980",
    contact: "+63 920 111 2233", address: "77 Bonifacio Rd., Marikina",
    bloodType: "AB-", allergies: ["Aspirin"], status: "active",
    philhealth: "PH-3344-5566-7", conditions: ["Lumbar strain", "Mild obesity"],
    lastVisit: "Feb 22, 2026", totalVisits: 8, priority: null,
    visits: [
      { id: "v1", date: "Feb 22, 2026", time: "3:00 PM",  queue: "C-002", reason: "Back pain",            diagnosis: "Lumbar muscle strain (M54.5)",        doctor: "Dr. Reyes",  duration: "25 min", status: "completed" },
      { id: "v2", date: "Oct 3, 2025",  time: "11:45 AM", queue: "B-008", reason: "Back pain follow-up",  diagnosis: "Lumbar muscle strain (M54.5)",        doctor: "Dr. Reyes",  duration: "15 min", status: "completed" },
    ],
  },
  {
    id: 7, name: "Carlos Mendoza", age: 8, gender: "M", dob: "Mar 5, 2018",
    contact: "+63 918 444 3322", address: "14 Sampaguita St., Caloocan",
    bloodType: "O+", allergies: [], status: "active",
    philhealth: "PH-7788-9900-1", conditions: [],
    lastVisit: "Feb 10, 2026", totalVisits: 9, priority: "pediatric",
    visits: [
      { id: "v1", date: "Feb 10, 2026", time: "9:00 AM",  queue: "A-003", reason: "Fever",                diagnosis: "Viral fever (R50.9)",                 doctor: "Dr. Cruz",   duration: "15 min", status: "completed" },
      { id: "v2", date: "Nov 5, 2025",  time: "10:30 AM", queue: "B-006", reason: "Vaccination",          diagnosis: "Routine immunization (Z23)",          doctor: "Dr. Cruz",   duration: "10 min", status: "completed" },
    ],
  },
  {
    id: 8, name: "Pedro Bautista", age: 51, gender: "M", dob: "Apr 7, 1975",
    contact: "+63 919 444 5566", address: "14 Aguinaldo St., Taguig",
    bloodType: "O-", allergies: [], status: "inactive",
    philhealth: "PH-2233-4455-6", conditions: ["Overweight"],
    lastVisit: "Feb 28, 2026", totalVisits: 3, priority: null,
    visits: [
      { id: "v1", date: "Feb 28, 2026", time: "10:00 AM", queue: "B-001", reason: "Annual physical",      diagnosis: "Routine exam (Z00.00)",               doctor: "Dr. Reyes",  duration: "25 min", status: "completed" },
    ],
  },
];
// ── end placeholder ──────────────────────────────────────────────────────────

const statusStyle = {
  active:   { color: "#2a9d8f", bg: "#e8f7f5", label: "Active"   },
  priority: { color: "#8B5FBF", bg: "#f0eafb", label: "Priority" },
  inactive: { color: "#9aabc0", bg: "#f0f4fa", label: "Inactive" },
};

const priorityConfig = {
  elderly:   { label: "Senior Citizen", Icon: UserRound, color: "#8B5FBF", bg: "#f0eafb" },
  pregnant:  { label: "Pregnant",       Icon: UserRound, color: "#d4709a", bg: "#fce8f3" },
  pwd:       { label: "PWD",            Icon: UserRound, color: "#0047AB", bg: "#EBF0FA" },
  pediatric: { label: "Pedia",          Icon: UserRound, color: "#e09040", bg: "#fdf3e8" },
  solo:      { label: "Solo Parent",    Icon: Users, color: "#2a9d8f", bg: "#e8f7f5" },
};

function Avatar({ name, size = 36 }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const hue = (name.charCodeAt(0) * 37 + name.charCodeAt(1) * 17) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `hsl(${hue},45%,72%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700,
      color: `hsl(${hue},45%,28%)`, flexShrink: 0,
    }}>{initials}</div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar() {
  return (
    <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 220, background: "white", borderRight: "1px solid #edf1f7", display: "flex", flexDirection: "column", zIndex: 10, boxShadow: "2px 0 12px rgba(100,120,150,0.07)" }}>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #f0f3f7" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}><Building2 size={18} strokeWidth={2} /></div>
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
          { Icon: LayoutDashboard,  label: "Dashboard"                        },
          { Icon: ClipboardList, label: "Queue"                             },
          { icon: Plus, label: "Register Patient"                  },
          { Icon: FolderOpen, label: "Patient Records"                   },
          { Icon: CalendarDays, label: "Appointments",   badge: "3"       },
          { icon: "", label: "SMS Logs"                          },
          { Icon: BarChart3, label: "Reports"                           },
        ].map(item => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10, marginBottom: 2, cursor: "pointer",
            background: item.label === "Patient Records" ? "#e8f7f5" : "transparent",
            color: item.label === "Patient Records" ? "#2a9d8f" : "#4a5d75",
            fontWeight: item.label === "Patient Records" ? 600 : 400, fontSize: 14, transition: "all 0.18s",
          }}
            onMouseEnter={e => { if (item.label !== "Patient Records") { e.currentTarget.style.background = "#f4f7fb"; e.currentTarget.style.color = "#1e2d40"; }}}
            onMouseLeave={e => { if (item.label !== "Patient Records") { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4a5d75"; }}}
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

// ── Visit Detail Drawer ───────────────────────────────────────────────────────
function VisitDrawer({ visit, patient, onClose, onBook, onSms }) {
  if (!visit) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.22)", zIndex: 90 }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 420,
        background: "white", zIndex: 100, overflowY: "auto",
        boxShadow: "-8px 0 40px rgba(30,45,64,0.14)",
        animation: "slideIn 0.3s cubic-bezier(0.22,1,0.36,1)",
        display: "flex", flexDirection: "column",
      }}>
        <style>{`@keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }`}</style>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "22px 24px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>Consultation Record</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>{visit.diagnosis}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>{patient?.name} · {visit.date} · {visit.time}</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} strokeWidth={2} /></button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {[visit.queue, visit.duration, visit.doctor].map(tag => (
              <span key={tag} style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", borderRadius: 7, padding: "3px 10px", fontSize: 14 }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Body — read-only info */}
        <div style={{ flex: 1, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#e8f7f5", borderRadius: 13, padding: "16px 18px", border: "1px solid #c0e0dc" }}>
            <div style={{ fontSize: 14, color: "#2a9d8f", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>Chief Complaint</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1e2d40" }}>{visit.reason}</div>
          </div>

          <div style={{ background: "#f7f9fd", borderRadius: 13, padding: "16px 18px", border: "1px solid #e0e7ef" }}>
            <div style={{ fontSize: 14, color: "#8a9bb0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>Diagnosis</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40" }}>{visit.diagnosis}</div>
          </div>

          {/* Read-only notice */}
          <div style={{ background: "#fdf3e8", borderRadius: 11, padding: "10px 14px", border: "1px solid #f5ddb8", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 16 }}><Lock size={16} strokeWidth={2} /></span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#b07030" }}>Read-only Access</div>
              <div style={{ fontSize: 14, color: "#9a6a40" }}>Clinical notes visible to doctors only. You can view basic visit info.</div>
            </div>
          </div>

          {/* Visit meta */}
          <div style={{ background: "white", borderRadius: 13, padding: "14px 16px", border: "1px solid #e0e7ef" }}>
            <div style={{ fontSize: 14, color: "#8a9bb0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>Visit Details</div>
            {[
              { label: "Date",     value: visit.date     },
              { label: "Time",     value: visit.time     },
              { label: "Queue #",  value: visit.queue    },
              { label: "Doctor",   value: visit.doctor   },
              { label: "Duration", value: visit.duration },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f0f3f7" }}>
                <span style={{ fontSize: 14, color: "#8a9bb0" }}>{r.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Actions available to receptionist */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
            <button onClick={() => { onBook && onBook(patient); onClose(); }} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.25)" }}>
              Book Follow-up Appointment
            </button>
            <button onClick={() => { onSms && onSms(patient.name); onClose(); }} style={{ background: "white", color: "#4a5d75", border: "1px solid #e0e7ef", borderRadius: 10, padding: "10px", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
              Send Visit Summary SMS
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Profile Panel ─────────────────────────────────────────────────────────────
function ProfilePanel({ patient, onVisitSelect, selectedVisitId, onAddQueue, onSms }) {
  const [tab, setTab] = useState("overview");

  if (!patient) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#8a9bb0" }}>
      <div style={{ fontSize: 52 }}><FolderOpen size={16} strokeWidth={2} /></div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#1e2d40" }}>Select a patient</div>
      <div style={{ fontSize: 14 }}>Click any record from the list</div>
    </div>
  );

  const ss = statusStyle[patient.status];
  const pc = patient.priority ? priorityConfig[patient.priority] : null;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Profile banner */}
      <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "24px 28px 20px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative" }}>
              <Avatar name={patient.name} size={54} />
              {pc && pc.Icon && <div style={{ position: "absolute", bottom: -2, right: -2 }}><pc.Icon size={14} strokeWidth={2} color={pc.color} /></div>}
            </div>
            <div>
              <div style={{ fontSize: 21, fontWeight: 700, color: "white" }}>{patient.name}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{patient.age} yrs · {patient.gender} · DOB: {patient.dob}</div>
              <div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ background: ss.bg, color: ss.color, borderRadius: 7, padding: "3px 10px", fontSize: 14, fontWeight: 700 }}>{ss.label}</span>
                {pc && <span style={{ background: pc.bg, color: pc.color, borderRadius: 7, padding: "3px 10px", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>{pc.Icon && <pc.Icon size={13} strokeWidth={2} />} {pc.label}</span>}
                <span style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", borderRadius: 7, padding: "3px 10px", fontSize: 14 }}><Droplets size={16} strokeWidth={2} /> {patient.bloodType}</span>
                <span style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", borderRadius: 7, padding: "3px 10px", fontSize: 14 }}><ClipboardList size={16} strokeWidth={2} /> {patient.totalVisits} visits</span>
              </div>
            </div>
          </div>

          {/* Receptionist actions */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={() => onSms && onSms(patient.name)} style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "8px 14px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>SMS</button>
            <button onClick={() => onAddQueue && onAddQueue(patient)} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(42,157,143,0.3)" }}><Plus size={16} strokeWidth={2} /> Add to Queue</button>
          </div>
        </div>

        {/* Quick info */}
        <div style={{ display: "flex", gap: 20, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)", flexWrap: "wrap" }}>
          {[
            { Icon: Phone,     v: patient.contact },
            { Icon: MapPin,    v: patient.address },
            { Icon: Building2, v: `PhilHealth: ${patient.philhealth}` },
          ].map(i => (
            <div key={i.v} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
              <i.Icon size={14} strokeWidth={2} />{i.v}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "white", borderBottom: "1px solid #e8edf7", padding: "0 28px", display: "flex", flexShrink: 0 }}>
        {[
          { key: "overview", label: "Overview" },
          { key: "history",  label: `All Visits (${patient.visits.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: "none", border: "none", padding: "14px 18px",
            fontSize: 14, fontWeight: tab === t.key ? 700 : 400,
            color: tab === t.key ? "#2a9d8f" : "#7a8fb0",
            borderBottom: tab === t.key ? "2.5px solid #2a9d8f" : "2.5px solid transparent",
            cursor: "pointer", marginBottom: -1, transition: "color 0.15s",
            fontFamily: "'Afacad', sans-serif",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "22px 28px", background: "#f7f9fb" }}>

        {/* Overview */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.2s ease" }}>
            <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }`}</style>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Conditions */}
              <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #e0e7ef" }}>
                <div style={{ fontSize: 14, color: "#8a9bb0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}><Building2 size={18} strokeWidth={2} /> Conditions</div>
                {patient.conditions.length > 0 ? patient.conditions.map(c => (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2a9d8f", flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: "#1e2d40", fontWeight: 500 }}>{c}</span>
                  </div>
                )) : <div style={{ fontSize: 14, color: "#8a9bb0" }}>None recorded</div>}
              </div>

              {/* Allergies */}
              <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #e0e7ef" }}>
                <div style={{ fontSize: 14, color: "#8a9bb0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Allergies</div>
                {patient.allergies.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {patient.allergies.map(a => (
                      <span key={a} style={{ background: "#fde8e0", color: "#CC0000", borderRadius: 8, padding: "5px 12px", fontSize: 14, fontWeight: 600, border: "1px solid #f5c8b0" }}><AlertTriangle size={14} strokeWidth={2} /> {a}</span>
                    ))}
                  </div>
                ) : <div style={{ fontSize: 14, color: "#8a9bb0" }}>No known allergies</div>}
              </div>
            </div>

            {/* Personal info */}
            <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #e0e7ef" }}>
              <div style={{ fontSize: 14, color: "#8a9bb0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 14 }}><User size={16} strokeWidth={2} /> Patient Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
                {[
                  { label: "Date of Birth",  value: patient.dob         },
                  { label: "Blood Type",     value: patient.bloodType   },
                  { label: "Gender",         value: patient.gender === "F" ? "Female" : "Male" },
                  { label: "Contact",        value: patient.contact     },
                  { label: "PhilHealth",     value: patient.philhealth  },
                  { label: "Total Visits",   value: `${patient.totalVisits} visits` },
                ].map((f, i) => (
                  <div key={f.label} style={{ padding: "11px 0", borderBottom: i < 3 ? "1px solid #f0f3f7" : "none", paddingRight: 14 }}>
                    <div style={{ fontSize: 14, color: "#8a9bb0", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>{f.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Last visit snapshot */}
            {patient.visits[0] && (
              <div onClick={() => { onVisitSelect(patient.visits[0]); setTab("history"); }}
                style={{ background: "linear-gradient(135deg,#e8f7f5,#d4ede9)", borderRadius: 14, padding: "16px 18px", border: "1px solid #b8e4de", cursor: "pointer" }}>
                <div style={{ fontSize: 14, color: "#2a9d8f", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}><Stethoscope size={16} strokeWidth={2} /> Last Visit — click to view</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1e2d40" }}>{patient.visits[0].diagnosis}</div>
                <div style={{ fontSize: 14, color: "#5a8f80", marginTop: 3 }}>{patient.visits[0].date} · {patient.visits[0].doctor}</div>
              </div>
            )}

            {/* Read-only notice */}
            <div style={{ background: "#fdf3e8", borderRadius: 12, padding: "12px 14px", border: "1px solid #f5ddb8", display: "flex", gap: 10, alignItems: "center" }}>
              <span><Lock size={16} strokeWidth={2} /></span>
              <div style={{ fontSize: 14, color: "#9a6a40" }}>Clinical notes and prescriptions are visible to doctors only. As reception, you can view basic patient info, visit history, and manage scheduling.</div>
            </div>
          </div>
        )}

        {/* Visit History */}
        {tab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0, animation: "fadeUp 0.2s ease" }}>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginBottom: 14 }}>
              {patient.visits.length} total visit record{patient.visits.length !== 1 ? "s" : ""}
              <span style={{ marginLeft: 8, background: "#EBF0FA", color: "#0047AB", borderRadius: 6, padding: "2px 8px", fontSize: 13, fontWeight: 600 }}>All types shown</span>
              <span style={{ marginLeft: 6, fontSize: 13, color: "#b0beca" }}>— click any to view details</span>
            </div>

            <div style={{ position: "relative" }}>
              {/* Timeline line */}
              <div style={{ position: "absolute", left: 16, top: 10, bottom: 10, width: 2, background: "#e0e8e6", zIndex: 0 }} />

              {patient.visits.map((v, i) => {
                const isSelected = selectedVisitId === v.id;
                return (
                  <div key={v.id} onClick={() => onVisitSelect(v)} style={{ display: "flex", gap: 14, marginBottom: 12, cursor: "pointer", position: "relative", zIndex: 1 }}>
                    {/* Timeline dot */}
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      background: i === 0 ? "#2a9d8f" : "white",
                      border: `2px solid ${i === 0 ? "#2a9d8f" : "#c8deda"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: i === 0 ? 14 : 11,
                      color: i === 0 ? "white" : "#8a9bb0",
                      fontWeight: 700,
                      boxShadow: i === 0 ? "0 0 0 4px #d4ede9" : "none", zIndex: 2,
                    }}>
                      {i === 0 ? <Stethoscope size={16} strokeWidth={2} /> : patient.visits.length - i}
                    </div>

                    {/* Card */}
                    <div style={{
                      flex: 1, background: "white", borderRadius: 14, padding: "14px 16px",
                      border: `2px solid ${isSelected ? "#2a9d8f" : "#e0e7ef"}`,
                      boxShadow: isSelected ? "0 4px 16px rgba(42,157,143,0.14)" : "0 2px 6px rgba(20,40,60,0.04)",
                      transition: "all 0.18s",
                    }}
                      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = "#a8d5cc"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(42,157,143,0.1)"; }}}
                      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = "#e0e7ef"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(20,40,60,0.04)"; }}}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e2d40" }}>{v.diagnosis}</div>
                          <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 3 }}>{v.reason}</div>
                          <div style={{ fontSize: 14, color: "#b0beca", marginTop: 4 }}>{v.doctor} · {v.queue} · {v.duration}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: i === 0 ? "#2a9d8f" : "#7a8fb0" }}>{v.date}</div>
                          <div style={{ fontSize: 14, color: "#b0beca", marginTop: 2 }}>{v.time}</div>
                          <div style={{
                            marginTop: 8, display: "inline-block",
                            background: isSelected ? "#2a9d8f" : "#f0f3f7",
                            color: isSelected ? "white" : "#2a9d8f",
                            border: `1px solid ${isSelected ? "#2a9d8f" : "#c8deda"}`,
                            borderRadius: 7, padding: "3px 10px", fontSize: 14, fontWeight: 600,
                            transition: "all 0.15s",
                          }}>
                            {isSelected ? "Viewing →" : "View →"}
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

// ── Add to Queue Modal ──────────────────────────────────────────────────────
function AddToQueueModal({ patient, onClose, onConfirm }) {
  const [reason, setReason] = useState(patient?.reason || '');
  const [doctor, setDoctor] = useState('Dr. Reyes');
  if (!patient) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: 440, boxShadow: "0 24px 64px rgba(20,40,70,0.22)", overflow: "hidden", animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <style>{`@keyframes popIn{from{transform:scale(0.93);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "white" }}>Add to Queue</div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14, color: "white" }}><X size={16} strokeWidth={2} /></button>
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>{patient.name} · {patient.age} yrs</div>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Chief Complaint / Reason</label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Enter reason for visit..." style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Assign Doctor</label>
            <select value={doctor} onChange={e => setDoctor(e.target.value)} style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }}>
              <option>Dr. Reyes</option>
              <option>Dr. Santos</option>
              <option>Dr. Cruz</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, background: "#f4f7fb", border: "1px solid #e0e7ef", borderRadius: 10, padding: "11px", fontSize: 14, color: "#7a8fb0", cursor: "pointer" }}>Cancel</button>
            <button onClick={() => { onConfirm(patient, reason, doctor); onClose(); }} style={{ flex: 2, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 10, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.28)" }}>Add to Queue</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReceptionistPatientRecords({ onNavigate }) {
  const [allPatients, setAllPatients]     = useState([]);
  const [selected, setSelected]           = useState(null);
  const [activeVisit, setActiveVisit]     = useState(null);
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [addQueueModal, setAddQueueModal] = useState(null);
  const [toast, setToast]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const debounceRef = useRef(null);

  const showToast = (msg) => { setToast(null); setTimeout(() => setToast(msg), 10); };

  // ── Load patient list ──────────────────────────────────────────────────────
  const fetchPatients = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await patientsApi.getAll({ search: q, limit: 50 });
      const normalized = (res.data || []).map(normalizePatient);
      setAllPatients(normalized);
      if (!selected && normalized.length > 0) setSelected(normalized[0]);
    } catch (err) {
      console.error("[PatientRecords] fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { fetchPatients(); }, []);

  // Debounced search (400ms)
  const handleSearchChange = (val) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPatients(val), 400);
  };

  // ── Lazy-load visits when a patient is selected ────────────────────────────
  const handlePatientSelect = useCallback(async (p) => {
    setSelected(p);
    setActiveVisit(null);
    if (p.visitsLoaded) return;  // already fetched
    setVisitsLoading(true);
    try {
      const res = await patientsApi.getVisits(p.id);
      const visits = (res.data || []).map(normalizeVisit);
      setAllPatients(prev => prev.map(pt =>
        pt.id === p.id ? { ...pt, visits, visitsLoaded: true } : pt
      ));
      setSelected(prev => prev ? { ...prev, visits, visitsLoaded: true } : prev);
    } catch (err) {
      console.error("[PatientRecords] visits fetch error:", err.message);
    } finally {
      setVisitsLoading(false);
    }
  }, []);

  // Client-side status filter (search is server-side)
  const filtered = allPatients.filter(p => {
    return statusFilter === "all" || p.status === statusFilter ||
      (statusFilter === "priority" && p.priority);
  });

  return (
    <div style={{ background: "#f4f7fb", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      
      

      <AddToQueueModal
        patient={addQueueModal}
        onClose={() => setAddQueueModal(null)}
        onConfirm={(p, reason, doctor) => showToast(`${p.name} added to queue for ${doctor}`)}
      />

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e2d40", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 14, zIndex: 300, boxShadow: "0 8px 24px rgba(30,45,64,0.28)", animation: "fadeUp 0.3s ease" }}>{toast}</div>
      )}

      <VisitDrawer
        visit={activeVisit}
        patient={selected}
        onClose={() => setActiveVisit(null)}
        onBook={(p) => showToast(`Follow-up booking initiated for ${p.name}`)}
        onSms={(name) => showToast(`Visit summary SMS queued for ${name}`)}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{
          background: "#f4f7fb", borderBottom: "1px solid #dde8e5",
          padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e2d40" }}>Patient Records</h1>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>
              {loading ? "Loading…" : `${allPatients.length} patients on file`}
            </div>
          </div>
          <button onClick={() => onNavigate && onNavigate('register')} style={{
            background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none",
            borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 4px 14px rgba(42,157,143,0.28)", display: "flex", alignItems: "center", gap: 6,
          }}><Plus size={16} strokeWidth={2} /> Register New Patient</button>
        </div>

        {/* Split */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "300px 1fr", overflow: "hidden" }}>

          {/* Patient list */}
          <div style={{ background: "white", borderRight: "1px solid #dde8e5", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Search */}
            <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #f0f3f7" }}>
              <div style={{ position: "relative", marginBottom: 10 }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#8a9bb0" }}><Search size={14} strokeWidth={2} color="#8a9bb0" /></span>
                <input value={search} onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Name, PhilHealth..."
                  style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, color: "#1e2d40", outline: "none", background: "#f7f9fb" }}
                  onFocus={e => e.target.style.borderColor = "#2a9d8f"}
                  onBlur={e => e.target.style.borderColor = "#e0e7ef"}
                />
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {["all", "active", "priority", "inactive"].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} style={{
                    background: statusFilter === s ? "#1e2d40" : "#f4f7fb",
                    color: statusFilter === s ? "white" : "#7a8fb0",
                    border: "none", borderRadius: 7, padding: "4px 10px",
                    fontSize: 14, fontWeight: statusFilter === s ? 600 : 400,
                    cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s",
                  }}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
                ))}
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "#8a9bb0" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}><Clock size={16} strokeWidth={2} /></div>
                  <div style={{ fontSize: 14 }}>Loading patients…</div>
                </div>
              ) : filtered.map(p => {
                const ss = statusStyle[p.status];
                const pc = p.priority ? priorityConfig[p.priority] : null;
                const isSelected = selected?.id === p.id;
                return (
                  <div key={p.id} onClick={() => handlePatientSelect(p)} style={{
                    padding: "12px 12px", borderRadius: 12, marginBottom: 6, cursor: "pointer",
                    background: isSelected ? "#e8f7f5" : "transparent",
                    border: `1.5px solid ${isSelected ? "#b8e4de" : "transparent"}`,
                    transition: "all 0.15s", position: "relative", overflow: "hidden",
                  }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f4f7fb"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    {p.priority && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: priorityConfig[p.priority].color, borderRadius: "12px 0 0 12px" }} />}
                    <div style={{ display: "flex", gap: 10, paddingLeft: p.priority ? 6 : 0 }}>
                      <div style={{ position: "relative" }}>
                        <Avatar name={p.name} size={36} />
                        {pc && pc.Icon && <div style={{ position: "absolute", bottom: -1, right: -1 }}><pc.Icon size={13} strokeWidth={2} color={pc.color} /></div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{p.name}</div>
                          <span style={{ background: ss.bg, color: ss.color, borderRadius: 5, padding: "1px 6px", fontSize: 14, fontWeight: 600, flexShrink: 0, marginLeft: 4 }}>{ss.label}</span>
                        </div>
                        <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 1 }}>{p.age} yrs · {p.gender} · {p.bloodType}</div>
                        <div style={{ fontSize: 14, color: "#8a9bb0", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.conditions.length > 0 ? p.conditions.join(" · ") : "No conditions"}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                          <span style={{ fontSize: 14, color: "#b0beca" }}>Last: {p.lastVisit}</span>
                          <span style={{ fontSize: 14, color: "#8a9bb0", fontWeight: 500 }}>{p.visits.length} visits</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!loading && filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "#8a9bb0" }}>
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
              onAddQueue={(p) => setAddQueueModal(p)}
              onSms={async (name) => {
                try {
                  await smsApi.send({ patient_id: selected.id, message: `LikhaHealth: Reminder regarding your recent clinic visit. Please contact us for follow-up.` });
                  showToast(`SMS sent to ${name}`);
                } catch (err) {
                  showToast(`SMS failed: ${err.message}`);
                }
              }}
              visitsLoading={visitsLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
