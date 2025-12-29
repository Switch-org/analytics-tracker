# Upgrade Guide

This guide helps you upgrade `user-analytics-tracker` to the latest version. Follow the sections relevant to your current version.

## Table of Contents

- [Upgrading to v2.1.0+ (IP Geolocation API Change)](#upgrading-to-v210-ip-geolocation-api-change)
- [Upgrading to v2.0.0 (Major Features)](#upgrading-to-v200-major-features)
- [General Upgrade Tips](#general-upgrade-tips)

---

## Upgrading to v2.1.0+ (IP Geolocation API Change)

### What Changed?

**IP Geolocation API Migration**: The package now uses [ipwho.is](https://ipwho.is/) instead of ip-api.com for IP-based location tracking. This change provides:

- ✅ **More comprehensive data**: Access to additional fields like continent, flag, connection details, and timezone information
- ✅ **Dynamic key storage**: All API response keys are automatically stored, including nested objects
- ✅ **Future-proof**: New fields added by the API are automatically captured without code changes
- ✅ **No API key required**: Free tier with no authentication needed

### Breaking Changes

**None!** This upgrade is fully backward compatible. All existing code will continue to work without modifications.

### New Features

#### 1. Enhanced IP Location Data

The `IPLocation` interface now includes all fields from the ipwho.is API response:

```typescript
interface IPLocation {
  ip: string;
  success?: boolean;
  type?: string;
  continent?: string;
  continent_code?: string;
  country?: string;
  country_code?: string;
  region?: string;
  region_code?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  is_eu?: boolean;
  postal?: string;
  calling_code?: string;
  capital?: string;
  borders?: string;
  flag?: {
    img?: string;
    emoji?: string;
    emoji_unicode?: string;
  };
  connection?: {
    asn?: number;
    org?: string;
    isp?: string;
    domain?: string;
  };
  timezone?: {
    id?: string;
    abbr?: string;
    is_dst?: boolean;
    offset?: number;
    utc?: string;
    current_time?: string;
  };
  // ... and all other keys from the API response
}
```

#### 2. Dynamic Key Storage

All keys from the API response are automatically stored, including any new fields that may be added in the future:

```typescript
// All keys are stored dynamically
const ipLocation = await getIPLocation('202.165.235.92');
// ipLocation contains ALL fields from the API response
// If the API adds new fields, they're automatically included
```

#### 3. Access to Full IP Location Data

The full IP location data is now available in analytics events:

```typescript
// In your analytics events
{
  location: {
    // Standard location fields
    lat: 33.7293882,
    lon: 73.0931461,
    city: "Islamabad",
    country: "Pakistan",
    // Full IP location data with all keys
    ipLocationData: {
      ip: "202.165.235.92",
      continent: "Asia",
      continent_code: "AS",
      flag: {
        img: "https://cdn.ipwhois.io/flags/pk.svg",
        emoji: "🇵🇰"
      },
      connection: {
        asn: 23674,
        org: "Naya Tel pvt. Limited",
        isp: "Naya Tel pvt. Limited"
      },
      timezone: {
        id: "Asia/Karachi",
        abbr: "PKT",
        utc: "+05:00"
      },
      // ... all other fields
    }
  },
  ipLocation: {
    // Full IP location object with all keys
    ip: "202.165.235.92",
    continent: "Asia",
    // ... all fields
  }
}
```

### Migration Steps

#### Step 1: Update the Package

```bash
npm install user-analytics-tracker@latest
# or
yarn add user-analytics-tracker@latest
# or
pnpm add user-analytics-tracker@latest
```

#### Step 2: No Code Changes Required

Since this upgrade is backward compatible, **no code changes are required**. Your existing code will continue to work:

```typescript
// This still works exactly as before
import { getIPLocation } from 'user-analytics-tracker';

const location = await getIPLocation('202.165.235.92');
console.log(location?.country); // Still works
console.log(location?.city);    // Still works
console.log(location?.lat);     // Still works (backward compatible)
```

#### Step 3: (Optional) Use New Fields

You can now access additional fields that weren't available before:

```typescript
import { getIPLocation } from 'user-analytics-tracker';

const location = await getIPLocation('202.165.235.92');

// New fields available
console.log(location?.continent);        // "Asia"
console.log(location?.continent_code);   // "AS"
console.log(location?.flag?.emoji);      // "🇵🇰"
console.log(location?.connection?.asn);    // 23674
console.log(location?.timezone?.utc);    // "+05:00"
console.log(location?.is_eu);            // false
console.log(location?.postal);           // "44000"
```

#### Step 4: (Optional) Access Full Data in Analytics Events

If you're using the React hook or analytics service, the full IP location data is automatically included:

```typescript
import { useAnalytics } from 'user-analytics-tracker';

function MyComponent() {
  const { location } = useAnalytics();
  
  // Access full IP location data
  const ipLocationData = (location as any)?.ipLocationData;
  if (ipLocationData) {
    console.log('Continent:', ipLocationData.continent);
    console.log('Flag:', ipLocationData.flag?.emoji);
    console.log('ISP:', ipLocationData.connection?.isp);
  }
}
```

### Backward Compatibility

All existing fields are still available with the same names:

| Old Field | New Field | Status |
|-----------|-----------|--------|
| `lat` | `latitude` (also available as `lat`) | ✅ Compatible |
| `lon` | `longitude` (also available as `lon`) | ✅ Compatible |
| `countryCode` | `country_code` (also available as `countryCode`) | ✅ Compatible |
| `regionName` | `region` (also available as `regionName`) | ✅ Compatible |
| `timezone` | `timezone.id` (also available as `timezone`) | ✅ Compatible |
| `isp` | `connection.isp` (also available as `isp`) | ✅ Compatible |
| `org` | `connection.org` (also available as `org`) | ✅ Compatible |

### Example: Before and After

#### Before (v2.0.0 and earlier)

```typescript
const location = await getIPLocation('202.165.235.92');
// Available fields:
// - ip, country, countryCode, city, region, lat, lon, timezone, isp, org
```

#### After (v2.1.0+)

```typescript
const location = await getIPLocation('202.165.235.92');
// Available fields (all previous fields + new ones):
// - ip, country, countryCode, city, region, lat, lon, timezone, isp, org
// - continent, continent_code, region_code, latitude, longitude
// - is_eu, postal, calling_code, capital, borders
// - flag: { img, emoji, emoji_unicode }
// - connection: { asn, org, isp, domain }
// - timezone: { id, abbr, is_dst, offset, utc, current_time }
// - ... and any future fields automatically
```

### Troubleshooting

#### Issue: Missing fields in my analytics events

**Solution**: The full IP location data is stored in the `ipLocationData` field of the `LocationInfo` object. Access it like this:

```typescript
const ipLocationData = (location as any)?.ipLocationData;
```

#### Issue: TypeScript errors with new fields

**Solution**: The `IPLocation` interface extends `Record<string, any>`, so you can access any field:

```typescript
const location = await getIPLocation(ip);
// TypeScript knows about common fields
console.log(location?.continent);

// For dynamic fields, use type assertion if needed
console.log((location as any).someNewField);
```

#### Issue: API rate limits

**Solution**: The ipwho.is API has generous rate limits. If you encounter issues, consider:
- Caching IP location data
- Using the built-in caching in `LocationDetector`
- Implementing your own caching layer

---

## Upgrading to v2.0.0 (Major Features)

If you're upgrading from v1.x to v2.0.0, see the [CHANGELOG.md](../CHANGELOG.md) for details on:

- Event batching and queue system
- Offline support
- Retry logic with exponential backoff
- Plugin/middleware system
- Enhanced logging
- Performance monitoring

### Quick Migration for v2.0.0

```typescript
// Before (v1.x)
AnalyticsService.configure({
  apiEndpoint: '/api/analytics'
});

// After (v2.0.0+)
AnalyticsService.configure({
  apiEndpoint: '/api/analytics',
  batchSize: 10,           // New: batch events
  batchInterval: 5000,      // New: flush every 5s
  maxRetries: 3,            // New: retry failed requests
  logLevel: 'warn',        // New: configurable logging
  enableMetrics: false      // New: optional metrics
});
```

---

## General Upgrade Tips

### 1. Always Check the CHANGELOG

Before upgrading, review the [CHANGELOG.md](../CHANGELOG.md) for:
- New features
- Breaking changes
- Deprecations
- Bug fixes

### 2. Test in Development First

```bash
# Install in dev
npm install user-analytics-tracker@latest --save-dev

# Test thoroughly
npm test

# Then update production
npm install user-analytics-tracker@latest
```

### 3. Review Type Definitions

If you're using TypeScript, check for updated type definitions:

```bash
npm install --save-dev @types/user-analytics-tracker@latest
```

### 4. Check for Deprecations

Run your code with warnings enabled to see deprecation notices:

```typescript
import { logger } from 'user-analytics-tracker';

logger.setLevel('warn'); // Shows deprecation warnings
```

### 5. Update Your Tests

If you have tests that mock IP geolocation responses, update them to match the new API format:

```typescript
// Update test mocks to use ipwho.is response format
const mockIPLocation = {
  ip: '202.165.235.92',
  success: true,
  country: 'Pakistan',
  // ... new format
};
```

### 6. Monitor Analytics After Upgrade

After upgrading, monitor your analytics to ensure:
- Events are being sent correctly
- Location data is accurate
- No errors in console/logs

---

## Need Help?

If you encounter issues during upgrade:

1. **Check the [CHANGELOG.md](../CHANGELOG.md)** for detailed change notes
2. **Review the [Usage Guide](./usage-guide.md)** for examples
3. **Open an issue** on [GitHub](https://github.com/switch-org/analytics-tracker/issues)
4. **Contact support**: support@switch.org

---

## Version History

| Version | Release Date | Key Changes |
|---------|--------------|-------------|
| v2.1.0+ | TBD | IP geolocation API migration to ipwho.is |
| v2.0.0 | 2025-12-01 | Major features: batching, retry, plugins |
| v1.8.0 | 2025-01-XX | Event batching, offline support, retry logic |
| v1.7.0 | 2025-11-24 | Build updates |
| v1.0.0 | 2025-11-21 | Initial release |

---

Made with ❤️ by Switch Org

