# Essential Mode Guide

This guide explains how Essential Mode works, what data is stored, and how it optimizes payload size while maintaining all crucial information.

## Overview

Essential Mode is the default storage mode that stores only the most important fields for each data type. This significantly reduces payload size (30-40% smaller) while maintaining all critical analytics data.

## ✅ What Data is Stored in Essential Mode?

Essential mode **WILL save** all the data you need:

1. ✅ **deviceInfo** - Device and browser information
2. ✅ **connection** - Network connection details (inside `customData.ipLocation`)
3. ✅ **location** - Geographic coordinates
4. ✅ **networkInfo** - Network performance metrics
5. ✅ **customData** - Your custom event data + IP location

---

## 📊 Essential Fields by Data Type

### 1. **deviceInfo** (8 Essential Fields)

**Stored Fields:**
- `type` - Device type (desktop, mobile, tablet)
- `os` - Operating system (macOS, Windows, iOS, Android)
- `osVersion` - OS version
- `browser` - Browser name (Chrome, Firefox, Safari)
- `browserVersion` - Browser version
- `deviceModel` - Device model
- `deviceBrand` - Device brand
- `userAgent` - Full user agent string

**Example:**
```json
{
  "deviceInfo": {
    "type": "desktop",
    "os": "macOS",
    "osVersion": "15.2.0",
    "browser": "Chrome",
    "browserVersion": "143.0",
    "deviceModel": "Apple",
    "deviceBrand": "Apple",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36..."
  }
}
```

**Excluded (not crucial):** `screenResolution`, `language`, `timezone`, `touchSupport`, `pixelRatio`, `colorDepth`, `orientation`, `deviceMemory`, `hardwareConcurrency`, `maxTouchPoints`, `cookieEnabled`, `doNotTrack`

---

### 2. **networkInfo** (5 Essential Fields)

**Stored Fields:**
- `type` - Connection type (wifi, cellular, ethernet)
- `effectiveType` - Effective connection type (2g, 3g, 4g, 5g)
- `downlink` - Downlink speed (Mbps)
- `rtt` - Round-trip time (ms)
- `saveData` - Data saver mode enabled

**Example:**
```json
{
  "networkInfo": {
    "type": "wifi",
    "effectiveType": "4g",
    "downlink": 7.95,
    "rtt": 150,
    "saveData": false
  }
}
```

**All crucial network metrics are included!**

---

### 3. **location** (4 Essential Fields - Minimal)

**Stored Fields:**
- `lat` - Latitude
- `lon` - Longitude
- `source` - Location source (gps, ip, unknown)
- `ts` - Timestamp

**Example:**
```json
{
  "location": {
    "lat": 34.0149748,
    "lon": 71.5804899,
    "source": "ip",
    "ts": "2025-12-30T13:35:54.398Z"
  }
}
```

**Note:** Only coordinates + source. All IP-related data (country, city, region, timezone, etc.) is stored in `customData.ipLocation` to avoid duplication.

**Excluded:** `ip`, `country`, `countryCode`, `city`, `region`, `timezone` (stored in `customData.ipLocation` instead)

---

### 4. **attribution** (Essential Fields - Nulls Removed)

