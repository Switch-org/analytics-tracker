# IP Location Analytics Integration Guide

This guide explains how to query, extract, and display IP location data from the analytics database in your analytics portal.

## Overview

IP location data is stored in the `customData` JSON column of the `analytics_events` table. The data structure follows this format:

```json
{
  "ipLocation": {
    "country": "Pakistan",
    "countryCode": "PK",
    "region": "Islamabad Capital Territory",
    "city": "Islamabad",
    "timezone": "Asia/Karachi",
    "lat": 33.7293882,
    "lon": 73.0931461,
    "isp": "Naya Tel pvt. Limited",
    "connection": {
      "asn": 23674,
      "org": "Naya Tel pvt. Limited",
      "isp": "Naya Tel pvt. Limited",
      "domain": "nayatel.com"
    },
    "postal": "44000",
    "callingCode": "92",
    "capital": "Islamabad",
    "continent": "Asia",
    "continentCode": "AS",
    "type": "IPv4",
    "isEu": false,
    "borders": "AF,CN,IN,IR",
    "flag": {
      "img": "https://cdn.ipwhois.io/flags/pk.svg",
      "emoji": "🇵🇰",
      "emojiUnicode": "U+1F1F5 U+1F1F0"
    },
    "timezoneDetails": {
      "id": "Asia/Karachi",
      "abbr": "PKT",
      "isDst": false,
      "offset": 18000,
      "utc": "+05:00",
      "currentTime": "2025-12-29T14:43:25+05:00"
    }
  }
}
```

---

## Database Schema

### Table: `analytics_events`

| Column | Type | Description |
|--------|------|-------------|
| `eventId` | VARCHAR(255) | Primary key |
| `sessionId` | VARCHAR(255) | Session identifier |
| `userId` | VARCHAR(255) | User identifier |
| `msisdn` | VARCHAR(20) | Mobile number |
| `customData` | JSON | Contains `ipLocation` object |
| `timestamp` | DATETIME | Event timestamp |
| `pageUrl` | TEXT | Page URL |

---

## SQL Queries

### 1. Extract Basic IP Location Data

```sql
SELECT 
  eventId,
  sessionId,
  userId,
  msisdn,
  timestamp,
  pageUrl,
  JSON_EXTRACT(customData, '$.ipLocation.country') as country,
  JSON_EXTRACT(customData, '$.ipLocation.countryCode') as countryCode,
  JSON_EXTRACT(customData, '$.ipLocation.region') as region,
  JSON_EXTRACT(customData, '$.ipLocation.city') as city,
  JSON_EXTRACT(customData, '$.ipLocation.lat') as latitude,
  JSON_EXTRACT(customData, '$.ipLocation.lon') as longitude,
  JSON_EXTRACT(customData, '$.ipLocation.timezone') as timezone
FROM analytics_events
WHERE JSON_EXTRACT(customData, '$.ipLocation') IS NOT NULL
ORDER BY timestamp DESC
LIMIT 100;
```

### 2. Extract Connection Information

```sql
SELECT 
  eventId,
  sessionId,
  JSON_EXTRACT(customData, '$.ipLocation.connection.asn') as asn,
  JSON_EXTRACT(customData, '$.ipLocation.connection.org') as organization,
  JSON_EXTRACT(customData, '$.ipLocation.connection.isp') as isp,
  JSON_EXTRACT(customData, '$.ipLocation.connection.domain') as domain,
  JSON_EXTRACT(customData, '$.ipLocation.country') as country,
  JSON_EXTRACT(customData, '$.ipLocation.city') as city
FROM analytics_events
WHERE JSON_EXTRACT(customData, '$.ipLocation.connection') IS NOT NULL
ORDER BY timestamp DESC;
```

### 3. Extract Full IP Location Object

```sql
SELECT 
  eventId,
  sessionId,
  userId,
  timestamp,
  JSON_EXTRACT(customData, '$.ipLocation') as ipLocation
FROM analytics_events
WHERE JSON_EXTRACT(customData, '$.ipLocation') IS NOT NULL
ORDER BY timestamp DESC;
```

### 4. Filter by Country

