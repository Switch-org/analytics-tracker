/**
 * React Hook for Analytics Tracking
 * Provides device, network, location, and attribution data
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  NetworkInfo,
  DeviceInfo,
  LocationInfo,
  AttributionInfo,
  UseAnalyticsReturn,
  AnalyticsConfig,
} from '../types';
// NetworkDetector removed - use connection from ipwho.is instead (more accurate)
// import { NetworkDetector } from '../detectors/network-detector';
import { DeviceDetector } from '../detectors/device-detector';
import { LocationDetector } from '../detectors/location-detector';
import { AttributionDetector } from '../detectors/attribution-detector';
import { AnalyticsService } from '../services/analytics-service';
import { getOrCreateUserId, trackPageVisit, getOrCreateSession, updateSessionActivity } from '../utils/storage';
import { hasLocationConsent } from '../utils/location-consent';
import { initDebug } from '../utils/debug';

export interface UseAnalyticsOptions {
  autoSend?: boolean;
  config?: Partial<AnalyticsConfig>;
  onReady?: (data: {
    sessionId: string;
    networkInfo: NetworkInfo;
    deviceInfo: DeviceInfo;
    location: LocationInfo;
    attribution: AttributionInfo;
  }) => void;
}

/**
 * React hook for analytics tracking
 * 
 * @example
 * ```tsx
 * const { sessionId, networkInfo, deviceInfo, logEvent } = useAnalytics({
 *   autoSend: true,
 *   config: { apiEndpoint: '/api/analytics' }
 * });
 * ```
 */
