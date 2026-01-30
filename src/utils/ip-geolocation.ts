/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import type { IPLocation } from '../types';

/**
 * IP Geolocation Service
 * Fetches location data (country, region, city) from user's IP address
 * Uses ipwho.is API (supports optional API key for higher rate limits)
 *
 * Stores all keys dynamically from the API response, including nested objects
 * This ensures we capture all available data and any new fields added by the API
 *
 * --- Where does the IP come from? (secure usage) ---
 *
 * 1) Browser / client-side:
 *    - Do NOT pass an IP. Call getCompleteIPLocation(config) with no IP.
 *    - The request goes: user's browser → ipwho.is; ipwho.is sees the visitor's
 *      public IP and returns it. The IP is never stored or sent by your code.
 *    - For config.apiKey: avoid hardcoding. Use a build-time env var or omit (free tier).
 *
 * 2) Server-side (Node/Express/Next etc.):
 *    - Get the visitor's IP from the incoming request with getIPFromRequest(req).
 *    - Then call getIPLocation(userIp, config) to geolocate that IP.
 *    - Keep apiKey in process.env (e.g. IPWHOIS_API_KEY); never commit it.
 */

/**
 * IP Geolocation configuration interface
 */
export interface IPGeolocationConfig {
  apiKey?: string; // Optional API key for ipwho.is (for higher rate limits)
  baseUrl?: string; // API base URL (default: 'https://ipwho.is')
  timeout?: number; // Request timeout in ms (default: 5000)
}

/**
 * Get complete IP location data from ipwho.is API (HIGH PRIORITY)
 * This is the primary method - gets IP, location, connection, and all data in one call
 * 
 * @param config - Optional configuration for API key and base URL
 * @returns Promise<IPLocation | null> - Complete IP location data, or null if unavailable
 * 
 * @example
 * ```typescript
 * // Without API key (free tier)
 * const location = await getCompleteIPLocation();
 * 
 * // With API key (for higher rate limits)
 * const location = await getCompleteIPLocation({ 
 *   apiKey: '<your-api-key>',
 *   baseUrl: 'https://ipwho.is'
 * });
 * ```
 */
export async function getCompleteIPLocation(config?: IPGeolocationConfig): Promise<IPLocation | null> {
  // Skip if we're in an environment without fetch (SSR)
  if (typeof fetch === 'undefined') {
    return null;
  }

  // Use provided config or defaults
  const baseUrl = config?.baseUrl || 'https://ipwho.is';
  const timeout = config?.timeout || 5000;
  const apiKey = config?.apiKey;

  try {
    // Build URL with optional API key
    let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Add API key as query parameter if provided
    if (apiKey) {
      url += `?key=${encodeURIComponent(apiKey)}`;
    } else {
      url += '/';
    }

    // Call ipwho.is without IP parameter - it auto-detects user's IP and returns everything
    // This is the HIGH PRIORITY source - gets IP, location, connection, timezone, flag, etc. in one call
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(timeout),
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
 * @param config - Optional configuration for API key and base URL
 * @returns Promise<string | null> - The public IP address, or null if unavailable
 * 
 * @example
 * ```typescript
 * const ip = await getPublicIP();
 * console.log('Your IP:', ip); // e.g., "203.0.113.42"
 * ```
 */
export async function getPublicIP(config?: IPGeolocationConfig): Promise<string | null> {
  // Try to get complete location first (includes IP)
  const completeLocation = await getCompleteIPLocation(config);
  if (completeLocation?.ip) {
    return completeLocation.ip;
  }

  // Fallback: try direct IP fetch (less efficient, lower priority)
  try {
    const baseUrl = config?.baseUrl || 'https://ipwho.is';
    const timeout = config?.timeout || 5000;
    const apiKey = config?.apiKey;

    // Build URL with optional API key
    let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    if (apiKey) {
      url += `?key=${encodeURIComponent(apiKey)}`;
    } else {
      url += '/';
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(timeout),
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
 * 
 * Stores all keys dynamically from the API response, including nested objects
 * This ensures we capture all available data and any new fields added by the API
 * 
 * @param ip - IP address to geolocate
 * @param config - Optional configuration for API key and base URL
 * @returns Promise<IPLocation | null> - IP location data, or null if unavailable
 * 
 * @example
 * ```typescript
 * // Without API key
 * const location = await getIPLocation('203.0.113.42');
 * 
 * // With API key
 * const location = await getIPLocation('203.0.113.42', { 
 *   apiKey: '<your-api-key>' 
 * });
 * ```
 * 
 * Note: If you don't have an IP yet, use getCompleteIPLocation() which gets everything in one call
 */
export async function getIPLocation(ip: string, config?: IPGeolocationConfig): Promise<IPLocation | null> {
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
    // Use provided config or defaults
    const baseUrl = config?.baseUrl || 'https://ipwho.is';
    const timeout = config?.timeout || 5000;
    const apiKey = config?.apiKey;

    // Build URL with IP and optional API key
    let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    url += `/${ip}`;
    
    // Add API key as query parameter if provided
    if (apiKey) {
      url += `?key=${encodeURIComponent(apiKey)}`;
    }

    // Using ipwho.is API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(timeout),
    });

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

