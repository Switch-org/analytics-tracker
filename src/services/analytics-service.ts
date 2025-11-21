import type { AnalyticsEvent, NetworkInfo, DeviceInfo, AttributionInfo } from '../types';

/**
 * Analytics Service
 * Sends analytics events to your backend API
 */
export class AnalyticsService {
  private static apiEndpoint: string = '/api/analytics';

  /**
   * Configure the analytics API endpoint
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
    });
  }
}

