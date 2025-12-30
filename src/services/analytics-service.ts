import type { AnalyticsEvent, NetworkInfo, DeviceInfo, AttributionInfo, AnalyticsConfig, LogLevel } from '../types';
import { QueueManager } from '../utils/queue-manager';
import { logger } from '../utils/logger';
import { pluginManager } from '../plugins/plugin-manager';
import { metricsCollector } from '../utils/metrics';
import { transformIPLocationForBackend } from '../utils/ip-location-transformer';

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
   */
  private static async sendBatch(events: AnalyticsEvent[]): Promise<void> {
    if (events.length === 0) return;

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
   */
  static async trackEvent(event: Omit<AnalyticsEvent, 'eventId' | 'timestamp'>): Promise<void> {
    const payload: AnalyticsEvent = {
      ...event,
      timestamp: new Date(),
      eventId: this.generateEventId(),
    };

    // If queue is available, use it (browser environment)
    if (this.queueManager && typeof window !== 'undefined') {
      this.queueManager.enqueue(payload);
      
      // Record metrics
      if (this.config.enableMetrics) {
        metricsCollector.recordQueued();
        metricsCollector.updateQueueSize(this.queueManager.getQueueSize());
      }
      
      return;
    }

    // Fallback: send immediately (SSR or queue not initialized)
    try {
      await this.sendBatch([payload]);
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
    pageVisits = 1,
    interactions = 0,
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
    // Transform IP location data to match backend expected format (camelCase)
    const transformedIPLocation = transformIPLocationForBackend(ipLocation);

    await this.trackEvent({
      sessionId,
      pageUrl,
      networkInfo,
      deviceInfo,
      location,
      attribution,
      ipLocation,
      userId: userId ?? sessionId,
      customData: {
        ...customData,
        // Store transformed IP location in customData for backend integration
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
          const { NetworkDetector } = await import('../detectors/network-detector');
          const { DeviceDetector } = await import('../detectors/device-detector');
          const { LocationDetector } = await import('../detectors/location-detector');
          const { AttributionDetector } = await import('../detectors/attribution-detector');

          autoContext = {
            sessionId: getOrCreateUserId(),
            pageUrl: window.location.href,
            networkInfo: NetworkDetector.detect(),
            deviceInfo: await DeviceDetector.detect(),
            location: await LocationDetector.detect().catch(() => undefined),
            attribution: AttributionDetector.detect(),
          };
        } catch (error) {
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

    const finalSessionId = context?.sessionId || autoContext?.sessionId || 'unknown';
    const finalPageUrl = context?.pageUrl || autoContext?.pageUrl || '';
    
    // Extract IP location from location object if available
    const locationData = context?.location || autoContext?.location;
    const ipLocationData = locationData && typeof locationData === 'object' 
      ? (locationData as any)?.ipLocationData 
      : undefined;
    
    // Transform IP location data to match backend expected format
    const transformedIPLocation = transformIPLocationForBackend(ipLocationData);

    await this.trackEvent({
      sessionId: finalSessionId,
      pageUrl: finalPageUrl,
      networkInfo: context?.networkInfo || autoContext?.networkInfo,
      deviceInfo: context?.deviceInfo || autoContext?.deviceInfo,
      location: context?.location || autoContext?.location,
      attribution: context?.attribution || autoContext?.attribution,
      userId: context?.userId || finalSessionId,
      eventName,
      eventParameters: parameters || {},
      customData: {
        ...(parameters || {}),
        // Store transformed IP location in customData for backend integration
        ...(transformedIPLocation && { ipLocation: transformedIPLocation }),
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
    parameters?: Record<string, any>
  ): Promise<void> {
    const page = pageName || (typeof window !== 'undefined' ? window.location.pathname : '');
    
    await this.logEvent('page_view', {
      page_name: page,
      page_title: typeof document !== 'undefined' ? document.title : undefined,
      ...parameters,
    });
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

