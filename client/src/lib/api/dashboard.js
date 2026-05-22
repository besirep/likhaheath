import { apiFetch } from './apiFetch.js';

export const dashboardApi = {
  /**
   * GET /api/dashboard/stats
   * Returns: { total_patients, today_appointments, waiting_queue,
   *            total_doctors, total_staff, records_today, expiring_licenses }
   */
  getStats: async () => {
    const res  = await apiFetch('/dashboard/stats');
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
