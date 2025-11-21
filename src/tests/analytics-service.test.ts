import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnalyticsService } from '../services/analytics-service';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock dynamic imports to avoid actual network calls
vi.mock('../utils/storage', () => ({
  getOrCreateUserId: vi.fn(() => 'test-session-id'),
}));

vi.mock('../detectors/network-detector', () => ({
  NetworkDetector: {
    detect: vi.fn(() => ({ type: 'wifi' })),
  },
}));

vi.mock('../detectors/device-detector', () => ({
  DeviceDetector: {
    detect: vi.fn(async () => ({ type: 'desktop', os: 'Windows' })),
  },
}));

vi.mock('../detectors/location-detector', () => ({
  LocationDetector: {
    detect: vi.fn(async () => ({ source: 'ip', permission: 'granted' })),
  },
}));

vi.mock('../detectors/attribution-detector', () => ({
  AttributionDetector: {
    detect: vi.fn(() => ({ landingUrl: 'https://example.com' })),
  },
}));

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AnalyticsService.configure({ apiEndpoint: '/api/analytics' });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logEvent', () => {
    it('should send event with eventName and parameters', async () => {
      // Mock window to avoid auto-collection issues
      Object.defineProperty(global, 'window', {
        value: {
          location: { href: 'https://example.com' },
        },
        writable: true,
        configurable: true,
      });

      await AnalyticsService.logEvent('button_click', {
        button_name: 'signup',
        button_location: 'header',
      }, {
        sessionId: 'test-session',
        pageUrl: 'https://example.com',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toBe('/api/analytics');
      expect(call[1].method).toBe('POST');
      expect(call[1].headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(call[1].body);
      expect(body.eventName).toBe('button_click');
      expect(body.eventParameters).toEqual({
        button_name: 'signup',
        button_location: 'header',
      });
      expect(body.customData).toEqual({
        button_name: 'signup',
        button_location: 'header',
      });
      expect(body.eventId).toBeDefined();
      expect(body.timestamp).toBeDefined();
    }, 10000);

    it('should send event without parameters', async () => {
      await AnalyticsService.logEvent('page_view', undefined, {
        sessionId: 'test-session',
        pageUrl: 'https://example.com',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.eventName).toBe('page_view');
      expect(body.eventParameters).toEqual({});
    }, 10000);

    it('should auto-collect context when not provided', async () => {
      // Mock window and navigator for context collection
      Object.defineProperty(global, 'window', {
        value: {
          location: { href: 'https://example.com/test' },
        },
        writable: true,
      });

      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'test-agent',
          hardwareConcurrency: 4,
        },
        writable: true,
      });

      await AnalyticsService.logEvent('test_event', { param: 'value' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.pageUrl).toBe('https://example.com/test');
      expect(body.sessionId).toBeDefined();
    });

    it('should use custom context when provided', async () => {
      const customContext = {
        sessionId: 'custom-session-123',
        pageUrl: 'https://custom.com/page',
        userId: 'user-123',
      };

      await AnalyticsService.logEvent('test_event', { param: 'value' }, customContext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.sessionId).toBe('custom-session-123');
      expect(body.pageUrl).toBe('https://custom.com/page');
      expect(body.userId).toBe('user-123');
    });

    it('should use custom endpoint from configuration', async () => {
      AnalyticsService.configure({ apiEndpoint: 'https://custom-api.com/events' });

      await AnalyticsService.logEvent('test_event');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toBe('https://custom-api.com/events');
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Should not throw
      await expect(
        AnalyticsService.logEvent('test_event', { param: 'value' })
      ).resolves.not.toThrow();
    });

    it('should handle non-ok responses gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server Error',
      });

      // Should not throw
      await expect(
        AnalyticsService.logEvent('test_event')
      ).resolves.not.toThrow();
    });
  });

  describe('trackPageView', () => {
    it('should send page_view event with page name', async () => {
      await AnalyticsService.trackPageView('/dashboard', {
        page_title: 'Dashboard',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.eventName).toBe('page_view');
      expect(body.eventParameters.page_name).toBe('/dashboard');
      expect(body.eventParameters.page_title).toBe('Dashboard');
    });

    it('should use current pathname when page name not provided', async () => {
      Object.defineProperty(global, 'window', {
        value: {
          location: { pathname: '/home', href: 'https://example.com/home' },
        },
        writable: true,
      });

      await AnalyticsService.trackPageView();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.eventName).toBe('page_view');
      expect(body.eventParameters.page_name).toBe('/home');
    });
  });

  describe('trackUserJourney', () => {
    it('should send page_view event with full context', async () => {
      await AnalyticsService.trackUserJourney({
        sessionId: 'session-123',
        pageUrl: 'https://example.com/page',
        userId: 'user-123',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.eventName).toBe('page_view');
      expect(body.sessionId).toBe('session-123');
      expect(body.pageUrl).toBe('https://example.com/page');
      expect(body.userId).toBe('user-123');
    });
  });
});

