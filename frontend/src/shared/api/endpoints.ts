/**
 * Centralized API endpoint map.
 *
 * All backend paths live here so UI code never concatenates strings and we
 * can refactor routes in one place. Every path is routed via the Kubernetes
 * ingress `/api` prefix rule and consumed by the frontend through
 * REACT_APP_BACKEND_URL (resolved in httpClient).
 */

const API_PREFIX = "/api";

export const endpoints = {
  mixSessions: {
    create: () => `${API_PREFIX}/mix-sessions`,
    byCode: (code: string) =>
      `${API_PREFIX}/mix-sessions/${encodeURIComponent(code)}`,
  },
  sessions: {
    create: () => `${API_PREFIX}/sessions`,
  },
  contactRequests: {
    create: () => `${API_PREFIX}/contact-requests`,
  },
  health: () => `${API_PREFIX}/health`,
} as const;

export type Endpoints = typeof endpoints;
