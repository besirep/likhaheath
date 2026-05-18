/**
 * Centralized API configuration.
 *
 * For LAN deployment: create a file called `client/.env.local` and set:
 *   VITE_API_BASE_URL=http://192.168.1.10:5000/api
 *
 * Replace 192.168.1.10 with the server PC's actual LAN IP address.
 * The .env.local file is gitignored and won't be committed.
 *
 * For local development (same machine), no .env.local is needed —
 * it defaults to localhost:5000.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
