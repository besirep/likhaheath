import { useState, useEffect } from "react";
import { patientsApi } from "../../lib/api/patients.js";
import { staffApi } from "../../lib/api/staff.js";
import { getAge, validateStep0, validateStep1, validateStep2, validateStep3 } from "../../lib/validation/patientValidation.js";

// ── Config ────────────────────────────────────────────────────────────────────
const SUFFIX_OPTIONS = ["", "II", "Jr", "Sr", "III", "IV", "V", "2nd", "3rd"];
const SEX_OPTIONS = ["Male", "Female", "Other"];
const CIVIL_STATUS_OPTIONS = ["Single", "Married", "Widowed", "Separated", "Annulled"];
const BLOOD_TYPE_OPTIONS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const priorityTypes = [
  { key: "elderly",   label: "Senior Citizen (60+)", icon: "👴", color: "#8B5FBF", bg: "#f0eafb", desc: "RA 9994 — Expanded Senior Citizens Act" },
  { key: "pwd",       label: "PWD",                  icon: "♿", color: "#0047AB", bg: "#EBF0FA", desc: "RA 7277 — Magna Carta for Disabled Persons" },
  { key: "pregnant",  label: "Pregnant Woman",        icon: "🤰", color: "#d4709a", bg: "#fce8f3", desc: "Priority lane for maternal health" },
  { key: "pediatric", label: "Infant / Child (0–5)", icon: "👶", color: "#e09040", bg: "#fdf3e8", desc: "Pediatric priority" },
  { key: "solo",      label: "Solo Parent",           icon: "👨‍👧", color: "#2a9d8f", bg: "#e8f7f5", desc: "RA 8972 — Solo Parents' Welfare Act" },
];

const visitReasons = [
  "Hypertension / Blood Pressure", "Diabetes check-up", "Fever & cough",
  "Prenatal check-up", "Annual physical exam", "Vaccination",
  "Lab results review", "Follow-up consultation", "Wound care / dressing", "Other",
];

