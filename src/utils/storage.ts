/**
 * Storage utilities for analytics tracking
 */

export const loadJSON = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
};

export const saveJSON = (key: string, obj: unknown): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(obj));
  } catch {
    // Silently fail if storage is unavailable
  }
};

export const loadSessionJSON = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const s = sessionStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
};

export const saveSessionJSON = (key: string, obj: unknown): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(obj));
  } catch {
    // Silently fail if storage is unavailable
  }
};

/**
 * Generate or retrieve a user ID from localStorage
 */
export function getOrCreateUserId(length = 8): string {
  if (typeof window === 'undefined') {
    return `server-${Date.now()}`;
  }

  const storageKey = 'analytics:userId';
  let userId = localStorage.getItem(storageKey);

  if (!userId) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    userId = result;
    localStorage.setItem(storageKey, userId);
  }

  return userId;
}

/**
 * Track page visits with localStorage
 */
export function trackPageVisit(): number {
  if (typeof window === 'undefined') return 1;

  const storedCount = localStorage.getItem('analytics:pageVisits');
  const newCount = storedCount ? parseInt(storedCount, 10) + 1 : 1;
  localStorage.setItem('analytics:pageVisits', newCount.toString());
  return newCount;
}

/**
 * Session management utilities
 */
export interface SessionInfo {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
}

const SESSION_STORAGE_KEY = 'analytics:session';
const DEFAULT_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

/**
 * Get or create a session
 */
export function getOrCreateSession(timeout: number = DEFAULT_SESSION_TIMEOUT): SessionInfo {
  if (typeof window === 'undefined') {
    return {
      sessionId: `server-${Date.now()}`,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 1,
    };
  }

  const stored = loadJSON<SessionInfo>(SESSION_STORAGE_KEY);
  const now = Date.now();

  // Check if session expired
  if (stored && now - stored.lastActivity < timeout) {
    // Update last activity
    const updated: SessionInfo = {
      ...stored,
      lastActivity: now,
      pageViews: stored.pageViews + 1,
    };
    saveJSON(SESSION_STORAGE_KEY, updated);
    return updated;
  }

  // Create new session
  const sessionId = `session-${Date.now()}-${getSecureRandomString(16)}`;
  const newSession: SessionInfo = {
    sessionId,
    startTime: now,
    lastActivity: now,
    pageViews: 1,
  };
  saveJSON(SESSION_STORAGE_KEY, newSession);
  return newSession;
}

/**
 * Update session activity
 */
export function updateSessionActivity(): void {
  if (typeof window === 'undefined') return;

  const stored = loadJSON<SessionInfo>(SESSION_STORAGE_KEY);
  if (stored) {
    const updated: SessionInfo = {
      ...stored,
      lastActivity: Date.now(),
    };
    saveJSON(SESSION_STORAGE_KEY, updated);
  }
}

/**
 * Get current session info
 */
export function getSession(): SessionInfo | null {
  return loadJSON<SessionInfo>(SESSION_STORAGE_KEY);
}

/**
 * Clear session
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Generate a cryptographically secure random string.
 * Length is the number of bytes, which are hex-encoded (2 chars per byte).
 */
function getSecureRandomString(length: number): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    let result = '';
    for (let i = 0; i < bytes.length; i++) {
      const hex = bytes[i].toString(16).padStart(2, '0');
      result += hex;
    }
    return result;
  }

  // Fallback to a less secure method only if crypto is unavailable.
  // This should be rare in modern browsers.
  return Math.random().toString(36).substring(2, 2 + length);
}
