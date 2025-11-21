import type { AnalyticsEvent, NetworkInfo, DeviceInfo, AttributionInfo } from '../types';

/**
 * Analytics Service
 * Sends analytics events to your backend API
 * 
 * Supports both relative paths (e.g., '/api/analytics') and full URLs (e.g., 'https://your-server.com/api/analytics')
 */
export class AnalyticsService {
  private static apiEndpoint: string = '/api/analytics';

  /**
   * Configure the analytics API endpoint
   * 
   * @param config - Configuration object
   * @param config.apiEndpoint - Your backend API endpoint URL
   *   - Relative path: '/api/analytics' (sends to same domain)
   *   - Full URL: 'https://your-server.com/api/analytics' (sends to your server)
   * 
   * @example
   * ```typescript
   * // Use your own server
   * AnalyticsService.configure({ 
   *   apiEndpoint: 'https://api.yourcompany.com/analytics' 
   * });
   * 
   * // Or use relative path (same domain)
   * AnalyticsService.configure({ 
   *   apiEndpoint: '/api/analytics' 
   * });
   * ```
   */
  static configure(config: { apiEndpoint: string }) {
    this.apiEndpoint = config.apiEndpoint;
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
   * Track user journey/analytics event
   */
  static async trackEvent(event: Omit<AnalyticsEvent, 'eventId' | 'timestamp'>): Promise<void> {
    const payload: AnalyticsEvent = {
      ...event,
      timestamp: new Date(),
      eventId: this.generateEventId(),
    };

    try {
      const res = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true, // Allows sending during unload on some browsers
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn('[Analytics] Send failed:', await res.text());
      } else if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.log('[Analytics] Event sent successfully');
      }
    } catch (err) {
      // Don't break user experience - silently fail
      console.warn('[Analytics] Failed to send event:', err);
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
        ...(ipLocation && { ipLocation }),
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
      customData: parameters || {},
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
}