```sql
SELECT 
  eventId,
  sessionId,
  JSON_EXTRACT(customData, '$.ipLocation.country') as country,
  JSON_EXTRACT(customData, '$.ipLocation.city') as city,
  JSON_EXTRACT(customData, '$.ipLocation.connection.isp') as isp,
  timestamp
FROM analytics_events
WHERE JSON_EXTRACT(customData, '$.ipLocation.countryCode') = 'PK'
ORDER BY timestamp DESC;
```

### 5. Filter by ISP/Organization

```sql
SELECT 
  eventId,
  sessionId,
  JSON_EXTRACT(customData, '$.ipLocation.connection.isp') as isp,
  JSON_EXTRACT(customData, '$.ipLocation.connection.org') as organization,
  JSON_EXTRACT(customData, '$.ipLocation.country') as country,
  COUNT(*) as eventCount
FROM analytics_events
WHERE JSON_EXTRACT(customData, '$.ipLocation.connection.isp') IS NOT NULL
GROUP BY 
  JSON_EXTRACT(customData, '$.ipLocation.connection.isp'),
  JSON_EXTRACT(customData, '$.ipLocation.connection.org'),
  JSON_EXTRACT(customData, '$.ipLocation.country')
ORDER BY eventCount DESC;
```

### 6. Geographic Distribution Analysis

```sql
SELECT 
  JSON_EXTRACT(customData, '$.ipLocation.country') as country,
  JSON_EXTRACT(customData, '$.ipLocation.countryCode') as countryCode,
  JSON_EXTRACT(customData, '$.ipLocation.continent') as continent,
  COUNT(DISTINCT sessionId) as uniqueSessions,
  COUNT(*) as totalEvents
FROM analytics_events
WHERE JSON_EXTRACT(customData, '$.ipLocation.country') IS NOT NULL
GROUP BY 
  JSON_EXTRACT(customData, '$.ipLocation.country'),
  JSON_EXTRACT(customData, '$.ipLocation.countryCode'),
  JSON_EXTRACT(customData, '$.ipLocation.continent')
ORDER BY totalEvents DESC;
```

### 7. City-Level Analysis

```sql
SELECT 
  JSON_EXTRACT(customData, '$.ipLocation.country') as country,
  JSON_EXTRACT(customData, '$.ipLocation.city') as city,
  JSON_EXTRACT(customData, '$.ipLocation.region') as region,
  COUNT(DISTINCT sessionId) as uniqueSessions,
  COUNT(*) as totalEvents
FROM analytics_events
WHERE JSON_EXTRACT(customData, '$.ipLocation.city') IS NOT NULL
GROUP BY 
  JSON_EXTRACT(customData, '$.ipLocation.country'),
  JSON_EXTRACT(customData, '$.ipLocation.city'),
  JSON_EXTRACT(customData, '$.ipLocation.region')
ORDER BY totalEvents DESC
LIMIT 50;
```

### 8. Extract All Fields (Complete)

