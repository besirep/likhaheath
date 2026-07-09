import { apiFetch } from './apiFetch.js';

export const dashboardApi = {
  /**
   * GET /api/dashboard/stats?period=today|week|month
   * Returns stats scoped to the given time frame.
   */
  getStats: async (period = 'today') => {
    const res  = await apiFetch(`/dashboard/stats?period=${period}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch dashboard stats.');
    return data;
  },

  /**
   * GET /api/dashboard/recent
   * Returns: { recent_patients: [], recent_records: [] }
   */
  getRecent: async () => {
    const res  = await apiFetch('/dashboard/recent');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch recent data.');
    return data;
  },
};
