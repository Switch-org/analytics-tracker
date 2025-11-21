/**
 * @atif/analytics-tracker
 * Comprehensive analytics tracking library with device detection,
 * network analysis, location tracking, and IP geolocation
 */

// Types
export type {
  NetworkType,
  DeviceType,
  NetworkInfo,
  DeviceInfo,
  LocationInfo,
  AttributionInfo,
  IPLocation,
  AnalyticsConfig,
  AnalyticsEvent,
  UseAnalyticsReturn,
} from './types';

// Detectors
export { NetworkDetector } from './detectors/network-detector';
export { DeviceDetector } from './detectors/device-detector';
export { LocationDetector } from './detectors/location-detector';
export { AttributionDetector } from './detectors/attribution-detector';

// Services
export { AnalyticsService } from './services/analytics-service';

// React Hook
export { useAnalytics } from './hooks/useAnalytics';
export type { UseAnalyticsOptions } from './hooks/useAnalytics';

// Utilities
export {
  getOrCreateUserId,
  trackPageVisit,
  loadJSON,
  saveJSON,
  loadSessionJSON,
  saveSessionJSON,
} from './utils/storage';

export {
  setLocationConsentGranted,
  hasLocationConsent,
  getLocationConsentTimestamp,
  clearLocationConsent,
  checkAndSetLocationConsent,
} from './utils/location-consent';

export { getIPLocation, getIPFromRequest } from './utils/ip-geolocation';

// Default export for convenience
export { useAnalytics as default } from './hooks/useAnalytics';

