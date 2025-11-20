/**
 * Vitest setup file
 * Configures test environment
 */
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test)',
    language: 'en-US',
    platform: 'Test',
    hardwareConcurrency: 4,
    deviceMemory: 8,
    maxTouchPoints: 0,
    connection: {
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
    },
    geolocation: {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 24.8607,
            longitude: 67.0011,
            accuracy: 10,
          },
          timestamp: Date.now(),
        });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
  },
  writable: true,
});

// Mock window.location
delete (window as any).location;
(window as any).location = {
  href: 'https://example.com/test?utm_source=test',
  hostname: 'example.com',
  pathname: '/test',
  search: '?utm_source=test',
  origin: 'https://example.com',
};

// Mock document.referrer
Object.defineProperty(document, 'referrer', {
  value: 'https://google.com',
  writable: true,
});

// Mock performance
Object.defineProperty(window, 'performance', {
  value: {
    getEntriesByType: vi.fn(() => [
      {
        type: 'navigate',
      },
    ]),
  },
  writable: true,
});

