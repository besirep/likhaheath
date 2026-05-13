/**
 * Centralized API configuration.
 * Uses Vite environment variables so different developers can point to 
 * different backend ports/hosts using a client/.env file.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
