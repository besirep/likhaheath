import { apiFetch } from './apiFetch.js';

export const smsApi = {
  /**
   * POST /api/sms/send
   * @param {Object} payload 
   * @param {number} payload.patient_id
   * @param {number} [payload.appointment_id]
   * @param {string} payload.message
   */
  send: async (payload) => {
    const res = await apiFetch('/sms/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send SMS.');
    }
    return data;
  },
};
