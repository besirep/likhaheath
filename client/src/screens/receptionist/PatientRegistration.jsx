import { useState, useEffect } from "react";
import { Check, ClipboardList, Smartphone, Heart, Thermometer, Activity, Wind, Scale, Ruler, UserRound, Baby, FileText } from "lucide-react";
import { patientsApi } from "../../lib/api/patients.js";
import { staffApi } from "../../lib/api/staff.js";
import { queueApi } from "../../lib/api/queue.js";
import { getAge, validateStep0, validateStep1, validateStep2, validateStep3, validateStep5 } from "../../lib/validation/patientValidation.js";

// ── Config ────────────────────────────────────────────────────────────────────
const SUFFIX_OPTIONS = ["", "II", "Jr", "Sr", "III", "IV", "V", "2nd", "3rd"];
const SEX_OPTIONS = ["Male", "Female", "Other"];
const CIVIL_STATUS_OPTIONS = ["Single", "Married", "Widowed", "Separated", "Annulled"];
const BLOOD_TYPE_OPTIONS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const priorityTypes = [
  { key: "elderly",   label: "Senior Citizen (60+)", icon: <UserRound size={18} strokeWidth={2} />, color: "#8B5FBF", bg: "#f0eafb", desc: "RA 9994 — Expanded Senior Citizens Act" },
  { key: "pwd",       label: "PWD",                  icon: <UserRound size={18} strokeWidth={2} />, color: "#0047AB", bg: "#EBF0FA", desc: "RA 7277 — Magna Carta for Disabled Persons" },
  { key: "pregnant",  label: "Pregnant Woman",        icon: <UserRound size={18} strokeWidth={2} />, color: "#d4709a", bg: "#fce8f3", desc: "Priority lane for maternal health" },
  { key: "pediatric", label: "Infant / Child (0–5)", icon: <Baby size={18} strokeWidth={2} />, color: "#e09040", bg: "#fdf3e8", desc: "Pediatric priority" },
  { key: "solo",      label: "Solo Parent",           icon: <UserRound size={18} strokeWidth={2} />, color: "#2a9d8f", bg: "#e8f7f5", desc: "RA 8972 — Solo Parents' Welfare Act" },
];

