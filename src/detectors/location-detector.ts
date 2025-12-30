import type { LocationInfo } from '../types';
import { hasLocationConsent, setLocationConsentGranted } from '../utils/location-consent';
import { getCompleteIPLocation, getIPLocation, getPublicIP } from '../utils/ip-geolocation';

/**
 * Location Detector
 * Detects GPS location with consent management, falls back to IP-based location API
 * IP-based location works automatically without user permission
 */
export class LocationDetector {
  private static locationFetchingRef: { current: boolean } = { current: false };
  private static lastLocationRef: { current: LocationInfo | null } = { current: null };
  private static locationConsentLoggedRef: { current: boolean } = { current: false };
  private static ipLocationFetchingRef: { current: boolean } = { current: false };
  private static lastIPLocationRef: { current: LocationInfo | null } = { current: null };

  /**
   * Detect location using IP-based API only (no GPS, no permission needed)
   * Fast and automatic - works immediately without user interaction
   */
  static async detectIPOnly(): Promise<LocationInfo> {
    // Return cached IP location if available
    if (this.lastIPLocationRef.current) {
      return this.lastIPLocationRef.current;
    }

    // Get IP-based location (no permission required)
    const ipLocation = await this.getIPBasedLocation();
    this.lastLocationRef.current = ipLocation;
    return ipLocation;
  }

  /**
   * Detect location with automatic consent granted
   * Tries GPS first (if available), then falls back to IP-based location
   * Automatically sets location consent to bypass permission checks
   */
  static async detectWithAutoConsent(): Promise<LocationInfo> {
    // Automatically grant location consent
    setLocationConsentGranted();
    
    // Clear cache to force fresh detection
    this.lastLocationRef.current = null;
    
    // Now detect with consent granted
    return this.detect();
  }

  /**
   * Get browser GPS location
   * Respects location consent (set via MSISDN entry)
   * Falls back to IP-based location automatically if GPS fails
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
      } catch (_ipError) {
        const unsupportedResult: LocationInfo = {
          source: 'unknown',
          permission: 'unsupported',
        };
        this.lastLocationRef.current = unsupportedResult;
        return unsupportedResult;
      }
    }

    // Helper with timeout so we never block forever
    // Reduced timeout to 2 seconds for faster fallback to IP
    const withTimeout = <T,>(p: Promise<T>, ms = 2000) =>
      new Promise<T>((resolve) => {
        let settled = false;
        const t = setTimeout(async () => {
          if (!settled) {
            settled = true;
            // If GPS times out, fallback to IP-based location immediately
            console.log('[Location] GPS timeout, falling back to IP-based location API...');
            try {
              const ipLocation = await this.getIPBasedLocation();
              resolve(ipLocation as unknown as T);
            } catch (_ipError) {
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
            } catch (_ipError) {
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
              .catch((_ipError) => {
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
            timeout: 2000, // Reduced to 2 seconds for faster fallback to IP
            maximumAge: 60000, // Cache for 60 seconds
          }
        );
        return;
      }

      // No consent yet - use IP-based location as primary (no permission needed)
      // This provides automatic location without user interaction
      console.log('[Location] No consent granted, using IP-based location (automatic, no permission needed)...');
      this.locationFetchingRef.current = true;
      
      // Use IP-based location (no permission needed, works automatically)
      this.getIPBasedLocation()
        .then((ipLocation) => {
          this.locationFetchingRef.current = false;
          this.lastLocationRef.current = ipLocation;
          resolve(ipLocation);
        })
        .catch((_ipError) => {
          this.locationFetchingRef.current = false;
          // If IP fails, try GPS as last resort (but it will likely prompt)
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
                  // Both IP and GPS failed
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
                  timeout: 2000,
                  maximumAge: 60000,
                }
              );
            })
            .catch(() => {
              // Permissions API not available; GPS failed, return unknown
              this.locationFetchingRef.current = false;
              const locationResult: LocationInfo = {
                source: 'unknown',
                permission: 'prompt',
                ts: new Date().toISOString(),
              };
              this.lastLocationRef.current = locationResult;
              resolve(locationResult);
            });
        });
    });

    // Reduced overall timeout to 2 seconds for faster IP fallback
    return withTimeout(ask, 2000);
  }

  /**
   * Get location from IP-based public API (client-side)
   * Works without user permission, good fallback when GPS is unavailable
   * Uses ipwho.is API (no API key required)
   * Stores all keys dynamically from the API response
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
      // HIGH PRIORITY: Get complete IP location data from ipwho.is in one call
      // This gets IP, location, connection, timezone, flag, and all other data at once
      // More efficient than making separate calls
      let ipLocation = await getCompleteIPLocation();
      
      // If complete location fetch failed, try fallback: get IP first, then location
      if (!ipLocation) {
        console.log('[Location] Primary ipwho.is call failed, trying fallback...');
        const publicIP = await getPublicIP();
        
        if (publicIP) {
          // Fallback: Get location from IP using ipwho.is API
          ipLocation = await getIPLocation(publicIP);
        }
      }

      if (!ipLocation) {
        throw new Error('Could not fetch location data from ipwho.is');
      }

      // Convert IP location to LocationInfo format
      // Map all available fields from the IP location response
      // Handle timezone which can be either a string or an object
      const timezoneValue = typeof ipLocation.timezone === 'string' 
        ? ipLocation.timezone 
        : ipLocation.timezone?.id || undefined;

      const locationResult: LocationInfo = {
        lat: ipLocation.latitude ?? ipLocation.lat ?? null,
        lon: ipLocation.longitude ?? ipLocation.lon ?? null,
        accuracy: null, // IP-based location has no accuracy metric
        permission: 'granted', // IP location doesn't require permission
        source: 'ip',
        ts: new Date().toISOString(),
        ip: ipLocation.ip || undefined,
        country: ipLocation.country || undefined,
        countryCode: ipLocation.country_code || ipLocation.countryCode || undefined,
        city: ipLocation.city || undefined,
        region: ipLocation.region || ipLocation.regionName || undefined,
        timezone: timezoneValue,
      };

      // Store the full IP location data in a custom field for access to all keys
      // This preserves all dynamic keys from the API response
      (locationResult as any).ipLocationData = ipLocation;

      console.log('[Location] IP-based location obtained from ipwho.is:', {
        ip: locationResult.ip,
        lat: locationResult.lat,
        lon: locationResult.lon,
        city: locationResult.city,
        country: locationResult.country,
        continent: ipLocation.continent,
        timezone: locationResult.timezone,
        isp: ipLocation.connection?.isp,
        connection: ipLocation.connection,
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

