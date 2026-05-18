import { apiFetch } from './apiFetch.js';

export const patientsApi = {
  /** POST /api/patients — register new patient + creates appointment + queue entry */
  create: async (payload) => {
    const res = await apiFetch('/patients', {
      method: 'POST',
      body:   JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register patient.');
    return data; // { patient_id, appointment_id, queue_number }
  },

  /** POST /api/patients/:id/visit — queue a returning (existing) patient */
  createVisit: async (patientId, payload) => {
    const res = await apiFetch(`/patients/${patientId}/visit`, {
      method: 'POST',
      body:   JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add patient to queue.');
    return data; // { patient_id, appointment_id, queue_number, patient_name }
  },

  /** GET /api/patients?search=&page=&limit= */
  getAll: async ({ search = '', page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams({ search, page, limit });
    const res  = await apiFetch(`/patients?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch patients.');
    return data; // { data: [], total, page, limit }
  },

  /** GET /api/patients/:id */
  getOne: async (id) => {
    const res  = await apiFetch(`/patients/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Patient not found.');
    return data;
  },

  /** GET /api/patients/:id/visits — all appointment/visit records */
  getVisits: async (id) => {
    const res  = await apiFetch(`/patients/${id}/visits`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load visit history.');
    return data; // { data: [], total }
  },
};

