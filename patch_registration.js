/**
 * patch_registration.js  (CRLF-aware)
 * Patches PatientRegistration.jsx with all medical history + middle name changes.
 */
const fs   = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'client/src/screens/receptionist/PatientRegistration.jsx');

let c = fs.readFileSync(FILE, 'utf8');
// Normalise to LF for matching, we'll restore CRLF at the end
const hasCRLF = c.includes('\r\n');
c = c.replace(/\r\n/g, '\n');
const orig = c;

function replace(from, to, required = true) {
  if (!c.includes(from)) {
    if (required) throw new Error(`PATCH FAILED — not found:\n${from.substring(0, 150)}`);
    console.warn(`⚠ Skipped (already applied?): ${from.substring(0,80)}`);
    return;
  }
  c = c.replace(from, to);
}

// ── 1. Imports ───────────────────────────────────────────────────────────────
replace(
  `import { Check, ClipboardList, Smartphone, Heart, Thermometer, Activity, Wind, Scale, Ruler, UserRound, Baby } from "lucide-react";`,
  `import { Check, ClipboardList, Smartphone, Heart, Thermometer, Activity, Wind, Scale, Ruler, UserRound, Baby, FileText } from "lucide-react";`
);
replace(
  `import { getAge, validateStep0, validateStep1, validateStep2, validateStep3 } from "../../lib/validation/patientValidation.js";`,
  `import { getAge, validateStep0, validateStep1, validateStep2, validateStep3, validateStep5 } from "../../lib/validation/patientValidation.js";`
);

// ── 2. emptyForm ─────────────────────────────────────────────────────────────
replace(
  `const emptyForm = {\n  existingPatientId: null,          // null = new patient, number = returning\n  firstName: "", lastName: "", suffix: "", dob: "", sex: "",\n  civilStatus: "", bloodType: "", nationality: "Filipino", occupation: "",\n  philhealthNo: "", emergencyContact: "",\n  street: "", barangay: "", municipality: "Angono", province: "Rizal",\n  phone: "", email: "",\n  reasons: [], doctor: "", reasonOther: "",\n  vitals: { bp: "", temp: "", hr: "", spo2: "", weight: "", height: "" },\n  priority: null, sendSms: true, notes: "",\n};`,
  `const emptyForm = {\n  existingPatientId: null,          // null = new patient, number = returning\n  firstName: "", middleName: "", lastName: "", suffix: "", dob: "", sex: "",\n  civilStatus: "", bloodType: "", nationality: "Filipino", occupation: "",\n  philhealthNo: "", emergencyContact: "",\n  street: "", barangay: "", municipality: "Angono", province: "Rizal",\n  phone: "", email: "",\n  reasons: [], doctor: "", reasonOther: "",\n  vitals: { bp: "", temp: "", hr: "", spo2: "", weight: "", height: "" },\n  // Step 4 — Medical & Social History (all optional)\n  medical_history: {\n    has_hypertension: false, has_heart_disease: false, has_diabetes: false,\n    has_stroke: false, has_asthma: false, has_tuberculosis: false,\n    has_copd: false, has_allergies: false, has_smoking_hx: false,\n    has_none: false, other_conditions: "",\n    social_smoking: null, social_alcohol: null, general_survey: "",\n  },\n  female_health: {\n    no_of_children: "", lmp: "", period_duration_days: "",\n    cycle_length_days: "", fp_method: "", menopausal_age: "",\n  },\n  pediatric_vitals: {\n    length_cm: "", head_circ: "", skinfold: "",\n    body_circ: "", waist_cm: "", hip_cm: "", limbs_cm: "", muac_cm: "",\n  },\n  priority: null, sendSms: true, notes: "",\n};`
);

// ── 3. StepBar ───────────────────────────────────────────────────────────────
replace(
  `  const steps = ["Personal Info", "Address & Contact", "Visit Details", "Vitals", "Priority & SMS"];`,
  `  const steps = ["Personal Info", "Address & Contact", "Visit Details", "Vitals", "Medical History", "Priority & SMS"];`
);
replace(
  `    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>`,
  `    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28, flexWrap: "wrap", rowGap: 8 }}>`
);
replace(
  `                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,`,
  `                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,`
);
replace(
  `                fontSize: 14, fontWeight: 700, color: isComplete || isActive ? "white" : "#8a9bb0",`,
  `                fontSize: 12, fontWeight: 700, color: isComplete || isActive ? "white" : "#8a9bb0",`
);
replace(
  `              }}>{isComplete ? <Check size={16} strokeWidth={3} /> : i + 1}</div>\n              <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? "#1e2d40" : "#8a9bb0", whiteSpace: "nowrap" }}>{s}</span>`,
  `              }}>{isComplete ? <Check size={14} strokeWidth={3} /> : i + 1}</div>\n              <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? "#1e2d40" : "#8a9bb0", whiteSpace: "nowrap" }}>{s}</span>`
);
replace(
  `              <div style={{ flex: 1, height: 2, background: i < step ? "#2a9d8f" : "#e8edf7", margin: "0 10px", transition: "background 0.3s" }} />`,
  `              <div style={{ flex: 1, height: 2, background: i < step ? "#2a9d8f" : "#e8edf7", margin: "0 6px", transition: "background 0.3s", minWidth: 10 }} />`
);

