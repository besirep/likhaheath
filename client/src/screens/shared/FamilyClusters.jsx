import React, { useState, useEffect, useCallback } from "react";
import { Users, Search, Plus, Trash, User, X, Crown, Home, Phone, Calendar, ChevronRight, FileText, Edit2, Check } from "lucide-react";
import { clusterApi } from "../../lib/api/clusters.js";
import { patientsApi } from "../../lib/api/patients.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
function Avatar({ name = "?", size = 36 }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const hue = ((name.charCodeAt(0) || 0) * 37 + (name.charCodeAt(1) || 0) * 17) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `hsl(${hue},42%,68%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700,
      color: `hsl(${hue},42%,26%)`, flexShrink: 0,
    }}>{initials}</div>
  );
}

function calcAge(dob) {
  if (!dob) return "—";
  return Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 3600 * 1000)) + " yrs";
}

// ── Create Cluster Modal ──────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }) {
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onCreate({ label, notes });
      onClose();
    } catch (err) { alert("Failed: " + err.message); }
    finally { setBusy(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,40,70,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: 440, boxShadow: "0 24px 64px rgba(20,40,70,0.22)", animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)", overflow: "hidden" }}>
        <style>{`@keyframes popIn { from{transform:scale(0.93);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
        <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "22px 26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", letterSpacing: 0.8, textTransform: "uppercase" }}>New Household</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "white", marginTop: 3 }}>Create Family Cluster</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 34, height: 34, borderRadius: 9, cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
          </div>
        </div>
        <form onSubmit={submit} style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>Family Name *</label>
            <input value={label} onChange={e => setLabel(e.target.value)} required placeholder="e.g. Dela Cruz Family"
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, color: "#1e2d40", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Address or household notes..." rows={3}
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, resize: "vertical", boxSizing: "border-box", outline: "none", color: "#1e2d40" }}
              onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: "#f4f7fb", border: "1px solid #dde8e5", borderRadius: 11, padding: "11px", fontSize: 14, color: "#7a8fb0", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={busy} style={{ flex: 2, background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 11, padding: "11px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.3)" }}>
              {busy ? "Creating…" : "Create Family"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Member Detail Panel (right side) ─────────────────────────────────────────
function MemberPanel({ member, onClose }) {
  if (!member) return null;
  const fullName = `${member.first_name || ""} ${member.last_name || ""}`.trim();

  return (
    <div style={{ width: 320, borderLeft: "1px solid #e0e7ef", background: "white", display: "flex", flexDirection: "column", flexShrink: 0, animation: "slideInRight 0.22s ease" }}>
      <style>{`@keyframes slideInRight { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }`}</style>
      <div style={{ background: "linear-gradient(135deg,#1e2d40,#2a4060)", padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Avatar name={fullName} size={44} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{fullName}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{calcAge(member.date_of_birth)}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", width: 30, height: 30, borderRadius: 8, cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          { label: "Date of Birth", value: member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—", Icon: Calendar },
          { label: "Sex", value: member.sex || "—", Icon: User },
          { label: "Contact", value: member.contact || "—", Icon: Phone },
          { label: "Address", value: member.address || "—", Icon: Home },
        ].map(row => (
          <div key={row.label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#f0f4fa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <row.Icon size={15} color="#8a9bb0" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#8a9bb0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>{row.label}</div>
              <div style={{ fontSize: 14, color: "#1e2d40", marginTop: 2, fontWeight: 500, lineHeight: 1.4 }}>{row.value}</div>
            </div>
          </div>
        ))}
        {member.philhealth_no && (
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#f0f4fa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileText size={15} color="#8a9bb0" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#8a9bb0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>PhilHealth No.</div>
              <div style={{ fontSize: 14, color: "#1e2d40", marginTop: 2, fontWeight: 500 }}>{member.philhealth_no}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cluster Detail (center) ───────────────────────────────────────────────────
function ClusterDetail({ cluster, onBack, onUpdate }) {
  const [patientSearch, setPatientSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(cluster.label);

  useEffect(() => {
    setLabelDraft(cluster.label);
    setSelectedMember(null);
  }, [cluster.id, cluster.label]);

  useEffect(() => {
    if (!patientSearch || patientSearch.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await patientsApi.getAll({ search: patientSearch, limit: 6 });
        setSearchResults(res.data || []);
      } catch { /* ignore */ } finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [patientSearch]);

  const handleAddMember = async (patient) => {
    try {
      await clusterApi.addPatient(cluster.id, patient.id);
      setPatientSearch(""); setSearchResults([]);
      onUpdate();
    } catch (err) { alert("Failed to add: " + err.message); }
  };

  const handleRemoveMember = async (patientId) => {
    if (!window.confirm("Remove this member from the family cluster?")) return;
    try {
      await clusterApi.removePatient(cluster.id, patientId);
      if (selectedMember?.id === patientId) setSelectedMember(null);
      onUpdate();
    } catch (err) { alert("Failed to remove: " + err.message); }
  };

  const handleSetHead = async (patientId) => {
    try {
      await clusterApi.update(cluster.id, { label: cluster.label, notes: cluster.notes, head_patient_id: patientId });
      onUpdate();
    } catch (err) { alert("Failed: " + err.message); }
  };

  const handleSaveLabel = async () => {
    if (!labelDraft.trim()) return;
    try {
      await clusterApi.update(cluster.id, { label: labelDraft.trim(), notes: cluster.notes, head_patient_id: cluster.head_patient_id });
      setEditingLabel(false);
      onUpdate();
    } catch (err) { alert("Failed: " + err.message); }
  };

  const members = cluster.members || [];

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* Member list */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #e8edf7", background: "white", flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={onBack} style={{ background: "#f4f7fb", border: "1px solid #e0e7ef", borderRadius: 9, padding: "7px 12px", fontSize: 13, color: "#4a5d75", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            {editingLabel ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input value={labelDraft} onChange={e => setLabelDraft(e.target.value)}
                  autoFocus style={{ flex: 1, fontSize: 18, fontWeight: 700, color: "#1e2d40", border: "1.5px solid #2a9d8f", borderRadius: 8, padding: "4px 10px", outline: "none" }}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveLabel(); if (e.key === "Escape") setEditingLabel(false); }} />
                <button onClick={handleSaveLabel} style={{ background: "#2a9d8f", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "white", display: "flex", alignItems: "center" }}><Check size={15} /></button>
                <button onClick={() => setEditingLabel(false)} style={{ background: "#f4f7fb", border: "1px solid #e0e7ef", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#8a9bb0", display: "flex", alignItems: "center" }}><X size={15} /></button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e2d40" }}>{cluster.label}</div>
                <button onClick={() => setEditingLabel(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#b0beca", padding: 4 }}><Edit2 size={14} /></button>
              </div>
            )}
            <div style={{ fontSize: 13, color: "#8a9bb0", marginTop: 2 }}>{members.length} member{members.length !== 1 ? "s" : ""}{cluster.notes ? ` · ${cluster.notes}` : ""}</div>
          </div>
        </div>

        {/* Members */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", background: "#f7f9fb", display: "flex", flexDirection: "column", gap: 8 }}>
          {members.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#8a9bb0" }}>
              <Users size={32} strokeWidth={1.5} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>No members yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Search and add patients below</div>
            </div>
          ) : members.map(m => {
            const fullName = `${m.first_name} ${m.last_name}`;
            const isHead = m.id === cluster.head_patient_id;
            const isSelected = selectedMember?.id === m.id;
            return (
              <div key={m.id} onClick={() => setSelectedMember(isSelected ? null : { ...m, contact: m.contact, address: m.address, sex: m.sex })}
                style={{
                  background: isSelected ? "white" : "white", borderRadius: 14, padding: "14px 16px",
                  border: `2px solid ${isSelected ? "#2a9d8f" : isHead ? "#e8f0fe" : "#e8edf7"}`,
                  boxShadow: isSelected ? "0 4px 16px rgba(42,157,143,0.14)" : "0 1px 4px rgba(100,120,150,0.07)",
                  cursor: "pointer", transition: "all 0.18s",
                  display: "flex", alignItems: "center", gap: 14,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = "#c8e4e0"; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = isHead ? "#e8f0fe" : "#e8edf7"; }}
              >
                <Avatar name={fullName} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e2d40" }}>{fullName}</div>
                    {isHead && (
                      <span style={{ background: "#e8f7f5", color: "#2a9d8f", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 5, display: "flex", alignItems: "center", gap: 3 }}>
                        <Crown size={10} /> HEAD
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "#8a9bb0", marginTop: 2 }}>
                    {calcAge(m.date_of_birth)}{m.sex ? ` · ${m.sex}` : ""}
                    {m.date_of_birth ? ` · DOB: ${new Date(m.date_of_birth).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {!isHead && (
                    <button onClick={e => { e.stopPropagation(); handleSetHead(m.id); }}
                      style={{ fontSize: 12, padding: "5px 10px", background: "#f0f4fa", border: "1px solid #dde8f0", borderRadius: 7, cursor: "pointer", color: "#4a5d75", whiteSpace: "nowrap" }}>
                      Set Head
                    </button>
                  )}
                  <button onClick={e => { e.stopPropagation(); handleRemoveMember(m.id); }}
                    style={{ width: 30, height: 30, background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash size={13} />
                  </button>
                  <ChevronRight size={16} color={isSelected ? "#2a9d8f" : "#b0beca"} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Patient Search */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #e0e7ef", background: "white", flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#8a9bb0", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Add Existing Patient</div>
          <div style={{ position: "relative" }}>
            <Search size={14} color="#8a9bb0" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
            <input type="text" placeholder="Search patient by name…" value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
              style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1.5px solid #e0e7ef", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", color: "#1e2d40" }}
              onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
            {patientSearch.length >= 2 && (
              <div style={{ position: "absolute", bottom: "100%", left: 0, right: 0, background: "white", border: "1px solid #e0e7ef", borderRadius: 10, marginBottom: 4, boxShadow: "0 8px 24px rgba(30,45,64,0.14)", zIndex: 10, overflow: "hidden" }}>
                {searching ? (
                  <div style={{ padding: 12, color: "#8a9bb0", fontSize: 13, textAlign: "center" }}>Searching…</div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: 12, color: "#8a9bb0", fontSize: 13, textAlign: "center" }}>No patients found</div>
                ) : searchResults.map(p => {
                  const already = members.some(m => m.id === p.id);
                  return (
                    <div key={p.id} onClick={() => !already && handleAddMember(p)}
                      style={{ padding: "11px 14px", borderBottom: "1px solid #f0f3f7", cursor: already ? "not-allowed" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: already ? 0.5 : 1 }}
                      onMouseEnter={e => { if (!already) e.currentTarget.style.background = "#f7f9fb"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "white"; }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Avatar name={`${p.first_name} ${p.last_name}`} size={28} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>{p.first_name} {p.last_name}</div>
                          <div style={{ fontSize: 12, color: "#8a9bb0" }}>{calcAge(p.date_of_birth)}</div>
                        </div>
                      </div>
                      {already ? <span style={{ fontSize: 11, color: "#8a9bb0" }}>Already added</span> : <Plus size={15} color="#2a9d8f" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Member detail panel */}
      {selectedMember && <MemberPanel member={selectedMember} onClose={() => setSelectedMember(null)} />}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FamilyClusters() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clusterApi.getAll({ search: searchTerm });
      setClusters(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [searchTerm]);

  useEffect(() => { fetchClusters(); }, [fetchClusters]);

  const handleCreate = async (payload) => {
    await clusterApi.create(payload);
    fetchClusters();
  };

  const handleClusterClick = async (cluster) => {
    try {
      const details = await clusterApi.getOne(cluster.id);
      setSelectedCluster(details);
    } catch (err) { alert("Failed to load: " + err.message); }
  };

  const handleUpdate = async () => {
    if (!selectedCluster) return;
    try {
      const updated = await clusterApi.getOne(selectedCluster.id);
      setSelectedCluster(updated);
      fetchClusters();
    } catch { /* ignore */ }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "#f7f9fb" }}>
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}

      {selectedCluster ? (
        <ClusterDetail cluster={selectedCluster} onBack={() => setSelectedCluster(null)} onUpdate={handleUpdate} />
      ) : (
        <>
          {/* Top bar */}
          <div style={{ background: "white", borderBottom: "1px solid #dde8e5", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e2d40" }}>Family Clusters</h1>
              <div style={{ fontSize: 14, color: "#7a8fb0", marginTop: 2 }}>Manage patient households — click a family to view members</div>
            </div>
            <button onClick={() => setShowCreate(true)}
              style={{ background: "linear-gradient(135deg,#2a9d8f,#52c4b8)", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(42,157,143,0.28)", display: "flex", alignItems: "center", gap: 7 }}>
              <Plus size={16} /> New Family
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: "16px 28px", background: "white", borderBottom: "1px solid #e8edf7", flexShrink: 0 }}>
            <div style={{ position: "relative", maxWidth: 480 }}>
              <Search size={15} color="#8a9bb0" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input type="text" placeholder="Search by family name or patient name…"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "10px 14px 10px 36px", border: "1.5px solid #e0e7ef", borderRadius: 11, fontSize: 14, color: "#1e2d40", outline: "none", boxSizing: "border-box", background: "#f7f9fb" }}
                onFocus={e => e.target.style.borderColor = "#2a9d8f"} onBlur={e => e.target.style.borderColor = "#e0e7ef"} />
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#8a9bb0", fontSize: 14 }}>Loading families…</div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: 40, color: "#CC0000", fontSize: 14 }}>{error}</div>
            ) : clusters.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#8a9bb0" }}>
                <Users size={36} strokeWidth={1.5} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2d40" }}>No family clusters found</div>
                <div style={{ fontSize: 13, marginTop: 5 }}>Create a new family group to get started</div>
              </div>
            ) : clusters.map(cluster => (
              <div key={cluster.id} onClick={() => handleClusterClick(cluster)}
                style={{ background: "white", borderRadius: 16, padding: "16px 20px", border: "2px solid #e8edf7", cursor: "pointer", transition: "all 0.18s", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 8px rgba(100,120,150,0.06)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#c8e4e0"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(42,157,143,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8edf7"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(100,120,150,0.06)"; }}
              >
                {/* Icon */}
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#e8f7f5,#d0ede8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Home size={22} color="#2a9d8f" />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1e2d40", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cluster.label}</div>
                    <span style={{ background: "#f0f4fa", color: "#4a5d75", borderRadius: 7, padding: "2px 9px", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{cluster.member_count} member{cluster.member_count !== 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#8a9bb0", marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {cluster.head_name && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Crown size={11} color="#2a9d8f" /> Head: <strong style={{ color: "#4a5d75" }}>{cluster.head_name}</strong>
                      </span>
                    )}
                    {cluster.notes && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>{cluster.notes}</span>}
                  </div>
                </div>

                <ChevronRight size={18} color="#b0beca" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
