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

export interface IPLocation {
  ip: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  query?: string;
}

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
}

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
  incrementInteraction: () => void;
  refresh: () => Promise<{
    net: NetworkInfo;
    dev: DeviceInfo;
    attr: AttributionInfo;
    loc: LocationInfo;
  }>;
}

