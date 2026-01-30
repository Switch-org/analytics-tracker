# Field Storage Configuration Guide

This guide explains how to configure which fields are stored for all analytics data types (IP location, device, network, location, attribution) to optimize storage capacity.

## Passing your API key and IP (optional)

The package supports [ipwho.is](https://ipwho.is/) (free/paid) and paid providers like [ipwhois.pro](https://ipwhois.pro/). The **free tier works without a key**. For higher rate limits or paid subscriptions, pass `apiKey` (use an env var) and optionally `baseUrl` and `ip`.

### URL format

- **Auto-detect requestor IP:** `baseUrl/?key=API_KEY` (or `baseUrl/` without key).
- **Lookup a specific IP (paid / server-side):** `baseUrl/{IP}?key=API_KEY` — e.g. `https://ipwhois.pro/203.0.113.42?key=YOUR_API_KEY`.

### Client-side (no IP)

```tsx
import { useAnalytics } from 'user-analytics-tracker';

useAnalytics({
  config: {
    apiEndpoint: '/api/analytics',
    ipGeolocation: {
      apiKey: import.meta.env.VITE_IPWHOIS_API_KEY,
      baseUrl: 'https://ipwho.is',
      timeout: 5000,
    },
    fieldStorage: {
      ipLocation: { mode: 'essential' },
      deviceInfo: { mode: 'essential' },
      location: { mode: 'essential' },
      attribution: { mode: 'essential' },
    },
  },
});
```

### Paid subscription (ipwhois.pro) with IP + API key

When you have the user’s IP (e.g. server-side from `getIPFromRequest(req)`), pass `ip` and use the paid base URL:

```tsx
// Server-side example: you have the request IP and paid apiKey
import { getCompleteIPLocation, getIPFromRequest } from 'user-analytics-tracker';

// In your API route / handler
const userIp = getIPFromRequest(req);
const location = await getCompleteIPLocation({
  baseUrl: 'https://ipwhois.pro',
  apiKey: process.env.IPWHOIS_PRO_API_KEY,
  ip: userIp,
  timeout: 5000,
});
```

Or with `getIPLocation(ip, config)`:

```tsx
const location = await getIPLocation(userIp, {
  baseUrl: 'https://ipwhois.pro',
  apiKey: process.env.IPWHOIS_PRO_API_KEY,
});
```

- Get a key at [ipwho.is](https://ipwho.is/) or [ipwhois.pro](https://ipwhois.pro/).
- Store the key in `.env` (e.g. `VITE_IPWHOIS_API_KEY` or `IPWHOIS_PRO_API_KEY`) and keep `.env` in `.gitignore`.
- Omit `ipGeolocation` or `apiKey` to use the free tier.

## Overview

By default, the package stores **essential fields only** for all data types to minimize storage. However, you can customize which fields are stored for each data type based on your needs.

## Configuration Structure

You can configure field storage for all data types:

```typescript
AnalyticsService.configure({
  apiEndpoint: '/api/analytics',
  fieldStorage: {
    ipLocation: { mode: 'essential' },
    deviceInfo: { mode: 'essential' },
    networkInfo: { mode: 'essential' },
    location: { mode: 'essential' },
    attribution: { mode: 'essential' },
  },
});
```

## Configuration Modes

### 1. Essential Mode (Default)

Stores only the most important fields for analytics. This is the default mode and optimizes storage capacity.

```typescript
import { AnalyticsService } from 'user-analytics-tracker';

// Configure all data types to use essential mode (default)
AnalyticsService.configure({
  apiEndpoint: '/api/analytics',
  fieldStorage: {
    ipLocation: { mode: 'essential' },
    deviceInfo: { mode: 'essential' },
    networkInfo: { mode: 'essential' },
    location: { mode: 'essential' },
    attribution: { mode: 'essential' },
  },
});

// Or configure just one type
AnalyticsService.configure({
  apiEndpoint: '/api/analytics',
  fieldStorage: {
    ipLocation: { mode: 'essential' },
  },
});
```

**Essential fields stored:**
- `ip` - IP address
- `country`, `countryCode` - Country information
- `region`, `city` - Location details
- `lat`, `lon` - Coordinates
- `continent`, `continentCode` - Geographic context
- `type`, `isEu` - IP type and EU status
- `isp` - ISP name
- `connection` - Connection details (ASN, org, ISP, domain)
- `timezone` - Timezone ID
- `timezoneDetails` - Timezone details (id, abbr, utc)
- `flag.emoji` - Flag emoji

### 2. All Fields Mode

Stores all available fields from the API. You can exclude specific fields if needed.

```typescript
AnalyticsService.configure({
  apiEndpoint: '/api/analytics',
  ipLocationFields: {
    mode: 'all',
    // Optionally exclude specific fields
    exclude: [
      'postal',
      'capital',
      'callingCode',
      'borders',
      'flag.img',
      'flag.emojiUnicode',
      'timezoneDetails.isDst',
      'timezoneDetails.offset',
      'timezoneDetails.currentTime',
    ],
  },
});
```

### 3. Custom Mode

Specify exactly which fields you want to store.

```typescript
AnalyticsService.configure({
  apiEndpoint: '/api/analytics',
  ipLocationFields: {
    mode: 'custom',
    fields: [
      'ip',
      'country',
      'countryCode',
      'city',
      'lat',
      'lon',
      'isp',
      'connection.asn',
      'connection.org',
      'timezone',
      'flag.emoji',
    ],
  },
});
```

## Available Fields by Data Type

### IP Location Fields

### Basic Fields
- `ip` - IP address
- `country` - Country name
- `countryCode` - ISO country code (2 letters)
- `region` - Region/state name
- `city` - City name
- `postal` - Postal code
- `capital` - Capital city
- `callingCode` - Country calling code

### Geographic Fields
- `continent` - Continent name
- `continentCode` - Continent code
- `lat` - Latitude
- `lon` - Longitude
- `borders` - Border countries (comma-separated)

### Network Fields
- `type` - IP type (IPv4/IPv6)
- `isEu` - EU membership status (boolean)
- `isp` - ISP name
- `connection` - Connection object (include parent to get all sub-fields)
- `connection.asn` - Autonomous System Number
- `connection.org` - Organization name
- `connection.isp` - ISP name
- `connection.domain` - Domain name

### Timezone Fields
- `timezone` - Timezone ID (string)
- `timezoneDetails` - Timezone details object (include parent to get all sub-fields)
- `timezoneDetails.id` - Timezone ID
- `timezoneDetails.abbr` - Timezone abbreviation
- `timezoneDetails.utc` - UTC offset (e.g., "+05:00")
- `timezoneDetails.isDst` - Daylight Saving Time status
- `timezoneDetails.offset` - Offset in seconds
- `timezoneDetails.currentTime` - Current time in timezone

### Flag Fields
- `flag` - Flag object (include parent to get all sub-fields)
- `flag.emoji` - Flag emoji (🇵🇰)
- `flag.img` - Flag image URL
- `flag.emojiUnicode` - Flag emoji Unicode

## Examples

### Minimal Storage (Only Most Critical Fields)

```typescript
AnalyticsService.configure({
  apiEndpoint: '/api/analytics',
  fieldStorage: {
    ipLocation: {
      mode: 'custom',
      fields: ['ip', 'country', 'countryCode', 'city', 'isp'],
    },
    deviceInfo: {
      mode: 'custom',
      fields: ['type', 'os', 'browser', 'deviceModel'],
    },
    networkInfo: {
      mode: 'custom',
      fields: ['type', 'effectiveType'],
    },
    location: {
      mode: 'custom',
      fields: ['lat', 'lon', 'country', 'city'],
    },
    attribution: {
      mode: 'custom',
      fields: ['utm_source', 'utm_medium', 'utm_campaign'],
    },
  },
});
```

### Balanced Storage (Essential + Some Details)

```typescript
AnalyticsService.configure({
  apiEndpoint: '/api/analytics',
  fieldStorage: {
    ipLocation: {
      mode: 'essential', // Uses default essential fields
    },
    deviceInfo: {
      mode: 'all',
      exclude: ['deviceMemory', 'hardwareConcurrency'], // Exclude large optional fields
    },
    networkInfo: {
      mode: 'essential', // Uses default essential fields
    },
    location: {
      mode: 'essential', // Uses default essential fields
    },
    attribution: {
      mode: 'all',
      exclude: ['firstTouch', 'lastTouch'], // Exclude nested objects if not needed
    },
  },
});
```

### All Fields Except Large/Unnecessary Ones

```typescript
AnalyticsService.configure({
  apiEndpoint: '/api/analytics',
  ipLocationFields: {
    mode: 'all',
    exclude: [
      'borders', // Large string, rarely used
      'flag.img', // URL string, emoji is enough
      'flag.emojiUnicode', // Not needed if emoji is stored
      'timezoneDetails.currentTime', // Changes constantly
      'timezoneDetails.offset', // Can be calculated from UTC
      'postal', // Rarely used
      'capital', // Rarely used
      'callingCode', // Rarely used
    ],
  },
});
```

## Using with React Hook

```tsx
import { useAnalytics } from 'user-analytics-tracker';

function App() {
  const analytics = useAnalytics({
    config: {
      apiEndpoint: '/api/analytics',
      ipGeolocation: {
        apiKey: import.meta.env.VITE_IPWHOIS_API_KEY,
        timeout: 5000,
      },
      fieldStorage: {
        ipLocation: { mode: 'essential' },
        deviceInfo: { mode: 'essential' },
        networkInfo: { mode: 'essential' },
        location: { mode: 'essential' },
        attribution: { mode: 'essential' },
      },
    },
  });

  return <div>Your app</div>;
}
```

## Storage Optimization Tips

1. **Use Essential Mode**: Default mode stores only what's needed for most analytics use cases
2. **Exclude Time-Dependent Fields**: Fields like `timezoneDetails.currentTime` change constantly and waste storage
3. **Prefer Emoji Over Images**: `flag.emoji` is much smaller than `flag.img` URL
4. **Exclude Rarely Used Fields**: Fields like `borders`, `postal`, `capital`, `callingCode` are rarely queried
5. **Calculate Instead of Store**: Fields like `timezoneDetails.offset` can be calculated from UTC if needed
6. **Exclude Optional Device Fields**: `deviceMemory` and `hardwareConcurrency` are optional and can be excluded
7. **Exclude Attribution Objects**: `firstTouch` and `lastTouch` objects can be large - exclude if not needed
8. **Mix Modes**: Use different modes for different data types based on your needs

## Default Essential Fields

You can import and inspect the default essential fields for each data type:

```typescript
import {
  DEFAULT_ESSENTIAL_IP_FIELDS,
  DEFAULT_ESSENTIAL_DEVICE_FIELDS,
  DEFAULT_ESSENTIAL_NETWORK_FIELDS,
  DEFAULT_ESSENTIAL_LOCATION_FIELDS,
  DEFAULT_ESSENTIAL_ATTRIBUTION_FIELDS,
} from 'user-analytics-tracker';

console.log('IP Location:', DEFAULT_ESSENTIAL_IP_FIELDS);
console.log('Device Info:', DEFAULT_ESSENTIAL_DEVICE_FIELDS);
console.log('Network Info:', DEFAULT_ESSENTIAL_NETWORK_FIELDS);
console.log('Location:', DEFAULT_ESSENTIAL_LOCATION_FIELDS);
console.log('Attribution:', DEFAULT_ESSENTIAL_ATTRIBUTION_FIELDS);
```

## Complete Configuration Example

Here's a complete example showing how to configure all data types:

```typescript
import { AnalyticsService } from 'user-analytics-tracker';

AnalyticsService.configure({
  apiEndpoint: '/api/analytics',
  
  // Configure field storage for all data types
  fieldStorage: {
    // IP Location - store essential fields only
    ipLocation: {
      mode: 'essential',
    },
    
    // Device Info - store all except optional memory fields
    deviceInfo: {
      mode: 'all',
      exclude: ['deviceMemory', 'hardwareConcurrency'],
    },
    
    // Network Info - store essential only
    networkInfo: {
      mode: 'essential',
    },
    
    // Location - custom selection
    location: {
      mode: 'custom',
      fields: ['lat', 'lon', 'country', 'countryCode', 'city', 'source'],
    },
    
    // Attribution - store all UTM fields but exclude touch objects
    attribution: {
      mode: 'all',
      exclude: ['firstTouch', 'lastTouch'],
    },
  },
});
```

## Migration Guide

If you're upgrading and want to keep storing all fields:

```typescript
// Old behavior (stores everything)
// No configuration needed - it stored all fields

// New behavior (stores essential by default)
AnalyticsService.configure({
  apiEndpoint: '/api/analytics',
  fieldStorage: {
    ipLocation: { mode: 'all' },
    deviceInfo: { mode: 'all' },
    networkInfo: { mode: 'all' },
    location: { mode: 'all' },
    attribution: { mode: 'all' },
  },
});

// Or use legacy format (backward compatible)
AnalyticsService.configure({
  apiEndpoint: '/api/analytics',
  ipLocationFields: {
    mode: 'all', // Store all IP location fields like before
  },
});
```

## Best Practices

1. **Start with Essential**: Use `mode: 'essential'` for all data types unless you have specific needs
2. **Monitor Storage**: Check your database size and adjust configurations if needed
3. **Query Requirements**: Only include fields you actually query in your analytics
4. **Test Configuration**: Test your configuration to ensure all needed fields are stored
5. **Per-Type Configuration**: Different data types can use different modes based on importance
6. **Exclude Large Objects**: Exclude nested objects like `firstTouch`/`lastTouch` if not needed
7. **Review Regularly**: Periodically review which fields you actually use and adjust accordingly

## Storage Impact

**Essential Mode (Default):**
- Reduces storage by approximately 30-50% compared to storing all fields
- Includes all fields needed for common analytics queries
- Recommended for most use cases

**Custom Mode:**
- Maximum control over storage
- Can reduce storage by 50-70% if only critical fields are selected
- Requires knowledge of which fields you need

**All Mode with Exclusions:**
- Good balance between completeness and optimization
- Store everything except known unnecessary fields
- Reduces storage by 20-40% compared to all fields

## Quick Reference

### Essential Fields Summary

| Data Type | Essential Fields Count | Optional Fields |
|-----------|----------------------|-----------------|
| IP Location | ~20 fields | postal, capital, borders, flag.img, etc. |
| Device Info | ~15 fields | deviceMemory, hardwareConcurrency |
| Network Info | ~5 fields | connectionType |
| Location | ~10 fields | accuracy, permission |
| Attribution | ~13 fields | sessionStart, click IDs, touch objects |

---

For more information, see:
- [IP Location Analytics Integration](./IP_LOCATION_ANALYTICS_INTEGRATION.md) - How to query stored data
- [Usage Guide](./usage-guide.md) - Complete usage documentation

