import type { LocationInfo } from '../types';
import { hasLocationConsent } from '../utils/location-consent';

/**
 * Location Detector
 * Detects GPS location with consent management
 */
export class LocationDetector {
  private static locationFetchingRef: { current: boolean } = { current: false };
  private static lastLocationRef: { current: LocationInfo | null } = { current: null };
  private static locationConsentLoggedRef: { current: boolean } = { current: false };

  /**
   * Get browser GPS location
   * Respects location consent (set via MSISDN entry)
   */
  static async detect(): Promise<LocationInfo> {
    // Check if user has granted location consent via MSISDN entry
    const userHasConsent = hasLocationConsent();
    if (
      this.lastLocationRef.current &&
      userHasConsent &&
      this.lastLocationRef.current.permission !== 'granted'
    ) {
      // Consent was granted but cached location has wrong permission - clear cache
      console.log(
        '[Location] Consent detected but cache has wrong permission - clearing cache'
      );
      this.lastLocationRef.current = null;
    }

    // Return cached location if available and permission matches consent status
    if (this.lastLocationRef.current) {
      // If we have consent, ensure cached location reflects it
      if (userHasConsent && this.lastLocationRef.current.permission !== 'granted') {
        // Update cached location to reflect consent
        this.lastLocationRef.current = {
          ...this.lastLocationRef.current,
          permission: 'granted',
        };
      }
      return this.lastLocationRef.current;
    }

    // Prevent multiple simultaneous location requests
    if (this.locationFetchingRef.current) {
      // Return a default promise that will resolve when current fetch completes
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.lastLocationRef.current) {
            clearInterval(checkInterval);
            resolve(this.lastLocationRef.current);
          } else if (!this.locationFetchingRef.current) {
            clearInterval(checkInterval);
            resolve({
              source: 'unknown',
              permission: userHasConsent ? 'granted' : 'prompt',
            } as LocationInfo);
          }
        }, 50);
      });
    }

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      const unsupportedResult: LocationInfo = {
        source: 'unknown',
        permission: 'unsupported',
      };
      this.lastLocationRef.current = unsupportedResult;
      return unsupportedResult;
    }

    // Helper with timeout so we never block forever
    const withTimeout = <T,>(p: Promise<T>, ms = 5000) =>
      new Promise<T>((resolve) => {
        let settled = false;
        const t = setTimeout(() => {
          if (!settled) resolve(promiseFallback());
        }, ms);

        const promiseFallback = () =>
          ({ source: 'unknown', permission: userHasConsent ? 'granted' : 'prompt' } as unknown as T);

        p.then((v) => {
          settled = true;
          clearTimeout(t);
          resolve(v);
        }).catch(() => {
          settled = true;
          clearTimeout(t);
          resolve(promiseFallback());
        });
      });

    const ask = new Promise<LocationInfo>((resolve) => {
      // If user has consented (via MSISDN entry), treat as granted
      if (userHasConsent) {
        // Only log once to prevent console spam
        if (!this.locationConsentLoggedRef.current) {
          this.locationConsentLoggedRef.current = true;
          console.log('[Location] Consent granted via MSISDN entry, requesting location...');
        }

        this.locationFetchingRef.current = true;

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.locationFetchingRef.current = false;
            const locationResult: LocationInfo = {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              accuracy: isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
              permission: 'granted',
              source: 'gps',
              ts: new Date(pos.timestamp || Date.now()).toISOString(),
            };
            console.log('[Location] GPS coordinates obtained:', {
              lat: locationResult.lat,
              lon: locationResult.lon,
            });
            this.lastLocationRef.current = locationResult;
            resolve(locationResult);
          },
          (error) => {
            this.locationFetchingRef.current = false;
            // Log the error to understand why GPS failed
            console.warn('[Location] GPS failed:', {
              code: error.code,
              message: error.message,
              codeMeaning:
                error.code === 1
                  ? 'PERMISSION_DENIED'
                  : error.code === 2
                    ? 'POSITION_UNAVAILABLE'
                    : error.code === 3
                      ? 'TIMEOUT'
                      : 'UNKNOWN',
            });

            // Even if GPS fails, we still have consent
            const locationResult: LocationInfo = {
              permission: 'granted',
              source: 'unknown',
              ts: new Date().toISOString(),
            };
            this.lastLocationRef.current = locationResult;
            resolve(locationResult);
          },
          {
            enableHighAccuracy: false,
            timeout: 5000, // Increased timeout to 5 seconds
            maximumAge: 60000, // Cache for 60 seconds
          }
        );
        return;
      }

      // No consent yet - check permission state first
      this.locationFetchingRef.current = true;

      (navigator as any).permissions?.query({ name: 'geolocation' as any })
        .then((perm: any) => {
          const base: Partial<LocationInfo> = {
            permission: perm?.state || 'prompt',
          };
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              this.locationFetchingRef.current = false;
              const locationResult: LocationInfo = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                accuracy: isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
                permission: 'granted',
                source: 'gps',
                ts: new Date(pos.timestamp || Date.now()).toISOString(),
              };
              this.lastLocationRef.current = locationResult;
              resolve(locationResult);
            },
            () => {
              this.locationFetchingRef.current = false;
              const locationResult: LocationInfo = {
                ...base,
                source: 'unknown',
                ts: new Date().toISOString(),
              } as LocationInfo;
              this.lastLocationRef.current = locationResult;
              resolve(locationResult);
            },
            {
              enableHighAccuracy: false,
              timeout: 2500,
              maximumAge: 60000,
            }
          );
        })
        .catch(() => {
          // Permissions API not available; still try getCurrentPosition
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              this.locationFetchingRef.current = false;
              const locationResult: LocationInfo = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                accuracy: isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
                permission: 'granted',
                source: 'gps',
                ts: new Date(pos.timestamp || Date.now()).toISOString(),
              };
              this.lastLocationRef.current = locationResult;
              resolve(locationResult);
            },
            () => {
              this.locationFetchingRef.current = false;
              const locationResult: LocationInfo = {
                source: 'unknown',
                permission: 'prompt',
                ts: new Date().toISOString(),
              };
              this.lastLocationRef.current = locationResult;
              resolve(locationResult);
            },
            { enableHighAccuracy: false, timeout: 2500, maximumAge: 60000 }
          );
        });
    });

    return withTimeout(ask, 5000);
  }

  /**
   * Clear location cache (useful when consent is granted)
   */
  static clearCache(): void {
    this.lastLocationRef.current = null;
    this.locationFetchingRef.current = false;
    this.locationConsentLoggedRef.current = false;
    console.log('[Location] Cache cleared - will re-fetch with consent');
  }
}

