/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AnalyticsEvent } from '../types';
import { logger } from './logger';

/**
 * Required fields for analytics events
 * Events missing these fields will be filtered out
 */
export interface RequiredEventFields {
  ip?: string | null;
  lat?: number | null;
  lon?: number | null;
  mobile?: boolean | null;
  location?: string | null; // Country or city
  msisdn?: string | null;
  session?: string | null;
  operators?: string | null; // ISP/Operator name
  page?: string | null; // Page name extracted from URL
  pageUrl?: string | null;
  eventType?: string | null; // eventName
  companyName?: string | null;
  eventId?: string | null;
  timestamp?: Date | string | null;
  gps?: boolean | null; // true if GPS source, false if IP-based
  os?: string | null;
  browser?: string | null;
  serviceId?: string | null;
}

/**
 * Extract required fields from analytics event
 */
export function extractRequiredFields(event: AnalyticsEvent): RequiredEventFields {
  // Extract IP from ipLocation or location or customData.ipLocation
  const ip = event.ipLocation?.ip || 
    (event.location as any)?.ip || 
    (event.customData as any)?.ipLocation?.ip ||
    null;
  
  // Extract lat/lon from location or ipLocation
  const lat = event.location?.lat || event.ipLocation?.latitude || event.ipLocation?.lat || null;
  const lon = event.location?.lon || event.ipLocation?.longitude || event.ipLocation?.lon || null;
  
  // Extract mobile status
  const mobile = event.deviceInfo?.type === 'mobile' ? true : event.deviceInfo?.type ? false : null;
  
  // Extract location (city - country removed in essential mode)
  const location = 
    event.ipLocation?.city || 
    (event.location as any)?.city || 
    event.ipLocation?.country || 
    (event.location as any)?.country || 
    null;
  
  // Extract msisdn from customData
  const msisdn = event.customData?.msisdn || null;
  
  // Session ID
  const session = event.sessionId || null;
  
  // Extract operator/ISP
  const operators = 
    event.ipLocation?.connection?.isp || 
    event.ipLocation?.connection?.org || 
    null;
  
  // Extract page name from URL
  const pageUrl = event.pageUrl || null;
  let page: string | null = null;
  if (pageUrl) {
    try {
      page = new URL(pageUrl).pathname;
    } catch {
      // If URL parsing fails, try to extract pathname manually
      const match = pageUrl.match(/^https?:\/\/[^/]+(\/.*)?$/);
      page = match ? (match[1] || '/') : null;
    }
  }
  
  // Event type
  const eventType = event.eventName || 'page_view';
  
  // Company name from customData
  const companyName = event.customData?.companyName || null;
  
  // Event ID
  const eventId = event.eventId || null;
  
  // Timestamp
  const timestamp = event.timestamp || null;
  
  // GPS source check
  const gps = event.location?.source === 'gps' ? true : 
              (event.location?.source === 'ip' ? false : null);
  
  // OS
  const os = event.deviceInfo?.os || null;
  
  // Browser
  const browser = event.deviceInfo?.browser || null;
  
  // Service ID
  const serviceId = event.customData?.serviceId || null;
  
  return {
    ip,
    lat,
    lon,
    mobile,
    location,
    msisdn,
    session,
    operators,
    page,
    pageUrl,
    eventType,
    companyName,
    eventId,
    timestamp,
    gps,
    os,
    browser,
    serviceId,
  };
}

/**
 * Validate that event has minimum required fields
 * Returns true if valid, false if should be filtered out
 */
export function validateRequiredFields(fields: RequiredEventFields): boolean {
  // Location (IP or lat/lon) is optional — allows localhost and dev where IP may be null
  // Must have session (non-empty string, not 'unknown')
  if (!fields.session || fields.session === 'unknown' || fields.session.trim() === '') {
    return false;
  }
  
  // Must have pageUrl (non-empty string)
  if (!fields.pageUrl || fields.pageUrl.trim() === '') {
    return false;
  }
  
  // Must have eventType
  if (!fields.eventType) {
    return false;
  }
  
  // Must have eventId
  if (!fields.eventId) {
    return false;
  }
  
  // Must have timestamp
  if (!fields.timestamp) {
    return false;
  }
  
  // Must have at least one of: mobile, OS, or browser
  const hasDeviceInfo = fields.mobile !== null || fields.os || fields.browser;
  if (!hasDeviceInfo) {
    return false;
  }
  
  return true;
}

/**
 * Check if event has null values for critical fields
 * Returns true if should be filtered out (too many nulls)
 */
export function hasTooManyNulls(fields: RequiredEventFields): boolean {
  // Only count non-critical fields for null percentage
  // Critical fields (ip, lat, lon, session, pageUrl, eventType, eventId, timestamp) are already validated
  const nonCriticalFields = ['mobile', 'location', 'msisdn', 'operators', 'page', 'companyName', 'gps', 'os', 'browser', 'serviceId'];
  const nullCount = nonCriticalFields.filter(key => {
    const value = fields[key as keyof RequiredEventFields];
    return value === null || value === undefined;
  }).length;
  const totalNonCritical = nonCriticalFields.length;
  const nullPercentage = totalNonCritical > 0 ? nullCount / totalNonCritical : 0;
  
  // Filter out if more than 70% of non-critical fields are null (more lenient)
  return nullPercentage > 0.7;
}

/**
 * Validate and filter event
 * Returns null if event should be filtered out, otherwise returns the event
 */
export function validateEvent(event: AnalyticsEvent): AnalyticsEvent | null {
  const fields = extractRequiredFields(event);
  
  // Check if has too many null values
  if (hasTooManyNulls(fields)) {
    logger.debug('Event filtered: too many null values', {
      fields,
      sessionId: event.sessionId,
      pageUrl: event.pageUrl,
      eventName: event.eventName,
    });
    return null;
  }
  
  // Check if has minimum required fields
  if (!validateRequiredFields(fields)) {
    logger.debug('Event filtered: missing required fields', {
      fields,
      sessionId: event.sessionId,
      pageUrl: event.pageUrl,
      eventName: event.eventName,
      hasIP: !!fields.ip,
      hasLatLon: fields.lat !== null && fields.lon !== null,
      hasSession: !!fields.session,
      hasPageUrl: !!fields.pageUrl,
      hasEventType: !!fields.eventType,
      hasEventId: !!fields.eventId,
      hasTimestamp: !!fields.timestamp,
      hasDeviceInfo: fields.mobile !== null || !!fields.os || !!fields.browser,
    });
    return null;
  }
  
  return event;
}

/**
 * Generate a unique key for deduplication
 * Based on: sessionId + pageUrl + eventName + timestamp (rounded to nearest second)
 */
export function generateDeduplicationKey(event: AnalyticsEvent): string {
  const timestamp = event.timestamp instanceof Date 
    ? event.timestamp.getTime() 
    : new Date(event.timestamp).getTime();
  
  // Round timestamp to nearest second to handle rapid duplicate events
  const roundedTimestamp = Math.floor(timestamp / 1000) * 1000;
  
  const parts = [
    event.sessionId || '',
    event.pageUrl || '',
    event.eventName || 'page_view',
    roundedTimestamp.toString(),
  ];
  
  return parts.join('|');
}
