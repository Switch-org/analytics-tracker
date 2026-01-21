import type { AnalyticsEvent, NetworkInfo, DeviceInfo, AttributionInfo, AnalyticsConfig, LogLevel, LocationInfo } from '../types';
import { QueueManager } from '../utils/queue-manager';
import { logger } from '../utils/logger';
import { pluginManager } from '../plugins/plugin-manager';
import { metricsCollector } from '../utils/metrics';
import { transformIPLocationForBackend } from '../utils/ip-location-transformer';
import { filterFieldsByConfig } from '../utils/field-storage-transformer';
import { LocationDetector } from '../detectors/location-detector';
import { validateEvent, generateDeduplicationKey } from '../utils/event-validator';
import {
  DEFAULT_ESSENTIAL_DEVICE_FIELDS,
  DEFAULT_ESSENTIAL_NETWORK_FIELDS,
  DEFAULT_ESSENTIAL_LOCATION_FIELDS,
  DEFAULT_ESSENTIAL_ATTRIBUTION_FIELDS,
} from '../types';

/**
 * Analytics Service
 * Sends analytics events to your backend API
 * 
 * Supports both relative paths (e.g., '/api/analytics') and full URLs (e.g., 'https://your-server.com/api/analytics')
 * 
 * Features:
 * - Event batching and queueing
 * - Automatic retry with exponential backoff
 * - Offline support with localStorage persistence
 * - Configurable logging levels
 */
export class AnalyticsService {
  private static apiEndpoint: string = '/api/analytics';
  private static queueManager: QueueManager | null = null;
  private static config: Partial<AnalyticsConfig> = {};
  private static isInitialized = false;
  private static seenEventKeys: Set<string> = new Set();
  private static readonly DEDUPE_CACHE_SIZE = 1000; // Keep last 1000 event keys

  /**
   * Configure the analytics service
   * 
   * @param config - Configuration object
   * @param config.apiEndpoint - Your backend API endpoint URL
   * @param config.batchSize - Events per batch (default: 10)
   * @param config.batchInterval - Flush interval in ms (default: 5000)
   * @param config.maxQueueSize - Max queued events (default: 100)
   * @param config.maxRetries - Max retry attempts (default: 3)
   * @param config.retryDelay - Initial retry delay in ms (default: 1000)
   * @param config.logLevel - Logging verbosity (default: 'warn')
   * 
   * @example
   * ```typescript
   * // Basic configuration
   * AnalyticsService.configure({ 
   *   apiEndpoint: 'https://api.yourcompany.com/analytics' 
   * });
   * 
   * // Advanced configuration
   * AnalyticsService.configure({
   *   apiEndpoint: '/api/analytics',
   *   batchSize: 20,
   *   batchInterval: 10000,
   *   maxRetries: 5,
   *   logLevel: 'info'
   * });
   * ```
   */
  static configure(config: Partial<AnalyticsConfig> & { apiEndpoint: string }) {
    this.apiEndpoint = config.apiEndpoint;
    this.config = {
      batchSize: 10,
      batchInterval: 5000,
      maxQueueSize: 100,
      maxRetries: 3,
      retryDelay: 1000,
      logLevel: 'warn',
      ...config,
    };

    // Clear seen event keys when reconfiguring (important for tests)
    this.seenEventKeys.clear();

    // Set log level
    if (this.config.logLevel) {
      logger.setLevel(this.config.logLevel as LogLevel);
    }

    // Initialize queue manager
    this.initializeQueue();

    // Store endpoint for sendBeacon
    if (typeof window !== 'undefined') {
      (window as any).__analyticsEndpoint = this.apiEndpoint;
    }

    // Reset metrics if enabled
    if (this.config.enableMetrics) {
      metricsCollector.reset();
    }

    // Configure IP geolocation if provided
    if (this.config.ipGeolocation) {
      LocationDetector.configureIPGeolocation(this.config.ipGeolocation);
    }

    this.isInitialized = true;
  }

