import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Stethoscope, Clock, ClipboardList, Heart, Thermometer, Wind,
  Activity, Scale, X, FlaskConical, Pencil, Printer, CheckCircle, Save,
  ChevronRight, AlertTriangle, RefreshCw, Users, ListOrdered,
} from "lucide-react";
import { consultationsApi } from "../../lib/api/consultations.js";
import { queueApi } from "../../lib/api/queue.js";

// ── Error Boundary ─────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(e) { return { hasError: true, error: e }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: 32, color: "#CC0000", background: "#fff5f5", borderRadius: 12 }}>
        <strong>Component error:</strong>
        <pre style={{ fontSize: 12, marginTop: 8 }}>{this.state.error?.toString()}</pre>
      </div>
    );
    return this.props.children;
  }
}

// ── Vital flag helpers ─────────────────────────────────────────────────────────
const bpFlag   = bp => { if (!bp || bp === "null") return "ok"; const s = Number(String(bp).split("/")[0]); return s >= 140 ? "high" : s < 90 ? "low" : "ok"; };
const tempFlag = v  => { if (!v || v === "null") return "ok"; const n = Number(v); return n >= 37.8 ? "high" : n < 36 ? "low" : "ok"; };
const spo2Flag = v  => (!v || v === "null") ? "ok" : Number(v) < 95 ? "low" : "ok";

const flagColor = { high: "#CC0000", low: "#c04080", ok: "#2a9d8f" };
const flagBg    = { high: "#fde8e0", low: "#fce8f0", ok: "#e8f7f5"  };
const flagBorder = { high: "#f5c0b0", low: "#f5b8d8", ok: "#b8e4de" };

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
  const n   = name || "?";
  // For "Surname, First" format — initials from last name + first name
  const parts   = n.split(/[\s,]+/).filter(Boolean);
  const initials = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  const hue  = (n.charCodeAt(0) * 41 + (n.charCodeAt(1) || 0) * 19) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},38%,72%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.34, fontWeight: 700, color: `hsl(${hue},38%,26%)`, flexShrink: 0, textTransform: "uppercase" }}>
      {initials.toUpperCase() || "?"}
    </div>
  );
}

