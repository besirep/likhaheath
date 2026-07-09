import { apiFetch } from './apiFetch.js';

export const reportsApi = {
  /**
   * GET /api/reports?days=7|30
   * Returns: { dailyQueue, hourlyFlow, priorityBreakdown, topReasons, doctorLoad, smsWeekly, waitTimeWeek }
   */
  getWeekly: async (days = 7) => {
    const res  = await apiFetch(`/reports?days=${days}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch report data.');
    return data;
  },

  /**
   * GET /api/reports/reasons?days=7&search=&limit=50
   * Returns full case-normalized visit reason list for the "View More" modal.
   */
  getReasons: async ({ days = 7, search = '', limit = 50 } = {}) => {
    const params = new URLSearchParams({ days, limit });
    if (search) params.append('search', search);
    const res  = await apiFetch(`/reports/reasons?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch visit reasons.');
    return data;
  },
};
