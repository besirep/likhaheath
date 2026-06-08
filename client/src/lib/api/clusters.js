import { apiFetch } from "./apiFetch.js";

export const clusterApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    
    const res = await apiFetch(`/clusters?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch clusters");
    return data;
  },
  
  getOne: async (id) => {
    const res = await apiFetch(`/clusters/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch cluster details");
    return data;
  },
  
  create: async (payload) => {
    const res = await apiFetch(`/clusters`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create cluster");
    return data;
  },
  
  update: async (id, payload) => {
    const res = await apiFetch(`/clusters/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update cluster");
    return data;
  },
  
  addPatient: async (clusterId, patientId) => {
    const res = await apiFetch(`/clusters/${clusterId}/patients/${patientId}`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to add patient to cluster");
    return data;
  },
  
  removePatient: async (clusterId, patientId) => {
    const res = await apiFetch(`/clusters/${clusterId}/patients/${patientId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to remove patient from cluster");
    return data;
  }
};
