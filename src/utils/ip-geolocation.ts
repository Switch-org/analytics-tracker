import type { IPLocation } from '../types';

/**
 * IP Geolocation Service
 * Fetches location data (country, region, city) from user's IP address
 * Uses ipwho.is API (no API key required)
 * 
 * Stores all keys dynamically from the API response, including nested objects
 * This ensures we capture all available data and any new fields added by the API
 */

/**
 * Get complete IP location data from ipwho.is API (HIGH PRIORITY)
 * This is the primary method - gets IP, location, connection, and all data in one call
 * No API key required
 * 
 * @returns Promise<IPLocation | null> - Complete IP location data, or null if unavailable
 * 
 * @example
 * ```typescript
 * const location = await getCompleteIPLocation();
 * console.log('IP:', location?.ip);
 * console.log('Country:', location?.country);
 * console.log('ISP:', location?.connection?.isp);
 * ```
 */
export async function getCompleteIPLocation(): Promise<IPLocation | null> {
  // Skip if we're in an environment without fetch (SSR)
  if (typeof fetch === 'undefined') {
    return null;
  }

  try {
    // Call ipwho.is without IP parameter - it auto-detects user's IP and returns everything
    // This is the HIGH PRIORITY source - gets IP, location, connection, timezone, flag, etc. in one call
    const response = await fetch('https://ipwho.is/', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // ipwho.is returns success field
    if (data.success === false) {
      return null;
    }

    // Store all keys dynamically from the response
    // This ensures we capture all fields, including nested objects and any new fields
    const locationData: IPLocation = {
      ip: data.ip,
      // Map all fields from the API response dynamically
      ...Object.keys(data).reduce((acc, key) => {
        // Store all keys and their values, preserving nested objects
        acc[key] = data[key];
        return acc;
      }, {} as Record<string, any>),
    };

    // Add backward compatibility mappings for existing code
    if (data.latitude !== undefined) {
      locationData.lat = data.latitude;
    }
    if (data.longitude !== undefined) {
      locationData.lon = data.longitude;
    }
    if (data.country_code !== undefined) {
      locationData.countryCode = data.country_code;
    }
    if (data.region !== undefined) {
      locationData.regionName = data.region;
    }
    if (data.connection?.isp !== undefined) {
      locationData.isp = data.connection.isp;
    }
    if (data.connection?.org !== undefined) {
      locationData.org = data.connection.org;
    }
    if (data.connection?.asn !== undefined) {
      locationData.as = `AS${data.connection.asn}`;
    }
    if (data.timezone?.id !== undefined) {
      locationData.timezone = data.timezone.id;
    }
    locationData.query = data.ip;

    return locationData;
  } catch (error: any) {
    // Silently fail - don't break user experience
    if (error.name !== 'AbortError') {
      console.warn('[IP Geolocation] Error fetching complete IP location from ipwho.is:', error.message);
    }
    return null;
  }
}

/**
 * Get public IP address using ipwho.is API (FALLBACK - lower priority)
 * This is kept for backward compatibility and as a fallback
 * Prefer getCompleteIPLocation() which gets everything in one call
 * 
 * @returns Promise<string | null> - The public IP address, or null if unavailable
 * 
 * @example
 * ```typescript
 * const ip = await getPublicIP();
 * console.log('Your IP:', ip); // e.g., "203.0.113.42"
 * ```
 */
export async function getPublicIP(): Promise<string | null> {
  // Try to get complete location first (includes IP)
  const completeLocation = await getCompleteIPLocation();
  if (completeLocation?.ip) {
    return completeLocation.ip;
  }

  // Fallback: try direct IP fetch (less efficient, lower priority)
  try {
    const response = await fetch('https://ipwho.is/', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.success === false) {
      return null;
    }

    return data.ip || null;
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.warn('[IP Geolocation] Error fetching public IP (fallback):', error.message);
    }
    return null;
  }
}

/**
 * Get location from IP address using ipwho.is API (HIGH PRIORITY)
 * Free tier: No API key required
 * 
 * Stores all keys dynamically from the API response, including nested objects
 * This ensures we capture all available data and any new fields added by the API
 * 
 * Note: If you don't have an IP yet, use getCompleteIPLocation() which gets everything in one call
 */
