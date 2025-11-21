# @atif/analytics-tracker

[![npm version](https://badge.fury.io/js/%40atif%2Fanalytics-tracker.svg)](https://www.npmjs.com/package/@atif/analytics-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/switch-org/analytics-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/switch-org/analytics-tracker/actions/workflows/ci.yml)

A comprehensive, lightweight analytics tracking library for React applications. Track device information, network type, user location, attribution data, and more—all with zero runtime dependencies (React as peer dependency).

## ✨ Features

- 🔍 **Device Detection**: Automatically detects device type, OS, browser, model, brand, and hardware specs using User-Agent Client Hints
- 🌐 **Network Detection**: Identifies WiFi, Cellular, Hotspot, Ethernet connections with quality metrics
- 📍 **Location Tracking**: GPS location with consent management (MSISDN-based consent)
- 🎯 **Attribution Tracking**: UTM parameters, referrer tracking, first/last touch attribution
- 📊 **IP Geolocation**: Server-side IP-based location detection (helper utilities)
- 🔒 **Privacy-First**: Location consent management, no tracking without user action
- ⚡ **Lightweight**: Zero runtime dependencies (except React)
- 📦 **TypeScript**: Fully typed with comprehensive type definitions
- 🎨 **Framework Agnostic Core**: Core detectors work without React
- 🧪 **Well Tested**: Comprehensive test suite with Vitest

## 📦 Installation

```bash
npm install @atif/analytics-tracker react react-dom
# or
yarn add @atif/analytics-tracker react react-dom
# or
pnpm add @atif/analytics-tracker react react-dom
```

**Note**: React and React-DOM are peer dependencies and must be installed separately.

## 🚀 Quick Start

### Basic Usage (React Hook)

```tsx
import { useAnalytics } from '@atif/analytics-tracker';

function MyApp() {
  const { sessionId, networkInfo, deviceInfo, location, logEvent } = useAnalytics({
    autoSend: true,
    config: {
      apiEndpoint: '/api/analytics',
    },
  });

  return (
    <div>
      <p>Device: {deviceInfo?.deviceBrand} {deviceInfo?.deviceModel}</p>
      <p>Network: {networkInfo?.type}</p>
      <button onClick={() => logEvent({ action: 'button_click' })}>
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
} from '@atif/analytics-tracker';

// Detect network type
const network = NetworkDetector.detect();
console.log(network.type); // 'wifi' | 'cellular' | 'hotspot' | 'ethernet' | 'unknown'

// Detect device info
const device = await DeviceDetector.detect();
console.log(device.deviceBrand, device.deviceModel);

// Detect attribution (UTM params, referrer, etc.)
const attribution = AttributionDetector.detect();
console.log(attribution.utm_source);

// Detect location (with consent check)
const location = await LocationDetector.detect();
console.log(location.lat, location.lon);
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

Detects GPS location (respects consent).

```typescript
const location = await LocationDetector.detect();
// Returns:
// {
//   lat?: number | null;
//   lon?: number | null;
//   accuracy?: number | null;
//   permission: 'granted' | 'denied' | 'prompt' | 'unsupported';
//   source: 'gps' | 'ip' | 'unknown';
//   ts?: string;
// }
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

#### `AnalyticsService.trackUserJourney()`

Send analytics data to your backend.

```typescript
import { AnalyticsService } from '@atif/analytics-tracker';

// Configure endpoint
AnalyticsService.configure({ apiEndpoint: '/api/analytics' });

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

### Utilities

#### Location Consent Management

```typescript
import {
  setLocationConsentGranted,
  hasLocationConsent,
  checkAndSetLocationConsent,
  clearLocationConsent,
} from '@atif/analytics-tracker';

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

#### IP Geolocation (Server-Side)

```typescript
import { getIPLocation, getIPFromRequest } from '@atif/analytics-tracker';

// In your API route (Next.js example)
export async function POST(req: Request) {
  const ip = getIPFromRequest(req);
  const location = await getIPLocation(ip);
  // location contains country, region, city, lat, lon, etc.
}
```

## 🔒 Privacy & Consent

### MSISDN-Based Consent

When a user enters their phone number (MSISDN), it implies consent for location tracking. The library automatically grants location consent:

```typescript
import { checkAndSetLocationConsent } from '@atif/analytics-tracker';

// When MSISDN is entered
checkAndSetLocationConsent(phoneNumber);
// Location consent is now granted, GPS will be requested automatically
```

### Hotspot Detection & Gating

Detect and restrict hotspot users:

```tsx
import { useAnalytics } from '@atif/analytics-tracker';

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
import { AnalyticsService } from '@atif/analytics-tracker';

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

### Manual Event Tracking

```typescript
const { logEvent, incrementInteraction } = useAnalytics();

// Log custom event
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
import { getIPFromRequest, getIPLocation } from '@atif/analytics-tracker';

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
} from '@atif/analytics-tracker';
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

- Uses [ip-api.com](http://ip-api.com) for free IP geolocation
- Built with modern web APIs (User-Agent Client Hints, Network Information API, Geolocation API)

## 📞 Support

- 📧 Email: support@switch.org
- 🐛 Issues: [GitHub Issues](https://github.com/switch-org/analytics-tracker/issues)
- 📖 Documentation: See the [docs/](./docs) directory for comprehensive guides

---

Made with ❤️ by Switch Org

