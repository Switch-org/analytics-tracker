import type { LocationInfo } from '../types';
import { hasLocationConsent } from '../utils/location-consent';

/**
 * Location Detector
 * Detects GPS location with consent management, falls back to IP-based location API
 */
export class LocationDetector {
  private static locationFetchingRef: { current: boolean } = { current: false };
  private static lastLocationRef: { current: LocationInfo | null } = { current: null };
  private static locationConsentLoggedRef: { current: boolean } = { current: false };
  private static ipLocationFetchingRef: { current: boolean } = { current: false };
  private static lastIPLocationRef: { current: LocationInfo | null } = { current: null };

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
      // GPS not supported, try IP-based location as fallback
      console.log('[Location] GPS not supported, using IP-based location API...');
      try {
        const ipLocation = await this.getIPBasedLocation();
        this.lastLocationRef.current = ipLocation;
        return ipLocation;
      } catch (ipError) {
        const unsupportedResult: LocationInfo = {
          source: 'unknown',
          permission: 'unsupported',
        };
        this.lastLocationRef.current = unsupportedResult;
        return unsupportedResult;
      }
    }

    // Helper with timeout so we never block forever
    const withTimeout = <T,>(p: Promise<T>, ms = 5000) =>
      new Promise<T>((resolve) => {
        let settled = false;
        const t = setTimeout(async () => {
          if (!settled) {
            settled = true;
            // If GPS times out, fallback to IP-based location
            console.log('[Location] GPS timeout, falling back to IP-based location API...');
            try {
              const ipLocation = await this.getIPBasedLocation();
              resolve(ipLocation as unknown as T);
            } catch (ipError) {
              resolve({ source: 'unknown', permission: userHasConsent ? 'granted' : 'prompt' } as unknown as T);
            }
          }
        }, ms);

        p.then((v) => {
          if (!settled) {
            settled = true;
            clearTimeout(t);
            resolve(v);
          }
        }).catch(async () => {
          if (!settled) {
            settled = true;
            clearTimeout(t);
            // If GPS fails, fallback to IP-based location
            try {
              const ipLocation = await this.getIPBasedLocation();
              resolve(ipLocation as unknown as T);
            } catch (ipError) {
              resolve({ source: 'unknown', permission: userHasConsent ? 'granted' : 'prompt' } as unknown as T);
            }
          }
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

            // Fallback to IP-based location when GPS fails
            console.log('[Location] Falling back to IP-based location API...');
            this.getIPBasedLocation()
              .then((ipLocation) => {
                this.lastLocationRef.current = ipLocation;
                resolve(ipLocation);
              })
              .catch((ipError) => {
                // Even if IP location fails, we still have consent
                const locationResult: LocationInfo = {
                  permission: 'granted',
                  source: 'unknown',
                  ts: new Date().toISOString(),
                };
                this.lastLocationRef.current = locationResult;
                resolve(locationResult);
              });
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
              // Fallback to IP-based location when GPS is not available/denied
              console.log('[Location] GPS not available, falling back to IP-based location API...');
              this.getIPBasedLocation()
                .then((ipLocation) => {
                  this.lastLocationRef.current = ipLocation;
                  resolve(ipLocation);
                })
                .catch((ipError) => {
                  const locationResult: LocationInfo = {
                    ...base,
                    source: 'unknown',
                    ts: new Date().toISOString(),
                  } as LocationInfo;
                  this.lastLocationRef.current = locationResult;
                  resolve(locationResult);
                });
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
              // Fallback to IP-based location when GPS fails
              console.log('[Location] GPS failed, falling back to IP-based location API...');
              this.getIPBasedLocation()
                .then((ipLocation) => {
                  this.lastLocationRef.current = ipLocation;
                  resolve(ipLocation);
                })
                .catch((ipError) => {
                  const locationResult: LocationInfo = {
                    source: 'unknown',
                    permission: 'prompt',
                    ts: new Date().toISOString(),
                  };
                  this.lastLocationRef.current = locationResult;
                  resolve(locationResult);
                });
            },
            { enableHighAccuracy: false, timeout: 2500, maximumAge: 60000 }
          );
        });
    });

    return withTimeout(ask, 5000);
  }

  /**
   * Get location from IP-based public API (client-side)
   * Works without user permission, good fallback when GPS is unavailable
   * Uses ip-api.com free tier (no API key required, 45 requests/minute)
   */
  private static async getIPBasedLocation(): Promise<LocationInfo> {
    // Return cached IP location if available
    if (this.lastIPLocationRef.current) {
      return this.lastIPLocationRef.current;
    }

    // Prevent multiple simultaneous requests
    if (this.ipLocationFetchingRef.current) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.lastIPLocationRef.current) {
            clearInterval(checkInterval);
            resolve(this.lastIPLocationRef.current);
          } else if (!this.ipLocationFetchingRef.current) {
            clearInterval(checkInterval);
            resolve({
              source: 'unknown',
              permission: 'granted',
            } as LocationInfo);
          }
        }, 50);
      });
    }

    // Skip if we're in an environment without fetch (SSR)
    if (typeof fetch === 'undefined') {
      const fallback: LocationInfo = {
        source: 'unknown',
        permission: 'unsupported',
      };
      this.lastIPLocationRef.current = fallback;
      return fallback;
    }

    this.ipLocationFetchingRef.current = true;

    try {
      // Call ip-api.com without IP parameter - it auto-detects user's IP
      // Using HTTPS endpoint for better security
      const response = await fetch(
        'https://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,query',
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // ip-api.com returns status field
      if (data.status === 'fail') {
        console.warn(`[Location] IP API error: ${data.message}`);
        const fallback: LocationInfo = {
          source: 'unknown',
          permission: 'granted',
        };
        this.lastIPLocationRef.current = fallback;
        return fallback;
      }

      // Convert IP location to LocationInfo format
      const locationResult: LocationInfo = {
        lat: data.lat || null,
        lon: data.lon || null,
        accuracy: null, // IP-based location has no accuracy metric
        permission: 'granted', // IP location doesn't require permission
        source: 'ip',
        ts: new Date().toISOString(),
      };

      console.log('[Location] IP-based location obtained:', {
        lat: locationResult.lat,
        lon: locationResult.lon,
        city: data.city,
        country: data.country,
      });

      this.lastIPLocationRef.current = locationResult;
      return locationResult;
    } catch (error: any) {
      // Silently fail - don't break user experience
      if (error.name !== 'AbortError') {
        console.warn('[Location] IP-based location fetch failed:', error.message);
      }
      
      const fallback: LocationInfo = {
        source: 'unknown',
        permission: 'granted',
      };
      this.lastIPLocationRef.current = fallback;
      return fallback;
    } finally {
      this.ipLocationFetchingRef.current = false;
    }
  }

  /**
   * Clear location cache (useful when consent is granted)
   */
  static clearCache(): void {
    this.lastLocationRef.current = null;
    this.lastIPLocationRef.current = null;
    this.locationFetchingRef.current = false;
    this.ipLocationFetchingRef.current = false;
    this.locationConsentLoggedRef.current = false;
    console.log('[Location] Cache cleared - will re-fetch with consent');
  }
}

