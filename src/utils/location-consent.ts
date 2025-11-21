/**
 * Location Consent Manager
 * When user enters MSISDN, they implicitly consent to location tracking
 * This utility manages the consent state and prevents unnecessary permission prompts
 */

const LOCATION_CONSENT_KEY = 'analytics:locationConsent';
const LOCATION_CONSENT_TIMESTAMP_KEY = 'analytics:locationConsentTimestamp';

/**
 * Set location consent as granted (when MSISDN is provided)
 */
export function setLocationConsentGranted(): void {
  if (typeof window === 'undefined') return;

  try {
    const timestamp = new Date().toISOString();
    localStorage.setItem(LOCATION_CONSENT_KEY, 'granted');
    localStorage.setItem(LOCATION_CONSENT_TIMESTAMP_KEY, timestamp);
    console.log('[Location Consent] Granted at:', timestamp);
  } catch (error) {
    console.warn('[Location Consent] Failed to save consent:', error);
  }
}

/**
 * Check if location consent has been granted
 */
export function hasLocationConsent(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const consent = localStorage.getItem(LOCATION_CONSENT_KEY);
    return consent === 'granted';
  } catch (error) {
    console.warn('[Location Consent] Failed to check consent:', error);
    return false;
  }
}

/**
 * Get location consent timestamp
 */
export function getLocationConsentTimestamp(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(LOCATION_CONSENT_TIMESTAMP_KEY);
  } catch (_error) {
    return null;
  }
}

/**
 * Clear location consent (for testing or user revocation)
 */
export function clearLocationConsent(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(LOCATION_CONSENT_KEY);
    localStorage.removeItem(LOCATION_CONSENT_TIMESTAMP_KEY);
    console.log('[Location Consent] Cleared');
  } catch (error) {
    console.warn('[Location Consent] Failed to clear consent:', error);
  }
}

/**
 * Check if MSISDN is provided and set consent accordingly
 * Call this whenever MSISDN is detected
 */
export function checkAndSetLocationConsent(msisdn?: string | null): boolean {
  if (msisdn && typeof msisdn === 'string' && msisdn.trim().length > 0) {
    // User has provided MSISDN, which means they consent to location tracking
    setLocationConsentGranted();
    return true;
  }
  return false;
}

