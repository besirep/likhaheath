import { tokenStore } from './auth.js';
import { API_BASE_URL as BASE } from './config.js';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${tokenStore.get()}`,
});

export const staffApi = {
  /**
   * GET /api/staff?position=Doctor
   * Fetches all active staff, optionally filtered by position.
   */
  getAll: async ({ search = '', position = '' } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (position) params.set('position', position);
    const res = await fetch(`${BASE}/staff?${params}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch staff.');
    return data;
  },

  /**
   * GET /api/staff/:id
   */
  getOne: async (id) => {
    const res = await fetch(`${BASE}/staff/${id}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Staff not found.');
    return data;
  },
};