export async function getIPLocation(ip: string): Promise<IPLocation | null> {
  // Skip localhost/private IPs (these can't be geolocated)
  if (
    !ip ||
    ip === '0.0.0.0' ||
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.') ||
    ip.startsWith('::ffff:127.')
  ) {
    console.log(
      `[IP Geolocation] Skipping localhost/private IP: ${ip} (geolocation not available for local IPs)`
    );
    return null;
  }

  try {
    // Using ipwho.is API (no API key required)
    const response = await fetch(
      `https://ipwho.is/${ip}`,
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
      console.warn(`[IP Geolocation] Failed to fetch location for IP ${ip}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // ipwho.is returns success field
    if (data.success === false) {
      console.warn(`[IP Geolocation] API error for IP ${ip}: ${data.message || 'Unknown error'}`);
      return null;
    }

    // Store all keys dynamically from the response
    // This ensures we capture all fields, including nested objects and any new fields
    const locationData: IPLocation = {
      ip: data.ip || ip,
      // Map all fields from the API response dynamically
      ...Object.keys(data).reduce((acc, key) => {
        // Store all keys and their values, preserving nested objects
        acc[key] = data[key];
        return acc;
      }, {} as Record<string, any>),
    };

    // Add backward compatibility mappings for existing code
    if (data.latitude !== undefined) {
      locationData.lat = data.latitude;
    }
    if (data.longitude !== undefined) {
      locationData.lon = data.longitude;
    }
    if (data.country_code !== undefined) {
      locationData.countryCode = data.country_code;
    }
    if (data.region !== undefined) {
      locationData.regionName = data.region;
    }
    if (data.connection?.isp !== undefined) {
      locationData.isp = data.connection.isp;
    }
    if (data.connection?.org !== undefined) {
      locationData.org = data.connection.org;
    }
    if (data.connection?.asn !== undefined) {
      locationData.as = `AS${data.connection.asn}`;
    }
    if (data.timezone?.id !== undefined) {
      locationData.timezone = data.timezone.id;
    }
    locationData.query = data.ip || ip;

    return locationData;
  } catch (error: any) {
    // Silently fail - don't break user experience
    if (error.name !== 'AbortError') {
      console.warn(`[IP Geolocation] Error fetching location for IP ${ip}:`, error.message);
    }
    return null;
  }
}

/**
 * Get IP address from request headers
 * Handles various proxy headers (x-forwarded-for, x-real-ip, etc.)
 */
export function getIPFromRequest(req: Request | any): string {
  // Try various headers that proxies/load balancers use
  const forwardedFor =
    req.headers?.get?.('x-forwarded-for') ||
    (req as any).headers?.['x-forwarded-for'] ||
    (req as any).headers?.['X-Forwarded-For'];

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwardedFor.split(',').map((ip: string) => ip.trim());
    const ip = ips[0];
    if (ip && ip !== '0.0.0.0') {
      return ip;
    }
  }

  const realIP =
    req.headers?.get?.('x-real-ip') ||
    (req as any).headers?.['x-real-ip'] ||
    (req as any).headers?.['X-Real-IP'];

  if (realIP && realIP !== '0.0.0.0') {
    return realIP.trim();
  }

  // Try req.ip (from Express/Next.js)
  if ((req as any).ip && (req as any).ip !== '0.0.0.0') {
    return (req as any).ip;
  }

  // For localhost, detect if we're running locally
  if (typeof window === 'undefined') {
    const hostname = req.headers?.get?.('host') || (req as any).headers?.['host'];
    if (
      hostname &&
      (hostname.includes('localhost') ||
        hostname.includes('127.0.0.1') ||
        hostname.startsWith('192.168.'))
    ) {
      return '127.0.0.1'; // Localhost IP
    }
  }

  // If no IP found and we're in development, return localhost
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    return '127.0.0.1'; // Localhost for development
  }

  return '0.0.0.0';
}

