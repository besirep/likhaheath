import { apiFetch } from './apiFetch.js';

export const staffApi = {
  /**
   * GET /api/staff?search=&position=
   * @param {{ search?: string, position?: string }} params
   * @returns {Promise<Array>}
   */
  getAll: async ({ search = '', position = '' } = {}) => {
    const qs  = new URLSearchParams({ search, position });
    const res = await apiFetch(`/staff?${qs}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch staff.');
    return data;
  },

  /**
   * GET /api/staff/:id
   */
  getOne: async (id) => {
    const res  = await apiFetch(`/staff/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Staff not found.');
    return data;
  },

  /**
   * POST /api/staff
   * Required: { first_name, last_name, position, health_center_id }
   */
  create: async (payload) => {
    const res  = await apiFetch('/staff', { method: 'POST', body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create staff.');
    return data;
  },

  /**
   * PUT /api/staff/:id
   */
  update: async (id, payload) => {
    const res  = await apiFetch(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update staff.');
    return data;
  },

  /**
   * PATCH /api/staff/:id/status
   */
  toggleStatus: async (id) => {
    const res  = await apiFetch(`/staff/${id}/status`, { method: 'PATCH' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle staff status.');
    return data;
  },
};