// ── VitalChip ─────────────────────────────────────────────────────────────────
function VitalChip({ icon, label, value, unit, flag = "ok" }) {
  if (!value || value === "null") return null;
  return (
    <div style={{ background: flagBg[flag], borderRadius: 10, padding: "10px 10px 8px", border: `1px solid ${flagBorder[flag]}`, textAlign: "center", minWidth: 0 }}>
      <div style={{ color: flagColor[flag], marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: flagColor[flag], lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#9aabc0", marginTop: 2 }}>{unit}</div>
      <div style={{ fontSize: 10, color: "#b0bdd6", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      {flag !== "ok" && <div style={{ fontSize: 10, color: flagColor[flag], fontWeight: 700, marginTop: 3 }}>{flag.toUpperCase()}</div>}
    </div>
  );
}

// ── Lab-result templates ───────────────────────────────────────────────────────
const LAB_TEMPLATES = {
  CBC: [
    { key: "wbc",  label: "WBC",        unit: "×10³/µL", ref: "4.5–11.0" },
    { key: "rbc",  label: "RBC",        unit: "×10⁶/µL", ref: "M:4.5–5.9 / F:4.0–5.2" },
    { key: "hgb",  label: "Hemoglobin", unit: "g/dL",    ref: "M:13–17 / F:12–16" },
    { key: "hct",  label: "Hematocrit", unit: "%",        ref: "M:38–50 / F:35–45" },
    { key: "plt",  label: "Platelets",  unit: "×10³/µL", ref: "150–400"  },
    { key: "neut", label: "Neutrophils",unit: "%",        ref: "50–70"    },
    { key: "lymp", label: "Lymphocytes",unit: "%",        ref: "20–40"    },
  ],
  Urinalysis: [
    { key: "color",    label: "Color",        unit: "",   ref: "Yellow" },
    { key: "clarity",  label: "Clarity",      unit: "",   ref: "Clear"  },
    { key: "ph",       label: "pH",           unit: "",   ref: "5.0–8.0"},
    { key: "protein",  label: "Protein",      unit: "",   ref: "Negative"},
    { key: "glucose",  label: "Glucose",      unit: "",   ref: "Negative"},
    { key: "rbc_u",   label: "RBC",          unit: "/hpf",ref: "0–2"   },
    { key: "wbc_u",   label: "WBC",          unit: "/hpf",ref: "0–5"   },
    { key: "bacteria", label: "Bacteria",     unit: "",   ref: "None"   },
  ],
  "Blood Chemistry": [
    { key: "fbs",   label: "Fasting Blood Sugar", unit: "mg/dL", ref: "70–99"    },
    { key: "bun",   label: "BUN",                  unit: "mg/dL", ref: "7–25"     },
    { key: "creat", label: "Creatinine",           unit: "mg/dL", ref: "M:0.7–1.3 / F:0.5–1.1"},
    { key: "ua",    label: "Uric Acid",            unit: "mg/dL", ref: "M:3.5–7.2 / F:2.5–6.0"},
    { key: "chol",  label: "Total Cholesterol",    unit: "mg/dL", ref: "<200"     },
    { key: "trig",  label: "Triglycerides",        unit: "mg/dL", ref: "<150"     },
    { key: "hdl",   label: "HDL",                  unit: "mg/dL", ref: ">40"      },
    { key: "ldl",   label: "LDL",                  unit: "mg/dL", ref: "<100"     },
  ],
  "Lipid Panel": [
    { key: "chol",  label: "Total Cholesterol",    unit: "mg/dL", ref: "<200"     },
    { key: "trig",  label: "Triglycerides",        unit: "mg/dL", ref: "<150"     },
    { key: "hdl",   label: "HDL",                  unit: "mg/dL", ref: ">40"      },
    { key: "ldl",   label: "LDL",                  unit: "mg/dL", ref: "<100"     },
    { key: "vldl",  label: "VLDL",                 unit: "mg/dL", ref: "2–30"     },
  ],
  "Thyroid Function": [
    { key: "tsh",   label: "TSH",  unit: "mIU/L",  ref: "0.45–4.5"  },
    { key: "ft4",   label: "Free T4", unit: "ng/dL", ref: "0.8–1.8" },
    { key: "ft3",   label: "Free T3", unit: "pg/mL", ref: "2.3–4.2" },
  ],
  "Fecalysis": [],
  "Blood Typing": [],
  "HBA1C": [],
  "Malaria Smear": [],
  "Peripheral Blood Smear": [],
  "Dengue NS1": [],
  "ECG": [],
  "2D ECHO": [],
  "Chest X-ray": [],
  "UTZ": [],
  "Custom / Other": [],
};

// ── Lab Request + Results Editor Modal ───────────────────────────────────────
function LabModal({ record, onClose, onSave, showToast }) {
  const [requested, setRequested] = useState(record.labs || []);
  const [editMode, setEditMode]   = useState(record.labs?.length > 0 ? "results" : "request");
  const [customName, setCustomName] = useState("");
  const [results, setResults]     = useState(() => {
    const init = {};
    (record.labs || []).forEach(lab => {
      init[lab.name] = lab.results || {};
    });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(record.labs?.[0]?.name || Object.keys(LAB_TEMPLATES)[0]);

  const addLab = (name) => {
    if (!name.trim()) return;
    if (requested.find(l => l.name === name)) return;
    setRequested(prev => [...prev, { name, results: {} }]);
    setResults(prev => ({ ...prev, [name]: {} }));
    setActiveTab(name);
    setCustomName("");
  };

  const removeLab = (name) => {
    setRequested(prev => prev.filter(l => l.name !== name));
    setResults(prev => { const n = { ...prev }; delete n[name]; return n; });
    if (activeTab === name) setActiveTab(requested.filter(l => l.name !== name)[0]?.name || "");
  };

  const printRequest = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    win.document.write(`<html><body style="font-family:sans-serif;padding:40px;max-width:700px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:20px;">
        <h4 style="margin:0;font-weight:normal">REPUBLIC OF THE PHILIPPINES<br/>PROVINCE OF RIZAL<br/>MUNICIPALITY OF ANGONO</h4>
        <h3 style="margin:8px 0 0">MUNICIPAL HEALTH OFFICE</h3>
      </div>
      <h2 style="text-align:center;margin-bottom:24px;">LABORATORY REQUEST FORM</h2>
      <div style="margin-bottom:10px"><b>Patient:</b> ${record.patient.name}</div>
      <div style="margin-bottom:10px"><b>Age / Sex:</b> ${record.patient.age} yrs / ${record.patient.sex}</div>
      <div style="margin-bottom:10px"><b>Date:</b> ${new Date().toLocaleDateString()}</div>
      <div style="margin-bottom:20px"><b>Diagnosis / Impression:</b> ${record.diagnosis || "—"}</div>
      <div style="margin-bottom:10px;font-weight:bold">Requested Tests:</div>
      <ul style="margin:0 0 30px;padding-left:20px">${requested.map(l => `<li style="margin-bottom:6px;font-size:15px">${l.name}</li>`).join("")}</ul>
      <div style="margin-top:60px;text-align:right">
        <div style="display:inline-block;text-align:center">
          <div style="border-bottom:1px solid black;width:220px;margin-bottom:5px"></div>
          <div>RODOLFO S. NARCISO JR., MD</div>
          <div style="font-size:13px">Municipal Health Officer · Lic. No. 0101763</div>
        </div>
      </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => { 
      win.focus(); 
      win.print(); 
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 400);
    setEditMode("results");
  };

  const handleResultChange = (labName, field, value) => {
    setResults(prev => ({ ...prev, [labName]: { ...prev[labName], [field]: value } }));
  };

  const handleSave = async () => {
    if (!window.confirm("Save lab results to this consultation record?")) return;
    setSaving(true);
    try {
      const labPayload = requested.map(l => ({ name: l.name, results: results[l.name] || {} }));
      await onSave({ labs: labPayload });
      onClose();
    } catch { showToast ? showToast("Failed to save lab results.", "error") : alert("Failed to save lab results."); }
    finally { setSaving(false); }
  };

  const currentTemplate = activeTab ? (LAB_TEMPLATES[activeTab] || []) : [];
  const isCustom = activeTab && !LAB_TEMPLATES[activeTab];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: "min(880px, 96vw)", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(20,40,70,0.24)" }}>
        <style>{`@keyframes popIn{from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1}}`}</style>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", borderRadius: "20px 20px 0 0", padding: "20px 26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "white", display: "flex", alignItems: "center", gap: 8 }}>
                <FlaskConical size={18} /> Laboratory Orders — {record.patient.name}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>
                {record.diagnosis} · {new Date(record.date).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Toggle request / results */}
              <div style={{ display: "flex", background: "rgba(255,255,255,0.12)", borderRadius: 9, overflow: "hidden" }}>
                {["request", "results"].map(m => (
                  <button key={m} onClick={() => setEditMode(m)} style={{ padding: "7px 14px", border: "none", cursor: "pointer", background: editMode === m ? "rgba(255,255,255,0.22)" : "transparent", color: "white", fontSize: 13, fontWeight: editMode === m ? 700 : 400, textTransform: "capitalize" }}>{m === "request" ? "Request" : "Enter Results"}</button>
                ))}
              </div>
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={15} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Left: lab selector */}
          <div style={{ width: 240, flexShrink: 0, borderRight: "1px solid #e8edf7", display: "flex", flexDirection: "column", background: "#f7f9fb" }}>
            <div style={{ padding: "14px 14px 10px", fontSize: 12, fontWeight: 700, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #edf0f7" }}>
              Test Types
            </div>
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px" }}>
              {Object.keys(LAB_TEMPLATES).map(name => {
                const isAdded = requested.find(l => l.name === name);
                return (
                  <div key={name} onClick={() => { addLab(name); setActiveTab(name); }}
                    style={{ padding: "9px 11px", borderRadius: 9, marginBottom: 4, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: activeTab === name ? "#e8f7f5" : isAdded ? "#f0f4fa" : "transparent", border: `1px solid ${activeTab === name ? "#b8e4de" : "transparent"}`, transition: "all 0.15s" }}
                    onMouseEnter={e => { if (activeTab !== name) e.currentTarget.style.background = "#eef1f7"; }}
                    onMouseLeave={e => { if (activeTab !== name) e.currentTarget.style.background = isAdded ? "#f0f4fa" : "transparent"; }}>
                    <span style={{ fontSize: 13, color: "#1e2d40", fontWeight: isAdded ? 600 : 400 }}>{name}</span>
                    {isAdded && <CheckCircle size={13} color="#2a9d8f" />}
                  </div>
                );
              })}
              {/* Custom lab */}
              <div style={{ padding: "10px 6px 6px", borderTop: "1px solid #edf0f7", marginTop: 8 }}>
                <div style={{ fontSize: 11, color: "#8a9bb0", fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>Custom</div>
                <div style={{ display: "flex", gap: 5 }}>
                  <input placeholder="Lab name…" value={customName} onChange={e => setCustomName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addLab(customName)}
                    style={{ flex: 1, minWidth: 0, padding: "7px 9px", border: "1.5px solid #e0e7ef", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
                  <button onClick={() => addLab(customName)} style={{ background: "#2a9d8f", border: "none", borderRadius: 8, color: "white", padding: "0 10px", cursor: "pointer", fontSize: 16 }}>+</button>
                </div>
              </div>
            </div>

            {/* Added tests list */}
            {requested.length > 0 && (
              <div style={{ borderTop: "1px solid #e8edf7", padding: "10px 10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#8a9bb0", textTransform: "uppercase", marginBottom: 7 }}>Requested ({requested.length})</div>
                {requested.map(l => (
                  <div key={l.name} onClick={() => setActiveTab(l.name)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", borderRadius: 7, background: activeTab === l.name ? "#e8f7f5" : "transparent", cursor: "pointer", marginBottom: 3 }}>
                    <span style={{ fontSize: 13, color: "#1e2d40", fontWeight: 600 }}>{l.name}</span>
                    <button onClick={e => { e.stopPropagation(); removeLab(l.name); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#c05080", padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: content area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* ── REQUEST VIEW ── */}
            {editMode === "request" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                {requested.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#b0bdd6" }}>
                    <FlaskConical size={36} strokeWidth={1.5} />
                    <div style={{ marginTop: 12, fontSize: 14 }}>Select tests from the left to add them</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40", marginBottom: 16 }}>
                      Requested Tests for {record.patient.name}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {requested.map(l => (
                        <div key={l.name} style={{ background: "#f4f7fb", borderRadius: 12, padding: "14px 16px", border: "1px solid #e0e7ef", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <FlaskConical size={16} color="#2a9d8f" />
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{l.name}</span>
                          </div>
                          <button onClick={() => removeLab(l.name)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c05080", fontSize: 18, lineHeight: 1 }}>×</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── RESULTS VIEW ── */}
            {editMode === "results" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Tab bar for requested tests */}
                {requested.length > 0 && (
                  <div style={{ display: "flex", gap: 2, padding: "10px 20px 0", borderBottom: "1px solid #e8edf7", background: "white", flexWrap: "wrap" }}>
                    {requested.map(l => (
                      <button key={l.name} onClick={() => setActiveTab(l.name)} style={{ padding: "8px 14px", border: "none", background: activeTab === l.name ? "white" : "transparent", borderBottom: activeTab === l.name ? "2.5px solid #2a9d8f" : "2.5px solid transparent", color: activeTab === l.name ? "#2a9d8f" : "#8a9bb0", fontSize: 13, fontWeight: activeTab === l.name ? 700 : 400, cursor: "pointer", transition: "all 0.15s", marginBottom: -1 }}>
                        {l.name}
                        {results[l.name] && Object.values(results[l.name]).some(v => v) && (
                          <span style={{ marginLeft: 5, background: "#2a9d8f", color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                  {requested.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px", color: "#b0bdd6" }}>
                      <FlaskConical size={36} strokeWidth={1.5} />
                      <div style={{ marginTop: 12, fontSize: 14 }}>No tests requested yet — switch to "Request" to add</div>
                    </div>
                  ) : !activeTab ? null : (
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40", marginBottom: 4 }}>{activeTab}</div>
                      <div style={{ fontSize: 13, color: "#8a9bb0", marginBottom: 18 }}>Enter values from the lab report below. Reference ranges shown for guidance.</div>

                      {/* Standard template fields */}
                      {currentTemplate.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          {currentTemplate.map(field => (
                            <div key={field.key} style={{ background: "#f7f9fb", borderRadius: 12, padding: "14px 16px", border: "1px solid #e8edf7" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40" }}>{field.label}</div>
                                <div style={{ fontSize: 11, color: "#8a9bb0" }}>{field.unit}</div>
                              </div>
                              <input
                                placeholder="—"
                                value={results[activeTab]?.[field.key] || ""}
                                onChange={e => handleResultChange(activeTab, field.key, e.target.value)}
                                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e0e7ef", borderRadius: 9, fontSize: 14, outline: "none", boxSizing: "border-box", color: "#1e2d40", fontWeight: 600, fontFamily: "inherit" }}
                                onFocus={e => e.target.style.borderColor = "#2a9d8f"}
                                onBlur={e => e.target.style.borderColor = "#e0e7ef"}
                              />
                              <div style={{ fontSize: 11, color: "#aab0c0", marginTop: 5 }}>Ref: {field.ref}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Custom / freeform */
                        <textarea
                          placeholder="Enter lab results here (free text)…"
                          value={results[activeTab]?.["_text"] || ""}
                          onChange={e => handleResultChange(activeTab, "_text", e.target.value)}
                          rows={10}
                          style={{ width: "100%", padding: "12px", border: "1.5px solid #e0e7ef", borderRadius: 12, fontSize: 14, fontFamily: "monospace", outline: "none", resize: "vertical", color: "#1e2d40", boxSizing: "border-box" }}
                          onFocus={e => e.target.style.borderColor = "#2a9d8f"}
                          onBlur={e => e.target.style.borderColor = "#e0e7ef"}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div style={{ borderTop: "1px solid #e8edf7", padding: "14px 24px", display: "flex", gap: 10, background: "#f7f9fb", borderRadius: "0 0 20px 0" }}>
              <button onClick={printRequest} disabled={requested.length === 0}
                style={{ background: requested.length === 0 ? "#e8edf7" : "white", border: "1px solid #e0e7ef", borderRadius: 10, padding: "10px 18px", fontSize: 14, color: requested.length === 0 ? "#b0bdd6" : "#0047AB", cursor: requested.length === 0 ? "default" : "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <Printer size={15} /> Print Request
              </button>
              <button onClick={() => setEditMode("results")} style={{ background: "white", border: "1px solid #e0e7ef", borderRadius: 10, padding: "10px 18px", fontSize: 14, color: "#4a5d75", cursor: "pointer", fontWeight: 500 }}>
                Enter Results
              </button>
              <div style={{ flex: 1 }} />
              <button onClick={onClose} style={{ background: "white", border: "1px solid #e0e7ef", borderRadius: 10, padding: "10px 18px", fontSize: 14, color: "#7a8fb0", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || requested.length === 0}
                style={{ background: saving || requested.length === 0 ? "#b0bdd6" : "linear-gradient(135deg,#2a9d8f,#52c4b8)", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, fontWeight: 700, color: "white", cursor: saving || requested.length === 0 ? "default" : "pointer", boxShadow: "0 4px 12px rgba(42,157,143,0.2)", display: "flex", alignItems: "center", gap: 6 }}>
                <Save size={15} /> {saving ? "Saving…" : "Save Results"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Queue Sidebar Item ─────────────────────────────────────────────────────────
function QueueItem({ item, isCurrent }) {
  const statusColors = {
    "waiting":        { bg: "#fff8e6", color: "#b07830", label: "Waiting"  },
    "vitals-done":    { bg: "#e8f0fb", color: "#0047AB", label: "Ready"    },
    "in-consultation":{ bg: "#e8f7f5", color: "#2a9d8f", label: "Active"   },
    "done":           { bg: "#f0f4fa", color: "#8a9bb0", label: "Done"     },
    "skipped":        { bg: "#fde8e0", color: "#CC0000", label: "Skipped"  },
  };
  const sc = statusColors[item.status] || statusColors["waiting"];
  return (
    <div style={{ padding: "11px 12px", borderRadius: 12, marginBottom: 6, background: isCurrent ? "linear-gradient(135deg,#e8f7f5,#d4ede9)" : "white", border: `1.5px solid ${isCurrent ? "#b8e4de" : "#edf0f7"}`, transition: "all 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: isCurrent ? "#2a9d8f" : "#f0f4fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: isCurrent ? "white" : "#8a9bb0", flexShrink: 0 }}>
          {item.queue_number}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e2d40", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
          <div style={{ fontSize: 11, color: "#8a9bb0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.reason}</div>
        </div>
        <div style={{ background: sc.bg, color: sc.color, borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{sc.label}</div>
      </div>
    </div>
  );
}

// ── Record Detail Panel ────────────────────────────────────────────────────────
function ConsultationDetail({ record, onUpdate, onPrint, onLab, showToast }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm]   = useState({ diagnosis: "", treatment: "" });
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (record) {
      const combined = [record.notes, record.treatment].filter(Boolean).join("\n\n");
      setEditForm({ diagnosis: record.diagnosis || "", treatment: combined || "" });
      setIsEditing(false);
    }
  }, [record?.id]);

  if (!record) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, color: "#b0bdd6", background: "#f7f9fb" }}>
      <Stethoscope size={40} strokeWidth={1.5} />
      <div style={{ fontSize: 15, fontWeight: 600, color: "#4a5d75" }}>Select a consultation</div>
      <div style={{ fontSize: 13 }}>Click any record from the list to view details</div>
    </div>
  );

  const handleSave = async () => {
    if (!window.confirm("Save changes to this consultation record?")) return;
    setSaving(true);
    try {
      await consultationsApi.updateConsultation(record.id, { ...editForm, notes: "" });
      if (onUpdate) onUpdate({ ...editForm, notes: "" });
      setIsEditing(false);
    } catch { showToast("Failed to update.", "error"); }
    finally { setSaving(false); }
  };

  const printRecord = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    win.document.write(`<html><body style="font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:20px;">
        <h4 style="margin:0;font-weight:normal">REPUBLIC OF THE PHILIPPINES<br/>PROVINCE OF RIZAL<br/>MUNICIPALITY OF ANGONO</h4>
        <h3 style="margin:8px 0 0">MUNICIPAL HEALTH OFFICE</h3>
      </div>
      <h2 style="text-align:center;margin-bottom:24px;font-style:italic">Consultation Record</h2>
      <div style="display:flex;justify-content:flex-end;margin-bottom:16px">Date: <span style="border-bottom:1px solid black;display:inline-block;width:140px;text-align:center;margin-left:8px">${new Date(record.date).toLocaleDateString()}</span></div>
      <div style="margin-bottom:10px">NAME: <span style="border-bottom:1px solid black;display:inline-block;width:380px;padding-left:10px">${record.patient.name}</span></div>
      <div style="display:flex;gap:10px;margin-bottom:24px">
        <div style="flex:1">ADD: <span style="border-bottom:1px solid black;display:inline-block;width:80%">—</span></div>
        <div>Age: <span style="border-bottom:1px solid black;display:inline-block;width:50px;text-align:center">${record.patient.age}</span></div>
        <div>Sex: <span style="border-bottom:1px solid black;display:inline-block;width:50px;text-align:center">${record.patient.sex}</span></div>
      </div>
      <div style="margin-bottom:20px"><div style="font-weight:bold;margin-bottom:5px">HPI / Chief Complaint:</div><div style="padding-left:10px;min-height:40px">${record.visitReason || "—"}</div></div>
      <div style="margin-bottom:20px"><div style="font-weight:bold;margin-bottom:5px">Diagnosis:</div><div style="padding-left:10px">${record.diagnosis || "—"}</div></div>
      <div style="margin-bottom:40px"><div style="font-weight:bold;margin-bottom:5px">Doctor's Notes & Treatment:</div><div style="padding-left:10px;white-space:pre-wrap">${(record.treatment || "") + (record.notes ? "\n\n" + record.notes : "")}</div></div>
      <div style="margin-top:80px;text-align:right">
        <div style="display:inline-block;text-align:center">
          <div style="border-bottom:1px solid black;width:240px;margin-bottom:5px"></div>
          <div>RODOLFO S. NARCISO JR., MD</div>
          <div style="font-size:13px">MUNICIPAL HEALTH OFFICER · LIC. NO. 0101763</div>
        </div>
      </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => { 
      win.focus(); 
      win.print(); 
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 400);
  };

  const v   = record.vitals;
  const bmi = v?.weight && v?.height && v.weight !== "null" && v.height !== "null"
    ? (Number(v.weight) / Math.pow(Number(v.height) / 100, 2)).toFixed(1)
    : null;

  const hasLabs = record.labs && record.labs.length > 0;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", background: "#f7f9fb" }}>

      {/* Patient banner */}
      <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "20px 26px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Avatar name={record.patient.name} size={48} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>{record.patient.name}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                {record.patient.age} yrs · {record.patient.sex} · {new Date(record.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{record.visitReason || "—"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 9, padding: "7px 14px", fontSize: 13, color: "white", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={printRecord} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 9, padding: "7px 14px", fontSize: 13, color: "white", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                  <Printer size={13} /> Print
                </button>
                <button onClick={() => onLab(record)} style={{ background: hasLabs ? "linear-gradient(135deg,#2a9d8f,#3abca8)" : "rgba(255,255,255,0.12)", border: hasLabs ? "none" : "1px solid rgba(255,255,255,0.2)", borderRadius: 9, padding: "7px 14px", fontSize: 13, color: "white", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, boxShadow: hasLabs ? "0 3px 10px rgba(42,157,143,0.3)" : "none" }}>
                  <FlaskConical size={13} /> {hasLabs ? "Lab Results" : "Order Labs"}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 9, padding: "7px 14px", fontSize: 13, color: "white", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#888" : "linear-gradient(135deg,#2a9d8f,#52c4b8)", border: "none", borderRadius: 9, padding: "7px 14px", fontSize: 13, color: "white", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                  <Save size={13} /> {saving ? "Saving…" : "Save"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: "22px 26px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Edit form OR view */}
        {isEditing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Diagnosis</div>
              <input value={editForm.diagnosis} onChange={e => setEditForm({ ...editForm, diagnosis: e.target.value })}
                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 15, fontFamily: "inherit", color: "#1e2d40", outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0047AB", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Clinical Notes & Treatment Plan</div>
              <textarea value={editForm.treatment} onChange={e => setEditForm({ ...editForm, treatment: e.target.value })} rows={6}
                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, fontFamily: "inherit", resize: "vertical", color: "#1e2d40", outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "#0047AB"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "linear-gradient(135deg,#EBF0FA,#e0e8f9)", borderRadius: 14, padding: "16px 18px", border: "1px solid #C0D4F0", gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0047AB", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 }}>Diagnosis</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1e2d40" }}>{record.diagnosis || "—"}</div>
            </div>
            {record.notes && (
              <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #e8edf7" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Clinical Notes</div>
                <div style={{ fontSize: 14, color: "#2a3550", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{record.notes}</div>
              </div>
            )}
            <div style={{ background: "white", borderRadius: 14, padding: "16px 18px", border: "1px solid #C0D4F0", gridColumn: record.notes ? "auto" : "1 / -1" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0047AB", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Treatment Plan</div>
              <div style={{ fontSize: 14, color: "#2a3550", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{record.treatment || "—"}</div>
            </div>
          </div>
        )}

        {/* Vitals */}
        {v && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Vitals at Consultation</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              <VitalChip icon={<Heart size={15} strokeWidth={2} />} label="Blood Pressure" value={v.bp}   unit="mmHg" flag={bpFlag(v.bp)} />
              <VitalChip icon={<Thermometer size={15} strokeWidth={2} />} label="Temperature"    value={v.temp} unit="°C"   flag={tempFlag(v.temp)} />
              <VitalChip icon={<Activity size={15} strokeWidth={2} />} label="Heart Rate"     value={v.hr}   unit="bpm" />
              <VitalChip icon={<Wind size={15} strokeWidth={2} />} label="SpO₂"           value={v.spo2} unit="%" flag={spo2Flag(v.spo2)} />
              {bmi && <VitalChip icon={<Scale size={15} strokeWidth={2} />} label="BMI" value={bmi} unit="kg/m²" flag={Number(bmi) > 25 ? "high" : "ok"} />}
            </div>
          </div>
        )}

        {/* Lab Results preview */}
        {hasLabs && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <FlaskConical size={13} /> Laboratory Results
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {record.labs.map(lab => {
                const hasResults = lab.results && Object.values(lab.results).some(v => v);
                return (
                  <div key={lab.name} style={{ background: "white", borderRadius: 12, padding: "14px 16px", border: "1px solid #e8edf7" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: hasResults ? 12 : 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e2d40", display: "flex", alignItems: "center", gap: 6 }}>
                        <FlaskConical size={14} color="#2a9d8f" /> {lab.name}
                      </div>
                      <button onClick={() => onLab(record)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2a9d8f", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <Pencil size={12} /> Edit
                      </button>
                    </div>
                    {hasResults && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                        {Object.entries(lab.results).filter(([, v]) => v).map(([k, val]) => {
                          const template = LAB_TEMPLATES[lab.name];
                          const fieldDef = template?.find(f => f.key === k);
                          return (
                            <div key={k} style={{ background: "#f4f7fb", borderRadius: 8, padding: "8px 10px" }}>
                              <div style={{ fontSize: 11, color: "#8a9bb0", marginBottom: 3 }}>{fieldDef?.label || k}</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e2d40" }}>{val} {fieldDef?.unit || ""}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {!hasResults && (
                      <div style={{ fontSize: 13, color: "#b0bdd6" }}>No results entered yet — click Edit to add</div>
                    )}
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

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DoctorConsultations({ activePatient, onConsultComplete, onCancelConsult, onNavigate }) {
  const [history, setHistory]       = useState([]);
  const [queue, setQueue]           = useState([]);
  const [selectedRecord, setRecord] = useState(null);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [error, setError]           = useState(null);
  const [toast, setToast]           = useState(null);
  const [labRecord, setLabRecord]   = useState(null); // record being edited for labs
  const refreshRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await consultationsApi.getHistory();
      const arr  = Array.isArray(data) ? data : [];
      setHistory(arr);
      if (!selectedRecord && arr.length > 0) setRecord(arr[0]);
    } catch (e) {
      setError("Could not load consultation history.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      const data = await queueApi.getToday();
      setQueue(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    finally { setQueueLoading(false); }
  }, []);

  useEffect(() => {
    loadHistory();
    loadQueue();
    // Auto-refresh queue every 30 s
    refreshRef.current = setInterval(loadQueue, 30000);
    return () => clearInterval(refreshRef.current);
  }, [loadHistory, loadQueue]);

  const safeHistory = Array.isArray(history) ? history : [];

  const filtered = safeHistory.filter(r => {
    const name = r.patient?.name || "";
    const diag = r.diagnosis || "";
    return name.toLowerCase().includes(search.toLowerCase()) ||
      diag.toLowerCase().includes(search.toLowerCase());
  });

  const grouped = filtered.reduce((acc, r) => {
    const d    = new Date(r.date);
    const today = new Date();
    const diff  = Math.floor((today - d) / 86400000);
    const key   = diff === 0 ? "Today" : diff === 1 ? "Yesterday" : d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const todayCount     = safeHistory.filter(r => { try { return new Date(r.date).toDateString() === new Date().toDateString(); } catch { return false; } }).length;
  const completedCount = safeHistory.length;

  // Queue stats
  const waitingCount   = queue.filter(q => q.status === "waiting" || q.status === "vitals-done").length;
  const activeCount    = queue.filter(q => q.status === "in-consultation").length;
  const doneCount      = queue.filter(q => q.status === "done").length;

  // Sort queue: in-consultation first, then waiting/vitals-done, then done, then skipped
  const statusOrder = { "in-consultation": 0, "vitals-done": 1, "waiting": 2, "done": 3, "skipped": 4 };
  const sortedQueue = [...queue].sort((a, b) => {
    const so = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
    if (so !== 0) return so;
    return a.queue_number - b.queue_number;
  });

  const handleLabSave = async ({ labs }) => {
    if (!labRecord) return;
    // Persist to the consultation record by updating it
    await consultationsApi.updateConsultation(labRecord.id, {
      diagnosis: labRecord.diagnosis,
      treatment: labRecord.treatment,
      notes: labRecord.notes,
      labs,
    });
    // Update in local state
    setHistory(prev => prev.map(r => r.id === labRecord.id ? { ...r, labs } : r));
    setRecord(prev => prev && prev.id === labRecord.id ? { ...prev, labs } : prev);
    showToast("Lab results saved");
    setLabRecord(null);
  };

  return (
    <div style={{ height: "100%", background: "#EBF0FA", display: "flex", overflow: "hidden" }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn  { from{transform:scale(0.95);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      {/* Lab Modal */}
      {labRecord && (
        <LabModal record={labRecord} onClose={() => setLabRecord(null)} onSave={handleLabSave} showToast={showToast} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.type === "error" ? "#CC0000" : "#1a2540", color: "white", borderRadius: 12, padding: "12px 20px", fontSize: 14, zIndex: 400, boxShadow: "0 8px 24px rgba(20,40,90,0.28)", animation: "popIn 0.3s ease" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{ background: "#EBF0FA", borderBottom: "1px solid #CCDAF0", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a2540" }}>Consultations</h1>
            <div style={{ fontSize: 13, color: "#7a8fb0", marginTop: 1 }}>{todayCount} today · {completedCount} total</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {[
              { label: "Today",   value: todayCount,     color: "#0047AB", bg: "#EBF0FA" },
              { label: "Done",    value: completedCount, color: "#2a7d5f", bg: "#e8f7f1" },
              { label: "Waiting", value: waitingCount,   color: "#b07830", bg: "#fff8e6" },
              { label: "Active",  value: activeCount,    color: "#2a9d8f", bg: "#e8f7f5" },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "4px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.color, opacity: 0.75 }}>{s.label}</div>
              </div>
            ))}
            <button onClick={() => { loadHistory(); loadQueue(); }} style={{ background: "white", border: "1px solid #CCDAF0", borderRadius: 9, padding: "7px 13px", fontSize: 13, color: "#4a5d75", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <RefreshCw size={13} strokeWidth={2} /> Refresh
            </button>
          </div>
        </div>

        {/* Three-column split */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "200px 290px 1fr", overflow: "hidden" }}>

          {/* ── Column 1: Queue Sidebar ────────────────────────────────────── */}
          <div style={{ background: "#f4f7fb", borderRight: "1px solid #dde8e5", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid #e8edf7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ListOrdered size={14} color="#2a9d8f" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e2d40" }}>Queue</span>
              </div>
              <span style={{ background: "#e8f7f5", color: "#2a9d8f", borderRadius: 20, padding: "1px 8px", fontSize: 12, fontWeight: 700 }}>{queue.length}</span>
            </div>
            {/* Stats row */}
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e8edf7" }}>
              {[
                { label: "Wait", value: waitingCount, color: "#b07830" },
                { label: "Active", value: activeCount, color: "#2a9d8f" },
                { label: "Done", value: doneCount, color: "#8a9bb0" },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRight: "1px solid #e8edf7" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#8a9bb0", textTransform: "uppercase" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
              {queueLoading && <div style={{ textAlign: "center", padding: 20, color: "#9aabc0", fontSize: 13 }}>Loading…</div>}
              {!queueLoading && sortedQueue.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px 10px", color: "#b0bdd6" }}>
                  <Users size={24} strokeWidth={1.5} />
                  <div style={{ marginTop: 8, fontSize: 12 }}>Queue is empty</div>
                </div>
              )}
              {!queueLoading && sortedQueue.map(item => (
                <QueueItem key={item.id} item={item} isCurrent={item.status === "in-consultation"} />
              ))}
            </div>
          </div>

          {/* ── Column 2: Consultation History ────────────────────────────── */}
          <div style={{ background: "white", borderRight: "1px solid #CCDAF0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid #f0f3fa" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} color="#9aabc0" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or diagnosis…"
                  style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1.5px solid #e8edf7", borderRadius: 10, fontSize: 13, color: "#1a2540", outline: "none", background: "#f7f9fd", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#0047AB"}
                  onBlur={e => e.target.style.borderColor = "#e8edf7"} />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
              {loading && <div style={{ textAlign: "center", padding: "40px 16px", color: "#9aabc0" }}>Loading…</div>}
              {error  && <div style={{ textAlign: "center", padding: 20, color: "#CC0000", fontSize: 13 }}>{error}</div>}
              {!loading && !error && Object.entries(grouped).map(([groupDate, items]) => (
                <div key={groupDate}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#9aabc0", letterSpacing: 0.8, textTransform: "uppercase", padding: "10px 6px 6px" }}>{groupDate}</div>
                  {items.map((r, i) => {
                    const isSel = selectedRecord?.id === r.id;
                    const hasLabs = r.labs && r.labs.length > 0;
                    return (
                      <div key={r.id} onClick={() => setRecord(r)}
                        style={{ padding: "10px 11px", borderRadius: 11, marginBottom: 4, cursor: "pointer", background: isSel ? "#EBF0FA" : "transparent", border: `1.5px solid ${isSel ? "#B0C8E8" : "transparent"}`, transition: "all 0.15s", animation: `fadeIn 0.3s ease ${i * 0.04}s both` }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "#f7f9fd"; }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                          <Avatar name={r.patient?.name || "?"} size={32} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2540", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 6 }}>{r.patient?.name || "Unknown"}</div>
                              {hasLabs && <FlaskConical size={11} color="#2a9d8f" strokeWidth={2} />}
                            </div>
                            <div style={{ fontSize: 12, color: "#7a8fb0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.diagnosis}</div>
                            <div style={{ fontSize: 11, color: "#b0bdd6", marginTop: 2 }}>{new Date(r.date).toLocaleDateString()}</div>
                          </div>
                          <div style={{ background: "#e8f7f5", color: "#2a9d8f", borderRadius: 5, padding: "2px 6px", fontSize: 10, fontWeight: 700, flexShrink: 0, alignSelf: "center" }}>Done</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {!loading && !error && filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "#9aabc0" }}>
                  <ClipboardList size={28} strokeWidth={1.5} style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 13 }}>No consultations found</div>
                </div>
              )}
            </div>
          </div>

          {/* ── Column 3: Record Detail ────────────────────────────────────── */}
          <div style={{ display: "flex", overflow: "hidden" }}>
            <ErrorBoundary>
              <ConsultationDetail
                record={selectedRecord}
                onLab={setLabRecord}
                showToast={showToast}
                onUpdate={(newVals) => {
                  loadHistory();
                  showToast("Record updated");
                  setRecord(prev => prev ? { ...prev, ...newVals } : prev);
                }}
              />
            </ErrorBoundary>
          </div>

        </div>
      </div>
    </div>
  );
}
