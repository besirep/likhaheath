// ── Individual validators ─────────────────────────────────────────────────────

// PH mobile: 09XXXXXXXXX or +639XXXXXXXXX
export const isValidPHMobile = (v) => /^(09|\+639)\d{9}$/.test(v.trim());

// PhilHealth: 12 digits (strip dashes/spaces)
export const isValidPhilHealth = (v) => /^\d{12}$/.test(v.replace(/[-\s]/g, ''));

// Name fields: letters, spaces, hyphens, apostrophes, periods only
export const isValidName = (v) => /^[a-zA-ZÀ-ÿ\s'\-\.]+$/.test(v.trim());

// Middle name: same rules as name but entirely optional
export const isValidMiddleName = (v) => !v || !v.trim() || isValidName(v);

// Email: standard format
export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// DOB: must be in the past, not older than 150 years
export const isValidDOB = (v) => {
  if (!v) return false;
  const d = new Date(v + 'T00:00:00'); // force local timezone interpretation
  const now = new Date();
  now.setHours(0, 0, 0, 0); // compare dates only
  const minDate = new Date();
  minDate.setFullYear(now.getFullYear() - 150);
  return d < now && d > minDate;
};

// Compute age from DOB string
export const getAge = (dob) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

// ── Step validators ───────────────────────────────────────────────────────────

// Step 0 — Personal Info
// Fields: firstName, middleName?, lastName, suffix, dob, sex, civilStatus, nationality,
//         occupation, bloodType, philhealthNo
export function validateStep0(f) {
  const errs = {};
  if (!f.firstName.trim())                  errs.firstName    = 'Required';
  else if (!isValidName(f.firstName))        errs.firstName    = 'Letters only';
  if (!isValidMiddleName(f.middleName))      errs.middleName   = 'Letters only';
  if (!f.lastName.trim())                    errs.lastName     = 'Required';
  else if (!isValidName(f.lastName))         errs.lastName     = 'Letters only';
  if (f.suffix && !['II', 'Jr', 'Sr', 'III', 'IV', 'V', '2nd', '3rd'].includes(f.suffix))
                                             errs.suffix       = 'Invalid suffix';
  if (!f.dob)                                errs.dob          = 'Required';
  else if (!isValidDOB(f.dob))               errs.dob          = 'Invalid date';
  if (!f.sex)                                errs.sex          = 'Required';
  if (!f.civilStatus)                        errs.civilStatus  = 'Required';
  if (f.philhealthNo && !isValidPhilHealth(f.philhealthNo))
                                             errs.philhealthNo = '12 digits required';
  return errs;
}

// Step 1 — Address & Contact
// Fields: street, barangay, municipality, province, phone, email,
//         emergencyContact
export function validateStep1(f) {
  const errs = {};
  if (!f.barangay.trim())              errs.barangay    = 'Required';
  if (!f.municipality.trim())          errs.municipality = 'Required';
  if (!f.province.trim())              errs.province    = 'Required';
  if (!f.phone.trim())                 errs.phone       = 'Required';
  else if (!isValidPHMobile(f.phone))  errs.phone       = 'Use 09XXXXXXXXX format';
  if (f.email && !isValidEmail(f.email))
                                       errs.email       = 'Invalid email';
  return errs;
}

// Step 2 — Visit Details
// Fields: reasons (array), reasonOther
export function validateStep2(f) {
  const errs = {};
  const reasons = f.reasons || [];
  if (reasons.length === 0)            errs.reasons     = 'Select at least one reason';
  if (reasons.includes('Other') && !f.reasonOther.trim())
                                       errs.reasonOther = 'Please specify';
  return errs;
}

// Step 3 — Vitals (all fields required, with range checks)
export function validateStep3(f) {
  const errs = {};
  const v = f.vitals || {};

  // Blood pressure: required + format check (e.g. 120/80)
  if (!v.bp?.trim()) {
    errs['vitals.bp'] = 'Blood Pressure is required';
  } else if (!/^\d{2,3}\/\d{2,3}$/.test(v.bp.trim())) {
    errs['vitals.bp'] = 'Use format: 120/80';
  }

  // Temperature: required + plausible range
  if (!v.temp) {
    errs['vitals.temp'] = 'Temperature is required';
  } else if (Number(v.temp) < 30 || Number(v.temp) > 45) {
    errs['vitals.temp'] = 'Enter a value between 30–45 °C';
  }

  // Heart rate: required + plausible range
  if (!v.hr) {
    errs['vitals.hr'] = 'Heart Rate is required';
  } else if (Number(v.hr) < 20 || Number(v.hr) > 300) {
    errs['vitals.hr'] = 'Enter a value between 20–300 bpm';
  }

  // SpO2: required + plausible range
  if (!v.spo2) {
    errs['vitals.spo2'] = 'SpO₂ is required';
  } else if (Number(v.spo2) < 50 || Number(v.spo2) > 100) {
    errs['vitals.spo2'] = 'Enter a value between 50–100%';
  }

  if (!v.weight) errs['vitals.weight'] = 'Weight is required';
  if (!v.height) errs['vitals.height'] = 'Height is required';

  return errs;
}
// Step 5 — Medical & Social History (all optional — can be skipped)
// Fields: medical_history (checkbox object), female_health (object for females),
//         pediatric_vitals (object for age ≤ 24 months), general_survey
export function validateStep5(f) {
  const errs = {};
  const mh = f.medical_history || {};

  // Pediatric measurements — if section is shown (age ≤ 24 months),
  // values must be plausible if entered
  const pv = f.pediatric_vitals || {};
  if (pv.length_cm       && (Number(pv.length_cm)       < 20 || Number(pv.length_cm)       > 120)) errs['pv.length_cm']       = 'Enter 20–120 cm';
  if (pv.head_circ       && (Number(pv.head_circ)       < 20 || Number(pv.head_circ)       > 60))  errs['pv.head_circ']       = 'Enter 20–60 cm';
  if (pv.muac_cm         && (Number(pv.muac_cm)         < 5  || Number(pv.muac_cm)         > 20))  errs['pv.muac_cm']         = 'Enter 5–20 cm';

  // Female health — LMP must be in the past if provided
  const fh = f.female_health || {};
  if (fh.lmp) {
    const lmpDate = new Date(fh.lmp + 'T00:00:00');
    const today   = new Date(); today.setHours(0,0,0,0);
    if (lmpDate > today) errs['fh.lmp'] = 'LMP cannot be a future date';
  }

  return errs;
}