// ── 4. Subtitle ──────────────────────────────────────────────────────────────
replace(
  `               "New patient registration · 4-step form"}`,
  `               "New patient registration · 6-step form"}`
);

// ── 5. tryAdvance ─────────────────────────────────────────────────────────────
replace(
  `    if (step === 0) errs = validateStep0(form);\n    else if (step === 1) errs = validateStep1(form);\n    else if (step === 2) errs = validateStep2(form);\n    else if (step === 3) errs = validateStep3(form);\n    setErrors(errs);`,
  `    if (step === 0) errs = validateStep0(form);\n    else if (step === 1) errs = validateStep1(form);\n    else if (step === 2) errs = validateStep2(form);\n    else if (step === 3) errs = validateStep3(form);\n    else if (step === 4) errs = validateStep5(form);  // medical history step (all optional)\n    setErrors(errs);`
);
replace(
  `    if (Object.keys(errs).length === 0) {\n      // Returning patients: skip address/contact step (step 1) and jump to visit details, then vitals, then priority\n      if (isReturning && step === 2) setStep(3);\n      else setStep(s => s + 1);\n    }`,
  `    if (Object.keys(errs).length === 0) {\n      // Returning patients: skip step 1 (address) and step 4 (medical history)\n      if (isReturning && step === 2) setStep(3);\n      else if (isReturning && step === 3) setStep(5);\n      else setStep(s => s + 1);\n    }`
);

// ── 6. handleSubmit payload ───────────────────────────────────────────────────
replace(
  `        const payload = {\n          first_name: form.firstName, last_name: form.lastName, suffix: form.suffix || null,`,
  `        // Build medical/female payloads only if user entered something\n        const mh = form.medical_history;\n        const hasMH = mh && (mh.has_hypertension || mh.has_heart_disease || mh.has_diabetes ||\n          mh.has_stroke || mh.has_asthma || mh.has_tuberculosis || mh.has_copd ||\n          mh.has_allergies || mh.has_smoking_hx || mh.has_none || mh.other_conditions?.trim() ||\n          mh.social_smoking != null || mh.social_alcohol != null || mh.general_survey);\n        const fh = form.female_health;\n        const hasFH = form.sex === 'Female' && fh && (\n          fh.no_of_children || fh.lmp || fh.period_duration_days ||\n          fh.cycle_length_days || fh.fp_method || fh.menopausal_age);\n        const pv = form.pediatric_vitals;\n        const pvPayload = Object.values(pv || {}).some(Boolean) ? {\n          length_cm:             pv.length_cm  ? Number(pv.length_cm)  : null,\n          head_circumference_cm: pv.head_circ  ? Number(pv.head_circ)  : null,\n          skinfold_thickness_cm: pv.skinfold   ? Number(pv.skinfold)   : null,\n          body_circumference_cm: pv.body_circ  ? Number(pv.body_circ)  : null,\n          waist_cm:              pv.waist_cm   ? Number(pv.waist_cm)   : null,\n          hip_cm:                pv.hip_cm     ? Number(pv.hip_cm)     : null,\n          limbs_cm:              pv.limbs_cm   ? Number(pv.limbs_cm)   : null,\n          muac_cm:               pv.muac_cm    ? Number(pv.muac_cm)    : null,\n        } : null;\n        const payload = {\n          first_name: form.firstName, middle_name: form.middleName || null,\n          last_name: form.lastName, suffix: form.suffix || null,`
);
replace(
  `          ...visitPayload,\n        };\n        ({ queue_number } = await patientsApi.create(payload));`,
  `          ...(hasMH ? { medical_history: mh } : {}),\n          ...(hasFH ? { female_health: fh } : {}),\n          ...visitPayload,\n          vitals: { ...vitalsPayload, ...(pvPayload || {}) },\n        };\n        ({ queue_number } = await patientsApi.create(payload));`
);