export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const { autoSend = true, config, onReady } = options;

  // Configure analytics service if endpoint provided
  useEffect(() => {
    if (config?.apiEndpoint) {
      AnalyticsService.configure({
        apiEndpoint: config.apiEndpoint,
        batchSize: config.batchSize,
        batchInterval: config.batchInterval,
        maxQueueSize: config.maxQueueSize,
        maxRetries: config.maxRetries,
        retryDelay: config.retryDelay,
        logLevel: config.logLevel,
        enableMetrics: config.enableMetrics,
        sessionTimeout: config.sessionTimeout,
        fieldStorage: config.fieldStorage,
        ipLocationFields: config.ipLocationFields, // Legacy support
      });
    }
  }, [
    config?.apiEndpoint,
    config?.batchSize,
    config?.batchInterval,
    config?.maxQueueSize,
    config?.maxRetries,
    config?.retryDelay,
    config?.logLevel,
    config?.enableMetrics,
    config?.sessionTimeout,
  ]);

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [attribution, setAttribution] = useState<AttributionInfo | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pageVisits, setPageVisits] = useState<number>(1);
  const [interactions, setInteractions] = useState<number>(0);
  const [location, setLocation] = useState<LocationInfo | null>(null);

  // Guards to prevent infinite loops
  const didInit = useRef(false);
  const sessionLoggedRef = useRef(false);
  const locationFetchingRef = useRef(false);
  const lastLocationRef = useRef<LocationInfo | null>(null);
  const locationConsentLoggedRef = useRef(false);

  // Expose function to clear location cache (for when consent is granted)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__clearLocationCache = () => {
        LocationDetector.clearCache();
        lastLocationRef.current = null;
        locationFetchingRef.current = false;
        locationConsentLoggedRef.current = false;
      };
    }
  }, []);

  // Initialize debug tools in development
  useEffect(() => {
    initDebug();
  }, []);

  const refresh = useCallback(async () => {
    // Don't collect networkInfo - use connection from ipwho.is instead (more accurate)
    // const net = NetworkDetector.detect(); // Removed - use ipwho.is connection instead
    const dev = await DeviceDetector.detect();
    const attr = AttributionDetector.detect();
    const uid = getOrCreateUserId();
    const pv = trackPageVisit();

    // Check consent status - if consent exists but cached location doesn't reflect it, re-fetch
    const hasConsent = hasLocationConsent();
    const shouldRefetchLocation =
      !lastLocationRef.current ||
      (hasConsent && lastLocationRef.current.permission !== 'granted');

    // Fetch location if needed
    let loc: LocationInfo;
    if (!locationFetchingRef.current && shouldRefetchLocation) {
      locationFetchingRef.current = true;
      try {
        loc = await LocationDetector.detect();
        lastLocationRef.current = loc;

        // If we have consent, ensure location reflects it
        if (hasConsent && loc.permission !== 'granted') {
          loc = {
            ...loc,
            permission: 'granted',
          };
          lastLocationRef.current = loc;
        }
      } finally {
        locationFetchingRef.current = false;
      }
    } else {
      // Use cached location, but update permission if consent exists
      loc =
        lastLocationRef.current ||
        ({ source: 'unknown', permission: hasConsent ? 'granted' : 'prompt' } as LocationInfo);

      // If we have consent but cached location doesn't reflect it, update it
      if (hasConsent && loc.permission !== 'granted') {
        loc = {
          ...loc,
          permission: 'granted',
        };
        lastLocationRef.current = loc;
      }
    }

    // networkInfo removed - use connection from ipwho.is instead
    setNetworkInfo(null); // Set to null - connection data comes from ipwho.is
    setDeviceInfo(dev);
    setAttribution(attr);
    setSessionId(uid);
    setPageVisits(pv);
    setLocation(loc);

    // Call onReady callback if provided
    if (onReady && !sessionLoggedRef.current) {
      onReady({
        sessionId: uid,
        networkInfo: null as any, // Use connection from ipwho.is instead (more accurate)
        deviceInfo: dev,
        location: loc,
        attribution: attr,
      });
    }

    // Return null for net - connection data comes from ipwho.is instead
    return { net: null as any, dev, attr, loc }; // net is null - use ipwho.is connection instead
  }, [onReady]);

  // Initialize on mount
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    (async () => {
      const { net, dev, attr, loc } = await refresh();

      if (autoSend) {
        // Send after idle to not block paint
        const send = async () => {
          // Extract IP location data if available (stored in ipLocationData field)
          const ipLocationData = (loc as any)?.ipLocationData;
          
          await AnalyticsService.trackUserJourney({
            sessionId: getOrCreateUserId(),
            pageUrl: typeof window !== 'undefined' ? window.location.href : '',
            networkInfo: net,
            deviceInfo: dev,
            location: loc,
            attribution: attr,
            ipLocation: ipLocationData,
            customData: config?.enableLocation ? { locationEnabled: true } : undefined,
          });
        };
        if (typeof window !== 'undefined' && (window as any).requestIdleCallback) {
          (window as any).requestIdleCallback(send);
        } else {
          setTimeout(send, 0);
        }
      }
    })();
  }, [autoSend, refresh, config?.enableLocation]);

  const logEvent = useCallback(
    async (customData?: Record<string, any>) => {
      if (!sessionId || !networkInfo || !deviceInfo) return;

      // Extract IP location data if available (stored in ipLocationData field)
      const ipLocationData = location ? (location as any)?.ipLocationData : undefined;

      await AnalyticsService.trackUserJourney({
        sessionId,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        networkInfo,
        deviceInfo,
        location: location ?? undefined,
        attribution: attribution ?? undefined,
        ipLocation: ipLocationData,
        userId: sessionId,
        customData,
      });

      setInteractions((prev) => prev + 1);
    },
    [sessionId, networkInfo, deviceInfo, location, attribution]
  );

  /**
   * Track a custom event (Firebase/GA-style)
   * Automatically uses current session context
   * 
   * @param eventName - Name of the event (e.g., 'button_click', 'purchase')
   * @param parameters - Event-specific parameters (optional)
   * 
   * @example
   * ```tsx
   * const { trackEvent } = useAnalytics();
   * 
   * // Track button click
   * trackEvent('button_click', { 
   *   button_name: 'signup',
   *   button_location: 'header' 
   * });
   * 
   * // Track purchase
   * trackEvent('purchase', {
   *   transaction_id: 'T12345',
   *   value: 29.99,
   *   currency: 'USD'
   * });
   * ```
   */
  const trackEvent = useCallback(
    async (eventName: string, parameters?: Record<string, any>) => {
      // Wait for context to be available
      if (!sessionId || !networkInfo || !deviceInfo) {
        // If context not ready, still track but with auto-collected context
        await AnalyticsService.logEvent(eventName, parameters);
        return;
      }

      // Use hook context for more accurate tracking
      await AnalyticsService.logEvent(eventName, parameters, {
        sessionId,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        networkInfo,
        deviceInfo,
        location: location ?? undefined,
        attribution: attribution ?? undefined,
        userId: sessionId,
      });

      setInteractions((prev) => prev + 1);
    },
    [sessionId, networkInfo, deviceInfo, location, attribution]
  );

  /**
   * Track a page view event (Firebase/GA-style)
   * Automatically uses current session context
   * 
   * @param pageName - Optional page name (defaults to current pathname)
   * @param parameters - Optional page view parameters
   * 
   * @example
   * ```tsx
   * const { trackPageView } = useAnalytics();
   * 
   * // Track current page
   * trackPageView();
   * 
   * // Track with custom name
   * trackPageView('/dashboard', {
   *   page_title: 'Dashboard',
   *   user_type: 'premium'
   * });
   * ```
   */
  const trackPageView = useCallback(
    async (pageName?: string, parameters?: Record<string, any>) => {
      // Wait for context to be available
      if (!sessionId || !networkInfo || !deviceInfo) {
        // If context not ready, still track but with auto-collected context
        await AnalyticsService.trackPageView(pageName, parameters);
        return;
      }

      // Use hook context for more accurate tracking
      const page = pageName || (typeof window !== 'undefined' ? window.location.pathname : '');
      await AnalyticsService.logEvent('page_view', {
        page_name: page,
        page_title: typeof document !== 'undefined' ? document.title : undefined,
        ...parameters,
      }, {
        sessionId,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        networkInfo,
        deviceInfo,
        location: location ?? undefined,
        attribution: attribution ?? undefined,
        userId: sessionId,
      });

      setInteractions((prev) => prev + 1);
    },
    [sessionId, networkInfo, deviceInfo, location, attribution]
  );

  const incrementInteraction = useCallback(() => {
    setInteractions((n) => n + 1);
  }, []);

  // Session management
  useEffect(() => {
    if (config?.sessionTimeout) {
      getOrCreateSession(config.sessionTimeout);
      // Update session activity on user interactions
      const activityInterval = setInterval(() => {
        updateSessionActivity();
      }, 60000); // Update every minute

      return () => clearInterval(activityInterval);
    }
  }, [config?.sessionTimeout]);

  return useMemo(
    () => ({
      sessionId,
      networkInfo,
      deviceInfo,
      location,
      attribution,
      pageVisits, // Used in return
      interactions, // Used in return
      logEvent,
      trackEvent,
      trackPageView,
      incrementInteraction,
      refresh,
    }),
    [
      sessionId,
      networkInfo,
      deviceInfo,
      location,
      attribution,
      pageVisits,
      interactions,
      logEvent,
      trackEvent,
      trackPageView,
      incrementInteraction,
      refresh,
    ]
  );
}

