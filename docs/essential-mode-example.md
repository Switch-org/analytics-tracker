# Essential Mode Example Output

This document shows an example of what an analytics event looks like when using **essential mode** (the default mode).

## Configuration

Essential mode is the default and can be explicitly set:

```typescript
import { AnalyticsService } from 'user-analytics-tracker';

AnalyticsService.configure({
  apiEndpoint: '/api/analytics',
  ipGeolocation: {
    apiKey: process.env.VITE_IPWHOIS_API_KEY, // optional; use env var; omit for free tier
    timeout: 5000,
  },
  fieldStorage: {
    deviceInfo: { mode: 'essential' },
    ipLocation: { mode: 'essential' },
    location: { mode: 'essential' },
    networkInfo: { mode: 'essential' },
    attribution: { mode: 'essential' },
  },
});
```

## Example Event Output

Here's what a complete analytics event looks like in essential mode:

```json
{
  "eventId": "evt_1234567890_abc123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sessionId": "session_abc123def456",
  "pageUrl": "https://example.com/products/item-123",
  "eventName": "page_view",
  "eventParameters": {
    "page_name": "/products/item-123",
    "page_title": "Product Details"
  },
  "userId": "user_xyz789",
  
  "deviceInfo": {
    "os": "Windows",
    "browser": "Chrome"
  },
  
  "location": {
    "lat": 40.7128,
    "lon": -74.0060,
    "source": "ip",
    "ts": "2024-01-15T10:30:00.000Z"
  },
  
  "attribution": {
    "landingUrl": "https://example.com",
    "path": "/"
  },
  
  "customData": {
    "ipLocation": {
      "ip": "203.0.113.42",
      "countryCode": "US",
      "city": "New York",
      "lat": 40.7128,
      "lon": -74.0060,
      "isp": "Example ISP",
      "connection": {
        "asn": 12345,
        "org": "Example ISP Inc.",
        "isp": "Example ISP",
        "domain": "example-isp.com"
      }
    },
    "msisdn": "1234567890",
    "companyName": "Your Company",
    "serviceId": "service123"
  }
}
```

## Field Breakdown

### Required Fields (Always Present)
- ✅ **IP**: `customData.ipLocation.ip` - User's IP address
- ✅ **lat/lon**: `location.lat` and `location.lon` - Geographic coordinates
- ✅ **mobile**: Determined from `deviceInfo` (not stored, but validated)
- ✅ **location**: `customData.ipLocation.city` - City name (country removed in essential mode)
- ✅ **msisdn**: `customData.msisdn` (if provided)
- ✅ **session**: `sessionId` - Session identifier
- ✅ **operators**: `customData.ipLocation.connection.isp` - ISP/Operator name
- ✅ **page**: Extracted from `pageUrl` pathname
- ✅ **pageUrl**: Full page URL
- ✅ **eventType**: `eventName` - Event type (e.g., "page_view")
- ✅ **companyName**: `customData.companyName` (if provided)
- ✅ **eventId**: Unique event identifier
- ✅ **timestamp**: Event timestamp
- ✅ **gps**: `location.source === 'gps'` - GPS source flag
- ✅ **OS**: `deviceInfo.os` - Operating system
- ✅ **browser**: `deviceInfo.browser` - Browser name
- ✅ **serviceId**: `customData.serviceId` (if provided)

### Essential Mode Optimizations

1. **Device Info**: Only `os` and `browser` are stored (not `type`, `osVersion`, `browserVersion`, `deviceModel`, `deviceBrand`, `userAgent`, etc.)

2. **Network Info**: Not stored in essential mode. Instead, connection data from `ipwho.is` API is stored in `customData.ipLocation.connection` (more accurate than browser-based detection)

3. **Location Info**: Only `lat`, `lon`, `source`, and `ts` are stored. IP-based location data is stored in `customData.ipLocation` to avoid duplication