// ── 7. Step 0 — middle name field ────────────────────────────────────────────
replace(
  `    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: 14 }}>\n      <Input label="First Name" placeholder="Given name" value={form.firstName} onChange={v => update("firstName", v)} required error={errors.firstName} />\n      <Input label="Last Name" placeholder="Surname" value={form.lastName} onChange={v => update("lastName", v)} required error={errors.lastName} />\n      <Select label="Suffix" value={form.suffix} onChange={v => update("suffix", v)} options={["II", "Jr", "Sr", "III", "IV", "V", "2nd", "3rd"]} error={errors.suffix} />\n    </div>`,
  `    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 80px", gap: 14 }}>\n      <Input label="First Name" placeholder="Given name" value={form.firstName} onChange={v => update("firstName", v)} required error={errors.firstName} />\n      <Input label="Middle Name" placeholder="Optional" value={form.middleName} onChange={v => update("middleName", v)} error={errors.middleName} />\n      <Input label="Last Name" placeholder="Surname" value={form.lastName} onChange={v => update("lastName", v)} required error={errors.lastName} />\n      <Select label="Suffix" value={form.suffix} onChange={v => update("suffix", v)} options={["II", "Jr", "Sr", "III", "IV", "V", "2nd", "3rd"]} error={errors.suffix} />\n    </div>`
);

// ── 8. Preview card name display ─────────────────────────────────────────────
replace(
  `        <div>\n          <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40" }}>{fullName}{form.suffix ? \` \${form.suffix}\` : ""}</div>`,
  `        <div style={{ flex: 1 }}>\n          <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40" }}>{form.firstName}{form.middleName ? \` \${form.middleName}\` : ""} {form.lastName}{form.suffix ? \` \${form.suffix}\` : ""}</div>`
);

// ── 9. Insert Step 4 JSX block ───────────────────────────────────────────────
const STEP4 = `{/* Step 4 — Medical & Social History */}
{step === 4 && (() => {
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
    border:\`1.5px solid \${active?"#0047AB":"#e0e7ef"}\`,
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
          style={{ width:"100%", padding:"9px 40px 9px 12px", border:\`1.5px solid \${errors[\`pv.\${key}\`]?"#CC0000":"#e0e7ef"}\`, borderRadius:10, fontSize:14, color:"#1e2d40", outline:"none", boxSizing:"border-box" }}
          onFocus={e=>e.target.style.borderColor="#0047AB"} onBlur={e=>e.target.style.borderColor=errors[\`pv.\${key}\`]?"#CC0000":"#e0e7ef"} />
        <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"#8a9bb0" }}>cm</span>
      </div>
      {errors[\`pv.\${key}\`]&&<div style={errStyle}>{errors[\`pv.\${key}\`]}</div>}
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
              <div style={{ width:18,height:18,borderRadius:5,border:\`2px solid \${mh[key]?"#0047AB":"#c0cfe0"}\`,background:mh[key]?"#0047AB":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
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
`;

replace(
  `{/* Step 4 — Priority & SMS */}\n{step === 4 && (`,
  STEP4 + `{/* Step 5 — Priority & SMS */}\n{step === 5 && (`
);

// ── 10. Back button ───────────────────────────────────────────────────────────
replace(
  `  <button onClick={() => setStep(s => s === 0 ? -1 : isReturning && s === 3 ? 2 : s - 1)}`,
  `  <button onClick={() => setStep(s => s === 0 ? -1 : isReturning && s === 3 ? 2 : isReturning && s === 5 ? 3 : s - 1)}`
);

// ── 11. Continue button ───────────────────────────────────────────────────────
replace(
  `  {step < 4 ? (\n    <button onClick={tryAdvance} style={{\n      flex: 1, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "12px",\n      fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.3)", transition: "all 0.2s",\n    }}>{step === 3 ? "Continue to Priority →" : "Continue →"}</button>`,
  `  {step < 5 ? (\n    <button onClick={tryAdvance} style={{\n      flex: 1, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "12px",\n      fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.3)", transition: "all 0.2s",\n    }}>{step === 4 ? "Continue to Priority →" : step === 3 ? "Continue to Medical History →" : "Continue →"}</button>`
);

// ── Write back (restore CRLF if needed) ──────────────────────────────────────
const final = hasCRLF ? c.replace(/\n/g, '\r\n') : c;
fs.writeFileSync(FILE, final, 'utf8');
console.log('✅ PatientRegistration.jsx patched successfully!');
console.log(`   Size: ${orig.length} → ${c.length} bytes (+${c.length - orig.length})`);
