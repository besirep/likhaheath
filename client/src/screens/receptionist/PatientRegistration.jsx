import { useState, useEffect } from "react";
import { Check, Smartphone, UserRound, Baby, ClipboardList } from "lucide-react";
import { patientsApi } from "../../lib/api/patients.js";
import { staffApi } from "../../lib/api/staff.js";
import { queueApi } from "../../lib/api/queue.js";
import { getAge, validateStep0, validateStep1, validateStep2 } from "../../lib/validation/patientValidation.js";

// ── Config ────────────────────────────────────────────────────────────────────
const SEX_OPTIONS    = ["Male", "Female", "Other"];
const CIVIL_STATUS_OPTIONS = ["Single", "Married", "Widowed", "Separated", "Annulled"];
const BLOOD_TYPE_OPTIONS   = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const priorityTypes = [
  { key: "elderly",   label: "Senior Citizen (60+)", color: "#8B5FBF", bg: "#f0eafb", desc: "RA 9994 — Expanded Senior Citizens Act" },
  { key: "pwd",       label: "PWD",                  color: "#0047AB", bg: "#EBF0FA", desc: "RA 7277 — Magna Carta for Disabled Persons" },
  { key: "pregnant",  label: "Pregnant Woman",        color: "#d4709a", bg: "#fce8f3", desc: "Priority lane for maternal health" },
  { key: "pediatric", label: "Infant / Child (0–5)", color: "#e09040", bg: "#fdf3e8", desc: "Pediatric priority" },
  { key: "solo",      label: "Solo Parent",           color: "#2a9d8f", bg: "#e8f7f5", desc: "RA 8972 — Solo Parents' Welfare Act" },
];

const visitReasons = [
  "Hypertension / Blood Pressure", "Diabetes check-up", "Fever & cough",
  "Prenatal check-up", "Annual physical exam", "Vaccination",
  "Lab results review", "Follow-up consultation", "Wound care / dressing", "Other",
];

// ── Shared styles ─────────────────────────────────────────────────────────────
const labelStyle = { fontSize: 13, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 };
const errStyle   = { fontSize: 12, color: "#CC0000", marginTop: 4 };
const inputBase  = (focused, hasErr) => ({
  width: "100%", padding: "11px 14px",
  border: `1.5px solid ${hasErr ? "#CC0000" : focused ? "#2a9d8f" : "#e0e7ef"}`,
  borderRadius: 11, fontSize: 14, color: "#1e2d40", outline: "none",
  background: "white", transition: "border-color 0.2s", boxSizing: "border-box",
});

function Input({ label, placeholder, value, onChange, type = "text", required, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color: "#CC0000", marginLeft: 4 }}>*</span>}</label>
      <div style={{ position: "relative" }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={inputBase(focused, !!error)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
        {required && <div style={{ position: "absolute", top: 1.5, right: 1.5, width: 14, height: 14, background: "#ef4444", clipPath: "polygon(0 0, 100% 0, 100% 100%)", borderTopRightRadius: 10, pointerEvents: "none" }} />}
      </div>
      {error && <div style={errStyle}>{error}</div>}
    </div>
  );
}

function Select({ label, value, onChange, options, required, error, placeholder = "Select..." }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color: "#CC0000", marginLeft: 4 }}>*</span>}</label>
      <div style={{ position: "relative" }}>
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ ...inputBase(focused, !!error), color: value ? "#1e2d40" : "#8a9bb0", appearance: "none", cursor: "pointer" }}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      {error && <div style={errStyle}>{error}</div>}
    </div>
  );
}

