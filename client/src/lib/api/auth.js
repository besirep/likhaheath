import { API_BASE_URL as BASE } from './config.js';

export const authApi = {
  /**
   * POST /api/auth/login
   * @param {string} username
   * @param {string} password
   * @returns {{ token: string, user: object }}
   */
  login: async (username, password) => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');
    return data;
  },
};

// ── Token helpers ──────────────────────────────────────────────────────────────
export const tokenStore = {
  set: (token) => localStorage.setItem('lh_token', token),
  get: () => localStorage.getItem('lh_token'),
  clear: () => localStorage.removeItem('lh_token'),
};
