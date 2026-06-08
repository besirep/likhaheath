import React, { useState, useEffect } from "react";
import { Users, Search, Plus, Trash, User, ChevronRight, X } from "lucide-react";
import { clusterApi } from "../../lib/api/clusters.js";
import { patientsApi } from "../../lib/api/patients.js";

function FamilyClusters() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);

  useEffect(() => {
    fetchClusters();
  }, [searchTerm]);

  const fetchClusters = async () => {
    setLoading(true);
    try {
      const data = await clusterApi.getAll({ search: searchTerm });
      setClusters(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await clusterApi.create({
        label: formData.get("label"),
        notes: formData.get("notes"),
      });
      setShowCreateModal(false);
      fetchClusters();
    } catch (err) {
      alert("Failed to create cluster: " + err.message);
    }
  };

  const handleClusterClick = async (cluster) => {
    try {
      const details = await clusterApi.getOne(cluster.id);
      setSelectedCluster(details);
    } catch (err) {
      alert("Failed to load details: " + err.message);
    }
  };

  const closeDetails = () => {
    setSelectedCluster(null);
    fetchClusters(); // Refresh in case changes were made
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Family Clusters</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Manage patient households and family groups</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "#2a9d8f", color: "white", border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
        >
          <Plus size={18} /> New Family
        </button>
      </div>

      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb", display: "flex", gap: 16 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
            <Search size={18} color="#9ca3af" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search by family name or patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "10px 12px 10px 40px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading families...</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>{error}</div>
        ) : clusters.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>No family clusters found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#4b5563" }}>FAMILY NAME</th>
                <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#4b5563" }}>HEAD OF HOUSEHOLD</th>
                <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#4b5563" }}>MEMBERS</th>
                <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#4b5563" }}>NOTES</th>
              </tr>
            </thead>
            <tbody>
              {clusters.map(cluster => (
                <tr key={cluster.id} onClick={() => handleClusterClick(cluster)} style={{ borderBottom: "1px solid #e5e7eb", cursor: "pointer", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                  <td style={{ padding: "16px", fontSize: 14, fontWeight: 600, color: "#111827" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: "#e0f2fe", color: "#0ea5e9", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Users size={16} />
                      </div>
                      {cluster.label}
                    </div>
                  </td>
                  <td style={{ padding: "16px", fontSize: 14, color: "#4b5563" }}>{cluster.head_name}</td>
                  <td style={{ padding: "16px", fontSize: 14, color: "#4b5563" }}>
                    <span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{cluster.member_count}</span>
                  </td>
                  <td style={{ padding: "16px", fontSize: 14, color: "#6b7280" }}>{cluster.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 12, width: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>New Family Cluster</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Family Name *</label>
                <input name="label" required placeholder="e.g. Dela Cruz Family" style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: 6 }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Notes</label>
                <textarea name="notes" placeholder="Optional notes about this household..." style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: 6, minHeight: 80 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: "8px 16px", border: "1px solid #d1d5db", background: "white", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", border: "none", background: "#2a9d8f", color: "white", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>Create Family</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedCluster && (
        <ClusterDetailsModal 
          cluster={selectedCluster} 
          onClose={closeDetails} 
          onUpdate={async () => {
            const updated = await clusterApi.getOne(selectedCluster.id);
            setSelectedCluster(updated);
          }} 
        />
      )}
    </div>
  );
}

function ClusterDetailsModal({ cluster, onClose, onUpdate }) {
  const [patientSearch, setPatientSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!patientSearch || patientSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await patientsApi.getAll({ search: patientSearch, limit: 5 });
        setSearchResults(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  const handleAddMember = async (patient) => {
    try {
      await clusterApi.addPatient(cluster.id, patient.id);
      setPatientSearch("");
      onUpdate();
    } catch (err) {
      alert("Failed to add member: " + err.message);
    }
  };

  const handleRemoveMember = async (patientId) => {
    if (!confirm("Remove this member from the family cluster?")) return;
    try {
      await clusterApi.removePatient(cluster.id, patientId);
      onUpdate();
    } catch (err) {
      alert("Failed to remove member: " + err.message);
    }
  };

  const handleSetHead = async (patientId) => {
    try {
      await clusterApi.update(cluster.id, {
        label: cluster.label,
        notes: cluster.notes,
        head_patient_id: patientId
      });
      onUpdate();
    } catch (err) {
      alert("Failed to set head of family: " + err.message);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "white", padding: 0, borderRadius: 12, width: 600, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{cluster.label}</h2>
            <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>{cluster.notes || "No notes provided"}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={24} /></button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "#374151", fontWeight: 600 }}>Family Members ({cluster.members.length})</h4>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
              {cluster.members.length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No members yet.</div>
              ) : (
                cluster.members.map(m => (
                  <div key={m.id} style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", background: m.id === cluster.head_patient_id ? "#f0fdf4" : "white" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, background: "#f3f4f6", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                        <User size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>
                          {m.first_name} {m.last_name} 
                          {m.id === cluster.head_patient_id && <span style={{ marginLeft: 8, fontSize: 11, background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>HEAD</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>DOB: {m.date_of_birth}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {m.id !== cluster.head_patient_id && (
                        <button onClick={() => handleSetHead(m.id)} style={{ fontSize: 12, padding: "4px 8px", background: "white", border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }}>Set as Head</button>
                      )}
                      <button onClick={() => handleRemoveMember(m.id)} style={{ padding: 6, background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 4, cursor: "pointer" }}><Trash size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "#374151", fontWeight: 600 }}>Add Existing Patient</h4>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search patient by name..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6 }}
              />
              {patientSearch.length >= 2 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #e5e7eb", borderRadius: 6, marginTop: 4, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", zIndex: 10 }}>
                  {searching ? (
                    <div style={{ padding: 12, color: "#6b7280", fontSize: 13, textAlign: "center" }}>Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: 12, color: "#6b7280", fontSize: 13, textAlign: "center" }}>No matching patients found.</div>
                  ) : (
                    searchResults.map(p => {
                      const alreadyInCluster = cluster.members.some(m => m.id === p.id);
                      return (
                        <div 
                          key={p.id} 
                          onClick={() => !alreadyInCluster && handleAddMember(p)}
                          style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6", cursor: alreadyInCluster ? "not-allowed" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: alreadyInCluster ? 0.5 : 1 }}
                        >
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>{p.first_name} {p.last_name}</div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>DOB: {p.date_of_birth}</div>
                          </div>
                          {alreadyInCluster ? <span style={{ fontSize: 11, color: "#6b7280" }}>Added</span> : <Plus size={16} color="#2a9d8f" />}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default FamilyClusters;
