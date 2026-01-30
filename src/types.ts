/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Core types for the analytics tracker package
 */

export type NetworkType = 'wifi' | 'hotspot' | 'cellular' | 'ethernet' | 'unknown';
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';

export interface NetworkInfo {
  type: NetworkType;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  connectionType?: string;
}

export interface DeviceInfo {
  type: DeviceType;
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  screenResolution: string;
  deviceModel: string;
  deviceBrand: string;
  language: string;
  timezone: string;
  userAgent: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  touchSupport: boolean;
  pixelRatio: number;
  colorDepth: number;
  orientation: string;
  cpuArchitecture: string;
}

export interface LocationInfo {
  lat?: number | null;
  lon?: number | null;
  accuracy?: number | null;
  permission?: 'granted' | 'denied' | 'prompt' | 'unsupported';
  source: 'gps' | 'ip' | 'unknown';
  ts?: string;
  ip?: string | null; // Public IP address (when available)
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  timezone?: string;
}

export interface AttributionInfo {
  landingUrl: string;
  path: string;
  hostname: string;
  referrerUrl: string | null;
  referrerDomain: string | null;
  navigationType: 'navigate' | 'reload' | 'back_forward' | 'prerender' | 'unknown';
  isReload: boolean;
  isBackForward: boolean;
  sessionStart?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  ttclid?: string | null;
  msclkid?: string | null;
  dmclid?: string | null;
  firstTouch?: Record<string, string | null> | null;
  lastTouch?: Record<string, string | null> | null;
}

export interface IPLocation extends Record<string, any> {
  ip: string;
  success?: boolean;
  type?: string;
  continent?: string;
  continent_code?: string;
  country?: string;
  country_code?: string;
  region?: string;
  region_code?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  is_eu?: boolean;
  postal?: string;
  calling_code?: string;
  capital?: string;
  borders?: string;
  flag?: {
    img?: string;
    emoji?: string;
    emoji_unicode?: string;
  };
  connection?: {
    asn?: number;
    org?: string;
    isp?: string;
    domain?: string;
  };
  timezone?: {
    id?: string;
    abbr?: string;
    is_dst?: boolean;
    offset?: number;
    utc?: string;
    current_time?: string;
  };
  // Legacy fields for backward compatibility
  countryCode?: string;
  regionName?: string;
  lat?: number;
  lon?: number;
  isp?: string;
  org?: string;
  as?: string;
  query?: string;
}

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

export interface AnalyticsConfig {
  apiEndpoint: string;
  autoSend?: boolean;
  enableLocation?: boolean;
  enableIPGeolocation?: boolean;
  enableNetworkDetection?: boolean;
  enableDeviceDetection?: boolean;
  enableAttribution?: boolean;
  sessionStoragePrefix?: string;
  localStoragePrefix?: string;
  // Queue and batching configuration
  batchSize?: number; // Events per batch (default: 10)
  batchInterval?: number; // Flush interval in ms (default: 5000)
  maxQueueSize?: number; // Max queued events (default: 100)
  // Retry configuration
  maxRetries?: number; // Max retry attempts (default: 3)
  retryDelay?: number; // Initial retry delay in ms (default: 1000)
  // Session configuration
  sessionTimeout?: number; // Session timeout in ms (default: 1800000 = 30 min)
  // Logging configuration
  logLevel?: LogLevel; // Logging verbosity (default: 'warn')
  // Metrics configuration
  enableMetrics?: boolean; // Enable metrics collection (default: false)
  // IP Geolocation API configuration (ipwho.is or ipwhois.pro). Pass apiKey via env; for paid/server-side pass ip when you have it.
  ipGeolocation?: {
    apiKey?: string; // API key (use env var). Required for paid tiers; optional for ipwho.is free tier.
    baseUrl?: string; // API base URL (default: 'https://ipwho.is'). Use 'https://ipwhois.pro' for paid ipwhois.pro
    timeout?: number; // Request timeout in ms (default: 5000)
    ip?: string; // When provided (paid/server-side), lookup this IP. Ignored when proxyUrl is set.
    /** Proxy URL for paid users in browser: client calls this; your backend calls ipwho.is with API key (key never in browser). */
    proxyUrl?: string;
  };
  // Field storage configuration - control which fields are stored for each data type
  fieldStorage?: {
    // IP Location storage configuration
    ipLocation?: FieldStorageConfig; // Configure which IP location fields to store
    // Device Info storage configuration
    deviceInfo?: FieldStorageConfig; // Configure which device fields to store
    // Network Info storage configuration
    networkInfo?: FieldStorageConfig; // Configure which network fields to store
    // Location Info storage configuration
    location?: FieldStorageConfig; // Configure which location fields to store
    // Attribution Info storage configuration
    attribution?: FieldStorageConfig; // Configure which attribution fields to store
  };
  // Legacy: IP Location storage configuration (for backward compatibility)
  ipLocationFields?: IPLocationFieldConfig; // Configure which IP location fields to store
}