```sql
SELECT 
  eventId,
  sessionId,
  userId,
  msisdn,
  timestamp,
  pageUrl,
  -- Basic Location
  JSON_EXTRACT(customData, '$.ipLocation.country') as country,
  JSON_EXTRACT(customData, '$.ipLocation.countryCode') as countryCode,
  JSON_EXTRACT(customData, '$.ipLocation.region') as region,
  JSON_EXTRACT(customData, '$.ipLocation.city') as city,
  JSON_EXTRACT(customData, '$.ipLocation.postal') as postal,
  JSON_EXTRACT(customData, '$.ipLocation.capital') as capital,
  JSON_EXTRACT(customData, '$.ipLocation.callingCode') as callingCode,
  -- Geographic
  JSON_EXTRACT(customData, '$.ipLocation.continent') as continent,
  JSON_EXTRACT(customData, '$.ipLocation.continentCode') as continentCode,
  JSON_EXTRACT(customData, '$.ipLocation.lat') as latitude,
  JSON_EXTRACT(customData, '$.ipLocation.lon') as longitude,
  JSON_EXTRACT(customData, '$.ipLocation.borders') as borders,
  -- Network
  JSON_EXTRACT(customData, '$.ipLocation.type') as ipType,
  JSON_EXTRACT(customData, '$.ipLocation.isp') as isp,
  JSON_EXTRACT(customData, '$.ipLocation.connection.asn') as asn,
  JSON_EXTRACT(customData, '$.ipLocation.connection.org') as organization,
  JSON_EXTRACT(customData, '$.ipLocation.connection.domain') as domain,
  -- Timezone
  JSON_EXTRACT(customData, '$.ipLocation.timezone') as timezone,
  JSON_EXTRACT(customData, '$.ipLocation.timezoneDetails.abbr') as timezoneAbbr,
  JSON_EXTRACT(customData, '$.ipLocation.timezoneDetails.utc') as timezoneUtc,
  JSON_EXTRACT(customData, '$.ipLocation.timezoneDetails.currentTime') as currentTime,
  -- Flag
  JSON_EXTRACT(customData, '$.ipLocation.flag.emoji') as flagEmoji,
  JSON_EXTRACT(customData, '$.ipLocation.flag.img') as flagImage,
  -- EU Status
  JSON_EXTRACT(customData, '$.ipLocation.isEu') as isEu
FROM analytics_events
WHERE JSON_EXTRACT(customData, '$.ipLocation') IS NOT NULL
ORDER BY timestamp DESC;
```

---

## Backend API Integration

### Node.js/TypeScript Example

```typescript
import { queryAnalyticsEvents } from '@/lib/mysql-db';

interface IPLocationData {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  connection?: {
    asn?: number;
    org?: string;
    isp?: string;
    domain?: string;
  };
  postal?: string;
  callingCode?: string;
  capital?: string;
  continent?: string;
  continentCode?: string;
  type?: string;
  isEu?: boolean;
  borders?: string;
  flag?: {
    img?: string;
    emoji?: string;
    emojiUnicode?: string;
  };
  timezoneDetails?: {
    id?: string;
    abbr?: string;
    isDst?: boolean;
    offset?: number;
    utc?: string;
    currentTime?: string;
  };
}

// Get events with IP location data
export async function getEventsWithLocation(params: {
  sessionId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const events = await queryAnalyticsEvents(params);
  
  return events
    .filter(event => event.customData?.ipLocation)
    .map(event => ({
      eventId: event.eventId,
      sessionId: event.sessionId,
      userId: event.userId,
      timestamp: event.timestamp,
      pageUrl: event.pageUrl,
      ipLocation: event.customData.ipLocation as IPLocationData,
    }));
}

// Get geographic distribution
export async function getGeographicDistribution(startDate?: string, endDate?: string) {
  const pool = getPool();
  
  const conditions: string[] = [];
  const queryParams: any[] = [];
  
  if (startDate) {
    conditions.push('timestamp >= ?');
    queryParams.push(startDate);
  }
  if (endDate) {
    conditions.push('timestamp <= ?');
    queryParams.push(endDate);
  }
  
  const whereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(' AND ')} AND JSON_EXTRACT(customData, '$.ipLocation.country') IS NOT NULL`
    : `WHERE JSON_EXTRACT(customData, '$.ipLocation.country') IS NOT NULL`;
  
  const sql = `
    SELECT 
      JSON_EXTRACT(customData, '$.ipLocation.country') as country,
      JSON_EXTRACT(customData, '$.ipLocation.countryCode') as countryCode,
      JSON_EXTRACT(customData, '$.ipLocation.continent') as continent,
      JSON_EXTRACT(customData, '$.ipLocation.flag.emoji') as flagEmoji,
      COUNT(DISTINCT sessionId) as uniqueSessions,
      COUNT(*) as totalEvents
    FROM analytics_events
    ${whereClause}
    GROUP BY 
      JSON_EXTRACT(customData, '$.ipLocation.country'),
      JSON_EXTRACT(customData, '$.ipLocation.countryCode'),
      JSON_EXTRACT(customData, '$.ipLocation.continent'),
      JSON_EXTRACT(customData, '$.ipLocation.flag.emoji')
    ORDER BY totalEvents DESC
  `;
  
  const [rows] = await pool.execute(sql, queryParams);
  return rows;
}
```

---

## Frontend Integration

### React Component Example

```tsx
'use client';

