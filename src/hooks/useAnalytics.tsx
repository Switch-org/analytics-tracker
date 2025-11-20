/**
 * React Hook for Analytics Tracking
 * Provides device, network, location, and attribution data
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  NetworkInfo,
  DeviceInfo,
  LocationInfo,
  AttributionInfo,
  UseAnalyticsReturn,
  AnalyticsConfig,
} from '../types';
import { NetworkDetector } from '../detectors/network-detector';
import { DeviceDetector } from '../detectors/device-detector';
import { LocationDetector } from '../detectors/location-detector';
import { AttributionDetector } from '../detectors/attribution-detector';
import { AnalyticsService } from '../services/analytics-service';
import { getOrCreateUserId, trackPageVisit } from '../utils/storage';
import { hasLocationConsent } from '../utils/location-consent';

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
      AnalyticsService.configure({ apiEndpoint: config.apiEndpoint });
    }
  }, [config?.apiEndpoint]);

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

  const refresh = useCallback(async () => {
    const net = NetworkDetector.detect();
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

    setNetworkInfo(net);
    setDeviceInfo(dev);
    setAttribution(attr);
    setSessionId(uid);
    setPageVisits(pv);
    setLocation(loc);

    // Call onReady callback if provided
    if (onReady && !sessionLoggedRef.current) {
      onReady({
        sessionId: uid,
        networkInfo: net,
        deviceInfo: dev,
        location: loc,
        attribution: attr,
      });
    }

    return { net, dev, attr, loc };
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
          await AnalyticsService.trackUserJourney({
            sessionId: getOrCreateUserId(),
            pageUrl: typeof window !== 'undefined' ? window.location.href : '',
            networkInfo: net,
            deviceInfo: dev,
            location: loc,
            attribution: attr,
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

      await AnalyticsService.trackUserJourney({
        sessionId,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        networkInfo,
        deviceInfo,
        location: location ?? undefined,
        attribution: attribution ?? undefined,
        userId: sessionId,
        customData,
      });

      setInteractions((prev) => prev + 1);
    },
    [sessionId, networkInfo, deviceInfo, location, attribution]
  );

  const incrementInteraction = useCallback(() => {
    setInteractions((n) => n + 1);
  }, []);

  return useMemo(
    () => ({
      sessionId,
      networkInfo,
      deviceInfo,
      location,
      attribution,
      pageVisits,
      interactions,
      logEvent,
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
      incrementInteraction,
      refresh,
    ]
  );
}

