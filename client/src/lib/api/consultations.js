import { apiFetch } from './apiFetch.js';

export const consultationsApi = {
  /**
   * Fetch today's queue for the logged-in doctor.
   * @returns {Promise<Array>} List of queue entries with patient + vitals data.
   */
  getDoctorQueue: async () => {
    const res = await apiFetch('/consultations/queue');
    if (!res.ok) throw new Error('Failed to fetch doctor queue.');
    return res.json();
  },

  /**
   * Update a queue entry's status.
   * @param {number} queueId
   * @param {'Waiting'|'In-Progress'|'Done'|'Skipped'} status
   */
  updateQueueStatus: async (queueId, status) => {
    const res = await apiFetch(`/consultations/queue/${queueId}/status`, {
      method: 'PATCH',
      body:   JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update queue status.');
    return res.json();
  },

  /**
   * Save a completed consultation (creates a medical record).
   * @param {{ appointmentId, patientId, diagnosis, treatment, notes, followUpDate }} data
   */
  saveConsultation: async (data) => {
    const res = await apiFetch('/consultations', {
      method: 'POST',
      body:   JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save consultation.');
    return res.json();
  },

  /**
   * Fetch the doctor's past consultation history.
   * @returns {Promise<Array>} List of past medical records.
   */
  getHistory: async () => {
    const res = await apiFetch('/consultations/history');
    if (!res.ok) throw new Error('Failed to fetch consultation history.');
    return res.json();
  },
};
