import { apiFetch } from './apiFetch.js';

export const smsApi = {
  /**
   * POST /api/sms/send
   * @param {Object} payload
   * @param {number} payload.patient_id
   * @param {number} [payload.appointment_id]
   * @param {string} payload.message
   * @param {string} [payload.phone] - Optional override phone number
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

  /**
   * GET /api/sms/history
   * Returns all SMS notifications (most recent first, limit 200)
   */
  getHistory: async () => {
    const res = await apiFetch('/sms/history');
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load SMS history.');
    }
    return data;
  },

  /**
   * GET /api/sms/patient/:id
   * Returns SMS history for a specific patient
   * @param {number} patientId
   */
  getByPatient: async (patientId) => {
    const res = await apiFetch(`/sms/patient/${patientId}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load patient SMS history.');
    }
    return data;
  },
};
