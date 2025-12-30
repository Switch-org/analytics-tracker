# user-analytics-tracker

[![npm version](https://badge.fury.io/js/user-analytics-tracker.svg)](https://www.npmjs.com/package/user-analytics-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/switch-org/analytics-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/switch-org/analytics-tracker/actions/workflows/ci.yml)

A comprehensive, lightweight analytics tracking library for React applications. Track device information, network type, user location, attribution data, and more—all with zero runtime dependencies (React as peer dependency).

**🔒 Privacy-First & Self-Hosted**: All analytics data is sent to **your own backend server**. No data is sent to third-party servers. You have full control over your analytics data.

## ✨ Features

- 🔍 **Device Detection**: Automatically detects device type, OS, browser, model, brand, and hardware specs using User-Agent Client Hints
- 🌐 **Network Detection**: Identifies WiFi, Cellular, Hotspot, Ethernet connections with quality metrics
- 📍 **Location Tracking**: 
  - **IP-based location** - Requires user consent (privacy-compliant)
  - **GPS location** - Requires explicit user consent and browser permission
  - Includes public IP address, country, city, region, timezone, continent, flag, connection details
  - Dynamic key storage: All IP location API fields are automatically captured
  - Automatic fallback from GPS to IP when GPS unavailable
  - Consent management utilities included
- 🎯 **Attribution Tracking**: UTM parameters, referrer tracking, first/last touch attribution
- 📊 **IP Geolocation**: Client-side and server-side IP-based location detection utilities
- 🔒 **Privacy-First**: User consent required for location tracking (GPS & IP), consent management utilities
- 🎯 **Custom Event Tracking**: Firebase/Google Analytics-style event tracking with automatic context collection
- ⚡ **Event Batching & Queue System**: Automatic event batching reduces API calls by 50-90%. Events are queued and sent in configurable batches with offline persistence
- 🔄 **Retry Logic**: Automatic retry with exponential backoff for failed requests. Configurable retry attempts and delays
- 📝 **Enhanced Logging**: Configurable log levels (silent, error, warn, info, debug) with automatic dev/prod level selection
- 🔌 **Plugin System**: Extensible plugin architecture for event transformation, filtering, and enrichment
- 📈 **Session Management**: Enhanced session tracking with timeout detection and automatic renewal
- 🐛 **Debug Tools**: Built-in debugging utilities for development (queue inspection, manual flush, stats)
- 📊 **Performance Metrics**: Optional metrics collection for monitoring events, retries, and performance
- ⚡ **Lightweight**: Zero runtime dependencies (except React)
- 📦 **TypeScript**: Fully typed with comprehensive type definitions
- 🎨 **Framework Agnostic Core**: Core detectors work without React
- 🧪 **Well Tested**: Comprehensive test suite with Vitest

## 📦 Installation

```bash
npm install user-analytics-tracker react react-dom
# or
yarn add user-analytics-tracker react react-dom
# or
pnpm add user-analytics-tracker react react-dom
```

**Note**: React and React-DOM are peer dependencies and must be installed separately.

## 🔒 Self-Hosted Analytics - Configure Your Backend URL

**All analytics data is sent to YOUR backend server** - no third-party servers involved. You have complete control over your data.

### Quick Configuration

Simply provide your backend URL in the `apiEndpoint` configuration:

```tsx
import { useAnalytics } from 'user-analytics-tracker';

function App() {
  const analytics = useAnalytics({
    config: {
      apiEndpoint: 'https://api.yourcompany.com/analytics', // Your backend URL
    },
  });
}
```

### Advanced Configuration Options

The package now supports extensive configuration options for batching, retry logic, logging, and more:

```tsx
const analytics = useAnalytics({
  config: {
    apiEndpoint: 'https://api.yourcompany.com/analytics',
    
    // Event batching configuration
    batchSize: 10,              // Events per batch (default: 10)
    batchInterval: 5000,        // Flush interval in ms (default: 5000)
    maxQueueSize: 100,          // Max queued events (default: 100)
    
    // Retry configuration
    maxRetries: 3,              // Max retry attempts (default: 3)
    retryDelay: 1000,           // Initial retry delay in ms (default: 1000)
    
    // Session configuration
    sessionTimeout: 1800000,    // Session timeout in ms (default: 30 min)
    
    // Logging configuration
    logLevel: 'warn',           // 'silent' | 'error' | 'warn' | 'info' | 'debug' (default: 'warn')
    
    // Metrics configuration
    enableMetrics: false,       // Enable metrics collection (default: false)
    
    // Field storage configuration (optional) - control which fields are stored
    fieldStorage: {
      ipLocation: { mode: 'essential' },    // IP location fields
      deviceInfo: { mode: 'essential' },   // Device info fields
      networkInfo: { mode: 'essential' },  // Network info fields
      location: { mode: 'essential' },     // Location fields
      attribution: { mode: 'essential' },   // Attribution fields
      // Each can be: 'essential' (default) | 'all' | 'custom'
      // For 'custom': specify fields array
      // For 'all': specify exclude array
    },
    
    // Legacy: IP Location storage (backward compatible)
    ipLocationFields: { mode: 'essential' },
  },
});
```

### Configuration Options

You can configure your backend URL in three ways:

#### 1. **Full URL (Recommended for Production)**

Use a complete URL pointing to your backend server:

```tsx
const analytics = useAnalytics({
  config: {
    // Point to your own server
    apiEndpoint: 'https://api.yourcompany.com/analytics',
    
    // Or with a custom port
    // apiEndpoint: 'https://api.yourcompany.com:8080/analytics',
    
    // Or using a subdomain
    // apiEndpoint: 'https://analytics.yourcompany.com/track',
  },
});
```

#### 2. **Relative Path (Same Domain)**

Use a relative path if your API is on the same domain as your frontend:

```tsx
const analytics = useAnalytics({
  config: {
    // Sends to: https://yourdomain.com/api/analytics
    apiEndpoint: '/api/analytics',
  },
});
```

#### 3. **Environment Variables (Best Practice)**

Use environment variables for different environments:

```tsx
// .env.local (development)
// NEXT_PUBLIC_ANALYTICS_API=https://api-dev.yourcompany.com/analytics

// .env.production
// NEXT_PUBLIC_ANALYTICS_API=https://api.yourcompany.com/analytics

const analytics = useAnalytics({
  config: {
    apiEndpoint: process.env.NEXT_PUBLIC_ANALYTICS_API || '/api/analytics',
  },
});
```

### Step-by-Step Setup

1. **Set up your backend API endpoint** (see [Backend Setup](#-backend-api-setup) below)
2. **Configure the frontend** with your backend URL
3. **Test the connection** using browser DevTools Network tab

### Examples by Framework

**React (Create React App)**
```tsx
// src/App.tsx
import { useAnalytics } from 'user-analytics-tracker';

function App() {
  const analytics = useAnalytics({
    config: {
      apiEndpoint: process.env.REACT_APP_ANALYTICS_API || 'https://api.yourcompany.com/analytics',
    },
  });
}
```

**Next.js**
```tsx
// app/layout.tsx or pages/_app.tsx
import { useAnalytics } from 'user-analytics-tracker';

export default function Layout() {
  useAnalytics({
    config: {
      apiEndpoint: process.env.NEXT_PUBLIC_ANALYTICS_API || '/api/analytics',
    },
  });
}
```

**Vite + React**
```tsx
// src/main.tsx
import { useAnalytics } from 'user-analytics-tracker';

function App() {
  useAnalytics({
    config: {
      apiEndpoint: import.meta.env.VITE_ANALYTICS_API || 'https://api.yourcompany.com/analytics',
    },
  });
}
```

## 🚀 Quick Start

### Basic Usage (React Hook)

```tsx
import { useAnalytics } from 'user-analytics-tracker';

function MyApp() {
  const { 
    sessionId, 
    networkInfo, 
    deviceInfo, 
    location, 
    trackEvent, 
    trackPageView 
  } = useAnalytics({
    autoSend: true,
    config: {
      // Use your own backend server (full URL)
      apiEndpoint: 'https://api.yourcompany.com/analytics',
      // Or use relative path (same domain)
      // apiEndpoint: '/api/analytics',
    },
  });

  // Track page view on mount
  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  const handleButtonClick = async () => {
    // Track custom event (Firebase/GA-style)
    await trackEvent('button_click', {
      button_name: 'signup',
      button_location: 'header'
    });
  };

  return (
    <div>
      <p>Device: {deviceInfo?.deviceBrand} {deviceInfo?.deviceModel}</p>
      <p>Network: {networkInfo?.type}</p>
      <button onClick={handleButtonClick}>
        Track Click
      </button>
    </div>
  );
}
```

### Standalone Detectors (No React)

```typescript
import {
  NetworkDetector,
  DeviceDetector,
  AttributionDetector,
  LocationDetector,
} from 'user-analytics-tracker';

// Detect network type
const network = NetworkDetector.detect();
console.log(network.type); // 'wifi' | 'cellular' | 'hotspot' | 'ethernet' | 'unknown'

// Detect device info
const device = await DeviceDetector.detect();
console.log(device.deviceBrand, device.deviceModel);

// Detect attribution (UTM params, referrer, etc.)
const attribution = AttributionDetector.detect();
console.log(attribution.utm_source);

// Detect location (automatic IP-based if no consent, GPS if consent granted)
const location = await LocationDetector.detect();
console.log(location.lat, location.lon);
console.log(location.ip); // Public IP (when using IP-based location)
console.log(location.country, location.city); // Location details

// Or get IP-based location only (no permission needed)
const ipLocation = await LocationDetector.detectIPOnly();
console.log(ipLocation.ip, ipLocation.country, ipLocation.city);
```

## 📚 API Reference

### React Hook: `useAnalytics`

The main React hook for analytics tracking.

#### Parameters

```typescript
useAnalytics(options?: UseAnalyticsOptions): UseAnalyticsReturn
```

**Options:**

```typescript
interface UseAnalyticsOptions {
  autoSend?: boolean; // Auto-send analytics on mount (default: true)
  config?: Partial<AnalyticsConfig>;
  onReady?: (data: {
    sessionId: string;
    networkInfo: NetworkInfo;
    deviceInfo: DeviceInfo;
    location: LocationInfo;
    attribution: AttributionInfo;
  }) => void; // Callback when data is ready
}

interface AnalyticsConfig {
  apiEndpoint: string;
  // Batching options
  batchSize?: number;        // Events per batch (default: 10)
  batchInterval?: number;    // Flush interval in ms (default: 5000)
  maxQueueSize?: number;     // Max queued events (default: 100)
  // Retry options
  maxRetries?: number;       // Max retry attempts (default: 3)
  retryDelay?: number;       // Initial retry delay in ms (default: 1000)
  // Session options
  sessionTimeout?: number;   // Session timeout in ms (default: 1800000 = 30 min)
  // Logging options
  logLevel?: LogLevel;       // 'silent' | 'error' | 'warn' | 'info' | 'debug' (default: 'warn')
  // Metrics options
  enableMetrics?: boolean;   // Enable metrics collection (default: false)
  // Existing options
  autoSend?: boolean;
  enableLocation?: boolean;
  enableIPGeolocation?: boolean;
  enableNetworkDetection?: boolean;
  enableDeviceDetection?: boolean;
  enableAttribution?: boolean;
  sessionStoragePrefix?: string;
  localStoragePrefix?: string;
}
```

#### Returns

```typescript
interface UseAnalyticsReturn {
  sessionId: string | null;
  networkInfo: NetworkInfo | null;
  deviceInfo: DeviceInfo | null;
  location: LocationInfo | null;
  attribution: AttributionInfo | null;
  pageVisits: number;
  interactions: number;
  logEvent: (customData?: Record<string, any>) => Promise<void>;
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
```

### Detectors

#### `NetworkDetector.detect()`

Detects network connection type and quality.

```typescript
const network = NetworkDetector.detect();
// Returns:
// {
//   type: 'wifi' | 'cellular' | 'hotspot' | 'ethernet' | 'unknown';
//   effectiveType?: string; // '2g', '3g', '4g', etc.
//   downlink?: number; // Mbps
//   rtt?: number; // ms
//   saveData?: boolean;
//   connectionType?: string;
// }
```

#### `DeviceDetector.detect()`

Detects device information (async - uses User-Agent Client Hints).

```typescript
const device = await DeviceDetector.detect();
// Returns:
// {
//   type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
//   os: string;
//   osVersion: string;
//   browser: string;
//   browserVersion: string;
//   deviceModel: string;
//   deviceBrand: string;
//   screenResolution: string;
//   // ... more fields
// }
```

#### `LocationDetector.detect()`

Detects location (IP-first when no consent, GPS when consent granted). Automatically falls back to IP if GPS fails.

```typescript
const location = await LocationDetector.detect();
// Returns:
// {
//   lat?: number | null;
//   lon?: number | null;
//   accuracy?: number | null;  // GPS only
//   permission: 'granted' | 'denied' | 'prompt' | 'unsupported';
//   source: 'gps' | 'ip' | 'unknown';
//   ts?: string;
//   // IP-based location includes:
//   ip?: string | null;         // Public IP address
//   country?: string;           // Country name
//   countryCode?: string;       // ISO country code
//   city?: string;              // City name
//   region?: string;            // Region/state
//   timezone?: string;          // Timezone
// }
```

#### `LocationDetector.detectIPOnly()`

Get IP-based location only (fast, automatic, no permission needed).

```typescript
const location = await LocationDetector.detectIPOnly();
// Returns IP-based location with IP address, country, city, coordinates
// Works immediately without user permission
```

#### `LocationDetector.detectWithAutoConsent()`

Automatically grants consent and tries GPS, falls back to IP if GPS fails.

```typescript
const location = await LocationDetector.detectWithAutoConsent();
// 1. Automatically grants location consent
// 2. Tries GPS location (if available)
// 3. Falls back to IP-based location if GPS fails/denied/unavailable
```

#### `getPublicIP()`

Get just the public IP address (utility function).

```typescript
import { getPublicIP } from 'user-analytics-tracker';

const ip = await getPublicIP();
console.log(ip); // "203.0.113.42"
```

#### `AttributionDetector.detect()`

Detects UTM parameters, referrer, and session tracking.

```typescript
const attribution = AttributionDetector.detect();
// Returns:
// {
//   landingUrl: string;
//   referrerUrl: string | null;
//   referrerDomain: string | null;
//   utm_source?: string | null;
//   utm_medium?: string | null;
//   utm_campaign?: string | null;
//   // ... more UTM fields
//   firstTouch?: Record<string, string | null> | null;
//   lastTouch?: Record<string, string | null> | null;
//   sessionStart?: string | null;
// }
```

### Services

#### `AnalyticsService.configure()`

Configure the analytics service with advanced options.

```typescript
import { AnalyticsService } from 'user-analytics-tracker';

AnalyticsService.configure({
  apiEndpoint: 'https://api.yourcompany.com/analytics',
  batchSize: 20,              // Events per batch (default: 10)
  batchInterval: 10000,       // Flush interval in ms (default: 5000)
  maxQueueSize: 100,          // Max queued events (default: 100)
  maxRetries: 5,              // Max retry attempts (default: 3)
  retryDelay: 2000,           // Initial retry delay in ms (default: 1000)
  sessionTimeout: 1800000,    // Session timeout in ms (default: 30 min)
  logLevel: 'info',           // Logging verbosity (default: 'warn')
  enableMetrics: true,        // Enable metrics collection (default: false)
});
```

#### `AnalyticsService.trackUserJourney()`

Send analytics data to your backend.

```typescript
import { AnalyticsService } from 'user-analytics-tracker';

// Configure endpoint - use your own server
AnalyticsService.configure({ 
  apiEndpoint: 'https://api.yourcompany.com/analytics' 
});

// Or use relative path (same domain)
// AnalyticsService.configure({ apiEndpoint: '/api/analytics' });

// Track event
await AnalyticsService.trackUserJourney({
  sessionId: 'abc123',
  pageUrl: 'https://example.com/page',
  networkInfo: network,
  deviceInfo: device,
  location: location,
  attribution: attribution,
  customData: { userId: 'user123', action: 'purchase' },
});
```

#### `AnalyticsService.flushQueue()`

Manually flush the event queue (useful before page unload).

```typescript
// Flush all queued events immediately
await AnalyticsService.flushQueue();
```

#### `AnalyticsService.getQueueSize()`

Get the current number of events in the queue.

```typescript
const size = AnalyticsService.getQueueSize();
console.log(`Queue has ${size} events`);
```

#### `AnalyticsService.getMetrics()`

Get performance metrics (if enabled).

```typescript
const metrics = AnalyticsService.getMetrics();
if (metrics) {
  console.log(`Sent: ${metrics.eventsSent}, Failed: ${metrics.eventsFailed}`);
}
```

### Utilities

#### Logger

Configure logging levels for better debugging and production use.

```typescript
import { logger } from 'user-analytics-tracker';

// Set log level
logger.setLevel('debug'); // 'silent' | 'error' | 'warn' | 'info' | 'debug'

// Use logger
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
```

#### Plugin Manager

Register and manage plugins for event transformation.

```typescript
import { pluginManager } from 'user-analytics-tracker';

// Register a plugin
pluginManager.register({
  name: 'my-plugin',
  beforeSend: (event) => {
    // Transform event
    return event;
  },
});

// Unregister a plugin
pluginManager.unregister('my-plugin');

// Get all plugins
const plugins = pluginManager.getPlugins();
```

#### Queue Manager

Advanced queue management (for power users).

```typescript
import { QueueManager } from 'user-analytics-tracker';

const queue = new QueueManager({
  batchSize: 20,
  batchInterval: 10000,
  maxQueueSize: 200,
  storageKey: 'my-queue',
});

queue.setFlushCallback(async (events) => {
  // Custom flush logic
});
```

#### Metrics Collector

Collect and monitor analytics performance metrics.

```typescript
import { metricsCollector } from 'user-analytics-tracker';

// Metrics are automatically collected when enableMetrics is true
// Access metrics
const metrics = metricsCollector.getMetrics();

// Reset metrics
metricsCollector.reset();
```

#### Location Consent Management

```typescript
import {
  setLocationConsentGranted,
  hasLocationConsent,
  checkAndSetLocationConsent,
  clearLocationConsent,
} from 'user-analytics-tracker';

// When user enters MSISDN, grant location consent
checkAndSetLocationConsent(msisdn); // Returns true if consent granted

// Check if consent exists
if (hasLocationConsent()) {
  // Location tracking allowed
}

// Manually grant/revoke consent
setLocationConsentGranted();
clearLocationConsent();
```

#### Session Management

Enhanced session tracking utilities.

```typescript
import {
  getOrCreateSession,
  updateSessionActivity,
  getSession,
  clearSession,
} from 'user-analytics-tracker';

// Get or create session with custom timeout (30 minutes)
const session = getOrCreateSession(30 * 60 * 1000);
// Returns: { sessionId, startTime, lastActivity, pageViews }

// Update session activity
updateSessionActivity();

// Get current session
const currentSession = getSession();

// Clear session
clearSession();
```

#### Debug Utilities

Development debugging tools.

```typescript
import { initDebug } from 'user-analytics-tracker';

// Initialize debug tools (automatically called in development)
initDebug();

// Then access via window.__analyticsDebug in browser console
```

#### IP Geolocation Utilities

**Client-Side: Get Public IP**

```typescript
import { getPublicIP } from 'user-analytics-tracker';

// Get just the public IP address (no location data)
const ip = await getPublicIP();
console.log('Your IP:', ip); // "203.0.113.42"
```

**Server-Side: IP Location from Request**

```typescript
import { getIPLocation, getIPFromRequest } from 'user-analytics-tracker';

// In your API route (Next.js example)
export async function POST(req: Request) {
  // Extract IP from request headers
  const ip = getIPFromRequest(req);
  
  // Get location data from IP
  const location = await getIPLocation(ip);
  // location contains: country, region, city, lat, lon, timezone, isp, etc.
}
```

## 🔒 Privacy & Consent

### MSISDN-Based Consent

When a user enters their phone number (MSISDN), it implies consent for location tracking. The library automatically grants location consent:

```typescript
import { checkAndSetLocationConsent } from 'user-analytics-tracker';

// When MSISDN is entered
checkAndSetLocationConsent(phoneNumber);
// Location consent is now granted, GPS will be requested automatically
```

### Hotspot Detection & Gating

Detect and restrict hotspot users:

```tsx
import { useAnalytics } from 'user-analytics-tracker';

function HotspotGate({ children }) {
  const { networkInfo } = useAnalytics({ autoSend: false });
  
  if (networkInfo?.type === 'hotspot') {
    return (
      <div>
        <h2>Hotspot Detected</h2>
        <p>Please switch to mobile data or Wi-Fi.</p>
      </div>
    );
  }
  
  return children;
}
```

## 📖 Advanced Usage

### Custom Analytics Service

```typescript
import { AnalyticsService } from 'user-analytics-tracker';

class MyAnalyticsService extends AnalyticsService {
  static async trackUserJourney(data: any) {
    // Custom tracking logic
    await fetch('/my-custom-endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
```

### Custom Event Tracking (Firebase/GA-style)

Track custom events with automatic context collection:

```typescript
const { trackEvent, trackPageView } = useAnalytics();

// Track button click
await trackEvent('button_click', {
  button_name: 'signup',
  button_location: 'header',
  button_color: 'blue'
});

// Track purchase
await trackEvent('purchase', {
  transaction_id: 'T12345',
  value: 29.99,
  currency: 'USD',
  items: [
    { id: 'item1', name: 'Product 1', price: 29.99 }
  ]
});

// Track page views
await trackPageView('/dashboard', {
  page_title: 'Dashboard',
  user_type: 'premium'
});

// Track current page view
await trackPageView();
```

### Manual Event Tracking (Legacy)

```typescript
const { logEvent, incrementInteraction } = useAnalytics();

// Log custom event with full control
await logEvent({
  eventType: 'purchase',
  productId: '123',
  amount: 99.99,
});

// Increment interaction counter
incrementInteraction();
```

### Server-Side Integration

Example Next.js API route:

```typescript
// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getIPFromRequest, getIPLocation } from 'user-analytics-tracker';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ip = getIPFromRequest(req);
  const ipLocation = await getIPLocation(ip);
  
  // Store analytics with IP location
  await storeAnalytics({
    ...body,
    ip,
    ipLocation,
  });
  
  return NextResponse.json({ ok: true });
}
```

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs) directory:

- **[Upgrade Guide](./docs/upgrade-guide.md)** - Step-by-step migration instructions for upgrading between versions

- **[Upgrade Guide](./docs/upgrade-guide.md)** - Step-by-step migration instructions for upgrading between versions
  - Breaking changes and compatibility notes
  - New features and improvements
  - Migration examples
  - Troubleshooting upgrade issues

- **[Usage Guide](./docs/usage-guide.md)** - Complete guide on how to use the package in your applications
  - Installation instructions
  - Basic and advanced usage examples
  - React hook documentation
  - Standalone (non-React) usage
  - Framework integrations (Next.js, Gatsby, etc.)
  - Real-world examples
  - Troubleshooting

- **[Quick Start Guide](./docs/quick-start.md)** - Get started in 5 minutes
  - Installation
  - Basic setup
  - Development workflow
  - Common commands

- **[Publishing Guide](./docs/publishing.md)** - How to publish the package
  - Prerequisites
  - Publishing methods (automatic & manual)
  - Version management
  - Best practices

- **[Package Structure](./docs/package-structure.md)** - Understanding the codebase
  - Directory structure
  - Architecture overview
  - Code organization
  - Development guidelines

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🛠️ Development

```bash
# Clone repository
git clone https://github.com/switch-org/analytics-tracker.git
cd analytics-tracker

# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run build:watch

# Lint
npm run lint

# Format
npm run format

# Type check
npm run type-check
```

## 📝 TypeScript

This package is written in TypeScript and provides full type definitions. All exports are fully typed:

```typescript
import type {
  NetworkInfo,
  DeviceInfo,
  LocationInfo,
  AttributionInfo,
  IPLocation,
  UseAnalyticsReturn,
} from 'user-analytics-tracker';
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## 📄 License

MIT © [Switch Org](https://github.com/switch-org)

## 🙏 Acknowledgments

- Uses [ipwho.is](https://ipwho.is/) for free IP geolocation
- Built with modern web APIs (User-Agent Client Hints, Network Information API, Geolocation API)

<!-- ## 📞 Support

- 📧 Email: support@switch.org
- 🐛 Issues: [GitHub Issues](https://github.com/switch-org/analytics-tracker/issues)
- 📖 Documentation: See the [docs/](./docs) directory for comprehensive guides


--- -->

Made with ❤️ by ATIF RAFIQUE