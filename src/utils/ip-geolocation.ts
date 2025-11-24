import type { IPLocation } from '../types';

/**
 * IP Geolocation Service
 * Fetches location data (country, region, city) from user's IP address
 * Uses free tier of ip-api.com (no API key required, 45 requests/minute)
 */

/**
 * Get public IP address using ip-api.com
 * Free tier: 45 requests/minute, no API key required
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
  // Skip if we're in an environment without fetch (SSR)
  if (typeof fetch === 'undefined') {
    return null;
  }

  try {
    // Call ip-api.com without IP parameter - it auto-detects user's IP
    // Using HTTPS endpoint for better security
    const response = await fetch('https://ip-api.com/json/?fields=status,message,query', {
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

    // ip-api.com returns status field
    if (data.status === 'fail') {
      return null;
    }

    return data.query || null;
  } catch (error: any) {
    // Silently fail - don't break user experience
    if (error.name !== 'AbortError') {
      console.warn('[IP Geolocation] Error fetching public IP:', error.message);
    }
    return null;
  }
}

/**
 * Get location from IP address using ip-api.com
 * Free tier: 45 requests/minute, no API key required
 *
 * Alternative services:
 * - ipapi.co (requires API key for production)
 * - ipgeolocation.io (requires API key)
 * - ip-api.com (free tier available)
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
    // Using ip-api.com free tier (JSON format)
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,query`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!response.ok) {
      console.warn(`[IP Geolocation] Failed to fetch location for IP ${ip}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // ip-api.com returns status field
    if (data.status === 'fail') {
      console.warn(`[IP Geolocation] API error for IP ${ip}: ${data.message}`);
      return null;
    }

    return {
      ip: data.query || ip,
      country: data.country || undefined,
      countryCode: data.countryCode || undefined,
      region: data.region || undefined,
      regionName: data.regionName || undefined,
      city: data.city || undefined,
      lat: data.lat || undefined,
      lon: data.lon || undefined,
      timezone: data.timezone || undefined,
      isp: data.isp || undefined,
      org: data.org || undefined,
      as: data.as || undefined,
      query: data.query || ip,
    };
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

