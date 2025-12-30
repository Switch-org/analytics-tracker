import type { IPLocation } from '../types';

/**
 * Transform IP location data from API format (snake_case) to backend-expected format (camelCase)
 * This ensures compatibility with the analytics backend integration
 * 
 * @param ipLocation - Raw IP location data from ipwho.is API
 * @returns Transformed IP location data matching backend schema
 */
export function transformIPLocationForBackend(ipLocation: IPLocation | null): Record<string, any> | null {
  if (!ipLocation) {
    return null;
  }

  // Transform to match backend expected format (camelCase)
  const transformed: Record<string, any> = {
    // Basic fields
    ip: ipLocation.ip,
    country: ipLocation.country,
    countryCode: ipLocation.country_code || ipLocation.countryCode,
    region: ipLocation.region || ipLocation.regionName,
    city: ipLocation.city,
    postal: ipLocation.postal,
    capital: ipLocation.capital,
    callingCode: ipLocation.calling_code || ipLocation.callingCode,
    
    // Geographic fields
    continent: ipLocation.continent,
    continentCode: ipLocation.continent_code || ipLocation.continentCode,
    lat: ipLocation.latitude ?? ipLocation.lat,
    lon: ipLocation.longitude ?? ipLocation.lon,
    borders: ipLocation.borders,
    
    // Network fields
    type: ipLocation.type,
    isEu: ipLocation.is_eu ?? ipLocation.isEu,
    
    // ISP/Connection - preserve connection object and also add top-level isp
    isp: ipLocation.connection?.isp || ipLocation.isp,
    connection: ipLocation.connection ? {
      asn: ipLocation.connection.asn,
      org: ipLocation.connection.org,
      isp: ipLocation.connection.isp,
      domain: ipLocation.connection.domain,
    } : undefined,
    
    // Timezone - store both simple string and full details object
    timezone: typeof ipLocation.timezone === 'string' 
      ? ipLocation.timezone 
      : ipLocation.timezone?.id,
    timezoneDetails: ipLocation.timezone && typeof ipLocation.timezone === 'object' ? {
      id: ipLocation.timezone.id,
      abbr: ipLocation.timezone.abbr,
      isDst: ipLocation.timezone.is_dst,
      offset: ipLocation.timezone.offset,
      utc: ipLocation.timezone.utc,
      currentTime: ipLocation.timezone.current_time,
    } : undefined,
    
    // Flag - transform to camelCase
    flag: ipLocation.flag ? {
      img: ipLocation.flag.img,
      emoji: ipLocation.flag.emoji,
      emojiUnicode: ipLocation.flag.emoji_unicode,
    } : undefined,
  };

  // Remove undefined values to keep the payload clean
  Object.keys(transformed).forEach(key => {
    if (transformed[key] === undefined) {
      delete transformed[key];
    }
  });

  return transformed;
}

