/**
 * Centralized API endpoint map.
 *
 * All backend paths live here so UI code never concatenates strings and we
 * can refactor routes in one place. Every path is routed via the Kubernetes
 * ingress `/api` prefix rule and consumed by the frontend through
 * REACT_APP_BACKEND_URL (resolved in httpClient).
 *
 * P4 note: the `mix-sessions` / `sessions` endpoints have been replaced by
 * `learning-sessions`, matching the backend bounded-context name. Legacy
 * `mixSessions` / `sessions` keys were intentionally removed so the compiler
 * catches any stale call sites.
 */

const API_PREFIX = "/api";

export const endpoints = {
  learningSessions: {
    create: () => `${API_PREFIX}/learning-sessions`,
    byPublicCode: (publicCode: string) =>
      `${API_PREFIX}/learning-sessions/${encodeURIComponent(publicCode)}`,
  },
  contactRequests: {
    create: () => `${API_PREFIX}/contact-requests`,
  },
  pricing: () => `${API_PREFIX}/pricing`,
  health: () => `${API_PREFIX}/health`,
  adminHealth: () => `${API_PREFIX}/admin/health`,
} as const;

export type Endpoints = typeof endpoints;
