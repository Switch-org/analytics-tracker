import type { IPLocation, FieldStorageConfig } from '../types';
import { DEFAULT_ESSENTIAL_IP_FIELDS } from '../types';
import { filterFieldsByConfig } from './field-storage-transformer';

/**
 * Transform IP location data from API format (snake_case) to backend-expected format (camelCase)
 * Supports configurable field storage to optimize storage capacity
 * 
 * @param ipLocation - Raw IP location data from ipwho.is API
 * @param config - Optional configuration for which fields to store
 * @returns Transformed IP location data matching backend schema (only includes configured fields)
 */
export function transformIPLocationForBackend(
  ipLocation: IPLocation | null,
  config?: FieldStorageConfig
): Record<string, any> | null {
  if (!ipLocation) {
    return null;
  }

  // Transform to match backend expected format (camelCase)
  // Build complete object first, then filter based on configuration
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
      utc: ipLocation.timezone.utc,
      // Exclude these in essential mode: isDst, offset, currentTime
      // They will be filtered out by filterFieldsByConfig if not in essential fields
      isDst: ipLocation.timezone.is_dst,
      offset: ipLocation.timezone.offset,
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

  // Filter fields based on configuration using generic filter
  return filterFieldsByConfig(
    transformed,
    config,
    DEFAULT_ESSENTIAL_IP_FIELDS
  );
}