  /**
   * Initialize the queue manager
   */
  private static initializeQueue(): void {
    if (typeof window === 'undefined') return;

    const batchSize = this.config.batchSize ?? 10;
    const batchInterval = this.config.batchInterval ?? 5000;
    const maxQueueSize = this.config.maxQueueSize ?? 100;

    this.queueManager = new QueueManager({
      batchSize,
      batchInterval,
      maxQueueSize,
      storageKey: 'analytics:eventQueue',
    });

    // Set flush callback
    this.queueManager.setFlushCallback(async (events: AnalyticsEvent[]) => {
      await this.sendBatch(events);
    });
  }

  /**
   * Get queue manager instance
   */
  static getQueueManager(): QueueManager | null {
    return this.queueManager;
  }

  /**
   * Generate a random event ID
   */
  private static generateEventId(): string {
    const arr = new Uint32Array(4);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(arr);
      return Array.from(arr)
        .map((n) => n.toString(16))
        .join('');
    }
    // Fallback for environments without crypto
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Send a batch of events with retry logic
   * Filters out invalid and duplicate events before sending
   */
  private static async sendBatch(events: AnalyticsEvent[]): Promise<void> {
    // Validate and filter events
    const validatedEvents: AnalyticsEvent[] = [];
    const seenInBatch = new Set<string>();
    
    for (const event of events) {
      // Validate event
      const validated = validateEvent(event);
      if (!validated) {
        logger.debug('Event filtered out in batch: missing required fields', {
          sessionId: event.sessionId,
          pageUrl: event.pageUrl,
          hasIPLocation: !!event.ipLocation,
          hasIP: !!(event.ipLocation?.ip),
        });
        continue;
      }
      
      // Check for duplicates in this batch only
      // Note: Events are already deduplicated when queued, so we only check within the batch
      const dedupeKey = generateDeduplicationKey(validated);
      if (seenInBatch.has(dedupeKey)) {
        logger.debug('Duplicate event filtered out in batch', { dedupeKey });
        continue;
      }
      
      // Add to seen events for this batch
      seenInBatch.add(dedupeKey);
      
      // Also add to global seen events cache (for cross-batch deduplication)
      // But don't filter out if already seen - events from queue are already validated
      if (!this.seenEventKeys.has(dedupeKey)) {
        this.seenEventKeys.add(dedupeKey);
        // Manage cache size
        if (this.seenEventKeys.size > this.DEDUPE_CACHE_SIZE) {
          const firstKey = this.seenEventKeys.values().next().value;
          if (firstKey !== undefined) {
            this.seenEventKeys.delete(firstKey);
          }
        }
      }
      
      validatedEvents.push(validated);
    }
    
    if (validatedEvents.length === 0) {
      logger.debug('All events in batch were filtered out');
      return;
    }
    
    // Use validated events
    if (validatedEvents.length === 0) {
      return;
    }
    
    events = validatedEvents;

    // Apply plugin transformations
    const transformedEvents: AnalyticsEvent[] = [];
    for (const event of events) {
      const transformed = await pluginManager.executeBeforeSend(event);
      if (transformed) {
        transformedEvents.push(transformed);
      } else {
        if (this.config.enableMetrics) {
          metricsCollector.recordFiltered();
        }
      }
    }

    if (transformedEvents.length === 0) {
      logger.debug('All events filtered out by plugins');
      return;
    }

    const maxRetries = this.config.maxRetries ?? 3;
    const retryDelay = this.config.retryDelay ?? 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify(transformedEvents),
        });

        if (res.ok) {
          const sendTime = Date.now(); // Approximate send time
          logger.debug(`Successfully sent batch of ${transformedEvents.length} events`);
          
          // Record metrics
          if (this.config.enableMetrics) {
            for (let i = 0; i < transformedEvents.length; i++) {
              metricsCollector.recordSent(sendTime);
            }
            metricsCollector.recordFlush();
          }
          
          // Execute afterSend hooks
          for (const event of transformedEvents) {
            await pluginManager.executeAfterSend(event);
          }
          
          return;
        }

        // Don't retry on client errors (4xx)
        if (res.status >= 400 && res.status < 500) {
          const errorText = await res.text().catch(() => 'Unknown error');
          logger.warn(`Client error (${res.status}): ${errorText}`);
          
          // Record metrics
          if (this.config.enableMetrics) {
            const error = new Error(`Client error: ${errorText}`);
            for (let i = 0; i < transformedEvents.length; i++) {
              metricsCollector.recordFailed(error);
            }
          }
          
          return;
        }

        // Retry on server errors (5xx) or network errors
        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
          logger.debug(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
          
          if (this.config.enableMetrics) {
            metricsCollector.recordRetry();
          }
          
          await this.sleep(delay);
        } else {
          const errorText = await res.text().catch(() => 'Unknown error');
          const error = new Error(`Failed after ${maxRetries} retries: ${errorText}`);
          
          // Record metrics
          if (this.config.enableMetrics) {
            for (let i = 0; i < transformedEvents.length; i++) {
              metricsCollector.recordFailed(error);
            }
          }
          
          // Execute onError hooks
          for (const event of transformedEvents) {
            await pluginManager.executeOnError(event, error);
          }
          
          throw error;
        }
      } catch (err: any) {
        // Network error - retry if attempts remaining
        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt);
          logger.debug(`Network error, retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
          
          if (this.config.enableMetrics) {
            metricsCollector.recordRetry();
          }
          
          await this.sleep(delay);
        } else {
          logger.error(`Failed to send batch after ${maxRetries} retries:`, err);
          
          // Record metrics
          if (this.config.enableMetrics) {
            const error = err instanceof Error ? err : new Error(String(err));
            for (let i = 0; i < transformedEvents.length; i++) {
              metricsCollector.recordFailed(error);
            }
          }
          
          // Execute onError hooks
          const error = err instanceof Error ? err : new Error(String(err));
          for (const event of transformedEvents) {
            await pluginManager.executeOnError(event, error);
          }
          
          throw err;
        }
      }
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Track user journey/analytics event
   * Events are automatically queued and batched
   * Duplicate events and events with null values are filtered out
   */
  static async trackEvent(event: Omit<AnalyticsEvent, 'eventId' | 'timestamp'>): Promise<void> {
    const payload: AnalyticsEvent = {
      ...event,
      timestamp: new Date(),
      eventId: this.generateEventId(),
    };

    // Validate event - filter out if missing required fields or too many nulls
    const validatedEvent = validateEvent(payload);
    if (!validatedEvent) {
      logger.debug('Event filtered out: missing required fields or too many null values', {
        sessionId: payload.sessionId,
        pageUrl: payload.pageUrl,
        eventName: payload.eventName,
      });
      return;
    }

    // Check for duplicates
    const dedupeKey = generateDeduplicationKey(validatedEvent);
    if (this.seenEventKeys.has(dedupeKey)) {
      logger.debug('Duplicate event filtered out', {
        dedupeKey,
        sessionId: validatedEvent.sessionId,
        pageUrl: validatedEvent.pageUrl,
        eventName: validatedEvent.eventName,
      });
      return;
    }

    // Add to seen events (with cache size limit)
    this.seenEventKeys.add(dedupeKey);
    if (this.seenEventKeys.size > this.DEDUPE_CACHE_SIZE) {
      // Remove oldest entries (simple FIFO - remove first entry)
      const firstKey = this.seenEventKeys.values().next().value;
      if (firstKey !== undefined) {
        this.seenEventKeys.delete(firstKey);
      }
    }

    // If queue is available, use it (browser environment)
    if (this.queueManager && typeof window !== 'undefined') {
      this.queueManager.enqueue(validatedEvent);
      
      // Record metrics
      if (this.config.enableMetrics) {
        metricsCollector.recordQueued();
        metricsCollector.updateQueueSize(this.queueManager.getQueueSize());
      }
      
      return;
    }

    // Fallback: send immediately (SSR or queue not initialized)
    try {
      await this.sendBatch([validatedEvent]);
    } catch (err) {
      logger.warn('Failed to send event:', err);
    }
  }

  /**
   * Track user journey with full context
   */
  static async trackUserJourney({
    sessionId,
    pageUrl,
    networkInfo,
    deviceInfo,
    location,
    attribution,
    ipLocation,
    userId,
    customData,
    pageVisits: _pageVisits = 1,
    interactions: _interactions = 0,
  }: {
    sessionId: string;
    pageUrl: string;
    networkInfo?: NetworkInfo;
    deviceInfo?: DeviceInfo;
    location?: any;
    attribution?: AttributionInfo;
    ipLocation?: any;
    userId?: string;
    customData?: Record<string, any>;
    pageVisits?: number;
    interactions?: number;
  }): Promise<void> {
    // Get field storage config (support both new and legacy format)
    const fieldStorage = this.config.fieldStorage || {};
    const ipLocationConfig = fieldStorage.ipLocation || this.config.ipLocationFields;
    
    // Transform and filter all data types based on configuration
    // Use raw ipLocation if transformation returns null (for validation purposes)
    let transformedIPLocation = transformIPLocationForBackend(
      ipLocation,
      ipLocationConfig
    );
    // Fallback to original ipLocation if transform returns null (needed for validation)
    if (!transformedIPLocation && ipLocation) {
      transformedIPLocation = ipLocation as any;
    }
    
    const filteredDeviceInfo = filterFieldsByConfig(
      deviceInfo,
      fieldStorage.deviceInfo,
      DEFAULT_ESSENTIAL_DEVICE_FIELDS
    );
    
    // In essential mode, don't store browser-based networkInfo
    // Connection data from ipwho.is (in customData.ipLocation.connection) is more accurate
    const networkInfoConfig = fieldStorage.networkInfo;
    const networkInfoMode = networkInfoConfig?.mode || 'essential';
    
    // Skip networkInfo in essential mode - use connection from ipwho.is instead
    const filteredNetworkInfo = networkInfoMode === 'essential' 
      ? undefined 
      : filterFieldsByConfig(
          networkInfo,
          networkInfoConfig,
          DEFAULT_ESSENTIAL_NETWORK_FIELDS
        );
    
    // For location: In essential mode, remove duplicate fields that are already in customData.ipLocation
    // This prevents storing the same data twice (e.g., ip, country, city, region, timezone)
    const locationConfig = fieldStorage.location;
    const locationMode = locationConfig?.mode || 'essential';
    
    let filteredLocation = filterFieldsByConfig(
      location as LocationInfo,
      locationConfig,
      DEFAULT_ESSENTIAL_LOCATION_FIELDS
    );
    
    // In essential mode, if we have IP location data, remove duplicate fields from location
    // to avoid storing the same data twice
    if (locationMode === 'essential' && transformedIPLocation && filteredLocation) {
      // Remove fields that are duplicated in customData.ipLocation
      const duplicateFields = ['ip', 'country', 'countryCode', 'city', 'region', 'timezone'];
      const minimalLocation: any = { ...filteredLocation };
      duplicateFields.forEach(field => {
        delete minimalLocation[field];
      });
      // Only keep essential location fields: lat, lon, source, ts
      filteredLocation = {
        lat: minimalLocation.lat,
        lon: minimalLocation.lon,
        source: minimalLocation.source,
        ts: minimalLocation.ts,
      } as LocationInfo;
    }
    
    const filteredAttribution = filterFieldsByConfig(
      attribution,
      fieldStorage.attribution,
      DEFAULT_ESSENTIAL_ATTRIBUTION_FIELDS
    );

    await this.trackEvent({
      sessionId,
      pageUrl,
      networkInfo: filteredNetworkInfo || undefined,
      deviceInfo: filteredDeviceInfo || undefined,
      location: filteredLocation || undefined,
      attribution: filteredAttribution || undefined,
      ipLocation: transformedIPLocation || ipLocation || undefined,
      userId: userId ?? sessionId,
      customData: {
        ...customData,
        // Store transformed and filtered IP location in customData for backend integration
        ...(transformedIPLocation && { ipLocation: transformedIPLocation }),
      },
      eventName: 'page_view', // Auto-tracked as page view
    });
  }

  /**
   * Track a custom event (Firebase/GA-style)
   * Automatically collects device, network, location context if available
   * 
   * @param eventName - Name of the event (e.g., 'button_click', 'purchase', 'sign_up')
   * @param parameters - Event-specific parameters (optional)
   * @param context - Optional context override (auto-collected if not provided)
   * 
   * @example
   * ```typescript
   * // Simple event tracking
   * AnalyticsService.logEvent('button_click', { 
   *   button_name: 'signup',
   *   button_location: 'header' 
   * });
   * 
   * // Purchase event
   * AnalyticsService.logEvent('purchase', {
   *   transaction_id: 'T12345',
   *   value: 29.99,
   *   currency: 'USD',
   *   items: [{ id: 'item1', name: 'Product 1', price: 29.99 }]
   * });
   * ```
   */
  static async logEvent(
    eventName: string,
    parameters?: Record<string, any>,
    context?: {
      sessionId?: string;
      pageUrl?: string;
      networkInfo?: NetworkInfo;
      deviceInfo?: DeviceInfo;
      location?: any;
      attribution?: AttributionInfo;
      userId?: string;
      ipLocation?: any;
    }
  ): Promise<void> {
    // Auto-collect context if not provided (requires dynamic imports)
    let autoContext: {
      sessionId: string;
      pageUrl: string;
      networkInfo?: NetworkInfo;
      deviceInfo?: DeviceInfo;
      location?: any;
      attribution?: AttributionInfo;
    } | null = null;

    if (!context) {
      // Try to auto-collect context from window/global if available
      if (typeof window !== 'undefined') {
        try {
          // Import dynamically to avoid circular dependencies
          const { getOrCreateUserId } = await import('../utils/storage');
          const { DeviceDetector } = await import('../detectors/device-detector');
          const { LocationDetector } = await import('../detectors/location-detector');
          const { AttributionDetector } = await import('../detectors/attribution-detector');

          // Don't collect networkInfo - use connection from ipwho.is instead (more accurate)
          autoContext = {
            sessionId: getOrCreateUserId(),
            pageUrl: window.location.href,
            // networkInfo removed - use customData.ipLocation.connection from ipwho.is instead
            deviceInfo: await DeviceDetector.detect(),
            location: await LocationDetector.detect().catch(() => undefined),
            attribution: AttributionDetector.detect(),
          };
        } catch {
          // If auto-collection fails, use minimal context
          const { getOrCreateUserId } = await import('../utils/storage');
          autoContext = {
            sessionId: getOrCreateUserId(),
            pageUrl: typeof window !== 'undefined' ? window.location.href : '',
          };
        }
      } else {
        // SSR environment - use minimal context
        autoContext = {
          sessionId: 'unknown',
          pageUrl: '',
        };
      }
    }

    // Ensure sessionId is always a valid non-empty string for validation
    let finalSessionId = context?.sessionId || autoContext?.sessionId || 'unknown';
    if (finalSessionId === 'unknown' || finalSessionId.trim() === '') {
      // Try to get from storage if available
      if (typeof window !== 'undefined') {
        try {
          const { getOrCreateUserId } = await import('../utils/storage');
          finalSessionId = getOrCreateUserId();
        } catch {
          // If storage is not available, generate a temporary session ID
          finalSessionId = `temp-${Date.now()}`;
        }
      } else {
        // SSR environment - generate a temporary session ID
        finalSessionId = `temp-${Date.now()}`;
      }
    }
    
    // Ensure pageUrl is always a valid non-empty string for validation
    let finalPageUrl = context?.pageUrl || autoContext?.pageUrl || '';
    // If pageUrl is empty, try to get it from window.location if available
    if (!finalPageUrl && typeof window !== 'undefined' && window.location) {
      finalPageUrl = window.location.href;
    }
    // If still empty, use a default value to pass validation
    if (!finalPageUrl || finalPageUrl.trim() === '') {
      finalPageUrl = 'https://unknown';
    }
    
    // Extract IP location from context.ipLocation, location object, or auto-collected location
    const ipLocationData = context?.ipLocation || 
      (context?.location && typeof context.location === 'object' 
        ? (context.location as any)?.ipLocationData 
        : undefined) ||
      (autoContext?.location && typeof autoContext.location === 'object'
        ? (autoContext.location as any)?.ipLocationData
        : undefined);
    
    // Get field storage config (support both new and legacy format)
    const fieldStorage = this.config.fieldStorage || {};
    const ipLocationConfig = fieldStorage.ipLocation || this.config.ipLocationFields;
    
    // Transform and filter all data types based on configuration
    // Use raw ipLocationData if transformation returns null (for validation purposes)
    // Always prioritize context?.ipLocation if it has an IP (most direct and reliable source)
    const rawIPLocation = (context?.ipLocation && context.ipLocation.ip) 
      ? context.ipLocation 
      : (ipLocationData || undefined);
    
    // Preserve ip field for validation - always ensure ip is available
    const preserveIP = rawIPLocation?.ip;
    
    let transformedIPLocation = transformIPLocationForBackend(
      rawIPLocation,
      ipLocationConfig
    );
    
    // Critical: Ensure ip field is always preserved for validation
    // If transformation removed ip or returned null/empty, restore it from rawIPLocation
    if (preserveIP) {
      if (!transformedIPLocation) {
        // Transformation returned null, use rawIPLocation
        transformedIPLocation = rawIPLocation as any;
      } else if (Object.keys(transformedIPLocation).length === 0) {
        // Transformation returned empty object, use rawIPLocation
        transformedIPLocation = rawIPLocation as any;
      } else if (!transformedIPLocation.ip) {
        // Transformation returned object but without ip field, restore it
        transformedIPLocation = { ...transformedIPLocation, ip: preserveIP };
      }
    } else if (!transformedIPLocation && rawIPLocation) {
      // No ip to preserve, but use rawIPLocation if transformation failed
      transformedIPLocation = rawIPLocation as any;
    }
    
    const rawDeviceInfo = context?.deviceInfo || autoContext?.deviceInfo;
    const filteredDeviceInfo = filterFieldsByConfig(
      rawDeviceInfo,
      fieldStorage.deviceInfo,
      DEFAULT_ESSENTIAL_DEVICE_FIELDS
    );
    
    // Ensure deviceInfo has os and browser for validation (critical fields)
    // If filtering removed them, restore from rawDeviceInfo
    let finalDeviceInfo: Partial<DeviceInfo> | null = filteredDeviceInfo;
    if (rawDeviceInfo) {
      if (!finalDeviceInfo) {
        // Filtering returned null, create minimal object with essential fields
        finalDeviceInfo = {};
        if (rawDeviceInfo.os) finalDeviceInfo.os = rawDeviceInfo.os;
        if (rawDeviceInfo.browser) finalDeviceInfo.browser = rawDeviceInfo.browser;
      } else {
        // Ensure os and browser are present for validation
        if (!finalDeviceInfo.os && rawDeviceInfo.os) {
          finalDeviceInfo = { ...finalDeviceInfo, os: rawDeviceInfo.os };
        }
        if (!finalDeviceInfo.browser && rawDeviceInfo.browser) {
          finalDeviceInfo = { ...finalDeviceInfo, browser: rawDeviceInfo.browser };
        }
      }
      // Only use finalDeviceInfo if it has at least os or browser
      // But if rawDeviceInfo has os or browser, ensure finalDeviceInfo has them
      if (rawDeviceInfo.os || rawDeviceInfo.browser) {
        if (!finalDeviceInfo) {
          finalDeviceInfo = {};
        }
        if (rawDeviceInfo.os && !finalDeviceInfo.os) {
          finalDeviceInfo.os = rawDeviceInfo.os;
        }
        if (rawDeviceInfo.browser && !finalDeviceInfo.browser) {
          finalDeviceInfo.browser = rawDeviceInfo.browser;
        }
      } else if (!finalDeviceInfo || (!finalDeviceInfo.os && !finalDeviceInfo.browser)) {
        // No os or browser in rawDeviceInfo, and finalDeviceInfo doesn't have them either
        finalDeviceInfo = null;
      }
    }
    
    // In essential mode, don't store browser-based networkInfo
    // Connection data from ipwho.is (in customData.ipLocation.connection) is more accurate
    const networkInfoConfig = fieldStorage.networkInfo;
    const networkInfoMode = networkInfoConfig?.mode || 'essential';
    
    // Skip networkInfo in essential mode - use connection from ipwho.is instead
    const filteredNetworkInfo = networkInfoMode === 'essential' 
      ? undefined 
      : filterFieldsByConfig(
          context?.networkInfo || autoContext?.networkInfo,
          networkInfoConfig,
          DEFAULT_ESSENTIAL_NETWORK_FIELDS
        );
    
    // For location: In essential mode, remove duplicate fields that are already in customData.ipLocation
    const locationConfig = fieldStorage.location;
    const locationMode = locationConfig?.mode || 'essential';
    
    let filteredLocation = filterFieldsByConfig(
      (context?.location || autoContext?.location) as LocationInfo,
      locationConfig,
      DEFAULT_ESSENTIAL_LOCATION_FIELDS
    );
    
    // In essential mode, if we have IP location data, remove duplicate fields from location
    if (locationMode === 'essential' && transformedIPLocation && filteredLocation) {
      // Remove fields that are duplicated in customData.ipLocation
      const duplicateFields = ['ip', 'country', 'countryCode', 'city', 'region', 'timezone'];
      const minimalLocation: any = { ...filteredLocation };
      duplicateFields.forEach(field => {
        delete minimalLocation[field];
      });
      // Only keep essential location fields: lat, lon, source, ts
      filteredLocation = {
        lat: minimalLocation.lat,
        lon: minimalLocation.lon,
        source: minimalLocation.source,
        ts: minimalLocation.ts,
      } as LocationInfo;
    }
    
    const filteredAttribution = filterFieldsByConfig(
      context?.attribution || autoContext?.attribution,
      fieldStorage.attribution,
      DEFAULT_ESSENTIAL_ATTRIBUTION_FIELDS
    );

    // Ensure ipLocation is available for validation
    // Always preserve ip field - critical for validation
    // Use transformedIPLocation if it has ip, otherwise fall back to rawIPLocation
    let finalIPLocation: any = undefined;
    
    // Priority 1: If we have rawIPLocation with IP, always use it (most reliable source)
    if (rawIPLocation && rawIPLocation.ip) {
      if (transformedIPLocation && transformedIPLocation.ip) {
        // Both have IP, prefer transformed (has filtering applied)
        finalIPLocation = transformedIPLocation;
      } else if (transformedIPLocation) {
        // Transformed exists but no IP, merge with rawIPLocation to preserve IP
        finalIPLocation = { ...transformedIPLocation, ip: rawIPLocation.ip };
      } else {
        // No transformation, use rawIPLocation directly
        finalIPLocation = rawIPLocation;
      }
    } else if (transformedIPLocation) {
      // No raw IP, but transformation succeeded
      finalIPLocation = transformedIPLocation;
    } else if (context?.ipLocation && context.ipLocation.ip) {
      // Fallback to context.ipLocation if available
      finalIPLocation = context.ipLocation;
    }
    
    // Final safety check: ensure IP is always present if we have it from any source
    if (!finalIPLocation || !finalIPLocation.ip) {
      if (rawIPLocation && rawIPLocation.ip) {
        finalIPLocation = rawIPLocation;
      } else if (context?.ipLocation && context.ipLocation.ip) {
        finalIPLocation = context.ipLocation;
      }
    }
    
    // Ultimate safeguard: if context.ipLocation has IP, always use it for validation
    // This ensures validation never fails due to missing IP when it's provided in context
    if (context?.ipLocation && context.ipLocation.ip) {
      if (!finalIPLocation || !finalIPLocation.ip) {
        finalIPLocation = context.ipLocation;
      }
    }
    
    await this.trackEvent({
      sessionId: finalSessionId,
      pageUrl: finalPageUrl,
      networkInfo: filteredNetworkInfo || undefined,
      deviceInfo: (finalDeviceInfo && (finalDeviceInfo.os || finalDeviceInfo.browser)) ? (finalDeviceInfo as DeviceInfo) : undefined,
      location: filteredLocation || undefined,
      attribution: filteredAttribution || undefined,
      ipLocation: finalIPLocation,
      userId: context?.userId || finalSessionId,
      eventName,
      eventParameters: parameters || {},
      customData: {
        ...(parameters || {}),
        // Store transformed IP location in customData for backend integration
        // Use transformed if available, otherwise use raw (for validation)
        ...(finalIPLocation && { ipLocation: transformedIPLocation || finalIPLocation }),
      },
    });
  }

  /**
   * Track a page view event (Firebase/GA-style)
   * Automatically collects device, network, location context
   * 
   * @param pageName - Optional page name (defaults to current URL pathname)
   * @param parameters - Optional page view parameters
   * 
   * @example
   * ```typescript
   * // Track current page view
   * AnalyticsService.trackPageView();
   * 
   * // Track with custom page name
   * AnalyticsService.trackPageView('/dashboard', {
   *   page_title: 'Dashboard',
   *   user_type: 'premium'
   * });
   * ```
   */
  static async trackPageView(
    pageName?: string,
    parameters?: Record<string, any>,
    context?: {
      sessionId?: string;
      pageUrl?: string;
      networkInfo?: NetworkInfo;
      deviceInfo?: DeviceInfo;
      location?: any;
      attribution?: AttributionInfo;
      userId?: string;
      ipLocation?: any;
    }
  ): Promise<void> {
    const page = pageName || (typeof window !== 'undefined' ? window.location.pathname : '');
    
    await this.logEvent('page_view', {
      page_name: page,
      page_title: typeof document !== 'undefined' ? document.title : undefined,
      ...parameters,
    }, context);
  }

  /**
   * Manually flush the event queue
   * Useful for ensuring events are sent before page unload
   */
  static async flushQueue(): Promise<void> {
    if (this.queueManager) {
      await this.queueManager.flush();
    }
  }

  /**
   * Get current queue size
   */
  static getQueueSize(): number {
    return this.queueManager?.getQueueSize() ?? 0;
  }

  /**
   * Clear the event queue
   */
  static clearQueue(): void {
    this.queueManager?.clear();
    if (this.config.enableMetrics) {
      metricsCollector.updateQueueSize(0);
    }
  }

  /**
   * Get metrics (if enabled)
   */
  static getMetrics() {
    if (!this.config.enableMetrics) {
      logger.warn('Metrics collection is not enabled. Set enableMetrics: true in config.');
      return null;
    }
    return metricsCollector.getMetrics();
  }
}