// ── New-flow steps:
//  -1 = Check-in (search)
//   0 = Personal Info       (new patients only)
//   1 = Address & Contact   (new patients only)
//   2 = Visit Details + Priority + SMS  (both returning & new — AFTER queue # issued)
// Queue # is issued when the patient is identified (returning) or after address step (new)
// ── Step bar ─────────────────────────────────────────────────────────────────
function StepBar({ step, isReturning }) {
  const steps = isReturning
    ? ["Check-In", "Queue Issued", "Medical History", "Visit Details"]
    : ["Check-In", "Personal Info", "Address & Contact", "Queue Issued", "Medical History", "Visit Details"];

  // Map logical step to display index
  const displayIdx = isReturning
    ? { "-1": 0, "queue": 1, "2": 2, "3": 3 }[String(step)] ?? step
    : { "-1": 0, "0": 1, "1": 2, "queue": 3, "2": 4, "3": 5 }[String(step)] ?? step;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28, flexWrap: "wrap", rowGap: 8 }}>
      {steps.map((s, i) => {
        const isActive   = i === displayIdx;
        const isComplete = i < displayIdx;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                background: isComplete ? "#2a9d8f" : isActive ? "linear-gradient(135deg,#2a9d8f,#52c4b8)" : "#e8edf7",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: isComplete || isActive ? "white" : "#8a9bb0",
                boxShadow: isActive ? "0 3px 12px rgba(42,157,143,0.35)" : "none", transition: "all 0.3s",
              }}>{isComplete ? <Check size={14} strokeWidth={3} /> : i + 1}</div>
              <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? "#1e2d40" : "#8a9bb0", whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < displayIdx ? "#2a9d8f" : "#e8edf7", margin: "0 6px", transition: "background 0.3s", minWidth: 10 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Queue Slip Modal — shown right after queue # is assigned ──────────────────
function QueueSlipModal({ data, onContinue }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(5px)" }}>
      <div style={{ background: "white", borderRadius: 24, width: 400, boxShadow: "0 28px 70px rgba(20,40,70,0.28)", animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)", overflow: "hidden" }}>
        <style>{`@keyframes popIn { from{transform:scale(0.85);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
        {/* Queue number display */}
        <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "36px 32px 28px", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Queue Number</div>
          <div style={{ fontSize: 72, fontWeight: 800, color: "white", lineHeight: 1, letterSpacing: 6, textShadow: "0 4px 24px rgba(42,157,143,0.45)" }}>{data.queue}</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginTop: 12 }}>{data.name}</div>
          {data.priority && (
            <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "6px 16px" }}>
              <span style={{ fontSize: 15, color: "white", fontWeight: 600 }}>{priorityTypes.find(p => p.key === data.priority)?.label}</span>
            </div>
          )}
        </div>
        {/* Info */}
        <div style={{ padding: "22px 28px 28px" }}>
          <div style={{ background: "#f7f9fd", borderRadius: 13, padding: "14px 16px", marginBottom: 18 }}>
            <div style={{ fontSize: 13, color: "#8a9bb0", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Patient checked in</div>
            <div style={{ fontSize: 14, color: "#1e2d40", fontWeight: 600 }}>{data.name}</div>
            <div style={{ fontSize: 13, color: "#7a8fb0", marginTop: 4 }}>
              {data.isReturning ? "Returning patient — records loaded" : "New patient — registration complete"}
            </div>
          </div>
          <div style={{ background: "#fff8e6", border: "1.5px solid #ffe0a0", borderRadius: 13, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>📋</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#b07800" }}>Next: Medical History & Visit Details</div>
              <div style={{ fontSize: 13, color: "#9a6800", marginTop: 2 }}>Please update medical history before proceeding</div>
            </div>
          </div>
          <button onClick={onContinue} style={{ width: "100%", background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 18px rgba(42,157,143,0.35)" }}>
            Continue → Medical History
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Final Success Modal ────────────────────────────────────────────────────────
function SuccessModal({ data, onClose, onAnother }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "white", borderRadius: 22, width: 420, boxShadow: "0 24px 64px rgba(20,40,70,0.24)", animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)", overflow: "hidden" }}>
        <style>{`@keyframes popIn { from{transform:scale(0.88);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
        <div style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", padding: "28px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>{data.name} is in the queue!</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 6 }}>Queue <strong>{data.queue}</strong> · Visit details saved</div>
        </div>
        <div style={{ padding: "22px 28px 28px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {[
              { icon: "📋", label: "Reason",   value: data.reason || "Not specified" },
              { icon: "⏱️", label: "Next Step", value: "Nurse records vitals at triage" },
              { icon: "📱", label: "SMS",       value: data.sendSms ? `Sent to ${data.contact}` : "Not sent" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{r.icon}</span>
                <span style={{ fontSize: 14, color: "#8a9bb0", width: 80 }}>{r.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onAnother} style={{ flex: 1, background: "#e8f7f5", color: "#2a9d8f", border: "1.5px solid #b8e4de", borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>+ Register Another</button>
            <button onClick={onClose}   style={{ flex: 1, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.3)" }}>Go to Queue →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty form ────────────────────────────────────────────────────────────────
const emptyForm = {
  existingPatientId: null,
  firstName: "", middleName: "", lastName: "", suffix: "", dob: "", sex: "",
  civilStatus: "", bloodType: "", nationality: "Filipino", occupation: "",
  philhealthNo: "", emergencyContact: "",
  street: "", barangay: "", municipality: "Angono", province: "Rizal",
  phone: "", email: "",
  reasons: [], doctor: "", reasonOther: "",
  priority: null, sendSms: true, notes: "",
  // These are used only for carrying visit info after queue assignment
  assignedQueueId: null, assignedQueueNumber: null,
  mh: {}, // medical history
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PatientRegistration({ onNavigate, draft, onDraftChange, onDraftClear }) {
  const [step, setStep]       = useState(draft?.step ?? -1);
  const [form, setForm]       = useState(draft?.form ?? emptyForm);
  const [errors, setErrors]   = useState({});
  const [queueSlip, setQueueSlip]   = useState(null);   // shown right after queue # assigned
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState(null);
  const [doctors, setDoctors]       = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [assignedStaffList, setAssignedStaffList] = useState([]);

  // Sidebar queue state
  const [queueCounter, setQueueCounter] = useState(0);
  const [queueItems,   setQueueItems]   = useState([]);

  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching,     setSearching]     = useState(false);

  const fetchQueue = () => {
    queueApi.getToday()
      .then(data => {
        const maxQ = data.reduce((max, item) => Math.max(max, item.queue_number || 0), 0);
        setQueueCounter(maxQ);
        setQueueItems(data);
      })
      .catch(console.error);
  };

  useEffect(() => { fetchQueue(); }, []);

  useEffect(() => {
    if (onDraftChange && step >= 0) onDraftChange({ step, form });
  }, [step, form]); // eslint-disable-line

  useEffect(() => {
    setDoctorsLoading(true);
    staffApi.getAll({ position: "Doctor", active: true })
      .then(data => { setDoctors(Array.isArray(data) ? data : []); setDoctorsLoading(false); })
      .catch(() => { setDoctors([]); setDoctorsLoading(false); });
    staffApi.getAll({ active: true })
      .then(data => { if (Array.isArray(data)) setAssignedStaffList(data.filter(s => s.position === "BHW" || s.position === "Midwife")); })
      .catch(console.error);
  }, []);

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };
  const age      = getAge(form.dob);
  const fullName = form.lastName && form.firstName
    ? `${form.lastName}, ${form.firstName}`.trim()
    : `${form.firstName} ${form.lastName}`.trim();
  const isReturning = !!form.existingPatientId;

  const searchPatients = async (q) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await patientsApi.getAll({ search: q.trim(), limit: 8 });
      setSearchResults(data || []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  // ── Returning patient selected: load records, immediately create queue entry ──
  const selectReturningPatient = async (p) => {
    setSearching(true);
    try {
      const full = await patientsApi.getOne(p.id);
      const formatDate = (ds) => { if (!ds) return ""; const d = new Date(ds); return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0]; };

      const newForm = {
        ...emptyForm,
        existingPatientId: full.id,
        firstName:    full.first_name    || "",
        middleName:   full.middle_name   || "",
        lastName:     full.last_name     || "",
        sex:          full.sex           || "",
        barangay:     full.barangay      || "",
        municipality: full.municipality  || "Angono",
        province:     "Rizal",
        phone:        full.contacts?.find(c => c.is_primary)?.value || full.contacts?.[0]?.value || "",
        mh:           full.medical_history || {},
      };
      setForm(newForm);
      setErrors({});

      // Issue queue number right now (with no visit reason yet)
      const slipName = `${full.last_name}, ${full.first_name}`;
      const { queue_number, queue_id } = await patientsApi.createVisit(full.id, {
        visit_reason: "To be determined",
        priority: null, send_sms: false,
        vitals: null, medical_history: null, female_health: null,
      });

      setForm(f => ({ ...f, assignedQueueId: queue_id, assignedQueueNumber: queue_number }));
      setQueueSlip({ queue: `A-${String(queue_number).padStart(3, "0")}`, name: slipName, isReturning: true });
      fetchQueue();
    } catch (err) {
      console.error(err);
      // Fallback: go to step 2 without pre-issuing
      setForm(f => ({ ...f, existingPatientId: p.id, firstName: p.first_name || "", lastName: p.last_name || "", barangay: p.barangay || "", phone: p.primary_contact || "" }));
      setStep(2);
      setErrors({});
    } finally {
      setSearching(false);
    }
  };

  const tryAdvance = () => {
    let errs = {};
    if (step === 0) errs = validateStep0(form);
    if (step === 1) errs = validateStep1(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(s => s + 1);
  };

  // ── After address step (step 1 for new patients): issue queue # then go to visit details ──
  const advanceNewPatient = async () => {
    const errs = validateStep1(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true); setApiError(null);
    try {
      const payload = {
        first_name:    form.firstName,   middle_name:  form.middleName || null,
        last_name:     form.lastName,    suffix:       form.suffix || null,
        date_of_birth: form.dob,         sex_name:     form.sex,
        civil_status_name:  form.civilStatus,
        blood_type_code:    form.bloodType || null,
        nationality:        form.nationality,
        occupation:         form.occupation || null,
        philhealth_no:      form.philhealthNo || null,
        emergency_contact:  form.emergencyContact || null,
        assigned_staff_id:  form.assignedStaffId || null,
        address: { street: form.street || null, barangay: form.barangay, municipality: form.municipality, province: form.province },
        contact_info: [
          ...(form.phone ? [{ type: "phone", value: form.phone, is_primary: 1 }] : []),
          ...(form.email ? [{ type: "email", value: form.email, is_primary: 0 }] : []),
        ],
        visit_reason: "To be determined",
        priority: null, send_sms: false, vitals: null,
      };

      const { queue_number, queue_id, patient_id } = await patientsApi.create(payload);
      setForm(f => ({ ...f, existingPatientId: patient_id, assignedQueueId: queue_id, assignedQueueNumber: queue_number }));
      fetchQueue();

      const slipName = `${form.lastName}, ${form.firstName}`;
      setQueueSlip({ queue: `A-${String(queue_number).padStart(3, "0")}`, name: slipName, isReturning: false });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Save visit details after queue # already issued ───────────────────────────
  const handleSaveVisitDetails = async () => {
    const errs = validateStep2(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!window.confirm("Save visit details for this patient?")) return;
    setSubmitting(true); setApiError(null);
    try {
      const reasonList = form.reasons.includes("Other")
        ? [...form.reasons.filter(r => r !== "Other"), form.reasonOther].filter(Boolean)
        : form.reasons;
      // Normalize to lowercase for data analytics consistency (e.g. Hypertension vs HYPERTENSION)
      const visit_reason = reasonList.join(", ").toLowerCase();
      const doctorId = form.doctor
        ? doctors.find(d => `Dr. ${d.last_name}` === form.doctor)?.id || null
        : null;

      // Update the visit (appointment) that was already created with the real visit reason
      await patientsApi.updateVisit(form.existingPatientId, form.assignedQueueId, {
        visit_reason,
        doctor_id: doctorId,
        notes: form.notes || null,
        priority: form.priority,
        send_sms: form.sendSms,
        sex_name: form.sex,
      });

      fetchQueue();
      setSuccess({
        queue:      `A-${String(form.assignedQueueNumber).padStart(3, "0")}`,
        name:       fullName,
        reason:     visit_reason,
        contact:    form.phone,
        sendSms:    form.sendSms,
        priority:   form.priority,
        isReturning,
      });
      if (onDraftClear) onDraftClear();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnother = () => {
    setForm(emptyForm); setStep(-1); setSuccess(null); setErrors({});
    setSearchQuery(""); setSearchResults([]); setQueueSlip(null);
    if (onDraftClear) onDraftClear();
  };

  const inQueueCount = queueItems.filter(q => ["waiting","vitals-done","in-consultation"].includes(q.status)).length;
  const doneCount    = queueItems.filter(q => q.status === "done").length;
  const recentList   = [...queueItems].reverse().slice(0, 5).map(q => ({
    queue:  `A-${String(q.queue_number).padStart(3, "0")}`,
    name:   q.patient_name || "Unknown",
    time:   new Date(q.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    status: q.priority_tag ? "Priority" : "Waiting",
    color:  q.priority_tag ? "#8B5FBF" : "#2a9d8f",
    bg:     q.priority_tag ? "#f0eafb" : "#e8f7f5",
  }));

  const btnStyle = (active) => ({
    flex: 1, padding: "11px", border: `1.5px solid ${active ? "#2a9d8f" : "#e0e7ef"}`,
    borderRadius: 11, background: active ? "#e8f7f5" : "white",
    color: active ? "#2a9d8f" : "#7a8fb0", fontSize: 14, fontWeight: active ? 700 : 400,
    cursor: "pointer", transition: "all 0.15s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb", display: "flex" }}>
      <style>{`@keyframes fadeUp { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} } @keyframes spin { to{transform:rotate(360deg)} } @keyframes popIn { from{transform:scale(0.88);opacity:0} to{transform:scale(1);opacity:1} }`}</style>

      {/* Modals */}
      {queueSlip && (
        <QueueSlipModal
          data={queueSlip}
          onContinue={() => { setQueueSlip(null); setStep(2); }}
        />
      )}
      {success && (
        <SuccessModal
          data={success}
          onClose={() => { setSuccess(null); if (onNavigate) onNavigate("queue"); }}
          onAnother={handleAnother}
        />
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ background: "#f4f7fb", borderBottom: "1px solid #dde8e5", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e2d40" }}>Patient Check-In</h1>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>
              {step === -1 ? "Search for an existing patient or register a new one" :
               step === 0  ? "Step 1 of 2 — Personal Information" :
               step === 1  ? "Step 2 of 2 — Address & Contact" :
               step === 2  ? (isReturning ? "Returning patient — Medical History" : "New patient — Medical History") :
               step === 3  ? (isReturning ? "Returning patient — Visit Details" : "New patient — Visit Details") :
               "Completing registration…"}
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", borderRadius: 13, padding: "10px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "white", lineHeight: 1 }}>A-{String(queueCounter + 1).padStart(3, "0")}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>Next Queue #</div>
          </div>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 300px", overflow: "hidden" }}>
          {/* ── Form area ── */}
          <div style={{ overflowY: "auto", padding: "28px 32px" }}>
            {step >= 0 && <StepBar step={step} isReturning={isReturning} />}

            {/* ── Step -1: Check-in / Search ── */}
            {step === -1 && (
              <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40" }}>Is this patient already registered?</div>

                {/* Search box */}
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#8a9bb0", pointerEvents: "none" }}>🔍</div>
                  <input
                    value={searchQuery} onChange={e => searchPatients(e.target.value)}
                    placeholder="Search by surname, first name, or phone…"
                    style={{ width: "100%", padding: "13px 16px 13px 44px", border: "1.5px solid #dde8e5", borderRadius: 13, fontSize: 15, color: "#1e2d40", background: "white", outline: "none", boxSizing: "border-box", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
                    onFocus={e => e.target.style.borderColor = "#2a9d8f"}
                    onBlur={e  => e.target.style.borderColor = "#dde8e5"}
                    autoFocus
                  />
                  {searching && <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, border: "2px solid #e0e7ef", borderTopColor: "#2a9d8f", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
                </div>

                {/* Results */}
                {searchResults.length > 0 && (
                  <div style={{ background: "white", borderRadius: 14, border: "1px solid #e0e7ef", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
                    <div style={{ padding: "10px 16px", background: "#f7f9fd", fontSize: 12, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7 }}>
                      Existing Patients — click to check in
                    </div>
                    {searchResults.map((p, i) => (
                      <button key={p.id} onClick={() => selectReturningPatient(p)} style={{
                        width: "100%", padding: "13px 18px", display: "flex", alignItems: "center", gap: 14,
                        background: "white", border: "none", borderTop: i > 0 ? "1px solid #f0f4f8" : "none",
                        cursor: "pointer", textAlign: "left", transition: "background 0.12s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f0faf8"}
                        onMouseLeave={e => e.currentTarget.style.background = "white"}
                        disabled={searching}
                      >
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white", flexShrink: 0 }}>
                          {p.last_name?.[0]}{p.first_name?.[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#1e2d40" }}>{p.last_name}, {p.first_name}{p.suffix ? ` ${p.suffix}` : ""}</div>
                          <div style={{ fontSize: 13, color: "#8a9bb0", marginTop: 2 }}>{p.primary_contact || "No contact"} · {p.barangay || "—"}</div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#2a9d8f", background: "#e8f7f5", padding: "4px 10px", borderRadius: 7 }}>
                          {searching ? "…" : "Check In →"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                  <div style={{ textAlign: "center", color: "#8a9bb0", fontSize: 14, padding: "12px 0" }}>No patient found for "{searchQuery}"</div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: "#e0e7ef" }} />
                  <span style={{ fontSize: 13, color: "#8a9bb0", fontWeight: 500 }}>or</span>
                  <div style={{ flex: 1, height: 1, background: "#e0e7ef" }} />
                </div>

                <button onClick={() => { setForm(emptyForm); setStep(0); }} style={{
                  padding: "16px", background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white",
                  border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 4px 18px rgba(42,157,143,0.35)", transition: "opacity 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  ➕ Register New Patient
                </button>
              </div>
            )}

            {/* ── Step 0: Personal Info (new patients only) ── */}
            {step === 0 && (
              <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40", marginBottom: 4 }}>Personal Information</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 80px", gap: 14 }}>
                  <Input label="First Name"   value={form.firstName}  onChange={v => update("firstName",  v)} required error={errors.firstName} placeholder="Given name" />
                  <Input label="Middle Name"  value={form.middleName} onChange={v => update("middleName", v)} placeholder="Middle name" />
                  <Input label="Last Name"    value={form.lastName}   onChange={v => update("lastName",   v)} required error={errors.lastName} placeholder="Surname" />
                  <Select label="Suffix" value={form.suffix} onChange={v => update("suffix", v)} options={["II","Jr","Sr","III","IV","V","2nd","3rd"]} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <Input label="Date of Birth" value={form.dob} onChange={v => update("dob", v)} type="date" required error={errors.dob} />
                    {age !== null && <div style={{ fontSize: 13, color: "#2a9d8f", marginTop: 4, fontWeight: 600 }}>Age: {age} years old</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>Sex <span style={{ color: "#CC0000" }}>*</span></label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {SEX_OPTIONS.map(s => <button key={s} onClick={() => update("sex", s)} style={btnStyle(form.sex === s)}>{s}</button>)}
                    </div>
                    {errors.sex && <div style={errStyle}>{errors.sex}</div>}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Select label="Civil Status" value={form.civilStatus} onChange={v => update("civilStatus", v)} options={CIVIL_STATUS_OPTIONS} required error={errors.civilStatus} />
                  <Select label="Blood Type"   value={form.bloodType}   onChange={v => update("bloodType",   v)} options={BLOOD_TYPE_OPTIONS} placeholder="Unknown" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Input label="Nationality"  value={form.nationality}  onChange={v => update("nationality",  v)} placeholder="Filipino" />
                  <Input label="Occupation"   value={form.occupation}   onChange={v => update("occupation",   v)} placeholder="e.g. Teacher" />
                </div>
                <Input label="PhilHealth No." value={form.philhealthNo} onChange={v => update("philhealthNo", v)} placeholder="XX-XXXXXXXXX-X" error={errors.philhealthNo} />

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button onClick={() => setStep(-1)} style={{ background: "white", color: "#7a8fb0", border: "1px solid #dde8e5", borderRadius: 11, padding: "12px 22px", fontSize: 14, cursor: "pointer" }}>← Back</button>
                  <button onClick={tryAdvance} style={{ flex: 1, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.3)" }}>Continue →</button>
                </div>
              </div>
            )}

            {/* ── Step 1: Address & Contact (new patients only) ── */}
            {step === 1 && (
              <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40", marginBottom: 4 }}>Address & Contact</div>
                <Input label="Street / House No." value={form.street}   onChange={v => update("street",   v)} placeholder="e.g. 123 Rizal St." />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <Input label="Barangay"     value={form.barangay}     onChange={v => update("barangay",     v)} required error={errors.barangay} />
                  <Input label="Municipality" value={form.municipality} onChange={v => update("municipality", v)} required error={errors.municipality} />
                  <Input label="Province"     value={form.province}     onChange={v => update("province",     v)} required error={errors.province} />
                </div>
                <div style={{ height: 1, background: "#edf1f7" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Input label="Phone Number" value={form.phone} onChange={v => update("phone", v)} required error={errors.phone} placeholder="09XXXXXXXXX" />
                  <Input label="Email" value={form.email} onChange={v => update("email", v)} type="email" error={errors.email} placeholder="patient@email.com" />
                </div>
                <Input label="Emergency Contact" value={form.emergencyContact} onChange={v => update("emergencyContact", v)} placeholder="Name – 09XXXXXXXXX" />
                <div>
                  <label style={labelStyle}>Assigned BHW / Midwife (Optional)</label>
                  <select value={form.assignedStaffId || ""} onChange={e => update("assignedStaffId", e.target.value)}
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #dde8e5", borderRadius: 11, fontSize: 14, color: "#1e2d40", background: "white", outline: "none", boxSizing: "border-box", appearance: "none" }}>
                    <option value="">-- No Assignment --</option>
                    {assignedStaffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.position})</option>)}
                  </select>
                </div>

                {apiError && <div style={{ background: "#fff0ee", border: "1px solid #f5c6c0", borderRadius: 11, padding: "10px 14px", fontSize: 14, color: "#c0392b" }}>⚠ {apiError}</div>}

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button onClick={() => setStep(0)} style={{ background: "white", color: "#7a8fb0", border: "1px solid #dde8e5", borderRadius: 11, padding: "12px 22px", fontSize: 14, cursor: "pointer" }}>← Back</button>
                  <button onClick={advanceNewPatient} disabled={submitting} style={{
                    flex: 1, background: submitting ? "#d0dbe8" : "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none",
                    borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: submitting ? "none" : "0 4px 14px rgba(42,157,143,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    {submitting
                      ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Issuing Queue…</>
                      : "Issue Queue Number →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Medical History ── */}
            {step === 2 && (
              <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40", marginBottom: 4 }}>Medical History</div>
                <div style={{ fontSize: 14, color: "#7a8fb0", marginBottom: 10 }}>Update any existing medical conditions or history below. Changes will be saved to the patient's record.</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { key: "has_hypertension", label: "Hypertension" },
                    { key: "has_heart_disease", label: "Heart Disease" },
                    { key: "has_diabetes", label: "Diabetes" },
                    { key: "has_stroke", label: "Stroke" },
                    { key: "has_asthma", label: "Asthma" },
                    { key: "has_tuberculosis", label: "Tuberculosis" },
                    { key: "has_copd", label: "COPD" },
                    { key: "has_allergies", label: "Allergies" },
                    { key: "has_smoking_hx", label: "Smoking History" },
                  ].map(c => (
                    <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 10, background: "white", padding: "12px 14px", borderRadius: 10, border: "1px solid #e0e7ef", cursor: "pointer" }}>
                      <input type="checkbox" checked={!!form.mh[c.key]} onChange={e => {
                        const val = e.target.checked;
                        setForm(f => ({ ...f, mh: { ...f.mh, [c.key]: val } }));
                      }} style={{ width: 16, height: 16, accentColor: "#2a9d8f" }} />
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#1e2d40" }}>{c.label}</span>
                    </label>
                  ))}
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Input label="Other Conditions" value={form.mh.other_conditions || ""} onChange={v => setForm(f => ({ ...f, mh: { ...f.mh, other_conditions: v } }))} placeholder="Specify other conditions..." />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Input label="Social Smoking" value={form.mh.social_smoking || ""} onChange={v => setForm(f => ({ ...f, mh: { ...f.mh, social_smoking: v } }))} placeholder="e.g. 5 sticks/day" />
                    <Input label="Social Alcohol" value={form.mh.social_alcohol || ""} onChange={v => setForm(f => ({ ...f, mh: { ...f.mh, social_alcohol: v } }))} placeholder="e.g. Occasional" />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button onClick={async () => {
                    setSubmitting(true);
                    try {
                      await patientsApi.updateMedicalHistory(form.existingPatientId, form.mh);
                      setStep(3);
                    } catch (err) { alert(err.message); }
                    setSubmitting(false);
                  }} disabled={submitting} style={{ flex: 1, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.3)" }}>
                    {submitting ? "Saving..." : "Save & Continue →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Visit Details (both new & returning, after queue # issued) ── */}
            {step === 3 && (
              <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Queue number reminder */}
                <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ textAlign: "center", minWidth: 70 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "white", lineHeight: 1 }}>
                      A-{String(form.assignedQueueNumber || 0).padStart(3, "0")}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3, letterSpacing: 1, textTransform: "uppercase" }}>Queue #</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{fullName}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>
                      {isReturning ? "Returning patient" : "New patient"} · Queue number issued ✓
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 17, fontWeight: 700, color: "#1e2d40" }}>Visit Details</div>

                {/* Reason for visit */}
                <div>
                  <label style={labelStyle}>Reason for Visit <span style={{ color: "#CC0000" }}>*</span></label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {visitReasons.map(r => {
                      const selected = (form.reasons || []).includes(r);
                      return (
                        <button key={r} onClick={() => {
                          const cur = form.reasons || [];
                          update("reasons", selected ? cur.filter(x => x !== r) : [...cur, r]);
                        }} style={{
                          padding: "10px 14px", border: `1.5px solid ${selected ? "#2a9d8f" : "#e0e7ef"}`,
                          borderRadius: 11, background: selected ? "#e8f7f5" : "white",
                          color: selected ? "#2a9d8f" : "#4a5d75", fontSize: 14, fontWeight: selected ? 600 : 400,
                          cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                          display: "flex", alignItems: "center", gap: 8,
                        }}>
                          {selected && <Check size={14} strokeWidth={3} />}{r}
                        </button>
                      );
                    })}
                  </div>
                  {errors.reasons && <div style={errStyle}>{errors.reasons}</div>}
                </div>
                {(form.reasons || []).includes("Other") && (
                  <Input label="Specify Other Reason" value={form.reasonOther} onChange={v => update("reasonOther", v)} placeholder="Describe the specific visit reason" error={errors.reasonOther} />
                )}

                {/* Preferred Doctor */}
                <div>
                  <label style={labelStyle}>Preferred Doctor (Optional)</label>
                  {doctorsLoading ? <div style={{ fontSize: 14, color: "#8a9bb0" }}>Loading…</div> : (
                    <select value={form.doctor} onChange={e => update("doctor", e.target.value)}
                      style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #dde8e5", borderRadius: 11, fontSize: 14, color: "#1e2d40", background: "white", outline: "none", boxSizing: "border-box" }}>
                      <option value="">Any available doctor</option>
                      {doctors.map(d => <option key={d.id} value={`Dr. ${d.last_name}`}>Dr. {d.first_name} {d.last_name}</option>)}
                    </select>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label style={labelStyle}>Priority Classification</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button onClick={() => update("priority", null)} style={{ padding: "11px 16px", border: `1.5px solid ${!form.priority ? "#2a9d8f" : "#e0e7ef"}`, borderRadius: 11, background: !form.priority ? "#e8f7f5" : "white", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: !form.priority ? "#2a9d8f" : "#f0f3f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {!form.priority ? <Check size={14} strokeWidth={3} color="white" /> : <span style={{ fontSize: 14, color: "#8a9bb0" }}>—</span>}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: !form.priority ? "#2a9d8f" : "#1e2d40" }}>Regular Queue</div>
                    </button>
                    {priorityTypes.map(pt => (
                      <button key={pt.key} onClick={() => update("priority", pt.key)} style={{ padding: "11px 16px", border: `1.5px solid ${form.priority === pt.key ? pt.color : "#e0e7ef"}`, borderRadius: 11, background: form.priority === pt.key ? pt.bg : "white", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: form.priority === pt.key ? pt.color : "#f0f3f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {form.priority === pt.key ? <Check size={14} strokeWidth={3} color="white" /> : null}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: form.priority === pt.key ? pt.color : "#1e2d40" }}>{pt.label}</div>
                          <div style={{ fontSize: 12, color: "#8a9bb0" }}>{pt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SMS */}
                <div style={{ background: form.sendSms ? "#e8f7f5" : "#f7f9fd", borderRadius: 13, padding: "14px 18px", border: `1.5px solid ${form.sendSms ? "#b8e4de" : "#e0e7ef"}`, transition: "all 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Smartphone size={20} strokeWidth={2} color={form.sendSms ? "#2a9d8f" : "#8a9bb0"} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>Send SMS Confirmation</div>
                        <div style={{ fontSize: 13, color: "#8a9bb0" }}>Queue number + estimated wait</div>
                      </div>
                    </div>
                    <button onClick={() => update("sendSms", !form.sendSms)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: form.sendSms ? "#2a9d8f" : "#d0dbe8", position: "relative", transition: "background 0.2s" }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: form.sendSms ? 23 : 3, boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
                    </button>
                  </div>
                  {form.sendSms && !form.phone && <div style={{ fontSize: 13, color: "#CC0000", marginTop: 8 }}>⚠ No contact number on file — SMS cannot be sent</div>}
                </div>

                {/* Notes */}
                <div>
                  <label style={labelStyle}>Additional Notes</label>
                  <textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Allergies, special instructions, remarks…" rows={3}
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e0e7ef", borderRadius: 11, fontSize: 14, color: "#1e2d40", outline: "none", resize: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
                </div>

                {apiError && <div style={{ background: "#fff0ee", border: "1px solid #f5c6c0", borderRadius: 11, padding: "10px 14px", fontSize: 14, color: "#c0392b" }}>⚠ {apiError}</div>}

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  {/* Can't go back — queue # already issued */}
                  <button onClick={handleSaveVisitDetails} disabled={submitting} style={{
                    flex: 1, background: submitting ? "#d0dbe8" : "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none",
                    borderRadius: 11, padding: "13px", fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: submitting ? "none" : "0 4px 14px rgba(42,157,143,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    {submitting
                      ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Saving…</>
                      : "✓ Confirm Visit Details"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div style={{ background: "white", borderLeft: "1px solid #dde8e5", overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", borderRadius: 16, padding: "18px", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Next Queue #</div>
              <div style={{ fontSize: 44, fontWeight: 700, color: "white", letterSpacing: 3, lineHeight: 1 }}>A-{String(queueCounter + 1).padStart(3, "0")}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>~20 min estimated wait</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ label: "In Queue", value: inQueueCount, color: "#e09040", bg: "#fdf3e8" }, { label: "Done", value: doneCount, color: "#7a8fb0", bg: "#f0f4fa" }].map(s => (
                <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: s.color, opacity: 0.8, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Recently Checked In</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {recentList.length === 0
                  ? <div style={{ fontSize: 13, color: "#8a9bb0", textAlign: "center", padding: "12px 0" }}>No patients today yet.</div>
                  : recentList.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, background: "#f7f9fd", border: "1px solid #edf1f7" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#2a9d8f", minWidth: 44 }}>{r.queue}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{r.name}</div>
                        <div style={{ fontSize: 13, color: "#8a9bb0" }}>{r.time}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 6, padding: "2px 8px", background: r.bg, color: r.color }}>{r.status}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Flow diagram */}
            <div style={{ background: "#EBF0FA", borderRadius: 13, padding: "14px 16px", marginTop: "auto" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0047AB", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Patient Flow</div>
              {[
                { step: "1", label: "Check-In", detail: "Identify patient", done: step > -1 },
                { step: "2", label: "Queue Issued", detail: "Ticket assigned", done: !!form.assignedQueueNumber },
                { step: "3", label: "Visit Details", detail: "Reason recorded", done: step === 2 && form.reasons.length > 0 },
                { step: "4", label: "Triage / Vitals", detail: "Nurse records BP etc.", done: false },
                { step: "5", label: "Consultation", detail: "Doctor sees patient", done: false },
              ].map((s, i) => (
                <div key={s.step} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < 4 ? 10 : 0 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: s.done ? "#2a9d8f" : "#d0dce8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    {s.done ? <Check size={12} strokeWidth={3} color="white" /> : <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>{s.step}</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.done ? "#1e2d40" : "#7a8fb0" }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "#9aabc0" }}>{s.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
