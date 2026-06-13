import React, { useState, useEffect } from "react";
import { Clock, Printer, X, ClipboardList, Thermometer, Heart, Activity, Wind, Scale, Check, Plus, Calendar } from "lucide-react";
import { patientsApi } from "../../lib/api/patients.js";
import { queueApi } from "../../lib/api/queue.js";
import DoctorPatientRecords from "./DoctorPatientRecords.jsx";

// -- Static Maps
const bpFlag   = bp => { if (!bp || bp === "null") return "normal"; const s = Number(String(bp).split("/")[0]); return s >= 140 ? "high" : s < 90 ? "low" : "normal"; };
const tempFlag = v  => { if (!v || v === "null")  return "normal"; const n = Number(v); return n >= 37.8 ? "high" : n < 36 ? "low" : "normal"; };
const spo2Flag = v  => (!v || v === "null") ? "normal" : Number(v) < 95 ? "low" : "normal";
const flagColor = { high: "#CC0000", low: "#c04080", normal: "#0047AB" };
const flagBg    = { high: "#fdeee8", low: "#fce8f0", normal: "#EBF0FA" };

function Avatar({ name, size = 36 }) {
  const safeName = name || "?";
  const initials = safeName.split(" ").map(n => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "?";
  const hue = (safeName.charCodeAt(0) * 41 + (safeName.charCodeAt(1) || 0) * 19) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue || 0},40%,75%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: `hsl(${hue || 0},40%,28%)`, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// Format seconds into MM:SS
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const LAB_TESTS = [
  "Urinalysis", "CBC", "Fecalysis", "Blood Typing", "Platelet Count", 
  "HGB HCT", "HBA1C", "Malaria Smear", "Peripheral Blood Smear", "Dengue NS1", "Smear",
  "FBS", "ECG", "2D ECHO", "URIC ACID", "BUN", "Creatinine", "Cholesterol", "Lipid Profile",
  "Ca+", "K+", "Na+", "SGPT", "SGOT", "Chest X-ray", "UTZ"
];

export default function ActiveConsultationScreen({ patient, onSave, onCancel, saving, onNavigate }) {
  const [timer, setTimer] = useState(0);
  const [visits, setVisits] = useState([]);
  const [patientData, setPatientData] = useState(null);
  const [showFullRecord, setShowFullRecord] = useState(false);
  
  const [form, setForm] = useState({
    hpi: patient?.visitReason || "",
    diagnosis: "",
    treatment: "",
    labResults: "",
    followUpDate: "",
  });

  const [editVitalsMode, setEditVitalsMode] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    bp: patient?.vitals?.bp || "",
    temp: patient?.vitals?.temp || "",
    hr: patient?.vitals?.hr || "",
    spo2: patient?.vitals?.spo2 || "",
    weight: patient?.vitals?.weight || "",
    height: patient?.vitals?.height || ""
  });

  const [showLabModal, setShowLabModal] = useState(false);
  const [labTests, setLabTests] = useState([]);

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Visits
  useEffect(() => {
    if (!patient?.patientId) return;
    patientsApi.getVisits(patient.patientId).then(res => {
      setVisits(res.data || []);
    }).catch(console.error);
  }, [patient?.patientId]);

  // Fetch Full Patient Data for Medical History
  useEffect(() => {
    if (!patient?.patientId) return;
    patientsApi.getOne(patient.patientId).then(res => {
      setPatientData(res.data || null);
    }).catch(console.error);
  }, [patient?.patientId]);

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = () => {
    if (!form.treatment.trim()) {
      alert("Assessment, Diagnosis & Notes are required.");
      return;
    }
    
    if (!window.confirm("Are you sure you want to end and save this consultation?")) return;

    // Extract first line as a summary for the diagnosis column in DB
    const firstLine = form.treatment.trim().split('\n')[0] || "See Notes";

    // Combine HPI and Lab Results into notes if they were changed
    let finalNotes = form.treatment;
    if (form.hpi.trim() || form.labResults.trim()) {
      finalNotes = `HPI / Chief Complaint:\n${form.hpi || "—"}\n\nLaboratory Results:\n${form.labResults || "—"}\n\nClinical Notes & Treatment:\n${form.treatment}`;
    }

    // Build the labs array
    const requestedLabs = labTests.map(name => ({ name, results: {} }));

    onSave({
      appointmentId: patient.appointmentId,
      patientId:     patient.patientId,
      diagnosis:     firstLine,
      treatment:     finalNotes,
      notes:         "", // Storing everything in treatment for now as per previous schema
      labs:          requestedLabs,
      vitals:        vitalsForm,
      followUpDate:  form.followUpDate,
    });
  };

  const handlePrintConsultation = () => {
    const html = `<html><body style="font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h4 style="margin:0;font-weight:normal">REPUBLIC OF THE PHILIPPINES<br/>PROVINCE OF RIZAL<br/>MUNICIPALITY OF ANGONO</h4>
        <h3 style="margin:10px 0 0 0;">MUNICIPAL HEALTH OFFICE</h3>
      </div>
      <h2 style="text-align:center; font-style: italic; margin-bottom: 30px;">Consultation Record</h2>
      
      <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
        <div>Date: <span style="border-bottom: 1px solid black; display: inline-block; width: 150px; text-align:center;">${new Date().toLocaleDateString()}</span></div>
      </div>
      
      <div style="margin-bottom: 10px;">
        NAME: <span style="border-bottom: 1px solid black; display: inline-block; width: 400px; padding-left: 10px;">${patient.name}</span>
      </div>
      <div style="display: flex; gap: 10px; margin-bottom: 30px;">
        <div style="flex:1">ADD: <span style="border-bottom: 1px solid black; display: inline-block; width: 80%;">—</span></div>
        <div>Age: <span style="border-bottom: 1px solid black; display: inline-block; width: 50px; text-align:center;">${patient.age}</span></div>
        <div>Sex: <span style="border-bottom: 1px solid black; display: inline-block; width: 50px; text-align:center;">${patient.sex}</span></div>
      </div>

      <div style="margin-bottom: 20px;">
        <div style="font-weight:bold; margin-bottom:5px;">HPI / Chief Complaint:</div>
        <div style="padding-left:10px; min-height: 40px;">${form.hpi || "—"}</div>
      </div>
      <div style="margin-bottom: 20px;">
        <div style="font-weight:bold; margin-bottom:5px;">Laboratory Results:</div>
        <div style="padding-left:10px; white-space: pre-wrap;">${form.labResults || "—"}</div>
      </div>
      <div style="margin-bottom: 40px;">
        <div style="font-weight:bold; margin-bottom:5px;">Assessment, Diagnosis & Treatment:</div>
        <div style="padding-left:10px; white-space: pre-wrap;">${form.treatment || "—"}</div>
      </div>

      <div style="margin-top: 80px; text-align: right;">
        <div style="display: inline-block; text-align: center;">
          <div style="border-bottom: 1px solid black; width: 250px; margin-bottom: 5px;"></div>
          <div>RODOLFO S. NARCISO JR., MD</div>
          <div>MUNICIPAL HEALTH OFFICER</div>
          <div>LIC. NO. 0101763</div>
        </div>
      </div>
    </body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const win = iframe.contentWindow;
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
      setTimeout(() => { document.body.removeChild(iframe); }, 1000);
    }, 400);
  };

  const handlePrintLab = () => {
    // Create the HTML for the lab checkboxes
    let checkboxesHtml = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">`;
    LAB_TESTS.forEach(test => {
      const isChecked = labTests.includes(test);
      checkboxesHtml += `
        <div style="display: flex; alignItems: center; gap: 8px;">
          <div style="width: 14px; height: 14px; border: 1px solid black; display: inline-block; text-align: center; line-height: 14px;">
            ${isChecked ? "✔" : ""}
          </div>
          <span>${test}</span>
        </div>
      `;
    });
    checkboxesHtml += `</div>`;

    const html = `<html><body style="font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h4 style="margin:0;font-weight:normal">REPUBLIC OF THE PHILIPPINES<br/>PROVINCE OF RIZAL<br/>MUNICIPALITY OF ANGONO</h4>
        <h3 style="margin:10px 0 0 0;">MUNICIPAL HEALTH OFFICE</h3>
      </div>
      <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
        <div>Date: <span style="border-bottom: 1px solid black; display: inline-block; width: 150px; text-align:center;">${new Date().toLocaleDateString()}</span></div>
      </div>
      <div style="margin-bottom: 10px;">
        NAME: <span style="border-bottom: 1px solid black; display: inline-block; width: 400px; padding-left: 10px;">${patient.name}</span>
      </div>
      <div style="display: flex; gap: 10px; margin-bottom: 30px;">
        <div style="flex:1">ADD: <span style="border-bottom: 1px solid black; display: inline-block; width: 80%;">—</span></div>
        <div>Age: <span style="border-bottom: 1px solid black; display: inline-block; width: 50px; text-align:center;">${patient.age}</span></div>
        <div>Sex: <span style="border-bottom: 1px solid black; display: inline-block; width: 50px; text-align:center;">${patient.sex}</span></div>
      </div>
      
      <h2 style="text-align:center; font-style: italic; margin-bottom: 30px;">Laboratory</h2>
      
      ${checkboxesHtml}
      
      <div style="margin-top: 100px; text-align: right;">
        <div style="display: inline-block; text-align: center;">
          <div style="border-bottom: 1px solid black; width: 250px; margin-bottom: 5px;"></div>
          <div>RODOLFO S. NARCISO JR., MD</div>
          <div>MUNICIPAL HEALTH OFFICER</div>
          <div>LIC. NO. 0101763</div>
        </div>
      </div>
    </body></html>`;
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const win = iframe.contentWindow;
    win.document.write(html);
    win.document.close();

    // Give it time to render the DOM before calling print
    setTimeout(() => {
      win.focus();
      win.print();
      setShowLabModal(false);

      // Auto-populate labResults text area for easy editing
      let newLabText = form.labResults ? form.labResults + "\n" : "";
      if (labTests.length > 0) {
        newLabText += "--- Pending Lab Results ---\n";
        labTests.forEach(t => newLabText += `${t}:\n`);
      }
      setF("labResults", newLabText);
      
      setTimeout(() => { document.body.removeChild(iframe); }, 1000);
    }, 400);
  };

  const v = vitalsForm;
  const bmi = v?.weight && v?.height && v.weight !== "null" && v.height !== "null"
    ? (Number(v.weight) / Math.pow(Number(v.height) / 100, 2)).toFixed(1)
    : null;

  const renderVitalInput = (value, onChange, placeholder, unit, type="text", step) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input 
        className="vital-input"
        type={type} step={step} value={value} onChange={onChange} placeholder={placeholder}
        style={{ 
          width: 80, 
          padding: "6px 8px", 
          borderRadius: 8, 
          border: "1.5px solid #c0d4f0", 
          textAlign: "right", 
          fontSize: 14, 
          fontWeight: 700, 
          outline: "none", 
          color: "#0047AB", 
          background: "white",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)",
          transition: "border-color 0.2s"
        }} 
        onFocus={e => e.target.style.borderColor = "#0047AB"}
        onBlur={e => e.target.style.borderColor = "#c0d4f0"}
      />
      <span style={{ fontSize: 12, fontWeight: 700, color: "#8a9bb0", width: 38 }}>{unit}</span>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#f4f7fb", display: "flex", flexDirection: "column", animation: "fadeIn 0.2s ease" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .vital-input::placeholder { color: #cbd5e1; font-weight: 500; }
      `}</style>
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1a2540", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 14, zIndex: 10001, boxShadow: "0 8px 24px rgba(20,40,90,0.28)", animation: "fadeUp 0.3s ease" }}>{toast}</div>}
      
      {/* Top Header */}
      <div style={{ background: "white", padding: "12px 24px", borderBottom: "1px solid #e0e7ef", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "#0047AB", color: "white", padding: "6px 12px", borderRadius: 8, fontWeight: 700, fontSize: 16 }}>
            {patient.queueNumber || "—"}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2540", display: "flex", alignItems: "center", gap: 10 }}>
              {patient.name}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fce8e8", color: "#CC0000", padding: "4px 10px", borderRadius: 20, fontSize: 13 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#CC0000", animation: "pulse 1s infinite" }} />
                {formatTime(timer)}
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#7a8fb0" }}>
              {patient.age} yrs · {form.hpi || patient.visitReason || "Consultation"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handlePrintConsultation} style={{ background: "#EBF0FA", color: "#0047AB", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Printer size={16} /> Print Summary
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{ background: "#0047AB", color: "white", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Check size={16} /> {saving ? "Saving..." : "End Consultation"}
          </button>
          <button onClick={onCancel} style={{ background: "#f0f4fa", color: "#7a8fb0", border: "none", borderRadius: 8, padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        
        {/* Left Sidebar - Patient Context */}
        <div style={{ width: 280, background: "white", borderRight: "1px solid #e0e7ef", display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "24px", textAlign: "center", borderBottom: "1px solid #f0f4fa" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <Avatar name={patient.name} size={64} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a2540" }}>{patient.name}</div>
            <div style={{ fontSize: 12, color: "#9aabc0", marginTop: 4 }}>Patient ID • #{patient.patientId}</div>
          </div>

          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f4fa" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.8 }}>Vitals</div>
              <button 
                onClick={() => setEditVitalsMode(true)} 
                style={{ 
                  background: "#EBF0FA", 
                  border: "none", 
                  color: "#0047AB", 
                  fontSize: 12, 
                  fontWeight: 700, 
                  cursor: "pointer",
                  padding: "6px 14px",
                  borderRadius: 14,
                  transition: "all 0.2s ease"
                }}>
                Edit
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "#7a8fb0", display: "flex", alignItems: "center", gap: 6 }}><Heart size={14} /> BLOOD PRESSURE</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: flagColor[bpFlag(v?.bp)] }}>{v?.bp || "—"} {v?.bp && <span style={{ fontSize: 12, color: "#9aabc0", fontWeight: 600 }}>mmHg</span>}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "#7a8fb0", display: "flex", alignItems: "center", gap: 6 }}><Thermometer size={14} /> TEMPERATURE</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: flagColor[tempFlag(v?.temp)] }}>{v?.temp || "—"} {v?.temp && <span style={{ fontSize: 12, color: "#9aabc0", fontWeight: 600 }}>°C</span>}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "#7a8fb0", display: "flex", alignItems: "center", gap: 6 }}><Activity size={14} /> HEART RATE</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2540" }}>{v?.hr || "—"} {v?.hr && <span style={{ fontSize: 12, color: "#9aabc0", fontWeight: 600 }}>bpm</span>}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "#7a8fb0", display: "flex", alignItems: "center", gap: 6 }}><Wind size={14} /> SPO2</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: flagColor[spo2Flag(v?.spo2)] }}>{v?.spo2 || "—"} {v?.spo2 && <span style={{ fontSize: 12, color: "#9aabc0", fontWeight: 600 }}>%</span>}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "#7a8fb0", display: "flex", alignItems: "center", gap: 6 }}><Scale size={14} /> WEIGHT</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2540" }}>{v?.weight || "—"} {v?.weight && <span style={{ fontSize: 12, color: "#9aabc0", fontWeight: 600 }}>kg</span>}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "#7a8fb0", display: "flex", alignItems: "center", gap: 6 }}><Scale size={14} /> HEIGHT</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2540" }}>{v?.height || "—"} {v?.height && <span style={{ fontSize: 12, color: "#9aabc0", fontWeight: 600 }}>cm</span>}</div>
              </div>
              {bmi && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, paddingTop: 10, borderTop: "1px dashed #e0e7ef" }}>
                  <div style={{ fontSize: 12, color: "#7a8fb0", display: "flex", alignItems: "center", gap: 6 }}>BMI</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: Number(bmi) > 25 ? "#CC0000" : "#1a2540" }}>{bmi}</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: "20px 24px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <button onClick={() => setShowFullRecord(true)} style={{ width: "100%", background: "#EBF0FA", color: "#0047AB", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              View Full Patient Record →
            </button>
          </div>
        </div>

        {/* Center Panel - Form */}
        <div style={{ flex: 1, padding: "24px 40px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>CHIEF COMPLAINT / HPI</div>
            <textarea
              value={form.hpi}
              onChange={e => setF("hpi", e.target.value)}
              placeholder="Record chief complaint and history of present illness..."
              style={{ width: "100%", background: "white", border: "1px solid #e0e7ef", borderRadius: 10, padding: "14px", fontSize: 14, color: "#1a2540", outline: "none", resize: "vertical", minHeight: 80, fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#0047AB"}
              onBlur={e => e.target.style.borderColor = "#e0e7ef"}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>LABORATORY RESULTS</div>
            <textarea
              value={form.labResults}
              onChange={e => setF("labResults", e.target.value)}
              placeholder="Record laboratory results here... (Auto-populated when requesting labs)"
              style={{ width: "100%", background: "white", border: "1px solid #e0e7ef", borderRadius: 10, padding: "14px", fontSize: 14, color: "#1a2540", outline: "none", resize: "vertical", minHeight: 80, fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#0047AB"}
              onBlur={e => e.target.style.borderColor = "#e0e7ef"}
            />
          </div>

          <div style={{ marginBottom: 24, flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>ASSESSMENT, DIAGNOSIS & TREATMENT NOTES</div>
            <textarea
              value={form.treatment}
              onChange={e => setF("treatment", e.target.value)}
              placeholder="Record assessment, diagnosis, findings, and treatment plan..."
              style={{ width: "100%", flex: 1, background: "white", border: "1px solid #e0e7ef", borderRadius: 10, padding: "14px", fontSize: 14, color: "#1a2540", outline: "none", resize: "none", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#0047AB"}
              onBlur={e => e.target.style.borderColor = "#e0e7ef"}
            />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
            <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, background: "white", color: "#0047AB", border: "1px solid #CCDAF0", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <ClipboardList size={16} /> {saving ? "Saving..." : "Add to Records"}
            </button>
            <button onClick={() => setShowLabModal(true)} style={{ flex: 1, background: "white", color: "#2a7d5f", border: "1px solid #bce6d6", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Plus size={16} /> Request Lab
            </button>
            <button onClick={() => setShowFollowUpModal(true)} style={{ flex: 1, background: form.followUpDate ? "#f3ebf9" : "white", color: "#8B5FBF", border: "1px solid #dfcff2", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Calendar size={16} /> {form.followUpDate ? `Follow-up: ${new Date(form.followUpDate).toLocaleDateString()}` : "Schedule Follow-up"}
            </button>
          </div>
        </div>

        {/* Right Sidebar - Past Consultations */}
        <div style={{ width: 280, background: "white", borderLeft: "1px solid #e0e7ef", display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f4fa", fontSize: 12, fontWeight: 700, color: "#9aabc0", textTransform: "uppercase", letterSpacing: 0.8 }}>
            PAST CONSULTATIONS
          </div>
          <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            {visits.length === 0 ? (
              <div style={{ fontSize: 13, color: "#9aabc0", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No previous visits recorded.</div>
            ) : (
              visits.map((visit, i) => (
                <div 
                  key={i} 
                  onClick={() => setShowFullRecord(visit.id)}
                  style={{ 
                    padding: "12px", 
                    borderRadius: "10px", 
                    border: "1px solid #e0e7ef", 
                    cursor: "pointer", 
                    transition: "all 0.2s",
                    background: "#fff"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#0047AB"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,71,171,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e0e7ef"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2540", marginBottom: 4 }}>{visit.diagnosis || visit.reason || "Check-up"}</div>
                  <div style={{ fontSize: 12, color: "#7a8fb0", display: "flex", justifyContent: "space-between" }}>
                    <span>{visit.date?.split(",")[0] || "—"}</span>
                    <span style={{ fontWeight: 500 }}>{visit.doctor ? `Dr. ${visit.doctor.split(' ').pop()}` : "—"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Vitals Modal */}
      {editVitalsMode && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s ease" }}>
          <div style={{ background: "white", borderRadius: 16, width: 450, padding: 30, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: "#1a2540" }}>Edit Patient Vitals</h2>
              <button onClick={() => setEditVitalsMode(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9aabc0" }}><X size={24} /></button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 30 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#4a5d75", display: "flex", alignItems: "center", gap: 8 }}><Heart size={16} /> Blood Pressure</div>
                {renderVitalInput(v.bp, e => setVitalsForm({...v, bp: e.target.value}), "120/80", "mmHg")}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#4a5d75", display: "flex", alignItems: "center", gap: 8 }}><Thermometer size={16} /> Temperature</div>
                {renderVitalInput(v.temp, e => setVitalsForm({...v, temp: e.target.value}), "36.5", "°C", "number", "0.1")}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#4a5d75", display: "flex", alignItems: "center", gap: 8 }}><Activity size={16} /> Heart Rate</div>
                {renderVitalInput(v.hr, e => setVitalsForm({...v, hr: e.target.value}), "80", "bpm", "number")}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#4a5d75", display: "flex", alignItems: "center", gap: 8 }}><Wind size={16} /> SpO2</div>
                {renderVitalInput(v.spo2, e => setVitalsForm({...v, spo2: e.target.value}), "98", "%", "number")}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#4a5d75", display: "flex", alignItems: "center", gap: 8 }}><Scale size={16} /> Weight</div>
                {renderVitalInput(v.weight, e => setVitalsForm({...v, weight: e.target.value}), "65", "kg", "number", "0.1")}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#4a5d75", display: "flex", alignItems: "center", gap: 8 }}><Scale size={16} /> Height</div>
                {renderVitalInput(v.height, e => setVitalsForm({...v, height: e.target.value}), "170", "cm", "number", "0.1")}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setEditVitalsMode(false)} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #e0e7ef", background: "white", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={() => setEditVitalsMode(false)} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#0047AB", color: "white", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <Check size={16} /> Save Vitals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lab Request Modal */}
      {showLabModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 16, width: 600, padding: 30, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: "#1a2540" }}>Laboratory Request</h2>
              <button onClick={() => setShowLabModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9aabc0" }}><X size={24} /></button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20, maxHeight: 400, overflowY: "auto" }}>
              {LAB_TESTS.map(test => (
                <label key={test} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", padding: "4px 0" }}>
                  <input type="checkbox" checked={labTests.includes(test)} onChange={(e) => {
                    if (e.target.checked) setLabTests([...labTests, test]);
                    else setLabTests(labTests.filter(t => t !== test));
                  }} style={{ width: 16, height: 16 }} />
                  {test}
                </label>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowLabModal(false)} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #e0e7ef", background: "white", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={handlePrintLab} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#0047AB", color: "white", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <Printer size={16} /> Print Lab Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 16, width: 400, padding: 30, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: "#1a2540" }}>Schedule Follow-up</h2>
              <button onClick={() => setShowFollowUpModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9aabc0" }}><X size={24} /></button>
            </div>
            <div style={{ marginBottom: 30 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#1a2540", marginBottom: 6, display: "block" }}>Follow-up Date</label>
              <input type="date" value={form.followUpDate} onChange={e => setF("followUpDate", e.target.value)} min={new Date().toISOString().split("T")[0]} style={{ width: "100%", padding: "10px", border: "1px solid #e0e7ef", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowFollowUpModal(false)} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #e0e7ef", background: "white", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={() => {
                if(!form.followUpDate) return;
                setShowFollowUpModal(false);
                showToast(`Follow-up scheduled for ${new Date(form.followUpDate).toLocaleDateString()}`);
              }} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#8B5FBF", color: "white", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <Check size={16} /> Save Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Record Modal Overlay */}
      {showFullRecord && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "white", display: "flex", flexDirection: "column" }}>
          <div style={{ background: "#f0f4fa", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #dde8e5" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a2540" }}>Full Patient Record: {patient.name}</div>
            <button onClick={() => setShowFullRecord(false)} style={{ background: "white", border: "1px solid #CCDAF0", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "#4a5d75", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <X size={14} /> Close & Return to Consultation
            </button>
          </div>
          <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
             <DoctorPatientRecords navState={{ patientId: patient.patientId, visitId: showFullRecord !== true ? showFullRecord : undefined }} />
          </div>
        </div>
      )}

    </div>
  );
}
