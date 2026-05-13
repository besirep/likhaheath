// ── Individual validators ─────────────────────────────────────────────────────

// PH mobile: 09XXXXXXXXX or +639XXXXXXXXX
export const isValidPHMobile = (v) => /^(09|\+639)\d{9}$/.test(v.trim());

// PhilHealth: 12 digits (strip dashes/spaces)
export const isValidPhilHealth = (v) => /^\d{12}$/.test(v.replace(/[-\s]/g, ''));

// Name fields: letters, spaces, hyphens, apostrophes, periods only
export const isValidName = (v) => /^[a-zA-ZÀ-ÿ\s'\-\.]+$/.test(v.trim());

// Email: standard format
export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// DOB: must be in the past, not older than 150 years
export const isValidDOB = (v) => {
  if (!v) return false;
  const d = new Date(v);
  const now = new Date();
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
// Fields: firstName, lastName, suffix, dob, sex, civilStatus, nationality,
//         occupation, bloodType, philhealthNo
export function validateStep0(f) {
  const errs = {};
  if (!f.firstName.trim())            errs.firstName    = 'Required';
  else if (!isValidName(f.firstName)) errs.firstName    = 'Letters only';
  if (!f.lastName.trim())             errs.lastName     = 'Required';
  else if (!isValidName(f.lastName))  errs.lastName     = 'Letters only';
  if (f.suffix && !['Jr', 'Sr', 'III', 'IV', 'V'].includes(f.suffix))
                                      errs.suffix       = 'Invalid suffix';
  if (!f.dob)                         errs.dob          = 'Required';
  else if (!isValidDOB(f.dob))        errs.dob          = 'Invalid date';
  if (!f.sex)                         errs.sex          = 'Required';
  if (!f.civilStatus)                 errs.civilStatus  = 'Required';
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
// Fields: reason, reasonOther
export function validateStep2(f) {
  const errs = {};
  if (!f.reason)                       errs.reason      = 'Select a reason';
  if (f.reason === 'Other' && !f.reasonOther.trim())
                                       errs.reasonOther = 'Please specify';
  return errs;
}