const recentlyRegistered = [
  { queue: "A-007", name: "Ana Lim",   time: "9:40 AM", status: "Waiting" },
  { queue: "A-006", name: "Carlos M.", time: "9:35 AM", status: "Waiting" },
  { queue: "A-005", name: "Ramon V.",  time: "9:30 AM", status: "Waiting" },
  { queue: "A-004", name: "Luisa R.",  time: "9:20 AM", status: "Priority" },
  { queue: "A-003", name: "Elena C.",  time: "9:10 AM", status: "Priority" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const labelStyle = { fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 };
const errStyle = { fontSize: 12, color: "#CC0000", marginTop: 4 };
const inputBase = (focused, hasErr) => ({
  width: "100%", padding: "11px 14px",
  border: `1.5px solid ${hasErr ? "#CC0000" : focused ? "#2a9d8f" : "#e0e7ef"}`,
  borderRadius: 11, fontSize: 14, color: "#1e2d40", outline: "none",
  background: "white", transition: "border-color 0.2s", boxSizing: "border-box",
});

function Input({ label, placeholder, value, onChange, type = "text", required, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color: "#CC0000", marginLeft: 2 }}>*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={inputBase(focused, !!error)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      {error && <div style={errStyle}>{error}</div>}
    </div>
  );
}

function Select({ label, value, onChange, options, required, error, placeholder = "Select..." }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color: "#CC0000", marginLeft: 2 }}>*</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputBase(focused, !!error), color: value ? "#1e2d40" : "#8a9bb0", appearance: "none", cursor: "pointer" }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <div style={errStyle}>{error}</div>}
    </div>
  );
}
// ── Success Modal ─────────────────────────────────────────────────────────────
function SuccessModal({ data, onClose, onAnother }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "white", borderRadius: 22, width: 420, boxShadow: "0 24px 64px rgba(20,40,70,0.24)", animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)", overflow: "hidden" }}>
        <style>{`@keyframes popIn { from{transform:scale(0.88);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
        <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "32px 32px 28px", textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Queue Number</div>
          <div style={{ fontSize: 64, fontWeight: 700, color: "white", lineHeight: 1, letterSpacing: 4, textShadow: "0 4px 20px rgba(42,157,143,0.4)" }}>{data.queue}</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 10 }}>{data.name}</div>
          {data.priority && (
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", borderRadius: 9, padding: "5px 14px" }}>
              <span style={{ fontSize: 16 }}>{priorityTypes.find(p => p.key === data.priority)?.icon}</span>
              <span style={{ fontSize: 14, color: "white", fontWeight: 600 }}>{priorityTypes.find(p => p.key === data.priority)?.label}</span>
            </div>
          )}
        </div>
        <div style={{ padding: "22px 28px 28px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {[
              { icon: "🩺", label: "Doctor",   value: data.doctor || "To be assigned" },
              { icon: "📋", label: "Reason",   value: data.reason },
              { icon: "⏱️", label: "Est. Wait", value: "~18–25 minutes" },
              { icon: "📱", label: "SMS",       value: data.sendSms ? `Sent to ${data.contact}` : "Not sent" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{r.icon}</span>
                <span style={{ fontSize: 14, color: "#8a9bb0", width: 70 }}>{r.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{r.value}</span>
              </div>
            ))}
          </div>
          {data.sendSms && (
            <div style={{ background: "#e8f7f5", borderRadius: 11, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16, border: "1px solid #c0e0dc" }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#2a9d8f" }}>SMS Sent Successfully</div>
                <div style={{ fontSize: 14, color: "#5a8f80" }}>Queue number and estimated wait sent to patient</div>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onAnother} style={{ flex: 1, background: "#e8f7f5", color: "#2a9d8f", border: "1.5px solid #b8e4de", borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>+ Register Another</button>
            <button onClick={onClose} style={{ flex: 1, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.3)" }}>Go to Queue →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ["Personal Info", "Address & Contact", "Visit Details", "Vitals", "Priority & SMS"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => {
        const isActive = i === step, isComplete = i < step;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                background: isComplete ? "#2a9d8f" : isActive ? "linear-gradient(135deg,#2a9d8f,#52c4b8)" : "#e8edf7",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: isComplete || isActive ? "white" : "#8a9bb0",
                boxShadow: isActive ? "0 3px 12px rgba(42,157,143,0.35)" : "none", transition: "all 0.3s",
              }}>{isComplete ? "✓" : i + 1}</div>
              <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? "#1e2d40" : "#8a9bb0", whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? "#2a9d8f" : "#e8edf7", margin: "0 10px", transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
// ── Main ──────────────────────────────────────────────────────────────────────
const emptyForm = {
  existingPatientId: null,          // null = new patient, number = returning
  firstName: "", lastName: "", suffix: "", dob: "", sex: "",
  civilStatus: "", bloodType: "", nationality: "Filipino", occupation: "",
  philhealthNo: "", emergencyContact: "",
  street: "", barangay: "", municipality: "Angono", province: "Rizal",
  phone: "", email: "",
  reasons: [], doctor: "", reasonOther: "",
  vitals: { bp: "", temp: "", hr: "", spo2: "", weight: "", height: "" },
  priority: null, sendSms: true, notes: "",
};

export default function PatientRegistration({ onNavigate, draft, onDraftChange, onDraftClear }) {
  // Restore from draft if one exists (MHW switched tabs mid-registration)
  const [step, setStep]       = useState(draft?.step ?? -1);   // -1 = search pre-step
  const [form, setForm]       = useState(draft?.form ?? emptyForm);
  const [errors, setErrors]   = useState({});
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState(null);
  const [doctors, setDoctors]       = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  // Search pre-step state
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]       = useState(false);

  // Persist draft whenever step or form changes
  useEffect(() => {
    if (onDraftChange && step >= 0) onDraftChange({ step, form });
  }, [step, form]); // eslint-disable-line

  useEffect(() => {
    setDoctorsLoading(true);
    staffApi.getAll({ position: "Doctor" })
      .then(data => { setDoctors(Array.isArray(data) ? data : []); setDoctorsLoading(false); })
      .catch(() => { setDoctors([]); setDoctorsLoading(false); });
  }, []);

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };
  const age = getAge(form.dob);
  const fullName = `${form.firstName} ${form.lastName}`.trim();
  const queueCounter = 7;
  const isReturning = !!form.existingPatientId;

  // Live patient search for the pre-step
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

  // MHW picks an existing patient: pre-fill and jump to visit details (step 2)
  const selectReturningPatient = (p) => {
    setForm(f => ({
      ...emptyForm,
      existingPatientId: p.id,
      firstName: p.first_name || "",
      lastName:  p.last_name  || "",
      barangay:  p.barangay   || "",
      municipality: p.municipality || "Angono",
      province: "Rizal",
      phone: p.primary_contact || "",
    }));
    setStep(2);   // jump straight to Visit Details
    setErrors({});
  };

  const tryAdvance = () => {
    let errs = {};
    if (step === 0) errs = validateStep0(form);
    else if (step === 1) errs = validateStep1(form);
    else if (step === 2) errs = validateStep2(form);
    else if (step === 3) errs = validateStep3(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      // Returning patients: skip address/contact step (step 1) and jump to visit details, then vitals, then priority
      if (isReturning && step === 2) setStep(3);
      else setStep(s => s + 1);
    }
  };

  const updateVitals = (k, v) => {
    setForm(f => ({ ...f, vitals: { ...f.vitals, [k]: v } }));
    setErrors(e => ({ ...e, [`vitals.${k}`]: undefined }));
  };

  const handleSubmit = async () => {
    setSubmitting(true); setApiError(null);
    try {
      const reasonList = form.reasons.includes('Other')
        ? [...form.reasons.filter(r => r !== 'Other'), form.reasonOther].filter(Boolean)
        : form.reasons;
      const visit_reason = reasonList.join(', ');

      const vitalsPayload = {
        blood_pressure: form.vitals.bp || null,
        temperature: form.vitals.temp ? Number(form.vitals.temp) : null,
        heart_rate: form.vitals.hr ? Number(form.vitals.hr) : null,
        spo2: form.vitals.spo2 ? Number(form.vitals.spo2) : null,
        weight_kg: form.vitals.weight ? Number(form.vitals.weight) : null,
        height_cm: form.vitals.height ? Number(form.vitals.height) : null,
      };

      const visitPayload = {
        visit_reason,
        doctor_id: form.doctor ? doctors.find(d => `Dr. ${d.last_name}` === form.doctor)?.id || null : null,
        notes: form.notes || null,
        priority: form.priority,
        send_sms: form.sendSms,
        vitals: vitalsPayload,
      };

      let queue_number;
      if (isReturning) {
        ({ queue_number } = await patientsApi.createVisit(form.existingPatientId, visitPayload));
      } else {
        const payload = {
          first_name: form.firstName, last_name: form.lastName, suffix: form.suffix || null,
          date_of_birth: form.dob, sex_name: form.sex, civil_status_name: form.civilStatus,
          blood_type_code: form.bloodType || null, nationality: form.nationality,
          occupation: form.occupation || null, philhealth_no: form.philhealthNo || null,
          emergency_contact: form.emergencyContact || null,
          address: { street: form.street || null, barangay: form.barangay, municipality: form.municipality, province: form.province },
          contact_info: [
            ...(form.phone ? [{ type: "phone", value: form.phone, is_primary: 1 }] : []),
            ...(form.email ? [{ type: "email", value: form.email, is_primary: 0 }] : []),
          ],
          ...visitPayload,
        };
        ({ queue_number } = await patientsApi.create(payload));
      }

      const queue = `A-${String(queue_number).padStart(3, "0")}`;
      setSuccess({ queue, name: fullName, doctor: form.doctor, reason: visit_reason, contact: form.phone, sendSms: form.sendSms, priority: form.priority, isReturning });
      if (onDraftClear) onDraftClear();
    } catch (err) { setApiError(err.message); }
    finally { setSubmitting(false); }
  };


  const handleAnother = () => {
    setForm(emptyForm); setStep(-1); setSuccess(null); setErrors({});
    setSearchQuery(""); setSearchResults([]);
    if (onDraftClear) onDraftClear();
  };

  const btnStyle = (active) => ({
    flex: 1, padding: "11px", border: `1.5px solid ${active ? "#2a9d8f" : "#e0e7ef"}`,
    borderRadius: 11, background: active ? "#e8f7f5" : "white",
    color: active ? "#2a9d8f" : "#7a8fb0", fontSize: 14, fontWeight: active ? 700 : 400,
    cursor: "pointer", transition: "all 0.15s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb", display: "flex" }}>
      {success && <SuccessModal data={success} onClose={() => { setSuccess(null); if (onNavigate) onNavigate("queue"); }} onAnother={handleAnother} />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ background: "#f4f7fb", borderBottom: "1px solid #dde8e5", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e2d40" }}>Register Patient</h1>
            <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>
              {step === -1 ? "Search for an existing patient or register a new one" :
               isReturning ? `Returning patient · Adding to today's queue` :
               "New patient registration · 4-step form"}
            </div>
          </div>
          <div style={{ background: "#e8f7f5", borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#2a9d8f", lineHeight: 1 }}>A-{String(queueCounter + 1).padStart(3, "0")}</div>
            <div style={{ fontSize: 14, color: "#2a9d8f", opacity: 0.8 }}>Next Queue #</div>
          </div>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 300px", overflow: "hidden" }}>
          {/* ── Form ── */}
          <div style={{ overflowY: "auto", padding: "28px 32px" }}>
            {step >= 0 && <StepBar step={step} isReturning={isReturning} />}
            <style>{`@keyframes fadeUp { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} } @keyframes spin { to{transform:rotate(360deg)} }`}</style>

{/* Search pre-step (step === -1) */}
{step === -1 && (
  <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40" }}>Is this patient already registered?</div>
    {/* Search box */}
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#8a9bb0", pointerEvents: "none" }}>🔍</div>
      <input
        value={searchQuery}
        onChange={e => searchPatients(e.target.value)}
        placeholder="Search by name or phone number..."
        style={{ width: "100%", padding: "13px 16px 13px 44px", border: "1.5px solid #dde8e5", borderRadius: 13, fontSize: 15, color: "#1e2d40", background: "white", outline: "none", boxSizing: "border-box", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
        onFocus={e => e.target.style.borderColor = "#2a9d8f"}
        onBlur={e => e.target.style.borderColor = "#dde8e5"}
        autoFocus
      />
      {searching && <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, border: "2px solid #e0e7ef", borderTopColor: "#2a9d8f", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
    </div>
    {/* Search results */}
    {searchResults.length > 0 && (
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #e0e7ef", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
        <div style={{ padding: "10px 16px", background: "#f7f9fd", fontSize: 13, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7 }}>Existing Patients — click to queue</div>
        {searchResults.map((p, i) => (
          <button key={p.id} onClick={() => selectReturningPatient(p)} style={{
            width: "100%", padding: "13px 18px", display: "flex", alignItems: "center", gap: 14,
            background: "white", border: "none", borderTop: i > 0 ? "1px solid #f0f4f8" : "none",
            cursor: "pointer", textAlign: "left", transition: "background 0.12s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#f0faf8"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}
          >
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white", flexShrink: 0 }}>
              {p.first_name?.[0]}{p.last_name?.[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1e2d40" }}>{p.first_name} {p.last_name}{p.suffix ? ` ${p.suffix}` : ""}</div>
              <div style={{ fontSize: 13, color: "#8a9bb0", marginTop: 2 }}>{p.primary_contact || "No contact"} · {p.barangay || "—"}</div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#2a9d8f", background: "#e8f7f5", padding: "4px 10px", borderRadius: 7 }}>Queue →</span>
          </button>
        ))}
      </div>
    )}
    {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
      <div style={{ textAlign: "center", color: "#8a9bb0", fontSize: 14, padding: "12px 0" }}>No patient found for "{searchQuery}"</div>
    )}
    {/* Divider */}
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: "#e0e7ef" }} />
      <span style={{ fontSize: 13, color: "#8a9bb0", fontWeight: 500 }}>or</span>
      <div style={{ flex: 1, height: 1, background: "#e0e7ef" }} />
    </div>
    {/* New patient CTA */}
    <button onClick={() => { setForm(emptyForm); setStep(0); }} style={{
      padding: "16px", background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white",
      border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer",
      boxShadow: "0 4px 18px rgba(42,157,143,0.35)", transition: "opacity 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >➕ Register New Patient</button>
  </div>
)}
{/* Step 0 — Personal Info */}
{step === 0 && (
  <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40", marginBottom: 4 }}>Patient Information</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: 14 }}>
      <Input label="First Name" placeholder="Given name" value={form.firstName} onChange={v => update("firstName", v)} required error={errors.firstName} />
      <Input label="Last Name" placeholder="Surname" value={form.lastName} onChange={v => update("lastName", v)} required error={errors.lastName} />
      <Select label="Suffix" value={form.suffix} onChange={v => update("suffix", v)} options={["II", "Jr", "Sr", "III", "IV", "V", "2nd", "3rd"]} error={errors.suffix} />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div>
        <Input label="Date of Birth" value={form.dob} onChange={v => update("dob", v)} type="date" required error={errors.dob} />
        {age !== null && <div style={{ fontSize: 13, color: "#2a9d8f", marginTop: 4, fontWeight: 600 }}>Age: {age} years old</div>}
      </div>
      <div>
        <label style={labelStyle}>Sex <span style={{ color: "#CC0000" }}>*</span></label>
        <div style={{ display: "flex", gap: 8 }}>
          {SEX_OPTIONS.map(s => (
            <button key={s} onClick={() => update("sex", s)} style={btnStyle(form.sex === s)}>{s}</button>
          ))}
        </div>
        {errors.sex && <div style={errStyle}>{errors.sex}</div>}
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Select label="Civil Status" value={form.civilStatus} onChange={v => update("civilStatus", v)} options={CIVIL_STATUS_OPTIONS} required error={errors.civilStatus} />
      <Select label="Blood Type" value={form.bloodType} onChange={v => update("bloodType", v)} options={BLOOD_TYPE_OPTIONS.filter(Boolean)} placeholder="Unknown" />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Input label="Nationality" placeholder="Filipino" value={form.nationality} onChange={v => update("nationality", v)} />
      <Input label="Occupation" placeholder="e.g. Teacher, Vendor" value={form.occupation} onChange={v => update("occupation", v)} />
    </div>
    <Input label="PhilHealth No." placeholder="XX-XXXXXXXXX-X (12 digits)" value={form.philhealthNo} onChange={v => update("philhealthNo", v)} error={errors.philhealthNo} />
    {fullName && (
      <div style={{ background: "linear-gradient(135deg,#e8f7f5,#d4ede9)", borderRadius: 14, padding: "14px 18px", border: "1px solid #c0e0dc", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#2a9d8f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "white" }}>{form.firstName?.[0]}{form.lastName?.[0]}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40" }}>{fullName}{form.suffix ? ` ${form.suffix}` : ""}</div>
          <div style={{ fontSize: 14, color: "#5a8f80" }}>{age !== null ? `${age} yrs` : ""}{form.sex ? ` · ${form.sex}` : ""}{form.civilStatus ? ` · ${form.civilStatus}` : ""}</div>
        </div>
      </div>
    )}
  </div>
)}
{/* Step 1 — Address & Contact */}
{step === 1 && (
  <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40", marginBottom: 4 }}>Address & Contact</div>
    <Input label="Street / House No." placeholder="e.g. 123 Rizal St." value={form.street} onChange={v => update("street", v)} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
      <Input label="Barangay" placeholder="Barangay" value={form.barangay} onChange={v => update("barangay", v)} required error={errors.barangay} />
      <Input label="Municipality" placeholder="Angono" value={form.municipality} onChange={v => update("municipality", v)} required error={errors.municipality} />
      <Input label="Province" placeholder="Rizal" value={form.province} onChange={v => update("province", v)} required error={errors.province} />
    </div>
    <div style={{ height: 1, background: "#edf1f7", margin: "4px 0" }} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Input label="Phone Number" placeholder="09XXXXXXXXX" value={form.phone} onChange={v => update("phone", v)} required error={errors.phone} />
      <Input label="Email" placeholder="patient@email.com" value={form.email} onChange={v => update("email", v)} type="email" error={errors.email} />
    </div>
    <Input label="Emergency Contact" placeholder="Name – 09XXXXXXXXX" value={form.emergencyContact} onChange={v => update("emergencyContact", v)} />
  </div>
)}
{/* Step 2 — Visit Details */}
{step === 2 && (
  <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40", marginBottom: 4 }}>Visit Details</div>
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
            }}>{selected && <span style={{ marginRight: 6 }}>✓</span>}{r}</button>
          );
        })}
      </div>
      {errors.reasons && <div style={errStyle}>{errors.reasons}</div>}
    </div>
    {(form.reasons || []).includes("Other") && (
      <Input label="Specify Other Reason" placeholder="Describe the specific visit reason" value={form.reasonOther} onChange={v => update("reasonOther", v)} error={errors.reasonOther} />
    )}
    <div>
      <label style={labelStyle}>Assign Doctor (optional)</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => update("doctor", "")} style={btnStyle(!form.doctor)}>Unassigned</button>
        {doctors.map(d => {
          const name = `Dr. ${d.last_name}`;
          return <button key={d.id} onClick={() => update("doctor", name)} style={btnStyle(form.doctor === name)}>{name}</button>;
        })}
        {doctorsLoading && <span style={{ fontSize: 13, color: "#8a9bb0", alignSelf: "center" }}>Loading doctors...</span>}
        {!doctorsLoading && doctors.length === 0 && <span style={{ fontSize: 13, color: "#8a9bb0", alignSelf: "center" }}>No active doctors found.</span>}
      </div>
    </div>
    <div>
      <label style={labelStyle}>Additional Notes</label>
      <textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Any special instructions, allergies, or remarks..." rows={3}
        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e0e7ef", borderRadius: 11, fontSize: 14, color: "#1e2d40", outline: "none", resize: "none", boxSizing: "border-box" }}
        onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
    </div>
  </div>
)}
{/* Step 3 — Vitals */}
{step === 3 && (() => {
  const v = form.vitals || {};
  const bmi = v.weight && v.height ? (Number(v.weight) / Math.pow(Number(v.height) / 100, 2)).toFixed(1) : null;
  const vField = (key, label, placeholder, unit, icon) => (
    <div key={key}>
      <label style={labelStyle}>{icon} {label} <span style={{ color: "#CC0000" }}>*</span></label>
      <div style={{ position: "relative" }}>
        <input value={v[key] || ""} onChange={e => updateVitals(key, e.target.value)}
          placeholder={placeholder} type={key === "bp" ? "text" : "number"} step="0.1"
          style={{ width: "100%", padding: "10px 14px", paddingRight: 52, border: `1.5px solid ${errors[`vitals.${key}`] ? "#CC0000" : "#e0e7ef"}`, borderRadius: 11, fontSize: 14, color: "#1e2d40", outline: "none", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = "#2a9d8f"}
          onBlur={e => e.target.style.borderColor = errors[`vitals.${key}`] ? "#CC0000" : "#e0e7ef"}
        />
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#8a9bb0" }}>{unit}</span>
      </div>
      {errors[`vitals.${key}`] && <div style={errStyle}>⚠ {errors[`vitals.${key}`]}</div>}
    </div>
  );
  return (
    <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40", marginBottom: 2 }}>Vitals <span style={{ fontSize: 13, fontWeight: 600, color: "#CC0000", background: "#fff0ee", borderRadius: 6, padding: "2px 8px", marginLeft: 6 }}>All Required</span></div>
        <div style={{ fontSize: 14, color: "#7a8fb0" }}>Record the patient's current vitals before proceeding.</div>
      </div>
      {vField("bp", "Blood Pressure", "e.g. 120/80", "mmHg", "❤️")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {vField("temp", "Temperature", "e.g. 36.5", "°C", "🌡️")}
        {vField("hr", "Heart Rate", "e.g. 78", "bpm", "💓")}
        {vField("spo2", "SpO₂", "e.g. 98", "%", "🫁")}
        {vField("weight", "Weight", "e.g. 65", "kg", "⚖️")}
        {vField("height", "Height", "e.g. 160", "cm", "📏")}
        <div />
      </div>
      {bmi && (
        <div style={{ background: "linear-gradient(135deg,#e8f7f5,#d4f0eb)", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #b8e4de" }}>
          <div>
            <div style={{ fontSize: 13, color: "#2a9d8f", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>📐 BMI (auto-calculated)</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#1e2d40", lineHeight: 1.1, marginTop: 2 }}>{bmi}</div>
          </div>
          <div style={{ fontSize: 14, color: "#4a7d70", fontWeight: 500, textAlign: "right" }}>
            {Number(bmi) < 18.5 ? "Underweight" : Number(bmi) < 25 ? "Normal weight" : Number(bmi) < 30 ? "Overweight" : "Obese"}
            <div style={{ fontSize: 12, color: "#8a9bb0", marginTop: 2 }}>kg/m²</div>
          </div>
        </div>
      )}
      <div style={{ background: "#fff8e8", borderRadius: 11, padding: "10px 14px", border: "1px solid #f5dfa0", fontSize: 14, color: "#7a5c00", display: "flex", gap: 8, alignItems: "center" }}>
        <span>📋</span> All vitals must be recorded before proceeding to the next step.
      </div>
    </div>
  );
})()}
{/* Step 4 — Priority & SMS */}
{step === 4 && (
  <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40", marginBottom: 4 }}>Priority & Notifications</div>
    <div>
      <label style={labelStyle}>Priority Classification</label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => update("priority", null)} style={{ padding: "12px 16px", border: `1.5px solid ${!form.priority ? "#2a9d8f" : "#e0e7ef"}`, borderRadius: 12, background: !form.priority ? "#e8f7f5" : "white", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: !form.priority ? "#2a9d8f" : "#f0f3f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: !form.priority ? "white" : "#8a9bb0" }}>{!form.priority ? "✓" : "—"}</div>
          <div><div style={{ fontSize: 14, fontWeight: 600, color: !form.priority ? "#2a9d8f" : "#1e2d40" }}>Regular Queue</div><div style={{ fontSize: 14, color: "#8a9bb0" }}>No priority classification</div></div>
        </button>
        {priorityTypes.map(pt => (
          <button key={pt.key} onClick={() => update("priority", pt.key)} style={{ padding: "12px 16px", border: `1.5px solid ${form.priority === pt.key ? pt.color : "#e0e7ef"}`, borderRadius: 12, background: form.priority === pt.key ? pt.bg : "white", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: form.priority === pt.key ? pt.color : "#f0f3f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              {form.priority === pt.key ? <span style={{ fontSize: 14, color: "white", fontWeight: 700 }}>✓</span> : pt.icon}
            </div>
            <div><div style={{ fontSize: 14, fontWeight: 600, color: form.priority === pt.key ? pt.color : "#1e2d40" }}>{pt.label}</div><div style={{ fontSize: 14, color: "#8a9bb0" }}>{pt.desc}</div></div>
          </button>
        ))}
      </div>
    </div>
    {/* SMS toggle */}
    <div style={{ background: form.sendSms ? "#e8f7f5" : "#f7f9fd", borderRadius: 14, padding: "16px 18px", border: `1.5px solid ${form.sendSms ? "#b8e4de" : "#e0e7ef"}`, transition: "all 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: form.sendSms ? 12 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>📱</span>
          <div><div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>Send SMS Confirmation</div><div style={{ fontSize: 14, color: "#8a9bb0" }}>Queue number + estimated wait time</div></div>
        </div>
        <button onClick={() => update("sendSms", !form.sendSms)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: form.sendSms ? "#2a9d8f" : "#d0dbe8", position: "relative", transition: "background 0.2s" }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: form.sendSms ? 23 : 3, boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
        </button>
      </div>
      {form.sendSms && form.phone && (
        <div style={{ background: "white", borderRadius: 10, padding: "12px 14px", border: "1px solid #c0e0dc" }}>
          <div style={{ fontSize: 14, color: "#8a9bb0", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Message Preview</div>
          <div style={{ fontSize: 14, color: "#1e2d40", lineHeight: 1.6 }}>Hi {form.firstName}! Your queue number is <strong>A-{String(queueCounter + 1).padStart(3, "0")}</strong>. Estimated wait: ~20 minutes. — LikhaHealth</div>
          <div style={{ fontSize: 14, color: "#8a9bb0", marginTop: 6 }}>Sending to: {form.phone}</div>
        </div>
      )}
      {form.sendSms && !form.phone && <div style={{ fontSize: 14, color: "#CC0000" }}>⚠ No contact number provided — SMS cannot be sent</div>}
    </div>
    {apiError && <div style={{ background: "#fff0ee", border: "1px solid #f5c6c0", borderRadius: 11, padding: "10px 14px", fontSize: 14, color: "#c0392b", fontWeight: 500 }}>⚠ {apiError}</div>}
    {/* Summary */}
    <div style={{ background: "#f7f9fd", borderRadius: 14, padding: "16px 18px", border: "1px solid #e0e7ef" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>Registration Summary</div>
      {[
        { label: "Patient",  value: `${fullName}${form.suffix ? ` ${form.suffix}` : ""}` },
        { label: "DOB/Age",  value: form.dob ? `${form.dob} (${age} yrs)` : "—" },
        { label: "Sex",      value: form.sex || "—" },
        { label: "Status",   value: form.civilStatus || "—" },
        { label: "Address",  value: [form.barangay, form.municipality, form.province].filter(Boolean).join(", ") || "—" },
        { label: "Phone",    value: form.phone || "—" },
        { label: "Reason",   value: (form.reasons||[]).join(', ') || "—" },
        { label: "Doctor",   value: form.doctor || "Not yet assigned" },
        { label: "Priority", value: form.priority ? priorityTypes.find(p => p.key === form.priority)?.label : "None" },
      ].map(r => (
        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #edf1f7" }}>
          <span style={{ fontSize: 14, color: "#8a9bb0" }}>{r.label}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{r.value}</span>
        </div>
      ))}
    </div>
  </div>
)}
{/* Nav buttons — hidden on search pre-step */}
{step >= 0 && (
<div style={{ display: "flex", gap: 10, marginTop: 24 }}>
  <button onClick={() => setStep(s => s === 0 ? -1 : isReturning && s === 3 ? 2 : s - 1)}
    style={{ background: "white", color: "#7a8fb0", border: "1px solid #dde8e5", borderRadius: 11, padding: "12px 22px", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
    ← Back
  </button>
  {step < 4 ? (
    <button onClick={tryAdvance} style={{
      flex: 1, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "12px",
      fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.3)", transition: "all 0.2s",
    }}>{step === 3 ? "Continue to Priority →" : "Continue →"}</button>
  ) : (
    <button onClick={handleSubmit} disabled={submitting} style={{
      flex: 1, background: submitting ? "#d0dbe8" : "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none",
      borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
      boxShadow: submitting ? "none" : "0 4px 14px rgba(42,157,143,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    }}>
      {submitting
        ? <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Processing...</>
        : isReturning ? "✓ Add to Queue" : "✓ Register & Add to Queue"}
    </button>
  )}
</div>
)}

          </div>
{/* ── Right: Recent registrations ── */}
<div style={{ background: "white", borderLeft: "1px solid #dde8e5", overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
  <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", borderRadius: 16, padding: "18px", textAlign: "center" }}>
    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Next Queue #</div>
    <div style={{ fontSize: 44, fontWeight: 700, color: "white", letterSpacing: 3, lineHeight: 1 }}>A-{String(queueCounter + 1).padStart(3, "0")}</div>
    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>~20 min estimated wait</div>
  </div>
  <div style={{ display: "flex", gap: 8 }}>
    {[{ label: "In Queue", value: 7, color: "#e09040", bg: "#fdf3e8" }, { label: "Done", value: 2, color: "#7a8fb0", bg: "#f0f4fa" }].map(s => (
      <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: "10px", textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
        <div style={{ fontSize: 14, color: s.color, opacity: 0.8, marginTop: 2 }}>{s.label}</div>
      </div>
    ))}
  </div>
  <div>
    <div style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Recently Registered</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {recentlyRegistered.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, background: "#f7f9fd", border: "1px solid #edf1f7" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#2a9d8f", minWidth: 44 }}>{r.queue}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{r.name}</div>
            <div style={{ fontSize: 14, color: "#8a9bb0" }}>{r.time}</div>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, borderRadius: 6, padding: "2px 8px", background: r.status === "Priority" ? "#f0eafb" : "#e8f7f5", color: r.status === "Priority" ? "#8B5FBF" : "#2a9d8f" }}>{r.status}</span>
        </div>
      ))}
    </div>
  </div>
  <div style={{ background: "#EBF0FA", borderRadius: 13, padding: "14px 16px", marginTop: "auto" }}>
    <div style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>💡 Tips</div>
    {["Priority patients auto-jump to front", "SMS sends queue # + wait time", "Doctor can be assigned later"].map(t => (
      <div key={t} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 6 }}>
        <span style={{ color: "#2a9d8f", fontSize: 14, marginTop: 1 }}>·</span>
        <span style={{ fontSize: 14, color: "#5a6f90", lineHeight: 1.5 }}>{t}</span>
      </div>
    ))}
  </div>
</div>
        </div>
      </div>
    </div>
  );
}
