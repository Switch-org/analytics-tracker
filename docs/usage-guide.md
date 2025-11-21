# Usage Guide

This comprehensive guide shows you exactly how to use `@atif/analytics-tracker` in your applications. From installation to advanced use cases, everything is covered here.

## 📦 Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Basic React Setup](#basic-react-setup)
4. [Backend API Setup](#backend-api-setup)
5. [React Hook Usage](#react-hook-usage)
6. [Standalone (Non-React) Usage](#standalone-non-react-usage)
7. [Real-World Examples](#real-world-examples)
8. [Advanced Patterns](#advanced-patterns)
9. [Common Use Cases](#common-use-cases)
10. [Framework Integrations](#framework-integrations)

---

## 📦 Installation

### Step 1: Install the Package

```bash
# Using npm
npm install @atif/analytics-tracker react react-dom

# Using yarn
yarn add @atif/analytics-tracker react react-dom

# Using pnpm
pnpm add @atif/analytics-tracker react react-dom
```

**Important**: React and React-DOM are peer dependencies and must be installed separately. The minimum React version required is 16.8.0 (for hooks support).

### Step 2: Verify Installation

```bash
# Check if package is installed
npm list @atif/analytics-tracker
```

---

## 🚀 Quick Start

### Minimal Example (5 minutes)

```tsx
// App.tsx
import { useAnalytics } from '@atif/analytics-tracker';

function App() {
  const { deviceInfo, networkInfo, logEvent } = useAnalytics({
    autoSend: true,
    config: {
      apiEndpoint: '/api/analytics', // Your backend endpoint
    },
  });

  return (
    <div>
      <h1>Welcome!</h1>
      <p>Device: {deviceInfo?.deviceBrand} {deviceInfo?.deviceModel}</p>
      <p>Network: {networkInfo?.type}</p>
      
      <button onClick={() => logEvent({ action: 'button_click', buttonId: 'welcome' })}>
        Click Me
      </button>
    </div>
  );
}
```

That's it! The library will automatically:
- ✅ Detect device information
- ✅ Detect network type
- ✅ Track page visits
- ✅ Capture UTM parameters
- ✅ Send analytics to your backend

---

## 🎯 Basic React Setup

### Step 1: Create Your Backend API Endpoint

First, create an API endpoint to receive analytics data. Here are examples for different frameworks:

#### Next.js API Route (`app/api/analytics/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getIPFromRequest, getIPLocation } from '@atif/analytics-tracker';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Get IP address from request
    const ip = getIPFromRequest(req);
    
    // Optionally get IP-based location
    const ipLocation = await getIPLocation(ip);
    
    // Store analytics data (implement your storage logic)
    await saveAnalyticsData({
      ...body,
      ip,
      ipLocation,
      serverTimestamp: new Date().toISOString(),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to save analytics' }, { status: 500 });
  }
}

async function saveAnalyticsData(data: any) {
  // Your database/storage logic here
  // Examples: MongoDB, PostgreSQL, Firebase, etc.
  console.log('Analytics data:', data);
}
```

#### Express.js API (`routes/analytics.js`)

```javascript
const express = require('express');
const router = express.Router();
const { getIPFromRequest, getIPLocation } = require('@atif/analytics-tracker');

router.post('/api/analytics', async (req, res) => {
  try {
    const ip = getIPFromRequest(req);
    const ipLocation = await getIPLocation(ip);
    
    // Store analytics
    await saveAnalyticsData({
      ...req.body,
      ip,
      ipLocation,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to save analytics' });
  }
});

module.exports = router;
```

#### Fastify (`routes/analytics.ts`)

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { getIPFromRequest, getIPLocation } from '@atif/analytics-tracker';

export async function analyticsRoute(
  request: FastifyRequest<{ Body: any }>,
  reply: FastifyReply
) {
  try {
    const ip = getIPFromRequest(request);
    const ipLocation = await getIPLocation(ip);
    
    await saveAnalyticsData({
      ...request.body,
      ip,
      ipLocation,
    });
    
    return { success: true };
  } catch (error) {
    reply.code(500).send({ error: 'Failed to save analytics' });
  }
}
```

### Step 2: Set Up Analytics in Your React App

#### Option A: Single Page Application (SPA)

```tsx
// App.tsx
import { useAnalytics } from '@atif/analytics-tracker';

function App() {
  const { sessionId, deviceInfo, networkInfo, location, attribution, logEvent } = useAnalytics({
    autoSend: true,
    config: {
      apiEndpoint: '/api/analytics',
    },
    onReady: (data) => {
      console.log('Analytics ready:', data);
      // Optional: Do something when analytics is ready
    },
  });

  return (
    <div>
      {/* Your app content */}
    </div>
  );
}
```

#### Option B: Multiple Pages (with React Router)

```tsx
// App.tsx
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useAnalytics } from '@atif/analytics-tracker';
import { useEffect } from 'react';

// Analytics provider component
function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { logEvent, sessionId } = useAnalytics({
    autoSend: true,
    config: {
      apiEndpoint: '/api/analytics',
    },
  });

  return <>{children}</>;
}

// Track page views on route changes
function PageViewTracker() {
  const location = useLocation();
  const { logEvent } = useAnalytics({ autoSend: false });

  useEffect(() => {
    logEvent({
      eventType: 'page_view',
      page: location.pathname,
      search: location.search,
    });
  }, [location, logEvent]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AnalyticsProvider>
        <PageViewTracker />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </AnalyticsProvider>
    </BrowserRouter>
  );
}
```

---

## 🔧 React Hook Usage

### Basic Hook Configuration

```tsx
import { useAnalytics } from '@atif/analytics-tracker';

function MyComponent() {
  const analytics = useAnalytics({
    // Automatically send analytics data on mount (default: true)
    autoSend: true,
    
    // Configuration options
    config: {
      apiEndpoint: '/api/analytics', // Required: Your backend endpoint
      enableLocation: false,          // Enable location tracking
    },
    
    // Callback when analytics data is ready
    onReady: (data) => {
      console.log('Analytics initialized:', data);
    },
  });

  // Available properties:
  // - analytics.sessionId: Unique session ID
  // - analytics.deviceInfo: Device information
  // - analytics.networkInfo: Network type and quality
  // - analytics.location: GPS location (if enabled)
  // - analytics.attribution: UTM parameters, referrer
  // - analytics.pageVisits: Number of page visits
  // - analytics.interactions: Number of interactions
  // - analytics.logEvent(): Log custom events
  // - analytics.incrementInteraction(): Increment interaction counter
  // - analytics.refresh(): Refresh all detectors

  return <div>Your content</div>;
}
```

### Available Properties

```tsx
const {
  sessionId,        // string | null - Unique session identifier
  networkInfo,      // NetworkInfo | null - Network type and quality
  deviceInfo,       // DeviceInfo | null - Device details
  location,         // LocationInfo | null - GPS location (if enabled)
  attribution,      // AttributionInfo | null - UTM params, referrer
  pageVisits,       // number - Total page visits
  interactions,     // number - User interaction count
  logEvent,         // Function to log custom events
  incrementInteraction, // Function to increment interaction counter
  refresh,          // Function to refresh all detectors
} = useAnalytics();
```

### Logging Custom Events

```tsx
function ProductPage({ productId }: { productId: string }) {
  const { logEvent } = useAnalytics();

  const handlePurchase = async () => {
    // Log purchase event with custom data
    await logEvent({
      eventType: 'purchase',
      productId,
      amount: 99.99,
      currency: 'USD',
      category: 'electronics',
    });
    
    // Continue with purchase logic
    // ...
  };

  const handleAddToCart = async () => {
    await logEvent({
      eventType: 'add_to_cart',
      productId,
      quantity: 1,
    });
  };

  return (
    <div>
      <button onClick={handleAddToCart}>Add to Cart</button>
      <button onClick={handlePurchase}>Buy Now</button>
    </div>
  );
}
```

### Tracking User Interactions

```tsx
function InteractiveComponent() {
  const { logEvent, incrementInteraction } = useAnalytics();

  const handleClick = () => {
    // Option 1: Just increment counter (faster)
    incrementInteraction();
    
    // Option 2: Log detailed event
    logEvent({
      eventType: 'interaction',
      interactionType: 'click',
      element: 'button',
    });
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

### Manual Event Tracking (Without Auto-Send)

```tsx
function CustomTrackingComponent() {
  const { logEvent, sessionId, deviceInfo, networkInfo } = useAnalytics({
    autoSend: false, // Don't auto-send on mount
    config: {
      apiEndpoint: '/api/analytics',
    },
  });

  useEffect(() => {
    // Send initial page view manually
    logEvent({
      eventType: 'page_view',
      page: window.location.pathname,
    });
  }, []);

  return <div>Content</div>;
}
```

### Refreshing Analytics Data

```tsx
function NetworkMonitor() {
  const { networkInfo, refresh } = useAnalytics();

  const handleRefresh = async () => {
    // Refresh all detectors (network, device, location, attribution)
    const updated = await refresh();
    console.log('Updated network:', updated.net);
    console.log('Updated device:', updated.dev);
  };

  return (
    <div>
      <p>Current Network: {networkInfo?.type}</p>
      <button onClick={handleRefresh}>Refresh Network Info</button>
    </div>
  );
}
```

---

## 🎨 Real-World Examples

### Example 1: E-Commerce Product Tracking

```tsx
import { useAnalytics } from '@atif/analytics-tracker';

function ProductDetailPage({ product }: { product: Product }) {
  const { logEvent, deviceInfo, networkInfo } = useAnalytics({
    autoSend: true,
    config: {
      apiEndpoint: '/api/analytics',
    },
  });

  // Track page view
  useEffect(() => {
    logEvent({
      eventType: 'product_view',
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
    });
  }, [product.id]);

  const handleAddToCart = async () => {
    await logEvent({
      eventType: 'add_to_cart',
      productId: product.id,
      quantity: 1,
      price: product.price,
    });
  };

  const handlePurchase = async () => {
    await logEvent({
      eventType: 'purchase',
      productId: product.id,
      amount: product.price,
      currency: 'USD',
      // Include network info for context
      networkType: networkInfo?.type,
      deviceType: deviceInfo?.type,
    });
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <p>${product.price}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
      <button onClick={handlePurchase}>Buy Now</button>
    </div>
  );
}
```

### Example 2: Form Analytics

```tsx
function ContactForm() {
  const { logEvent, attribution } = useAnalytics();

  const handleSubmit = async (data: FormData) => {
    // Track form submission with attribution data
    await logEvent({
      eventType: 'form_submission',
      formType: 'contact',
      utm_source: attribution?.utm_source,
      utm_campaign: attribution?.utm_campaign,
      referrer: attribution?.referrerDomain,
    });
    
    // Submit form
    // ...
  };

  const handleFieldFocus = (fieldName: string) => {
    logEvent({
      eventType: 'form_interaction',
      action: 'focus',
      field: fieldName,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        onFocus={() => handleFieldFocus('email')}
        type="email"
        name="email"
      />
      <input
        onFocus={() => handleFieldFocus('message')}
        name="message"
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Example 3: Hotspot Detection & Gating

```tsx
import { useAnalytics } from '@atif/analytics-tracker';

function HotspotGate({ children }: { children: React.ReactNode }) {
  const { networkInfo, logEvent } = useAnalytics({
    autoSend: false, // Don't auto-send in gate
    config: {
      apiEndpoint: '/api/analytics',
    },
  });

  useEffect(() => {
    if (networkInfo?.type === 'hotspot') {
      // Track hotspot detection
      logEvent({
        eventType: 'hotspot_detected',
        action: 'access_blocked',
      });
    }
  }, [networkInfo?.type]);

  if (networkInfo?.type === 'hotspot') {
    return (
      <div className="hotspot-warning">
        <h2>Hotspot Detected</h2>
        <p>For security reasons, please switch to mobile data or Wi-Fi.</p>
        <p>Current connection: {networkInfo.type}</p>
      </div>
    );
  }

  return <>{children}</>;
}

// Usage
function App() {
  return (
    <HotspotGate>
      <YourAppContent />
    </HotspotGate>
  );
}
```

### Example 4: Location-Based Features

```tsx
import { useAnalytics, checkAndSetLocationConsent } from '@atif/analytics-tracker';

function LocationFeature() {
  const { location, logEvent, refresh } = useAnalytics({
    autoSend: false,
    config: {
      apiEndpoint: '/api/analytics',
      enableLocation: true,
    },
  });

  const handleMSISDNSubmit = async (phoneNumber: string) => {
    // When user enters phone number, grant location consent
    const consentGranted = checkAndSetLocationConsent(phoneNumber);
    
    if (consentGranted) {
      // Refresh location after consent
      await refresh();
      
      // Track consent granted
      await logEvent({
        eventType: 'location_consent_granted',
        msisdn: phoneNumber,
      });
    }
  };

  return (
    <div>
      {location?.permission === 'granted' && location.lat && location.lon ? (
        <div>
          <h2>Your Location</h2>
          <p>Latitude: {location.lat}</p>
          <p>Longitude: {location.lon}</p>
          <p>Accuracy: {location.accuracy}m</p>
        </div>
      ) : (
        <div>
          <p>Please enter your phone number to enable location features:</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const phone = e.currentTarget.phone.value;
            handleMSISDNSubmit(phone);
          }}>
            <input name="phone" type="tel" />
            <button type="submit">Submit</button>
          </form>
        </div>
      )}
    </div>
  );
}
```

### Example 5: Performance Monitoring

```tsx
function PerformanceMonitor() {
  const { deviceInfo, networkInfo, logEvent } = useAnalytics();

  useEffect(() => {
    // Track page load performance
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      logEvent({
        eventType: 'performance',
        metric: 'page_load',
        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        networkType: networkInfo?.type,
        effectiveType: networkInfo?.effectiveType,
        deviceType: deviceInfo?.type,
        connectionSpeed: networkInfo?.downlink,
      });
    });
  }, []);

  return null; // This is a tracking-only component
}
```

---

## 🔌 Standalone (Non-React) Usage

You can use the detectors without React:

### Device Detection

```typescript
import { DeviceDetector } from '@atif/analytics-tracker';

// Detect device information
const deviceInfo = await DeviceDetector.detect();

console.log(deviceInfo.deviceBrand);     // "Samsung"
console.log(deviceInfo.deviceModel);     // "Galaxy S21"
console.log(deviceInfo.os);              // "Android"
console.log(deviceInfo.osVersion);       // "12"
console.log(deviceInfo.browser);         // "Chrome"
console.log(deviceInfo.screenResolution); // "1080x1920"
console.log(deviceInfo.type);            // "mobile" | "tablet" | "desktop"

// Available fields:
// - type: DeviceType
// - os: string
// - osVersion: string
// - browser: string
// - browserVersion: string
// - screenResolution: string
// - deviceModel: string
// - deviceBrand: string
// - language: string
// - timezone: string
// - userAgent: string
// - deviceMemory?: number
// - hardwareConcurrency?: number
// - touchSupport: boolean
// - pixelRatio: number
// - colorDepth: number
// - orientation: string
// - cpuArchitecture: string
```

### Network Detection

```typescript
import { NetworkDetector } from '@atif/analytics-tracker';

// Detect network type (synchronous)
const networkInfo = NetworkDetector.detect();

console.log(networkInfo.type);           // "wifi" | "cellular" | "hotspot" | "ethernet" | "unknown"
console.log(networkInfo.effectiveType);  // "4g" | "3g" | "2g"
console.log(networkInfo.downlink);       // Connection speed in Mbps
console.log(networkInfo.rtt);            // Round-trip time in ms
console.log(networkInfo.saveData);       // true if data saver is enabled

// Monitor network changes
if (typeof navigator !== 'undefined' && 'connection' in navigator) {
  const connection = (navigator as any).connection;
  connection.addEventListener('change', () => {
    const updated = NetworkDetector.detect();
    console.log('Network changed:', updated);
  });
}
```

### Attribution Detection

```typescript
import { AttributionDetector } from '@atif/analytics-tracker';

// Detect attribution data (UTM parameters, referrer, etc.)
const attribution = AttributionDetector.detect();

console.log(attribution.utm_source);     // "google"
console.log(attribution.utm_medium);     // "cpc"
console.log(attribution.utm_campaign);   // "summer_sale"
console.log(attribution.referrerDomain); // "example.com"
console.log(attribution.landingUrl);     // Full landing URL
console.log(attribution.firstTouch);     // First touchpoint data
console.log(attribution.lastTouch);      // Last touchpoint data

// Attribution automatically persists:
// - First touch: Stored in localStorage (persists across sessions)
// - Last touch: Updated on each visit
// - Session start: Timestamp when session started
```

### Location Detection

```typescript
import { LocationDetector, hasLocationConsent, checkAndSetLocationConsent } from '@atif/analytics-tracker';

// Check if user has granted consent
if (hasLocationConsent()) {
  // Detect location
  const location = await LocationDetector.detect();
  
  if (location.permission === 'granted' && location.lat && location.lon) {
    console.log('Latitude:', location.lat);
    console.log('Longitude:', location.lon);
    console.log('Accuracy:', location.accuracy, 'meters');
    console.log('Source:', location.source); // "gps" | "ip" | "unknown"
  }
}

// Grant consent when user enters MSISDN
const consentGranted = checkAndSetLocationConsent('+1234567890');
if (consentGranted) {
  // Location will be available on next detection
  const location = await LocationDetector.detect();
}
```

### Direct API Service Usage

```typescript
import { AnalyticsService, NetworkDetector, DeviceDetector, AttributionDetector } from '@atif/analytics-tracker';

// Configure the service
AnalyticsService.configure({
  apiEndpoint: 'https://api.example.com/analytics',
});

// Collect all data
const networkInfo = NetworkDetector.detect();
const deviceInfo = await DeviceDetector.detect();
const attribution = AttributionDetector.detect();

// Send manually
await AnalyticsService.trackUserJourney({
  sessionId: 'unique-session-id',
  pageUrl: window.location.href,
  networkInfo,
  deviceInfo,
  attribution,
  customData: {
    userId: 'user123',
    action: 'page_view',
  },
});
```

---

## 🎯 Common Use Cases

### 1. Marketing Attribution

Track where users come from:

```tsx
function LandingPage() {
  const { attribution, logEvent } = useAnalytics();

  useEffect(() => {
    // Track landing with attribution
    logEvent({
      eventType: 'landing',
      utm_source: attribution?.utm_source,
      utm_campaign: attribution?.utm_campaign,
      referrer: attribution?.referrerDomain,
      firstTouch: attribution?.firstTouch,
    });
  }, []);

  return <div>Welcome!</div>;
}
```

### 2. Network Quality Optimization

Adapt content based on network:

```tsx
function AdaptiveContent() {
  const { networkInfo } = useAnalytics();

  if (networkInfo?.effectiveType === '2g' || networkInfo?.saveData) {
    return <LowQualityImage src="image-small.jpg" />;
  }

  return <HighQualityImage src="image-large.jpg" />;
}
```

### 3. Device-Specific Features

Enable features based on device:

```tsx
function DeviceSpecificFeature() {
  const { deviceInfo } = useAnalytics();

  if (deviceInfo?.type === 'mobile' && deviceInfo?.touchSupport) {
    return <TouchOptimizedUI />;
  }

  return <DesktopUI />;
}
```

### 4. Session Tracking

Track user sessions:

```tsx
function SessionTracker() {
  const { sessionId, pageVisits, interactions } = useAnalytics();

  return (
    <div>
      <p>Session ID: {sessionId}</p>
      <p>Page Visits: {pageVisits}</p>
      <p>Interactions: {interactions}</p>
    </div>
  );
}
```

---

## 🔗 Framework Integrations

### Next.js (App Router)

```tsx
// app/layout.tsx
import { AnalyticsProvider } from './components/AnalyticsProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}

// app/components/AnalyticsProvider.tsx
'use client';

import { useAnalytics } from '@atif/analytics-tracker';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useAnalytics({
    autoSend: true,
    config: {
      apiEndpoint: '/api/analytics',
    },
  });

  return <>{children}</>;
}
```

### Next.js (Pages Router)

```tsx
// pages/_app.tsx
import { useAnalytics } from '@atif/analytics-tracker';

function MyApp({ Component, pageProps }: any) {
  useAnalytics({
    autoSend: true,
    config: {
      apiEndpoint: '/api/analytics',
    },
  });

  return <Component {...pageProps} />;
}

export default MyApp;
```

### Gatsby

```tsx
// gatsby-browser.js or gatsby-ssr.js
import { wrapRootElement as wrap } from './wrap-root-element';

export const wrapRootElement = wrap;

// wrap-root-element.js
import React from 'react';
import { AnalyticsProvider } from './src/components/AnalyticsProvider';

export const wrapRootElement = ({ element }) => {
  return <AnalyticsProvider>{element}</AnalyticsProvider>;
};

// src/components/AnalyticsProvider.js
import { useAnalytics } from '@atif/analytics-tracker';

export function AnalyticsProvider({ children }) {
  useAnalytics({
    autoSend: true,
    config: {
      apiEndpoint: '/api/analytics',
    },
  });

  return <>{children}</>;
}
```

### Create React App

```tsx
// src/App.tsx
import { useAnalytics } from '@atif/analytics-tracker';

function App() {
  useAnalytics({
    autoSend: true,
    config: {
      apiEndpoint: '/api/analytics',
    },
  });

  return <div>Your App</div>;
}

export default App;
```

---

## 🔒 Privacy & Consent

### Location Consent Management

```tsx
import { 
  checkAndSetLocationConsent, 
  hasLocationConsent, 
  clearLocationConsent 
} from '@atif/analytics-tracker';

function PhoneNumberForm() {
  const handleSubmit = async (phoneNumber: string) => {
    // Grant location consent when MSISDN is entered
    const granted = checkAndSetLocationConsent(phoneNumber);
    
    if (granted) {
      console.log('Location consent granted');
      // Location tracking will now work
    }
  };

  // Check if consent exists
  const hasConsent = hasLocationConsent();

  // Revoke consent (optional)
  const handleRevoke = () => {
    clearLocationConsent();
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(e.currentTarget.phone.value);
    }}>
      <input name="phone" type="tel" />
      <button type="submit">Submit</button>
      {hasConsent && (
        <button type="button" onClick={handleRevoke}>
          Revoke Location Consent
        </button>
      )}
    </form>
  );
}
```

---

## 📊 Backend Data Structure

When analytics are sent to your backend, you'll receive this structure:

```json
{
  "eventId": "unique-event-id",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "sessionId": "unique-session-id",
  "userId": "optional-user-id",
  "pageUrl": "https://example.com/page",
  "pageVisits": 3,
  "interactions": 5,
  "networkInfo": {
    "type": "wifi",
    "effectiveType": "4g",
    "downlink": 10.5,
    "rtt": 50,
    "saveData": false
  },
  "deviceInfo": {
    "type": "mobile",
    "os": "Android",
    "osVersion": "12",
    "browser": "Chrome",
    "browserVersion": "120",
    "deviceModel": "Galaxy S21",
    "deviceBrand": "Samsung",
    "screenResolution": "1080x1920",
    "language": "en-US",
    "timezone": "America/New_York"
  },
  "location": {
    "lat": 40.7128,
    "lon": -74.0060,
    "accuracy": 10,
    "permission": "granted",
    "source": "gps"
  },
  "attribution": {
    "landingUrl": "https://example.com/?utm_source=google",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "summer_sale",
    "referrerDomain": "google.com",
    "firstTouch": {
      "utm_source": "google",
      "utm_medium": "cpc"
    },
    "lastTouch": {
      "utm_source": "facebook",
      "utm_medium": "social"
    }
  },
  "customData": {
    "action": "button_click",
    "buttonId": "cta-button"
  }
}
```

---

## 🆘 Troubleshooting

### Analytics not sending

1. **Check API endpoint**: Ensure `apiEndpoint` is correct and accessible
2. **Check browser console**: Look for errors in the console
3. **Verify network**: Check Network tab in DevTools
4. **Test endpoint manually**: Use curl or Postman to test your API

```bash
curl -X POST http://localhost:3000/api/analytics \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Location not working

1. **Check consent**: Ensure `checkAndSetLocationConsent()` is called with MSISDN
2. **Check browser permissions**: User must grant location permission
3. **HTTPS required**: GPS location requires HTTPS (except localhost)
4. **Check permission status**: `location.permission` will show status

### Device info not detected

1. **Browser support**: Requires modern browser with User-Agent Client Hints
2. **Permissions**: Some info requires permissions (device memory, etc.)
3. **Fallback**: Library provides fallbacks for unsupported browsers

---

## 📚 Additional Resources

- [Full API Reference](./README.md#-api-reference)
- [TypeScript Types](./README.md#typescript)
- [Contributing Guide](./CONTRIBUTING.md) (if available)

---

## 💡 Tips & Best Practices

1. **Always use HTTPS in production** - Required for location tracking
2. **Handle errors gracefully** - Analytics failures shouldn't break your app
3. **Respect user privacy** - Only track location with explicit consent
4. **Batch events** - Consider batching for high-frequency events
5. **Monitor performance** - Don't send analytics on every keystroke
6. **Test thoroughly** - Test in different browsers and network conditions
7. **Use TypeScript** - Get full type safety and autocomplete

---

## 📚 Additional Resources

- [Main README](../README.md) - Overview, features, and API reference
- [Quick Start](./quick-start.md) - Get started in 5 minutes
- [Publishing Guide](./publishing.md) - Publishing instructions
- [Package Structure](./package-structure.md) - Codebase structure
- [CHANGELOG](../CHANGELOG.md) - Version history

Happy tracking! 🚀

