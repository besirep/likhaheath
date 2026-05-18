/**
 * apiFetch — Centralized fetch wrapper for LikhaHealth.
 *
 * - Attaches the Authorization header automatically.
 * - Intercepts 401 responses: clears the stored token and
 *   reloads the page so the user lands on the login screen.
 *   (Fixes Issue #9 — expired token leaves users on a broken UI)
 */
import { tokenStore } from './auth.js';
import { API_BASE_URL as BASE } from './config.js';

export async function apiFetch(path, options = {}) {
  const token = tokenStore.get();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // On 401, clear auth and redirect to login automatically
  if (res.status === 401) {
    tokenStore.clear();
    window.location.reload();          // triggers useAuth to see null token → shows Login
    throw new Error('Session expired. Please log in again.');
  }

  return res;
}
