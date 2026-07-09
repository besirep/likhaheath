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
    return data; // { patient_id, appointment_id, queue_id, queue_number, patient_name }
  },

  /** PATCH /api/patients/:id/visits/:appointmentId — update visit reason/doctor/priority after queue # issued */
  updateVisit: async (patientId, queueId, payload) => {
    const res  = await apiFetch(`/patients/${patientId}/visits/${queueId}`, {
      method: 'PATCH',
      body:   JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update visit details.');
    return data;
  },

  /** GET /api/patients?search=&page=&limit= */
  getAll: async ({ search = '', page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams({ search, page, limit });
    const res  = await apiFetch(`/patients?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch patients.');
    return data; // { data: [], total, page, limit }
  },

  /** PUT /api/patients/:id */
  update: async (id, payload) => {
    const res = await apiFetch(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update patient.');
    return data;
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

  /** PUT /api/patients/:id — update patient profile */
  update: async (id, payload) => {
    const res = await apiFetch(`/patients/${id}`, {
      method: 'PUT',
      body:   JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update patient.');
    return data;
  },

  /** PATCH /api/patients/:id/medical-history — update medical history */
  updateMedicalHistory: async (id, payload) => {
    const res = await apiFetch(`/patients/${id}/medical-history`, {
      method: 'PATCH',
      body:   JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update medical history.');
    return data;
  },
};