**Stored Fields:**
- `landingUrl` - Landing page URL
- `path` - URL path
- `hostname` - Domain hostname
- `referrerUrl` - Referrer URL (only if not null)
- `referrerDomain` - Referrer domain (only if not null)
- `navigationType` - Navigation type (reload, navigate, back_forward)
- `isReload` - Is page reload
- `isBackForward` - Is back/forward navigation
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` (only if not null)

**Example:**
```json
{
  "attribution": {
    "landingUrl": "http://localhost:3000/pk-zong-daily",
    "path": "/pk-zong-daily",
    "hostname": "localhost",
    "navigationType": "reload",
    "isReload": true,
    "isBackForward": false
  }
}
```

**Note:** Null values are automatically removed to reduce payload size.

---

### 5. **customData.ipLocation** (Essential Fields)

**Stored Fields:**
- `ip` - IP address
- `country` - Country name
- `countryCode` - ISO country code
- `region` - Region/state
- `city` - City name
- `continent` - Continent name
- `continentCode` - ISO continent code
- `lat` - Latitude
- `lon` - Longitude
- `type` - IP type (IPv4, IPv6)
- `isEu` - Is EU country
- `isp` - ISP name
- `connection` - Connection details:
  - `asn` - Autonomous System Number
  - `org` - Organization name
  - `isp` - ISP name
  - `domain` - ISP domain
- `timezone` - Timezone ID
- `timezoneDetails` - Timezone details:
  - `id` - Timezone ID
  - `abbr` - Timezone abbreviation
  - `utc` - UTC offset
- `flag.emoji` - Country flag emoji

**Example:**
```json
{
  "customData": {
    "ipLocation": {
      "ip": "203.99.191.157",
      "country": "Pakistan",
      "countryCode": "PK",
      "region": "Khyber Pakhtunkhwa",
      "city": "Peshawar",
      "continent": "Asia",
      "continentCode": "AS",
      "lat": 34.0149748,
      "lon": 71.5804899,
      "type": "IPv4",
      "isEu": false,
      "isp": "Pakistan Telecommuication Company Limited",
      "connection": {
        "asn": 17557,
        "org": "Hsi Pool on Isb Bras",
        "isp": "Pakistan Telecommuication Company Limited",
        "domain": "ptcl.net.pk"
      },
      "timezone": "Asia/Karachi",
      "timezoneDetails": {
        "id": "Asia/Karachi",
        "abbr": "PKT",
        "utc": "+05:00"
      },
      "flag": {
        "emoji": "🇵🇰"
      }
    }
  }
}
```

**Excluded in Essential Mode:**
- ❌ `postal`, `calling_code`, `capital`, `borders`
- ❌ `flag.img`, `flag.emojiUnicode`
- ❌ `timezoneDetails.isDst`, `timezoneDetails.offset`, `timezoneDetails.currentTime`
- ❌ `success`, `query`, `region_code`, `regionName`, `as`

---

## 🔄 Deduplication & Optimization

### Automatic Deduplication

Essential mode automatically removes duplicate fields to minimize payload size:

**Before (with duplicates):**
```json
{
  "location": {
    "lat": 34.0149748,
    "lon": 71.5804899,
    "source": "ip",
    "ts": "2025-12-30T13:35:54.398Z",
    "ip": "203.99.191.157",           // ❌ DUPLICATE
    "country": "Pakistan",             // ❌ DUPLICATE
    "countryCode": "PK",               // ❌ DUPLICATE
    "city": "Peshawar",                // ❌ DUPLICATE
    "region": "Khyber Pakhtunkhwa",   // ❌ DUPLICATE
    "timezone": "Asia/Karachi"         // ❌ DUPLICATE
  },
  "customData": {
    "ipLocation": {
      "ip": "203.99.191.157",         // ❌ DUPLICATE
      "country": "Pakistan",           // ❌ DUPLICATE
      // ... same fields duplicated
    }
  }
}
```

**After (optimized - no duplicates):**
```json
{
  "location": {
    "lat": 34.0149748,
    "lon": 71.5804899,
    "source": "ip",
    "ts": "2025-12-30T13:35:54.398Z"
    // ✅ Only coordinates + source (no duplicates)
  },
  "customData": {
    "ipLocation": {
      "ip": "203.99.191.157",
      "country": "Pakistan",
      "countryCode": "PK",
      // ... all IP-related data stored here (single source of truth)
    }
  }
}
```

### Key Optimizations

1. **Minimal Location Object** - Only 4 fields (`lat`, `lon`, `source`, `ts`)
2. **Single Source of Truth** - All IP-related data in `customData.ipLocation`
3. **Null Value Removal** - Null/undefined values automatically removed
4. **Nested Object Cleaning** - Empty nested objects removed

---

## 📈 Payload Size Reduction

### Field Count Summary

| Data Type | Essential Fields | Total Keys |
|-----------|------------------|------------|
| **deviceInfo** | 8 | 8 |
| **networkInfo** | 5 | 5 |
| **location** | 4 | 4 |
| **attribution** | ~8-13 (nulls removed) | ~8-13 |
| **customData.ipLocation** | ~20 | ~20 |
| **customData** (your data) | All your fields | Variable |
| **Total** | ~45-50 + your custom data | **Optimized!** |

### Size Reduction

- **Before**: ~40+ keys (with duplicates and all fields)
- **After**: ~25-30 keys (no duplicates, essential only)
- **Reduction**: ~30-40% fewer fields
- **Payload Size**: ~1.8KB (optimized) vs ~2.5KB (before)
- **Savings**: ~700 bytes per event (~28% reduction)

---

## 🚀 Usage

### Default Configuration

Essential mode is the **default** - no configuration needed:

```typescript
import { AnalyticsService } from 'user-analytics-tracker';

// Essential mode is used by default
AnalyticsService.init({
  apiEndpoint: '/api/analytics'
});
```

### Explicit Configuration

You can explicitly configure essential mode for all data types:

```typescript
AnalyticsService.init({
  apiEndpoint: '/api/analytics',
  fieldStorage: {
    ipLocation: { mode: 'essential' },
    deviceInfo: { mode: 'essential' },
    networkInfo: { mode: 'essential' },
    location: { mode: 'essential' },
    attribution: { mode: 'essential' }
  }
});
```

### Per-Data-Type Configuration

Configure different modes for different data types:

```typescript
AnalyticsService.init({
  apiEndpoint: '/api/analytics',
  fieldStorage: {
    ipLocation: { mode: 'essential' },      // Essential only
    deviceInfo: { mode: 'all' },            // All fields
    networkInfo: { mode: 'essential' },     // Essential only
    location: { mode: 'essential' },        // Essential only
    attribution: { mode: 'custom', fields: ['landingUrl', 'path', 'utm_source'] }  // Custom fields
  }
});
```

---

## ✅ Benefits

1. ✅ **All Crucial Data** - Nothing important is missing
2. ✅ **No Duplicates** - Each piece of information stored once
3. ✅ **Optimized Size** - Only essential fields, no bloat
4. ✅ **Your Custom Data** - Always saved completely
5. ✅ **Connection Details** - Full connection info in `customData.ipLocation.connection`
6. ✅ **Mode-Aware** - Automatically adapts based on storage mode
7. ✅ **Backward Compatible** - Works with existing configurations
8. ✅ **Single Source of Truth** - IP location data in one place

---

## 🎯 Essential Mode = Crucial Data Only

Essential mode stores:
- ✅ All device/browser info you need (8 fields)
- ✅ All network metrics you need (5 fields)
- ✅ All location data you need (coordinates + IP location)
- ✅ All connection details you need
- ✅ All your custom data
- ❌ No unnecessary fields
- ❌ No duplicates
- ❌ No bloat

**Result:** Compact payload with all crucial information! 🚀

---

## 📝 Complete Example Payload

See [examples/essential-mode-payload.json](./examples/essential-mode-payload.json) for a complete example of an essential mode payload.

---

## Related Documentation

- [Field Storage Configuration](./ip-location-configuration.md) - Detailed configuration guide
- [Usage Guide](./usage-guide.md) - How to use the package
- [Upgrade Guide](./upgrade-guide.md) - Version migration guide