4. **Attribution Info**: Only `landingUrl` and `path` are stored. Removed fields: `hostname`, `referrerUrl`, `referrerDomain`, `navigationType`, `isReload`, `isBackForward`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`

5. **IP Location**: Essential fields from `ipwho.is` API stored in `customData.ipLocation`:
   - Basic: `ip`, `countryCode`, `city` (removed: `country`, `region`)
   - Geographic: `lat`, `lon` (removed: `continent`, `continentCode`)
   - Network: `isp`, `connection` (with `asn`, `org`, `isp`, `domain`)
   - Removed: `timezone`, `flag.emoji`

## Comparison: Essential vs All Mode

### Essential Mode (Default)

**Device Info:**
```json
{
  "deviceInfo": {
    "os": "Windows",
    "browser": "Chrome"
  }
}
```

**Attribution:**
```json
{
  "attribution": {
    "landingUrl": "https://example.com",
    "path": "/"
  }
}
```

**IP Location:**
```json
{
  "customData": {
    "ipLocation": {
      "ip": "203.0.113.42",
      "countryCode": "US",
      "city": "New York",
      "lat": 40.7128,
      "lon": -74.0060,
      "isp": "Example ISP",
      "connection": {
        "asn": 12345,
        "org": "Example ISP Inc.",
        "isp": "Example ISP",
        "domain": "example-isp.com"
      }
    }
  }
}
```

### All Mode

**Device Info:**
```json
{
  "deviceInfo": {
    "type": "desktop",
    "os": "Windows",
    "osVersion": "10",
    "browser": "Chrome",
    "browserVersion": "120.0.0.0",
    "screenResolution": "1920x1080",
    "deviceModel": "PC",
    "deviceBrand": "Generic",
    "language": "en-US",
    "timezone": "America/New_York",
    "userAgent": "Mozilla/5.0...",
    "deviceMemory": 8,
    "hardwareConcurrency": 8,
    "touchSupport": false,
    "pixelRatio": 1,
    "colorDepth": 24,
    "orientation": "landscape",
    "cpuArchitecture": "x86"
  }
}
```

**Attribution:**
```json
{
  "attribution": {
    "landingUrl": "https://example.com",
    "path": "/",
    "hostname": "example.com",
    "referrerUrl": "https://google.com/search?q=example",
    "referrerDomain": "google.com",
    "navigationType": "navigate",
    "isReload": false,
    "isBackForward": false,
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "summer_sale",
    "utm_term": "analytics",
    "utm_content": "banner"
  }
}
```

**IP Location:**
```json
{
  "customData": {
    "ipLocation": {
      "ip": "203.0.113.42",
      "country": "United States",
      "countryCode": "US",
      "region": "New York",
      "city": "New York",
      "lat": 40.7128,
      "lon": -74.0060,
      "continent": "North America",
      "continentCode": "NA",
      "isp": "Example ISP",
      "connection": {
        "asn": 12345,
        "org": "Example ISP Inc.",
        "isp": "Example ISP",
        "domain": "example-isp.com"
      },
      "timezone": "America/New_York",
      "flag": {
        "emoji": "🇺🇸"
      }
    }
  }
}
```

## Benefits of Essential Mode

1. **Reduced Storage**: Only essential fields are stored, reducing database size
2. **Faster Processing**: Less data to process and transmit
3. **Privacy-Friendly**: Minimal data collection
4. **Accurate Network Data**: Uses `ipwho.is` connection data instead of less accurate browser-based network detection

## Minimum Required Fields for Validation

For an event to pass validation and be sent to your backend, it must have:

1. ✅ **IP** OR **(lat AND lon)** - Location identifier
2. ✅ **sessionId** - Session identifier  
3. ✅ **pageUrl** - Page URL
4. ✅ **eventName** - Event type
5. ✅ **eventId** - Unique event ID (auto-generated)
6. ✅ **timestamp** - Event timestamp (auto-generated)
7. ✅ At least one of: **mobile**, **OS**, or **browser** - Device identifier

Events missing these fields or with >70% null values in non-critical fields will be filtered out.
