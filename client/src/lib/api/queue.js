import { apiFetch } from './apiFetch.js';

/** Status map: backend title-case → frontend kebab-case */
export const STATUS_FROM_DB = {
  'Waiting':     'waiting',
  'In-Progress': 'in-consultation',
  'Done':        'done',
  'Skipped':     'skipped',
};

/** Status map: frontend kebab-case → backend title-case (for PATCH) */
export const STATUS_TO_DB = {
  'waiting':         'Waiting',
  'in-consultation': 'In-Progress',
  'done':            'Done',
  'skipped':         'Skipped',
};

/**
 * Normalize a raw queue row from the backend into the shape
 * the frontend components expect.
 */
export function normalizeQueueItem(row) {
  // Compute age from date_of_birth
  const dob = row.date_of_birth ? new Date(row.date_of_birth) : null;
  const age  = dob
    ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  // Arrived time from scheduled_date
  const arrived = row.scheduled_date
    ? new Date(row.scheduled_date).toLocaleTimeString('en-PH', {
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

  // Derive vitals-done status: if vitals exist AND status is still Waiting → vitals-done
  let frontendStatus = STATUS_FROM_DB[row.status] || 'waiting';
  if (row.has_vitals && frontendStatus === 'waiting') {
    frontendStatus = 'vitals-done';
  }

  // Map sex to M/F
  const gender = row.sex === 'Female' ? 'F' : row.sex === 'Male' ? 'M' : '?';

  // Priority tag from DB (e.g. 'elderly', 'pregnant', 'pediatric', 'pwd')
  const priority = row.priority_tag || null;

  // Format vitals object if present
  const vitals = row.has_vitals
    ? {
        bp:     row.blood_pressure  || null,
        temp:   row.temperature != null ? String(row.temperature) : null,
        hr:     row.heart_rate     != null ? String(row.heart_rate)  : null,
        spo2:   row.spo2           != null ? String(row.spo2)        : null,
        weight: row.weight_kg      != null ? String(row.weight_kg)   : null,
        height: row.height_cm      != null ? String(row.height_cm)   : null,
      }
    : null;

  return {
    id:           row.id,                             // queue.id
    queueDbId:    row.id,                             // same, used for PATCH
    queue_number: row.queue_number,                   // raw number for sorting
    queue:        `Q-${String(row.queue_number).padStart(3, '0')}`,
    name:         row.patient_name,
    age,
    gender,
    reason:       row.chief_complaint || row.notes || '—',
    status:       frontendStatus,
    doctor:       row.doctor_name || null,
    arrived,
    wait:         '—',                                // computed server-side in future
    priority,
    contact:      row.contact_number || null,
    vitals,
    appointmentId: row.appointment_id,
    patientId:    row.patient_id,
  };
}

export const queueApi = {
  /** GET /api/queue — today's queue, normalized */
  getToday: async () => {
    const res  = await apiFetch('/queue');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch queue.');
    return Array.isArray(data) ? data.map(normalizeQueueItem) : [];
  },

  /** PATCH /api/queue/:id/status */
  updateStatus: async (queueId, frontendStatus) => {
    const dbStatus = STATUS_TO_DB[frontendStatus];
    if (!dbStatus) throw new Error(`Unknown status: ${frontendStatus}`);
    const res  = await apiFetch(`/queue/${queueId}/status`, {
      method: 'PATCH',
      body:   JSON.stringify({ status: dbStatus }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update queue status.');
    return data;
  },

  /** GET /api/queue/next */
  getNext: async () => {
    const res  = await apiFetch('/queue/next');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get next patient.');
    return data;
  },
};
