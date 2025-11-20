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

