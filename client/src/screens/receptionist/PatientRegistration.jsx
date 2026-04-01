import { useState } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const doctors = ["Dr. Reyes", "Dr. Santos", "Dr. Cruz"];

const priorityTypes = [
  { key: "elderly",   label: "Senior Citizen (60+)", icon: "👴", color: "#7b5ea7", bg: "#f0eafb", desc: "RA 9994 — Expanded Senior Citizens Act" },
  { key: "pwd",       label: "PWD",                  icon: "♿", color: "#3b7dd8", bg: "#eef3fc", desc: "RA 7277 — Magna Carta for Disabled Persons" },
  { key: "pregnant",  label: "Pregnant Woman",        icon: "🤰", color: "#d4709a", bg: "#fce8f3", desc: "Priority lane for maternal health" },
  { key: "pediatric", label: "Infant / Child (0–5)", icon: "👶", color: "#e09040", bg: "#fdf3e8", desc: "Pediatric priority" },
  { key: "solo",      label: "Solo Parent",           icon: "👨‍👧", color: "#2a9d8f", bg: "#e8f7f5", desc: "RA 8972 — Solo Parents' Welfare Act" },
];

const visitReasons = [
  "Hypertension / Blood Pressure",
  "Diabetes check-up",
  "Fever & cough",
  "Prenatal check-up",
  "Annual physical exam",
  "Vaccination",
  "Lab results review",
  "Follow-up consultation",
  "Wound care / dressing",
  "Other",
];

