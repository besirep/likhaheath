import { tokenStore } from './auth.js';

const BASE = 'http://localhost:5000/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${tokenStore.get()}`,
});

export const patientsApi = {
  /**
   * POST /api/patients
   * Creates a patient + address + contact_info in the normalized schema.
   */
  create: async (payload) => {
    const res = await fetch(`${BASE}/patients`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register patient.');
    return data;
  },

  /**
   * GET /api/patients?search=&page=&limit=
   */
  getAll: async ({ search = '', page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams({ search, page, limit });
    const res = await fetch(`${BASE}/patients?${params}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch patients.');
    return data;
  },

  /**
   * GET /api/patients/:id
   */
  getOne: async (id) => {
    const res = await fetch(`${BASE}/patients/${id}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Patient not found.');
    return data;
  },
};
