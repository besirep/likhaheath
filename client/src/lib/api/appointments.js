import { apiFetch } from './apiFetch.js';

export const appointmentsApi = {
  /**
   * GET /api/appointments
   * Query params: { date?, status?, doctor_id? }
   * Returns array of appointment rows.
   */
  getAll: async ({ date, status, doctor_id } = {}) => {
    const params = new URLSearchParams();
    if (date)      params.set('date',      date);
    if (status)    params.set('status',    status);
    if (doctor_id) params.set('doctor_id', doctor_id);
    const qs  = params.toString();
    const res  = await apiFetch(`/appointments${qs ? `?${qs}` : ''}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch appointments.');
    return data; // array
  },

  /**
   * GET /api/appointments/today
   * Returns today's appointments with queue status.
   */
  getToday: async () => {
    const res  = await apiFetch('/appointments/today');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch today\'s appointments.');
    return data;
  },

  /**
   * POST /api/appointments
   * Body: { patient_id, doctor_id?, scheduled_date, notes?, visit_reason? }
   * Returns: { id, queue_number, message }
   */
  create: async (payload) => {
    const res  = await apiFetch('/appointments', {
      method: 'POST',
      body:   JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create appointment.');
    return data;
  },

  /**
   * PUT /api/appointments/:id
   * Body: { status, doctor_id?, scheduled_date? }
   */
  update: async (id, payload) => {
    const res  = await apiFetch(`/appointments/${id}`, {
      method: 'PUT',
      body:   JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update appointment.');
    return data;
  },

  /**
   * DELETE /api/appointments/:id  (soft-cancel)
   */
  cancel: async (id) => {
    const res  = await apiFetch(`/appointments/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel appointment.');
    return data;
  },
};
