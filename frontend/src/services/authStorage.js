/**
 * authStorage.js — thin wrapper around localStorage for auth state.
 *
 * Stores: { userId, name, email, picture, role }
 * Read by api.js interceptor to attach X-User-Id / X-User-Role headers.
 */

const KEY = 'campus_auth';

export const authStorage = {
  /** Save user session returned from POST /api/auth/google */
  save(user) {
    localStorage.setItem(KEY, JSON.stringify(user));
  },

  /** Load current session. Returns null if not logged in. */
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /** Clear session on logout. */
  clear() {
    localStorage.removeItem(KEY);
  },

  /** Quick getters */
  get userId()  { return this.load()?.userId  ?? null; },
  get role()    { return this.load()?.role     ?? null; },
  get name()    { return this.load()?.name     ?? null; },
  get email()   { return this.load()?.email    ?? null; },
  get picture() { return this.load()?.picture  ?? null; },
  get isLoggedIn() { return !!this.load()?.userId; },
};