const visitReasons = [
  "Hypertension / Blood Pressure", "Diabetes check-up", "Fever & cough",
  "Prenatal check-up", "Annual physical exam", "Vaccination",
  "Lab results review", "Follow-up consultation", "Wound care / dressing", "Other",
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
          style={{ ...inputBase(focused, !!error), color: value ? "#1e2d40" : "#8a9bb0", appearance: "none", cursor: "pointer", paddingRight: required ? 24 : 14 }}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        {required && <div style={{ position: "absolute", top: 1.5, right: 1.5, width: 14, height: 14, background: "#ef4444", clipPath: "polygon(0 0, 100% 0, 100% 100%)", borderTopRightRadius: 10, pointerEvents: "none" }} />}
      </div>
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
  const steps = ["Personal Info", "Address & Contact", "Visit Details", "Medical History", "Vitals", "Priority & SMS"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28, flexWrap: "wrap", rowGap: 8 }}>
      {steps.map((s, i) => {
        const isActive = i === step, isComplete = i < step;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                background: isComplete ? "#2a9d8f" : isActive ? "linear-gradient(135deg,#2a9d8f,#52c4b8)" : "#e8edf7",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: isComplete || isActive ? "white" : "#8a9bb0",
                boxShadow: isActive ? "0 3px 12px rgba(42,157,143,0.35)" : "none", transition: "all 0.3s",
              }}>{isComplete ? <Check size={14} strokeWidth={3} /> : i + 1}</div>
              <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? "#1e2d40" : "#8a9bb0", whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? "#2a9d8f" : "#e8edf7", margin: "0 6px", transition: "background 0.3s", minWidth: 10 }} />
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
  firstName: "", middleName: "", lastName: "", suffix: "", dob: "", sex: "",
  civilStatus: "", bloodType: "", nationality: "Filipino", occupation: "",
  philhealthNo: "", emergencyContact: "",
  street: "", barangay: "", municipality: "Angono", province: "Rizal",
  phone: "", email: "",
  reasons: [], doctor: "", reasonOther: "",
  vitals: { bp: "", temp: "", hr: "", spo2: "", weight: "", height: "" },
  // Step 4 — Medical & Social History (all optional)
  medical_history: {
    has_hypertension: false, has_heart_disease: false, has_diabetes: false,
    has_stroke: false, has_asthma: false, has_tuberculosis: false,
    has_copd: false, has_allergies: false, has_smoking_hx: false,
    has_none: false, other_conditions: "",
    social_smoking: null, social_alcohol: null, general_survey: "",
  },
  female_health: {
    no_of_children: "", lmp: "", period_duration_days: "",
    cycle_length_days: "", fp_method: "", menopausal_age: "",
  },
  pediatric_vitals: {
    length_cm: "", head_circ: "", skinfold: "",
    body_circ: "", waist_cm: "", hip_cm: "", limbs_cm: "", muac_cm: "",
  },
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
  const [assignedStaffList, setAssignedStaffList] = useState([]);

  // Search pre-step state
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]       = useState(false);
  const [queueCounter, setQueueCounter] = useState(0);
  const [queueItems, setQueueItems]     = useState([]);

  // Fetch the latest queue number and items
  const fetchQueue = () => {
    queueApi.getToday()
      .then(data => {
        const maxQ = data.reduce((max, item) => Math.max(max, item.queue_number || 0), 0);
        setQueueCounter(maxQ);
        setQueueItems(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchQueue();
    // Optional: Refresh periodically or simply depend on success actions
  }, []);

  // Persist draft whenever step or form changes
  useEffect(() => {
    if (onDraftChange && step >= 0) onDraftChange({ step, form });
  }, [step, form]); // eslint-disable-line

  useEffect(() => {
    setDoctorsLoading(true);
    staffApi.getAll({ position: "Doctor", active: true })
      .then(data => { setDoctors(Array.isArray(data) ? data : []); setDoctorsLoading(false); })
      .catch(() => { setDoctors([]); setDoctorsLoading(false); });

    staffApi.getAll({ active: true })
      .then(data => {
        if (Array.isArray(data)) {
          setAssignedStaffList(data.filter(s => s.position === "BHW" || s.position === "Midwife"));
        }
      })
      .catch(console.error);
  }, []);

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };
  const age = getAge(form.dob);
  const fullName = `${form.firstName} ${form.lastName}`.trim();
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
  const selectReturningPatient = async (p) => {
    setSearching(true);
    try {
      const full = await patientsApi.getOne(p.id);
      
      // Convert dates to YYYY-MM-DD for inputs if present
      const formatDate = (dateString) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
      };

      setForm(f => ({
        ...emptyForm,
        existingPatientId: full.id,
        firstName: full.first_name || "",
        middleName: full.middle_name || "",
        lastName:  full.last_name  || "",
        sex: full.sex || "",
        barangay:  full.barangay   || "",
        municipality: full.municipality || "Angono",
        province: "Rizal",
        phone: full.contacts?.find(c => c.is_primary)?.value || full.contacts?.[0]?.value || "",
        medical_history: full.medical_history ? {
          has_hypertension: !!full.medical_history.has_hypertension,
          has_heart_disease: !!full.medical_history.has_heart_disease,
          has_diabetes: !!full.medical_history.has_diabetes,
          has_stroke: !!full.medical_history.has_stroke,
          has_asthma: !!full.medical_history.has_asthma,
          has_tuberculosis: !!full.medical_history.has_tuberculosis,
          has_copd: !!full.medical_history.has_copd,
          has_allergies: !!full.medical_history.has_allergies,
          has_smoking_hx: !!full.medical_history.has_smoking_hx,
          has_none: !!full.medical_history.has_none,
          other_conditions: full.medical_history.other_conditions || "",
          social_smoking: full.medical_history.social_smoking,
          social_alcohol: full.medical_history.social_alcohol,
          general_survey: full.medical_history.general_survey || "",
        } : emptyForm.medical_history,
        female_health: full.female_health ? {
          no_of_children: full.female_health.no_of_children || "",
          lmp: formatDate(full.female_health.lmp),
          period_duration_days: full.female_health.period_duration_days || "",
          cycle_length_days: full.female_health.cycle_length_days || "",
          fp_method: full.female_health.fp_method || "",
          menopausal_age: full.female_health.menopausal_age || "",
        } : emptyForm.female_health,
      }));
      setStep(2);   // jump straight to Visit Details
      setErrors({});
    } catch (err) {
      console.error(err);
      // Fallback
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
      setStep(2);
      setErrors({});
    } finally {
      setSearching(false);
    }
  };

  const tryAdvance = () => {
    let errs = {};
    if (step === 0) errs = validateStep0(form);
    else if (step === 1) errs = validateStep1(form);
    else if (step === 2) errs = validateStep2(form);
    else if (step === 3) errs = validateStep5(form);  // medical history step (all optional)
    else if (step === 4) errs = validateStep3(form);  // vitals step (required)
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setStep(s => s + 1);
    }
  };

  const updateVitals = (k, v) => {
    setForm(f => ({ ...f, vitals: { ...f.vitals, [k]: v } }));
    setErrors(e => ({ ...e, [`vitals.${k}`]: undefined }));
  };

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit this patient registration?")) return;
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

      // Build medical/female/pediatric payloads if user entered something
      const mh = form.medical_history;
      const hasMH = mh && (mh.has_hypertension || mh.has_heart_disease || mh.has_diabetes ||
        mh.has_stroke || mh.has_asthma || mh.has_tuberculosis || mh.has_copd ||
        mh.has_allergies || mh.has_smoking_hx || mh.has_none || mh.other_conditions?.trim() ||
        mh.social_smoking != null || mh.social_alcohol != null || mh.general_survey);
      const fh = form.female_health;
      const hasFH = form.sex === 'Female' && fh && (
        fh.no_of_children || fh.lmp || fh.period_duration_days ||
        fh.cycle_length_days || fh.fp_method || fh.menopausal_age);
      const pv = form.pediatric_vitals;
      const pvPayload = Object.values(pv || {}).some(Boolean) ? {
        length_cm:             pv.length_cm  ? Number(pv.length_cm)  : null,
        head_circumference_cm: pv.head_circ  ? Number(pv.head_circ)  : null,
        skinfold_thickness_cm: pv.skinfold   ? Number(pv.skinfold)   : null,
        body_circumference_cm: pv.body_circ  ? Number(pv.body_circ)  : null,
        waist_cm:              pv.waist_cm   ? Number(pv.waist_cm)   : null,
        hip_cm:                pv.hip_cm     ? Number(pv.hip_cm)     : null,
        limbs_cm:              pv.limbs_cm   ? Number(pv.limbs_cm)   : null,
        muac_cm:               pv.muac_cm    ? Number(pv.muac_cm)    : null,
      } : null;

      const visitPayload = {
        visit_reason,
        doctor_id: form.doctor ? doctors.find(d => `Dr. ${d.last_name}` === form.doctor)?.id || null : null,
        notes: form.notes || null,
        priority: form.priority,
        send_sms: form.sendSms,
        vitals: { ...vitalsPayload, ...(pvPayload || {}) },
        medical_history: hasMH ? mh : null,
        female_health: hasFH ? fh : null,
        sex_name: form.sex,
      };

      let queue_number;
      if (isReturning) {
        ({ queue_number } = await patientsApi.createVisit(form.existingPatientId, visitPayload));
      } else {
        const payload = {
          first_name: form.firstName, middle_name: form.middleName || null,
          last_name: form.lastName, suffix: form.suffix || null,
          date_of_birth: form.dob, sex_name: form.sex, civil_status_name: form.civilStatus,
          blood_type_code: form.bloodType || null, nationality: form.nationality,
          occupation: form.occupation || null, philhealth_no: form.philhealthNo || null,
          emergency_contact: form.emergencyContact || null,
          assigned_staff_id: form.assignedStaffId || null,
          address: { street: form.street || null, barangay: form.barangay, municipality: form.municipality, province: form.province },
          contact_info: [
            ...(form.phone ? [{ type: "phone", value: form.phone, is_primary: 1 }] : []),
            ...(form.email ? [{ type: "email", value: form.email, is_primary: 0 }] : []),
          ],
          ...(hasMH ? { medical_history: mh } : {}),
          ...(hasFH ? { female_health: fh } : {}),
          ...visitPayload,
          vitals: { ...vitalsPayload, ...(pvPayload || {}) },
        };
        ({ queue_number } = await patientsApi.create(payload));
      }

      const queue = `A-${String(queue_number).padStart(3, "0")}`;
      setSuccess({ queue, name: fullName, doctor: form.doctor, reason: visit_reason, contact: form.phone, sendSms: form.sendSms, priority: form.priority, isReturning });
      if (onDraftClear) onDraftClear();
      fetchQueue(); // refresh sidebar stats
    } catch (err) { setApiError(err.message); }
    finally { setSubmitting(false); }
  };
  const inQueueCount = queueItems.filter(q => q.status === "waiting" || q.status === "vitals-done" || q.status === "in-consultation").length;
  const doneCount = queueItems.filter(q => q.status === "done").length;
  const recentList = [...queueItems].reverse().slice(0, 5).map(q => ({
    queue: `A-${String(q.queue_number).padStart(3, "0")}`,
    name: q.patient_name || "Unknown Patient",
    time: new Date(q.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: q.priority_tag === "Emergency" || q.priority_tag === "High" ? "Emergency" : "Waiting",
    color: q.priority_tag === "Emergency" || q.priority_tag === "High" ? "#e63946" : "#2a9d8f",
    bg: q.priority_tag === "Emergency" || q.priority_tag === "High" ? "#fdf3f4" : "#e8f7f5"
  }));

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
               "New patient registration · 6-step form"}
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 80px", gap: 14 }}>
      <Input label="First Name" placeholder="Given Name" value={form.firstName} onChange={v => update("firstName", v)} required error={errors.firstName} />
      <Input label="Middle Name" placeholder="Middle Name" value={form.middleName} onChange={v => update("middleName", v)} error={errors.middleName} />
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
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40" }}>{form.firstName}{form.middleName ? ` ${form.middleName}` : ""} {form.lastName}{form.suffix ? ` ${form.suffix}` : ""}</div>
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
    <div style={{ height: 1, background: "#edf1f7", margin: "4px 0" }} />
    <div>
      <label style={labelStyle}>Assigned BHW / Midwife (Optional)</label>
      <select 
        value={form.assignedStaffId || ""} 
        onChange={e => update("assignedStaffId", e.target.value)}
        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #dde8e5", borderRadius: 11, fontSize: 15, color: "#1e2d40", background: "white", outline: "none", boxSizing: "border-box", appearance: "none" }}
      >
        <option value="">-- No Assignment --</option>
        {assignedStaffList.map(s => (
          <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.position})</option>
        ))}
      </select>
    </div>
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
            }}>{selected && <span style={{ marginRight: 6 }}><Check size={14} strokeWidth={3} /></span>}{r}</button>
          );
        })}
      </div>
      {errors.reasons && <div style={errStyle}>{errors.reasons}</div>}
    </div>
    {(form.reasons || []).includes("Other") && (
      <Input label="Specify Other Reason" placeholder="Describe the specific visit reason" value={form.reasonOther} onChange={v => update("reasonOther", v)} error={errors.reasonOther} />
    )}
    <div>
      <label style={labelStyle}>Preferred Doctor (Optional)</label>
      {doctorsLoading ? <div style={{ fontSize: 14, color: "#8a9bb0" }}>Loading doctors...</div> : (
        <select value={form.doctor} onChange={e => update("doctor", e.target.value)} style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #dde8e5", borderRadius: 11, fontSize: 15, color: "#1e2d40", background: "white", outline: "none", boxSizing: "border-box" }}>
          <option value="">Any available doctor</option>
          {doctors.map(d => (
            <option key={d.id} value={`Dr. ${d.last_name}`}>Dr. {d.first_name} {d.last_name} — {d.employment_status}</option>
          ))}
        </select>
      )}
    </div>
    <div>
      <label style={labelStyle}>Additional Notes</label>
      <textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Any special instructions, allergies, or remarks..." rows={3}
        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e0e7ef", borderRadius: 11, fontSize: 14, color: "#1e2d40", outline: "none", resize: "none", boxSizing: "border-box" }}
        onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
    </div>
  </div>
)}
{/* Step 4 — Vitals */}
{step === 4 && (() => {
  const wt = parseFloat(form.vitals.weight);
  const ht = parseFloat(form.vitals.height) / 100;
  const bmi = (wt && ht) ? (wt / (ht * ht)).toFixed(1) : null;
  let bmiCategory = "";
  let bmiColor = "#8a9bb0";
  if (bmi) {
    if (bmi < 18.5) { bmiCategory = "Underweight"; bmiColor = "#e09040"; }
    else if (bmi < 25) { bmiCategory = "Normal weight"; bmiColor = "#2a9d8f"; }
    else if (bmi < 30) { bmiCategory = "Overweight"; bmiColor = "#e09040"; }
    else { bmiCategory = "Obese"; bmiColor = "#CC0000"; }
  }

  return (
  <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40", marginBottom: 4 }}>Vitals</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {[{ k: "bp", l: "Blood Pressure", u: "mmHg", t: "text", p: "120/80" },
        { k: "temp", l: "Temperature", u: "°C", t: "number", p: "36.5" },
        { k: "hr", l: "Heart Rate", u: "bpm", t: "number", p: "80" },
        { k: "spo2", l: "SpO2", u: "%", t: "number", p: "98" },
        { k: "weight", l: "Weight", u: "kg", t: "number", p: "65" },
        { k: "height", l: "Height", u: "cm", t: "number", p: "165" },
      ].map(f => (
        <div key={f.k}>
          <label style={labelStyle}>{f.l} <span style={{ color: "#CC0000", marginLeft: 2 }}>*</span></label>
          <div style={{ position: "relative" }}>
            <input value={form.vitals[f.k] || ""} onChange={e => setForm(fm => ({ ...fm, vitals: { ...fm.vitals, [f.k]: e.target.value } }))} type={f.t} step="0.1" placeholder={f.p} style={{ width: "100%", padding: "9px 40px 9px 12px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, color: "#1e2d40", outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#0047AB"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#8a9bb0" }}>{f.u}</span>
            <div style={{ position: "absolute", top: 1.5, right: 1.5, width: 14, height: 14, background: "#ef4444", clipPath: "polygon(0 0, 100% 0, 100% 100%)", borderTopRightRadius: 8, pointerEvents: "none" }} />
          </div>
        </div>
      ))}
      <div style={{ gridColumn: "span 2", background: "#f7f9fd", borderRadius: 10, padding: "12px 14px", border: "1px solid #edf1f7", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5 }}>Body Mass Index (BMI)</div>
          <div style={{ fontSize: 13, color: "#5a6f90", marginTop: 2 }}>Calculated automatically</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: bmi ? bmiColor : "#b0beca", lineHeight: 1 }}>{bmi || "—"}</div>
          {bmi && <div style={{ fontSize: 12, fontWeight: 700, color: bmiColor, marginTop: 4 }}>{bmiCategory}</div>}
        </div>
      </div>
    </div>
  </div>
  );
})()}
{/* Step 3 — Medical & Social History */}
{step === 3 && (() => {
  const mh = form.medical_history;
  const fh = form.female_health;
  const pv = form.pediatric_vitals;
  const isFemale = form.sex === 'Female';
  const isPediatric = age !== null && age <= 2;
  const updateMH = (k, v) => setForm(f => ({ ...f, medical_history: { ...f.medical_history, [k]: v } }));
  const updateFH = (k, v) => setForm(f => ({ ...f, female_health:   { ...f.female_health,   [k]: v } }));
  const updatePV = (k, v) => setForm(f => ({ ...f, pediatric_vitals:{ ...f.pediatric_vitals,[k]: v } }));
  const CHK = (active) => ({
    display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
    border:`1.5px solid ${active?"#0047AB":"#e0e7ef"}`,
    borderRadius:10, background:active?"#EBF0FA":"white",
    cursor:"pointer", transition:"all 0.15s", userSelect:"none",
  });
  const SecTitle = ({ icon, title, sub }) => (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, paddingBottom:10, borderBottom:"1.5px solid #edf1f7" }}>
      <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#1a2540,#243560)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", flexShrink:0 }}>{icon}</div>
      <div><div style={{ fontSize:15, fontWeight:700, color:"#1e2d40" }}>{title}</div>{sub&&<div style={{ fontSize:13, color:"#8a9bb0" }}>{sub}</div>}</div>
    </div>
  );
  const pvField = (key, lbl) => (
    <div>
      <label style={labelStyle}>{lbl}</label>
      <div style={{ position:"relative" }}>
        <input value={pv[key]||""} onChange={e=>updatePV(key,e.target.value)} type="number" step="0.1" placeholder="cm"
          style={{ width:"100%", padding:"9px 40px 9px 12px", border:`1.5px solid ${errors[`pv.${key}`]?"#CC0000":"#e0e7ef"}`, borderRadius:10, fontSize:14, color:"#1e2d40", outline:"none", boxSizing:"border-box" }}
          onFocus={e=>e.target.style.borderColor="#0047AB"} onBlur={e=>e.target.style.borderColor=errors[`pv.${key}`]?"#CC0000":"#e0e7ef"} />
        <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"#8a9bb0" }}>cm</span>
      </div>
      {errors[`pv.${key}`]&&<div style={errStyle}>{errors[`pv.${key}`]}</div>}
    </div>
  );
  const PMH=[
    {key:"has_hypertension",label:"Hypertension"},{key:"has_heart_disease",label:"Heart Disease"},
    {key:"has_diabetes",label:"Diabetes"},{key:"has_stroke",label:"Stroke"},
    {key:"has_asthma",label:"Bronchial Asthma"},{key:"has_tuberculosis",label:"Tuberculosis"},
    {key:"has_copd",label:"COPD / Emphysema"},{key:"has_allergies",label:"Allergies"},
    {key:"has_smoking_hx",label:"Smoking History"},{key:"has_none",label:"NONE"},
  ];
  return (
    <div style={{ animation:"fadeUp 0.25s ease", display:"flex", flexDirection:"column", gap:20 }}>
      <div>
        <div style={{ fontSize:18, fontWeight:700, color:"#1e2d40", marginBottom:2, display:"flex", alignItems:"center", gap:10 }}>
          <FileText size={20} strokeWidth={2}/> Medical &amp; Social History
        </div>
        <div style={{ fontSize:14, color:"#7a8fb0" }}>Optional — can be filled in later from Patient Records.</div>
      </div>

      {/* Past Medical History */}
      <div style={{ background:"white", borderRadius:14, border:"1px solid #e0e7ef", padding:"16px 18px" }}>
        <SecTitle icon={<Heart size={16} strokeWidth={2}/>} title="Past Medical History" sub="Check all that apply"/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {PMH.map(({key,label})=>(
            <label key={key} style={CHK(!!mh[key])}>
              <div style={{ width:18,height:18,borderRadius:5,border:`2px solid ${mh[key]?"#0047AB":"#c0cfe0"}`,background:mh[key]?"#0047AB":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                {mh[key]&&<Check size={12} strokeWidth={3} color="white"/>}
              </div>
              <input type="checkbox" checked={!!mh[key]} onChange={e=>updateMH(key,e.target.checked)} style={{ display:"none" }}/>
              <span style={{ fontSize:14, color:mh[key]?"#0047AB":"#4a5d75", fontWeight:mh[key]?600:400 }}>{label}</span>
            </label>
          ))}
        </div>
        {!mh.has_none&&(
          <div style={{ marginTop:12 }}>
            <label style={labelStyle}>Others (please specify)</label>
            <input value={mh.other_conditions||""} onChange={e=>updateMH("other_conditions",e.target.value)}
              placeholder="e.g. Kidney disease, Cancer..."
              style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #e0e7ef",borderRadius:10,fontSize:14,color:"#1e2d40",outline:"none",boxSizing:"border-box" }}
              onFocus={e=>e.target.style.borderColor="#0047AB"} onBlur={e=>e.target.style.borderColor="#e0e7ef"}/>
          </div>
        )}
      </div>

      {/* Personal / Social History */}
      <div style={{ background:"white", borderRadius:14, border:"1px solid #e0e7ef", padding:"16px 18px" }}>
        <SecTitle icon={<Activity size={16} strokeWidth={2}/>} title="Personal / Social History"/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {[{key:"social_smoking",label:"Smoking",icon:"🚬"},{key:"social_alcohol",label:"Alcohol Intake",icon:"🍺"}].map(({key,label,icon})=>(
            <div key={key}>
              <label style={labelStyle}>{icon} {label}</label>
              <div style={{ display:"flex", gap:8 }}>
                {[{v:true,l:"Yes"},{v:false,l:"No"}].map(({v,l})=>(
                  <button key={l} onClick={()=>updateMH(key,v)} style={btnStyle(mh[key]===v)}>{l}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* General Survey */}
      <div style={{ background:"white", borderRadius:14, border:"1px solid #e0e7ef", padding:"16px 18px" }}>
        <SecTitle icon={<ClipboardList size={16} strokeWidth={2}/>} title="General Survey"/>
        <div style={{ display:"flex", gap:10 }}>
          {[{v:"awake_alert",l:"☀️ Awake and Alert"},{v:"altered_sensorium",l:"⚠️ Altered Sensorium"}].map(({v,l})=>(
            <button key={v} onClick={()=>updateMH("general_survey",mh.general_survey===v?"":v)}
              style={{...btnStyle(mh.general_survey===v),flex:1,padding:"11px 14px"}}>{l}
            </button>
          ))}
        </div>
      </div>

      {/* Female Health — conditional on sex = Female */}
      {isFemale&&(
        <div style={{ background:"white", borderRadius:14, border:"1.5px solid #f5d0e8", padding:"16px 18px" }}>
          <SecTitle icon={<span style={{ fontSize:15 }}>♀️</span>} title="For Females Only" sub="LMP, FP method, reproductive history"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Input label="No. of Children" placeholder="e.g. 2" value={fh.no_of_children} onChange={v=>updateFH("no_of_children",v)} type="number" error={errors["fh.no_of_children"]}/>
            <Input label="LMP (Last Menstrual Period)" value={fh.lmp} onChange={v=>updateFH("lmp",v)} type="date" error={errors["fh.lmp"]}/>
            <Input label="Period Duration (days)" placeholder="e.g. 5" value={fh.period_duration_days} onChange={v=>updateFH("period_duration_days",v)} type="number"/>
            <Input label="Cycle Length (days)" placeholder="e.g. 28" value={fh.cycle_length_days} onChange={v=>updateFH("cycle_length_days",v)} type="number"/>
            <Input label="FP Method" placeholder="e.g. Pills, IUD, None" value={fh.fp_method} onChange={v=>updateFH("fp_method",v)}/>
            <Input label="Menopausal Age" placeholder="if applicable" value={fh.menopausal_age} onChange={v=>updateFH("menopausal_age",v)} type="number"/>
          </div>
        </div>
      )}

      {/* Pediatric Measurements — conditional on age ≤ 24 months */}
      {isPediatric&&(
        <div style={{ background:"white", borderRadius:14, border:"1.5px solid #fde8c8", padding:"16px 18px" }}>
          <SecTitle icon={<Baby size={16} strokeWidth={2}/>} title="Pediatric Measurements" sub="For clients aged 0–24 months"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {pvField("length_cm","Length")}
            {pvField("head_circ","Head Circumference")}
            {pvField("skinfold","Skinfold Thickness")}
            {pvField("body_circ","Body Circumference")}
            {pvField("waist_cm","Waist")}
            {pvField("hip_cm","Hip")}
            {pvField("limbs_cm","Limbs")}
            {pvField("muac_cm","MUAC")}
          </div>
        </div>
      )}
    </div>
  );
})()}
{/* Step 5 — Priority & SMS */}
{step === 5 && (
  <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40", marginBottom: 4 }}>Priority & Notifications</div>
    <div>
      <label style={labelStyle}>Priority Classification</label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => update("priority", null)} style={{ padding: "12px 16px", border: `1.5px solid ${!form.priority ? "#2a9d8f" : "#e0e7ef"}`, borderRadius: 12, background: !form.priority ? "#e8f7f5" : "white", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: !form.priority ? "#2a9d8f" : "#f0f3f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: !form.priority ? "white" : "#8a9bb0" }}>{!form.priority ? <Check size={16} strokeWidth={3} /> : "—"}</div>
          <div><div style={{ fontSize: 14, fontWeight: 600, color: !form.priority ? "#2a9d8f" : "#1e2d40" }}>Regular Queue</div><div style={{ fontSize: 14, color: "#8a9bb0" }}>No priority classification</div></div>
        </button>
        {priorityTypes.map(pt => (
          <button key={pt.key} onClick={() => update("priority", pt.key)} style={{ padding: "12px 16px", border: `1.5px solid ${form.priority === pt.key ? pt.color : "#e0e7ef"}`, borderRadius: 12, background: form.priority === pt.key ? pt.bg : "white", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: form.priority === pt.key ? pt.color : "#f0f3f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              {form.priority === pt.key ? <span style={{ color: "white" }}><Check size={16} strokeWidth={3} /></span> : pt.icon}
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
          <span style={{ fontSize: 22 }}><Smartphone size={22} strokeWidth={2} /></span>
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
  <button onClick={() => setStep(s => s === 0 ? -1 : isReturning && s === 2 ? -1 : s - 1)}
    style={{ background: "white", color: "#7a8fb0", border: "1px solid #dde8e5", borderRadius: 11, padding: "12px 22px", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
    ← Back
  </button>
  {step < 5 ? (
    <button onClick={tryAdvance} style={{
      flex: 1, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "12px",
      fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.3)", transition: "all 0.2s",
    }}>{step === 4 ? "Continue to Priority →" : step === 3 ? "Continue to Medical History →" : "Continue →"}</button>
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
    {[{ label: "In Queue", value: inQueueCount, color: "#e09040", bg: "#fdf3e8" }, { label: "Done", value: doneCount, color: "#7a8fb0", bg: "#f0f4fa" }].map(s => (
      <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: "10px", textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
        <div style={{ fontSize: 14, color: s.color, opacity: 0.8, marginTop: 2 }}>{s.label}</div>
      </div>
    ))}
  </div>
  <div>
    <div style={{ fontSize: 14, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Recently Registered</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {recentList.length === 0 ? (
        <div style={{ fontSize: 13, color: "#8a9bb0", textAlign: "center", padding: "12px 0" }}>No patients registered yet today.</div>
      ) : recentList.map((r, i) => (
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
