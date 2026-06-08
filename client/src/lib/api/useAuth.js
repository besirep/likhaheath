/**
 * useAuth — central auth hook for LikhaHealth
 *
 * Reads the stored JWT on mount and resolves the user object.
 * Provides login / logout helpers used by App.jsx and Login.jsx.
 *
 * Token is stored in localStorage under 'lh_token'.
 * The token payload (decoded without verification on the client)
 * gives us: id, username, role, fullName, staffId, position.
 */

import { useState, useCallback } from 'react';
import { authApi, tokenStore } from './auth.js';

// ── Decode JWT payload without verification (client-side only) ──
function decodePayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// ── Map backend role → frontend role key ──
const ROLE_MAP = {
  Doctor:  'doctor',
  Admin:   'admin',
  Nurse:   'receptionist',
  Midwife: 'receptionist',
  BHW:     'receptionist',
  Receptionist: 'receptionist',
};

export function buildUserObject(apiUser, token) {
  const nameParts = (apiUser.fullName || apiUser.username).split(' ');
  const initials  = nameParts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  return {
    id:      apiUser.id,
    name:    apiUser.fullName || apiUser.username,
    title:   apiUser.position || apiUser.role,
    initials,
    role:    ROLE_MAP[apiUser.role] || 'receptionist',
    staffId: apiUser.staffId,
    token,
  };
}

export function useAuth() {
  // Hydrate from localStorage on first render
  const [user, setUser] = useState(() => {
    const token = tokenStore.get();
    if (!token) return null;
    const payload = decodePayload(token);
    if (!payload) { tokenStore.clear(); return null; }
    // Check token expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      tokenStore.clear();
      return null;
    }
    return buildUserObject(payload, token);
  });

  const login = useCallback(async (username, password) => {
    const { token, user: apiUser } = await authApi.login(username, password);
    tokenStore.set(token);
    const userObj = buildUserObject(apiUser, token);
    setUser(userObj);
    return userObj;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return { user, login, logout, setUser };
}
