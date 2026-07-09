import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { patientsApi } from "../lib/api/patients.js";

const SEX_OPTIONS    = ["Male", "Female", "Other"];
const CIVIL_STATUS_OPTIONS = ["Single", "Married", "Widowed", "Separated", "Annulled"];
const BLOOD_TYPE_OPTIONS   = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const labelStyle = { fontSize: 13, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 };
const errStyle   = { fontSize: 12, color: "#CC0000", marginTop: 4 };
const inputBase  = (focused, hasErr) => ({
  width: "100%", padding: "11px 14px",
  border: `1.5px solid ${hasErr ? "#CC0000" : focused ? "#2a9d8f" : "#e0e7ef"}`,
  borderRadius: 11, fontSize: 14, color: "#1e2d40", outline: "none",
  background: "white", transition: "border-color 0.2s", boxSizing: "border-box",
});

function Input({ label, placeholder, value, onChange, type = "text", required, error, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color: "#CC0000", marginLeft: 4 }}>*</span>}</label>
      <div style={{ position: "relative" }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          disabled={disabled}
          style={{ ...inputBase(focused, !!error), background: disabled ? "#f4f7fb" : "white" }} 
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
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

export default function EditPatientModal({ patientId, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const [form, setForm]       = useState({});
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    patientsApi.getOne(patientId)
      .then(data => {
        // Parse dates safely
        const dob = data.date_of_birth ? new Date(data.date_of_birth).toISOString().split('T')[0] : "";
        
        // Find contacts
        const phone = data.contacts?.find(c => c.type === "phone")?.value || "";
        const email = data.contacts?.find(c => c.type === "email")?.value || "";

        setForm({
          first_name: data.first_name || "",
          middle_name: data.middle_name || "",
          last_name: data.last_name || "",
          suffix: data.suffix || "",
          date_of_birth: dob,
          sex_name: data.sex || "",
          civil_status_name: data.civil_status || "",
          blood_type_code: data.blood_type || "",
          philhealth_no: data.philhealth_no || "",
          emergency_contact: data.emergency_contact || "",
          phone,
          email,
          street: data.street || "",
          barangay: data.barangay || "",
          municipality: data.municipality || "Angono",
          province: data.province || "Rizal",
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [patientId]);

  const handleChange = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const handleSubmit = async () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = "Required";
    if (!form.last_name.trim()) errs.last_name = "Required";
    if (!form.date_of_birth) errs.date_of_birth = "Required";
    if (!form.sex_name) errs.sex_name = "Required";
    if (!form.civil_status_name) errs.civil_status_name = "Required";
    if (!form.barangay.trim()) errs.barangay = "Required";
    if (!form.phone.trim()) errs.phone = "Required";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        suffix: form.suffix,
        date_of_birth: form.date_of_birth,
        sex_name: form.sex_name,
        civil_status_name: form.civil_status_name,
        blood_type_code: form.blood_type_code,
        philhealth_no: form.philhealth_no,
        emergency_contact: form.emergency_contact,
        address: {
          street: form.street,
          barangay: form.barangay,
          municipality: form.municipality,
          province: form.province,
        },
        phone: form.phone,
      };

      await patientsApi.update(patientId, payload);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.5)", zIndex: 300, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "white", width: 700, maxHeight: "90vh", borderRadius: 20, display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <style>{`@keyframes popIn { from{transform:scale(0.95);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
        
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTopLeftRadius: 20, borderTopRightRadius: 20, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>Edit Patient Record</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Update demographic and contact info</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyItems: "center" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>
          {error && (
            <div style={{ background: "#fde8e0", color: "#CC0000", padding: "12px 16px", borderRadius: 10, fontSize: 14, fontWeight: 500, border: "1px solid #f5c8b0" }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#8a9bb0" }}>Loading patient data...</div>
          ) : (
            <>
              {/* Demographics */}
              <div>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#1e2d40", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 28, height: 28, background: "#e8f7f5", color: "#2a9d8f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>1</span>
                  Personal Details
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
                  <Input label="First Name" value={form.first_name} onChange={v => handleChange("first_name", v)} required error={errors.first_name} />
                  <Input label="Last Name" value={form.last_name} onChange={v => handleChange("last_name", v)} required error={errors.last_name} />
                  <Input label="Middle Name" value={form.middle_name} onChange={v => handleChange("middle_name", v)} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                    <Input label="Suffix" placeholder="Jr, Sr" value={form.suffix} onChange={v => handleChange("suffix", v)} />
                    <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={v => handleChange("date_of_birth", v)} required error={errors.date_of_birth} />
                  </div>
                  <Select label="Sex at Birth" value={form.sex_name} onChange={v => handleChange("sex_name", v)} options={SEX_OPTIONS} required error={errors.sex_name} />
                  <Select label="Civil Status" value={form.civil_status_name} onChange={v => handleChange("civil_status_name", v)} options={CIVIL_STATUS_OPTIONS} required error={errors.civil_status_name} />
                  <Select label="Blood Type" value={form.blood_type_code} onChange={v => handleChange("blood_type_code", v)} options={BLOOD_TYPE_OPTIONS} />
                  <Input label="PhilHealth No." value={form.philhealth_no} onChange={v => handleChange("philhealth_no", v)} placeholder="xx-xxxxxxxxx-x" />
                </div>
              </div>

              {/* Contact & Address */}
              <div>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#1e2d40", display: "flex", alignItems: "center", gap: 8, paddingTop: 20, borderTop: "1px solid #e8edf7" }}>
                  <span style={{ width: 28, height: 28, background: "#e8f7f5", color: "#2a9d8f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>2</span>
                  Address & Contact
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
                  <Input label="Phone Number" value={form.phone} onChange={v => handleChange("phone", v)} required error={errors.phone} placeholder="09xxxxxxxxx" />
                  <Input label="Emergency Contact" value={form.emergency_contact} onChange={v => handleChange("emergency_contact", v)} placeholder="Name & Number" />
                  
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Input label="Street / Purok" value={form.street} onChange={v => handleChange("street", v)} />
                  </div>
                  <Input label="Barangay" value={form.barangay} onChange={v => handleChange("barangay", v)} required error={errors.barangay} />
                  <Input label="Municipality" value={form.municipality} onChange={v => handleChange("municipality", v)} disabled />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", background: "#f8f9fc", borderTop: "1px solid #e8edf7", display: "flex", justifyContent: "flex-end", gap: 12, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
          <button onClick={onClose} disabled={saving} style={{ background: "white", border: "1px solid #e0e7ef", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, color: "#4a5d75", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving || loading} style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 700, color: "white", cursor: saving || loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(42,157,143,0.3)" }}>
            {saving ? "Saving..." : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