import { useState, useEffect } from 'react';

interface IPLocation {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  connection?: {
    asn?: number;
    org?: string;
    isp?: string;
    domain?: string;
  };
  postal?: string;
  callingCode?: string;
  capital?: string;
  continent?: string;
  continentCode?: string;
  type?: string;
  isEu?: boolean;
  borders?: string;
  flag?: {
    img?: string;
    emoji?: string;
    emojiUnicode?: string;
  };
  timezoneDetails?: {
    id?: string;
    abbr?: string;
    isDst?: boolean;
    offset?: number;
    utc?: string;
    currentTime?: string;
  };
}

interface EventWithLocation {
  eventId: string;
  sessionId: string;
  userId: string | null;
  timestamp: string;
  pageUrl: string;
  ipLocation: IPLocation;
}

export function IPLocationDisplay({ eventId }: { eventId: string }) {
  const [location, setLocation] = useState<IPLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocation() {
      try {
        const response = await fetch(`/api/analytics?eventId=${eventId}`);
        const data = await response.json();
        
        if (data.events && data.events[0]?.customData?.ipLocation) {
          setLocation(data.events[0].customData.ipLocation);
        }
      } catch (error) {
        console.error('Failed to fetch location:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLocation();
  }, [eventId]);

  if (loading) return <div>Loading location data...</div>;
  if (!location) return <div>No location data available</div>;

  return (
    <div className="ip-location-card">
      <h3>IP Location Information</h3>
      
      {/* Country & Flag */}
      <div className="location-header">
        {location.flag?.emoji && (
          <span className="flag-emoji">{location.flag.emoji}</span>
        )}
        <h4>{location.country} ({location.countryCode})</h4>
      </div>

      {/* Basic Location */}
      <div className="location-section">
        <h5>Location</h5>
        <p><strong>City:</strong> {location.city}</p>
        <p><strong>Region:</strong> {location.region}</p>
        <p><strong>Continent:</strong> {location.continent} ({location.continentCode})</p>
        {location.capital && <p><strong>Capital:</strong> {location.capital}</p>}
        {location.postal && <p><strong>Postal Code:</strong> {location.postal}</p>}
        {location.callingCode && <p><strong>Calling Code:</strong> +{location.callingCode}</p>}
        {location.lat && location.lon && (
          <p><strong>Coordinates:</strong> {location.lat}, {location.lon}</p>
        )}
      </div>

      {/* Connection Information */}
      {location.connection && (
        <div className="connection-section">
          <h5>Network Connection</h5>
          {location.connection.asn && (
            <p><strong>ASN:</strong> {location.connection.asn}</p>
          )}
          {location.connection.org && (
            <p><strong>Organization:</strong> {location.connection.org}</p>
          )}
          {location.connection.isp && (
            <p><strong>ISP:</strong> {location.connection.isp}</p>
          )}
          {location.connection.domain && (
            <p><strong>Domain:</strong> {location.connection.domain}</p>
          )}
        </div>
      )}

      {/* Timezone Information */}
      {location.timezoneDetails && (
        <div className="timezone-section">
          <h5>Timezone</h5>
          <p><strong>Timezone:</strong> {location.timezoneDetails.id}</p>
          <p><strong>Abbreviation:</strong> {location.timezoneDetails.abbr}</p>
          <p><strong>UTC Offset:</strong> {location.timezoneDetails.utc}</p>
          {location.timezoneDetails.currentTime && (
            <p><strong>Current Time:</strong> {location.timezoneDetails.currentTime}</p>
          )}
        </div>
      )}

      {/* Additional Info */}
      <div className="additional-info">
        {location.type && <p><strong>IP Type:</strong> {location.type}</p>}
        {location.isEu !== undefined && (
          <p><strong>EU Member:</strong> {location.isEu ? 'Yes' : 'No'}</p>
        )}
        {location.borders && (
          <p><strong>Borders:</strong> {location.borders}</p>
        )}
      </div>
    </div>
  );
}
```

### Geographic Map Component

```tsx
'use client';

import { useEffect, useState } from 'react';

interface GeographicData {
  country: string;
  countryCode: string;
  continent: string;
  flagEmoji: string;
  uniqueSessions: number;
  totalEvents: number;
}

export function GeographicDistributionMap() {
  const [data, setData] = useState<GeographicData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/analytics/geographic-distribution');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch geographic data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (loading) return <div>Loading geographic data...</div>;

  return (
    <div className="geographic-map">
      <h2>Geographic Distribution</h2>
      <div className="country-list">
        {data.map((item) => (
          <div key={item.countryCode} className="country-item">
            <span className="flag">{item.flagEmoji}</span>
            <div className="country-info">
              <h4>{item.country}</h4>
              <p>{item.continent}</p>
            </div>
            <div className="country-stats">
              <p><strong>Sessions:</strong> {item.uniqueSessions}</p>
              <p><strong>Events:</strong> {item.totalEvents}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## API Endpoint Examples

### Get Event with IP Location

```typescript
// GET /api/analytics?eventId=abc123
// Response:
{
  "ok": true,
  "events": [
    {
      "eventId": "abc123",
      "sessionId": "session-xyz",
      "customData": {
        "ipLocation": {
          "country": "Pakistan",
          "countryCode": "PK",
          "city": "Islamabad",
          "connection": {
            "asn": 23674,
            "org": "Naya Tel pvt. Limited",
            "isp": "Naya Tel pvt. Limited",
            "domain": "nayatel.com"
          },
          // ... all other fields
        }
      }
    }
  ]
}
```

### Create Custom Endpoint for Geographic Stats

```typescript
// app/api/analytics/geographic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/mysql-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const pool = getPool();
    const conditions: string[] = [];
    const queryParams: any[] = [];

    if (startDate) {
      conditions.push('timestamp >= ?');
      queryParams.push(startDate);
    }
    if (endDate) {
      conditions.push('timestamp <= ?');
      queryParams.push(endDate);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')} AND JSON_EXTRACT(customData, '$.ipLocation.country') IS NOT NULL`
      : `WHERE JSON_EXTRACT(customData, '$.ipLocation.country') IS NOT NULL`;

    const sql = `
      SELECT 
        JSON_EXTRACT(customData, '$.ipLocation.country') as country,
        JSON_EXTRACT(customData, '$.ipLocation.countryCode') as countryCode,
        JSON_EXTRACT(customData, '$.ipLocation.continent') as continent,
        JSON_EXTRACT(customData, '$.ipLocation.flag.emoji') as flagEmoji,
        JSON_EXTRACT(customData, '$.ipLocation.flag.img') as flagImage,
        COUNT(DISTINCT sessionId) as uniqueSessions,
        COUNT(*) as totalEvents
      FROM analytics_events
      ${whereClause}
      GROUP BY 
        JSON_EXTRACT(customData, '$.ipLocation.country'),
        JSON_EXTRACT(customData, '$.ipLocation.countryCode'),
        JSON_EXTRACT(customData, '$.ipLocation.continent'),
        JSON_EXTRACT(customData, '$.ipLocation.flag.emoji'),
        JSON_EXTRACT(customData, '$.ipLocation.flag.img')
      ORDER BY totalEvents DESC
    `;

    const [rows] = await pool.execute(sql, queryParams);
    
    return NextResponse.json({
      ok: true,
      data: rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch geographic data', details: error.message },
      { status: 500 }
    );
  }
}
```

---

## Display Best Practices

### 1. Country Display
- Show flag emoji or image for visual recognition
- Display country name with country code
- Include continent for context

### 2. Connection Information
- Group ASN, Organization, ISP, and Domain together
- Show organization name prominently (often more readable than ISP)
- Display domain if available (useful for identifying networks)

### 3. Geographic Coordinates
- Use for map visualization
- Format as "Lat, Lon" for easy copying
- Consider using a map library (Leaflet, Google Maps) for visualization

### 4. Timezone Information
- Display timezone ID and abbreviation
- Show current time in that timezone
- Highlight DST status if relevant

### 5. Additional Metadata
- Show IP type (IPv4/IPv6)
- Display EU membership status
- List border countries if relevant for analysis

---

## Common Use Cases

### 1. User Location Dashboard
Display where your users are located geographically:
- Country distribution chart
- City-level heatmap
- Regional analysis

### 2. Network Analysis
Analyze connection patterns:
- Top ISPs by country
- Organization distribution
- ASN analysis

### 3. Timezone-Based Analytics
Segment users by timezone:
- Peak activity times per timezone
- Timezone-based campaign scheduling
- Regional time preferences

### 4. Geographic Filtering
Filter analytics by location:
- Country-specific reports
- Regional performance metrics
- City-level insights

---

## Performance Optimization

### 1. Index JSON Fields (MySQL 5.7+)
```sql
-- Create virtual columns for frequently queried fields
ALTER TABLE analytics_events
ADD COLUMN country_code_virtual VARCHAR(10) 
  AS (JSON_UNQUOTE(JSON_EXTRACT(customData, '$.ipLocation.countryCode'))) VIRTUAL;

CREATE INDEX idx_country_code ON analytics_events(country_code_virtual);
```

### 2. Cache Geographic Aggregations
```typescript
// Cache geographic distribution data (refresh every hour)
const CACHE_TTL = 3600000; // 1 hour
let cachedGeoData: GeographicData[] | null = null;
let cacheTimestamp = 0;

export async function getCachedGeographicDistribution() {
  const now = Date.now();
  if (cachedGeoData && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedGeoData;
  }
  
  cachedGeoData = await getGeographicDistribution();
  cacheTimestamp = now;
  return cachedGeoData;
}
```

### 3. Pagination for Large Datasets
```sql
-- Use LIMIT and OFFSET for pagination
SELECT ... 
FROM analytics_events
WHERE JSON_EXTRACT(customData, '$.ipLocation') IS NOT NULL
ORDER BY timestamp DESC
LIMIT 50 OFFSET 0;
```

---

## Troubleshooting

### Issue: JSON_EXTRACT returns NULL
**Solution**: Ensure the JSON path is correct and the data exists:
```sql
-- Check if ipLocation exists
SELECT JSON_EXTRACT(customData, '$.ipLocation') 
FROM analytics_events 
LIMIT 1;
```

### Issue: Nested Objects Not Extracting
**Solution**: Use proper JSON path syntax:
```sql
-- Correct
JSON_EXTRACT(customData, '$.ipLocation.connection.asn')

-- Incorrect
JSON_EXTRACT(customData, '$.ipLocation.connection') -- Returns object, not value
```

### Issue: Performance Issues with JSON Queries
**Solution**: 
- Create virtual columns for frequently queried fields
- Add indexes on virtual columns
- Consider materializing frequently accessed data

---

## Example Complete Integration

```typescript
// Complete example: Fetch and display IP location for a session
async function getSessionLocation(sessionId: string) {
  const response = await fetch(`/api/analytics?sessionId=${sessionId}`);
  const data = await response.json();
  
  if (data.events && data.events.length > 0) {
    const firstEvent = data.events[0];
    const ipLocation = firstEvent.customData?.ipLocation;
    
    if (ipLocation) {
      return {
        country: ipLocation.country,
        countryCode: ipLocation.countryCode,
        city: ipLocation.city,
        region: ipLocation.region,
        flag: ipLocation.flag?.emoji,
        connection: {
          isp: ipLocation.connection?.isp,
          org: ipLocation.connection?.org,
          domain: ipLocation.connection?.domain,
        },
        coordinates: ipLocation.lat && ipLocation.lon 
          ? { lat: ipLocation.lat, lon: ipLocation.lon }
          : null,
      };
    }
  }
  
  return null;
}
```

---

## Related Documentation

- [Analytics Data Extraction](./ANALYTICS_DATA_EXTRACTION.md) - Complete data structure reference
- [Analytics API Documentation](./ANALYTICS_API_DOCUMENTATION.md) - API endpoint details
- [Location Integration Summary](./LOCATION_INTEGRATION_SUMMARY.md) - Location service overview