/**
 * General field storage configuration
 * Allows users to customize which fields are stored to optimize storage capacity
 */
export interface FieldStorageConfig {
  // Field inclusion mode
  mode?: 'essential' | 'all' | 'custom'; // Default: 'essential'
  
  // Custom field whitelist (only used when mode is 'custom')
  // Specify which fields to include. Use dot notation for nested fields (e.g., 'connection.asn')
  fields?: string[];
  
  // Field exclusion list (used with 'all' mode to exclude specific fields)
  exclude?: string[];
}

/**
 * Configuration for IP location field storage
 * @deprecated Use FieldStorageConfig instead. This is kept for backward compatibility.
 */
export type IPLocationFieldConfig = FieldStorageConfig;

/**
 * Default essential fields for IP location storage
 * These fields are stored when mode is 'essential' (default)
 */
export const DEFAULT_ESSENTIAL_IP_FIELDS = [
  // Core identification
  'ip',
  'countryCode',
  'city',
  // Geographic coordinates (stored here, not duplicated in location)
  'lat',
  'lon',
  // Network info
  'type',
  'isEu',
  'isp',
  'connection',
  'connection.asn',
  'connection.org',
  'connection.isp',
  'connection.domain',
] as const;

/**
 * Default essential fields for Device Info storage
 * In essential mode, only OS and browser are stored
 */
export const DEFAULT_ESSENTIAL_DEVICE_FIELDS = [
  'os',
  'browser',
] as const;

/**
 * Default essential fields for Network Info storage
 * 
 * NOTE: In essential mode, networkInfo is not stored.
 * Connection data from ipwho.is API (in customData.ipLocation.connection) is used instead,
 * as it provides more accurate network/ISP information.
 */
export const DEFAULT_ESSENTIAL_NETWORK_FIELDS = [
  'type',
  'effectiveType',
  'downlink',
  'rtt',
  'saveData',
] as const;

/**
 * Default essential fields for Location Info storage
 */
export const DEFAULT_ESSENTIAL_LOCATION_FIELDS = [
  // Minimal location fields - only coordinates and source
  // All IP-related data (ip, country, city, etc.) is stored in customData.ipLocation to avoid duplication
  'lat',
  'lon',
  'source',
  'ts',
] as const;

/**
 * Default essential fields for Attribution Info storage
 */
export const DEFAULT_ESSENTIAL_ATTRIBUTION_FIELDS = [
  'landingUrl',
  'path',
] as const;

export interface AnalyticsEvent {
  sessionId: string;
  pageUrl: string;
  timestamp: Date | string;
  networkInfo?: NetworkInfo;
  deviceInfo?: DeviceInfo;
  location?: LocationInfo;
  attribution?: AttributionInfo;
  ipLocation?: IPLocation;
  userId?: string;
  customData?: Record<string, any>;
  eventId?: string;
  // Firebase/GA-like event tracking
  eventName?: string; // e.g., 'page_view', 'button_click', 'purchase'
  eventParameters?: Record<string, any>; // Event-specific parameters
}

export interface UseAnalyticsReturn {
  sessionId: string | null;
  networkInfo: NetworkInfo | null;
  deviceInfo: DeviceInfo | null;
  location: LocationInfo | null;
  attribution: AttributionInfo | null;
  pageVisits: number;
  interactions: number;
  logEvent: (customData?: Record<string, any>) => Promise<void>;
  // Firebase/GA-like event tracking
  trackEvent: (eventName: string, parameters?: Record<string, any>) => Promise<void>;
  trackPageView: (pageName?: string, parameters?: Record<string, any>) => Promise<void>;
  incrementInteraction: () => void;
  refresh: () => Promise<{
    net: NetworkInfo;
    dev: DeviceInfo;
    attr: AttributionInfo;
    loc: LocationInfo;
  }>;
}