const recentlyRegistered = [
  { queue: "A-007", name: "Ana Lim",      time: "9:40 AM", status: "Waiting"    },
  { queue: "A-006", name: "Carlos M.",    time: "9:35 AM", status: "Waiting"    },
  { queue: "A-005", name: "Ramon V.",     time: "9:30 AM", status: "Waiting"    },
  { queue: "A-004", name: "Luisa R.",     time: "9:20 AM", status: "Priority"   },
  { queue: "A-003", name: "Elena C.",     time: "9:10 AM", status: "Priority"   },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
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
            background: item.label === "Register Patient" ? "#e8f7f5" : "transparent",
            color: item.label === "Register Patient" ? "#2a9d8f" : "#4a5d75",
            fontWeight: item.label === "Register Patient" ? 600 : 400, fontSize: 14, transition: "all 0.18s",
          }}
            onMouseEnter={e => { if (item.label !== "Register Patient") { e.currentTarget.style.background = "#f4f7fb"; e.currentTarget.style.color = "#1e2d40"; }}}
            onMouseLeave={e => { if (item.label !== "Register Patient") { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4a5d75"; }}}
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

function Input({ label, placeholder, value, onChange, type = "text", required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#e07050", marginLeft: 2 }}>*</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "11px 14px",
          border: `1.5px solid ${focused ? "#2a9d8f" : "#e0e7ef"}`,
          borderRadius: 11, fontSize: 14, fontFamily: "'DM Sans',sans-serif",
          color: "#1e2d40", outline: "none", background: "white",
          transition: "border-color 0.2s", boxSizing: "border-box",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

function Select({ label, value, onChange, options, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#e07050", marginLeft: 2 }}>*</span>}
      </label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "11px 14px",
          border: `1.5px solid ${focused ? "#2a9d8f" : "#e0e7ef"}`,
          borderRadius: 11, fontSize: 14, fontFamily: "'DM Sans',sans-serif",
          color: value ? "#1e2d40" : "#8a9bb0", outline: "none", background: "white",
          appearance: "none", cursor: "pointer", boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ── Success Modal ─────────────────────────────────────────────────────────────
function SuccessModal({ data, onClose, onAnother }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(20,40,70,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "white", borderRadius: 22, width: 420, padding: 0,
        boxShadow: "0 24px 64px rgba(20,40,70,0.24)",
        animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        overflow: "hidden",
      }}>
        <style>{`@keyframes popIn { from{transform:scale(0.88);opacity:0} to{transform:scale(1);opacity:1} }`}</style>

        {/* Top — queue ticket */}
        <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "32px 32px 28px", textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Queue Number</div>
          <div style={{
            fontSize: 64, fontFamily: "'Fraunces',serif", fontWeight: 700, color: "white",
            lineHeight: 1, letterSpacing: 4,
            textShadow: "0 4px 20px rgba(42,157,143,0.4)",
          }}>{data.queue}</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 10 }}>{data.name}</div>
          {data.priority && (
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", borderRadius: 9, padding: "5px 14px" }}>
              <span style={{ fontSize: 16 }}>{priorityTypes.find(p => p.key === data.priority)?.icon}</span>
              <span style={{ fontSize: 12, color: "white", fontWeight: 600 }}>{priorityTypes.find(p => p.key === data.priority)?.label}</span>
            </div>
          )}
        </div>

        {/* Details */}
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
                <span style={{ fontSize: 12, color: "#8a9bb0", width: 70 }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40" }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* SMS success indicator */}
          {data.sendSms && (
            <div style={{ background: "#e8f7f5", borderRadius: 11, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16, border: "1px solid #c0e0dc" }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#2a9d8f" }}>SMS Sent Successfully</div>
                <div style={{ fontSize: 11, color: "#5a8f80" }}>Queue number and estimated wait sent to patient</div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onAnother} style={{
              flex: 1, background: "#e8f7f5", color: "#2a9d8f", border: "1.5px solid #b8e4de",
              borderRadius: 11, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>+ Register Another</button>
            <button onClick={onClose} style={{
              flex: 1, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none",
              borderRadius: 11, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 14px rgba(42,157,143,0.3)",
            }}>Go to Queue →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ["Personal Info", "Visit Details", "Priority & SMS"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => {
        const isActive   = i === step;
        const isComplete = i < step;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                background: isComplete ? "#2a9d8f" : isActive ? "linear-gradient(135deg,#2a9d8f,#52c4b8)" : "#e8edf7",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
                color: isComplete || isActive ? "white" : "#8a9bb0",
                boxShadow: isActive ? "0 3px 12px rgba(42,157,143,0.35)" : "none",
                transition: "all 0.3s",
              }}>
                {isComplete ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? "#1e2d40" : "#8a9bb0", whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? "#2a9d8f" : "#e8edf7", margin: "0 12px", transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const emptyForm = {
  firstName: "", lastName: "", age: "", gender: "", dob: "",
  contact: "", address: "",
  reason: "", doctor: "", reasonOther: "",
  priority: null, sendSms: true, notes: "",
};

export default function PatientRegistration({ onNavigate }) {
  const [step, setStep]         = useState(0);
  const [form, setForm]         = useState(emptyForm);
  const [success, setSuccess]   = useState(null);
  const [queueCounter, setQueueCounter] = useState(8); // next = A-008 already taken, so A-009

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const nextQueue = () => {
    const n = queueCounter + 1;
    setQueueCounter(n);
    return `A-${String(n).padStart(3, "0")}`;
  };

  const canProceed = () => {
    if (step === 0) return form.firstName && form.lastName && form.age && form.gender && form.contact;
    if (step === 1) return form.reason;
    return true;
  };

  const handleSubmit = () => {
    const queue = nextQueue();
    setSuccess({
      queue, name: `${form.firstName} ${form.lastName}`,
      doctor: form.doctor, reason: form.reason || form.reasonOther,
      contact: form.contact, sendSms: form.sendSms, priority: form.priority,
    });
  };

  const handleAnother = () => { setForm(emptyForm); setStep(0); setSuccess(null); };

  const fullName = `${form.firstName} ${form.lastName}`.trim();

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb", fontFamily: "'DM Sans',sans-serif", display: "flex" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #dce8e5; border-radius: 4px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {success && <SuccessModal data={success} onClose={() => { setSuccess(null); if (onNavigate) onNavigate("queue"); }} onAnother={handleAnother} />}
      <Sidebar />

      <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{
          background: "#f4f7fb", borderBottom: "1px solid #dde8e5",
          padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontFamily: "'Fraunces',serif", fontWeight: 700, color: "#1e2d40" }}>Register Patient</h1>
            <div style={{ fontSize: 13, color: "#7a8fb0", marginTop: 2 }}>Add a new patient to today's queue</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ background: "#e8f7f5", borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#2a9d8f", fontFamily: "'Fraunces',serif", lineHeight: 1 }}>A-{String(queueCounter + 1).padStart(3, "0")}</div>
              <div style={{ fontSize: 10, color: "#2a9d8f", opacity: 0.8 }}>Next Queue #</div>
            </div>
          </div>
        </div>

        {/* Main split */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 300px", overflow: "hidden" }}>

          {/* ── Form ── */}
          <div style={{ overflowY: "auto", padding: "28px 32px" }}>
            <StepBar step={step} />

            {/* Step 0 — Personal Info */}
            {step === 0 && (
              <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40", fontFamily: "'Fraunces',serif", marginBottom: 4 }}>Patient Information</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Input label="First Name" placeholder="Given name" value={form.firstName} onChange={v => update("firstName", v)} required />
                  <Input label="Last Name"  placeholder="Surname"    value={form.lastName}  onChange={v => update("lastName", v)}  required />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 14 }}>
                  <Input label="Age" placeholder="Age" value={form.age} onChange={v => update("age", v)} type="number" required />
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                      Gender <span style={{ color: "#e07050" }}>*</span>
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["Male", "Female"].map(g => (
                        <button key={g} onClick={() => update("gender", g)} style={{
                          flex: 1, padding: "11px", border: `1.5px solid ${form.gender === g ? "#2a9d8f" : "#e0e7ef"}`,
                          borderRadius: 11, background: form.gender === g ? "#e8f7f5" : "white",
                          color: form.gender === g ? "#2a9d8f" : "#7a8fb0",
                          fontSize: 13, fontWeight: form.gender === g ? 700 : 400, cursor: "pointer", transition: "all 0.15s",
                        }}>{g}</button>
                      ))}
                    </div>
                  </div>
                  <Input label="Date of Birth" placeholder="" value={form.dob} onChange={v => update("dob", v)} type="date" />
                </div>

                <Input label="Contact Number" placeholder="+63 9XX XXX XXXX" value={form.contact} onChange={v => update("contact", v)} required />
                <Input label="Home Address" placeholder="Street, Barangay, City" value={form.address} onChange={v => update("address", v)} />

                {/* Preview */}
                {(form.firstName || form.lastName) && (
                  <div style={{ background: "linear-gradient(135deg,#e8f7f5,#d4ede9)", borderRadius: 14, padding: "14px 18px", border: "1px solid #c0e0dc", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#2a9d8f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "white" }}>
                      {form.firstName?.[0]}{form.lastName?.[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40", fontFamily: "'Fraunces',serif" }}>{fullName}</div>
                      <div style={{ fontSize: 12, color: "#5a8f80" }}>{form.age ? `${form.age} yrs` : ""}{form.gender ? ` · ${form.gender}` : ""}{form.contact ? ` · ${form.contact}` : ""}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 1 — Visit Details */}
            {step === 1 && (
              <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40", fontFamily: "'Fraunces',serif", marginBottom: 4 }}>Visit Details</div>

                {/* Reason grid */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 8 }}>
                    Reason for Visit <span style={{ color: "#e07050" }}>*</span>
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {visitReasons.map(r => (
                      <button key={r} onClick={() => update("reason", r)} style={{
                        padding: "10px 14px", border: `1.5px solid ${form.reason === r ? "#2a9d8f" : "#e0e7ef"}`,
                        borderRadius: 11, background: form.reason === r ? "#e8f7f5" : "white",
                        color: form.reason === r ? "#2a9d8f" : "#4a5d75",
                        fontSize: 13, fontWeight: form.reason === r ? 600 : 400,
                        cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                      }}>
                        {form.reason === r && <span style={{ marginRight: 6 }}>✓</span>}{r}
                      </button>
                    ))}
                  </div>
                </div>

                {form.reason === "Other" && (
                  <Input label="Specify Reason" placeholder="Describe the visit reason" value={form.reasonOther} onChange={v => update("reasonOther", v)} />
                )}

                {/* Doctor assignment */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 8 }}>Assign Doctor (optional)</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => update("doctor", "")} style={{
                      padding: "9px 16px", border: `1.5px solid ${!form.doctor ? "#2a9d8f" : "#e0e7ef"}`,
                      borderRadius: 10, background: !form.doctor ? "#e8f7f5" : "white",
                      color: !form.doctor ? "#2a9d8f" : "#7a8fb0",
                      fontSize: 13, fontWeight: !form.doctor ? 600 : 400, cursor: "pointer", transition: "all 0.15s",
                    }}>Auto-assign</button>
                    {doctors.map(d => (
                      <button key={d} onClick={() => update("doctor", d)} style={{
                        padding: "9px 16px", border: `1.5px solid ${form.doctor === d ? "#2a9d8f" : "#e0e7ef"}`,
                        borderRadius: 10, background: form.doctor === d ? "#e8f7f5" : "white",
                        color: form.doctor === d ? "#2a9d8f" : "#7a8fb0",
                        fontSize: 13, fontWeight: form.doctor === d ? 600 : 400, cursor: "pointer", transition: "all 0.15s",
                      }}>{d}</button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Additional Notes</label>
                  <textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Any special instructions, allergies, or remarks..." rows={3}
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e0e7ef", borderRadius: 11, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: "#1e2d40", outline: "none", resize: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#2a9d8f"}
                    onBlur={e => e.target.style.borderColor = "#e0e7ef"}
                  />
                </div>
              </div>
            )}

            {/* Step 2 — Priority & SMS */}
            {step === 2 && (
              <div style={{ animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40", fontFamily: "'Fraunces',serif", marginBottom: 4 }}>Priority & Notifications</div>

                {/* Priority */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 10 }}>Priority Classification</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button onClick={() => update("priority", null)} style={{
                      padding: "12px 16px", border: `1.5px solid ${!form.priority ? "#2a9d8f" : "#e0e7ef"}`,
                      borderRadius: 12, background: !form.priority ? "#e8f7f5" : "white",
                      display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: !form.priority ? "#2a9d8f" : "#f0f3f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                        {!form.priority ? "✓" : "—"}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: !form.priority ? "#2a9d8f" : "#1e2d40" }}>Regular Queue</div>
                        <div style={{ fontSize: 12, color: "#8a9bb0" }}>No priority classification</div>
                      </div>
                    </button>
                    {priorityTypes.map(pt => (
                      <button key={pt.key} onClick={() => update("priority", pt.key)} style={{
                        padding: "12px 16px", border: `1.5px solid ${form.priority === pt.key ? pt.color : "#e0e7ef"}`,
                        borderRadius: 12, background: form.priority === pt.key ? pt.bg : "white",
                        display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                      }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: form.priority === pt.key ? pt.color : "#f0f3f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                          {form.priority === pt.key ? <span style={{ fontSize: 14, color: "white", fontWeight: 700 }}>✓</span> : pt.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: form.priority === pt.key ? pt.color : "#1e2d40" }}>{pt.label}</div>
                          <div style={{ fontSize: 11, color: "#8a9bb0" }}>{pt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SMS */}
                <div style={{ background: form.sendSms ? "#e8f7f5" : "#f7f9fd", borderRadius: 14, padding: "16px 18px", border: `1.5px solid ${form.sendSms ? "#b8e4de" : "#e0e7ef"}`, transition: "all 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: form.sendSms ? 12 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 22 }}>📱</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>Send SMS Confirmation</div>
                        <div style={{ fontSize: 12, color: "#8a9bb0" }}>Queue number + estimated wait time</div>
                      </div>
                    </div>
                    <button onClick={() => update("sendSms", !form.sendSms)} style={{
                      width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                      background: form.sendSms ? "#2a9d8f" : "#d0dbe8", position: "relative", transition: "background 0.2s",
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%", background: "white",
                        position: "absolute", top: 3, transition: "left 0.2s",
                        left: form.sendSms ? 23 : 3,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                      }} />
                    </button>
                  </div>
                  {form.sendSms && form.contact && (
                    <div style={{ background: "white", borderRadius: 10, padding: "12px 14px", border: "1px solid #c0e0dc" }}>
                      <div style={{ fontSize: 10, color: "#8a9bb0", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Message Preview</div>
                      <div style={{ fontSize: 13, color: "#1e2d40", lineHeight: 1.6 }}>
                        Hi {form.firstName}! Your queue number is <strong>A-{String(queueCounter + 1).padStart(3, "0")}</strong>. Estimated wait: ~20 minutes. Please stay nearby. — CareQueue Health Center
                      </div>
                      <div style={{ fontSize: 11, color: "#8a9bb0", marginTop: 6 }}>Sending to: {form.contact}</div>
                    </div>
                  )}
                  {form.sendSms && !form.contact && (
                    <div style={{ fontSize: 12, color: "#e07050" }}>⚠ No contact number provided — SMS cannot be sent</div>
                  )}
                </div>

                {/* Final summary */}
                <div style={{ background: "#f7f9fd", borderRadius: 14, padding: "16px 18px", border: "1px solid #e0e7ef" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>Registration Summary</div>
                  {[
                    { label: "Patient",  value: `${form.firstName} ${form.lastName}` },
                    { label: "Age",      value: `${form.age} yrs · ${form.gender}` },
                    { label: "Contact",  value: form.contact || "—" },
                    { label: "Reason",   value: form.reason === "Other" ? form.reasonOther : form.reason || "—" },
                    { label: "Doctor",   value: form.doctor || "Auto-assign" },
                    { label: "Priority", value: form.priority ? priorityTypes.find(p => p.key === form.priority)?.label : "None" },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #edf1f7" }}>
                      <span style={{ fontSize: 12, color: "#8a9bb0" }}>{r.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40" }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nav buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} style={{
                  background: "white", color: "#7a8fb0", border: "1px solid #dde8e5",
                  borderRadius: 11, padding: "12px 22px", fontSize: 14, cursor: "pointer", fontWeight: 500,
                }}>← Back</button>
              )}
              {step < 2 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} style={{
                  flex: 1, background: canProceed() ? "linear-gradient(135deg,#2a9d8f,#52c4b8)" : "#d0dbe8",
                  color: "white", border: "none", borderRadius: 11, padding: "12px",
                  fontSize: 14, fontWeight: 700, cursor: canProceed() ? "pointer" : "not-allowed",
                  boxShadow: canProceed() ? "0 4px 14px rgba(42,157,143,0.3)" : "none",
                  transition: "all 0.2s",
                }}>Continue →</button>
              ) : (
                <button onClick={handleSubmit} style={{
                  flex: 1, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none",
                  borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(42,157,143,0.3)",
                }}>✓ Register & Add to Queue</button>
              )}
            </div>
          </div>

          {/* ── Right: Recent registrations ── */}
          <div style={{ background: "white", borderLeft: "1px solid #dde8e5", overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Next queue preview */}
            <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", borderRadius: 16, padding: "18px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Next Queue #</div>
              <div style={{ fontSize: 44, fontFamily: "'Fraunces',serif", fontWeight: 700, color: "white", letterSpacing: 3, lineHeight: 1 }}>
                A-{String(queueCounter + 1).padStart(3, "0")}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>~20 min estimated wait</div>
            </div>

            {/* Queue stats */}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "In Queue", value: 7, color: "#e09040", bg: "#fdf3e8" },
                { label: "Done",     value: 2, color: "#7a8fb0", bg: "#f0f4fa" },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: s.color, opacity: 0.8, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Recently Registered</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {recentlyRegistered.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, background: "#f7f9fd", border: "1px solid #edf1f7" }}>
                    <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 13, color: "#2a9d8f", minWidth: 44 }}>{r.queue}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40" }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "#8a9bb0" }}>{r.time}</div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, borderRadius: 6, padding: "2px 8px",
                      background: r.status === "Priority" ? "#f0eafb" : "#e8f7f5",
                      color: r.status === "Priority" ? "#7b5ea7" : "#2a9d8f",
                    }}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick tips */}
            <div style={{ background: "#f0f4fb", borderRadius: 13, padding: "14px 16px", marginTop: "auto" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>💡 Tips</div>
              {[
                "Priority patients auto-jump to front",
                "SMS sends queue # + wait time",
                "Doctor can be assigned later",
              ].map(t => (
                <div key={t} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 6 }}>
                  <span style={{ color: "#2a9d8f", fontSize: 12, marginTop: 1 }}>·</span>
                  <span style={{ fontSize: 12, color: "#5a6f90", lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
