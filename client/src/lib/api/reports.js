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
};
