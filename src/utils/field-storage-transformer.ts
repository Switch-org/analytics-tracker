/**
 * Generic field storage transformer
 * Filters object fields based on storage configuration
 */

export interface FieldStorageConfig {
  mode?: 'essential' | 'all' | 'custom';
  fields?: string[];
  exclude?: string[];
}

/**
 * Filter object fields based on storage configuration
 * 
 * @param data - The data object to filter
 * @param config - Storage configuration
 * @param defaultEssentialFields - Default essential fields for this data type
 * @returns Filtered data object with only configured fields
 */
export function filterFieldsByConfig<T extends Record<string, any>>(
  data: T | null | undefined,
  config: FieldStorageConfig | undefined,
  defaultEssentialFields: readonly string[]
): T | null {
  if (!data) {
    return null;
  }

  const mode = config?.mode || 'essential';
  let fieldsToInclude: string[] = [];

  if (mode === 'essential') {
    // Use default essential fields
    fieldsToInclude = [...defaultEssentialFields];
  } else if (mode === 'all') {
    // Include all fields, then exclude specified ones
    fieldsToInclude = ['*']; // Special marker for "all fields"
  } else if (mode === 'custom' && config) {
    // Use custom field list
    fieldsToInclude = config.fields || [];
  }

  // If mode is 'all', just exclude specified fields
  if (mode === 'all') {
    const filtered: Record<string, any> = { ...data };
    
    if (config?.exclude && config.exclude.length > 0) {
      const excludeSet = new Set(config.exclude);
      Object.keys(filtered).forEach(key => {
        if (excludeSet.has(key)) {
          delete filtered[key];
        }
      });
      
      // Handle nested exclusions
      if (filtered.connection && excludeSet.has('connection')) {
        delete filtered.connection;
      }
      if (filtered.timezoneDetails && excludeSet.has('timezoneDetails')) {
        delete filtered.timezoneDetails;
      }
      if (filtered.flag && excludeSet.has('flag')) {
        delete filtered.flag;
      }
      if (filtered.firstTouch && excludeSet.has('firstTouch')) {
        delete filtered.firstTouch;
      }
      if (filtered.lastTouch && excludeSet.has('lastTouch')) {
        delete filtered.lastTouch;
      }
    }
    
    return filtered as T;
  }

  // For 'essential' or 'custom' mode, only include specified fields
  const filtered: Record<string, any> = {};
  const includeSet = new Set(fieldsToInclude);
  
  // Helper to check if a field path should be included
  const shouldInclude = (fieldPath: string): boolean => {
    // Direct match - most specific
    if (includeSet.has(fieldPath)) return true;
    
    // For nested fields (e.g., 'flag.emoji'), only include if explicitly listed
    // Don't auto-include all children just because parent is included
    const parts = fieldPath.split('.');
    if (parts.length > 1) {
      // For nested fields, require explicit inclusion
      // This prevents 'flag' from including all 'flag.*' fields
      return includeSet.has(fieldPath);
    }
    
    // For top-level fields only, check if parent path is included
    // This allows 'connection' to work when all connection.* fields are listed
    return false;
  };
  
  // Helper to check if a parent object should be created (for nested objects)
  const shouldIncludeParent = (parentPath: string): boolean => {
    // Check if any child of this parent is included
    for (const field of fieldsToInclude) {
      if (field.startsWith(parentPath + '.')) {
        return true;
      }
    }
    // Also check if parent itself is explicitly included
    return includeSet.has(parentPath);
  };

  // Filter top-level fields
  Object.keys(data).forEach(key => {
    if (shouldInclude(key)) {
      filtered[key] = data[key];
    }
  });

  // Handle nested objects - only create if at least one child field is included
  if (data.connection && shouldIncludeParent('connection')) {
    filtered.connection = {};
    if (shouldInclude('connection.asn')) filtered.connection.asn = data.connection.asn;
    if (shouldInclude('connection.org')) filtered.connection.org = data.connection.org;
    if (shouldInclude('connection.isp')) filtered.connection.isp = data.connection.isp;
    if (shouldInclude('connection.domain')) filtered.connection.domain = data.connection.domain;
    
    // If no connection fields were included, remove the object
    if (Object.keys(filtered.connection).length === 0) {
      delete filtered.connection;
    }
  }

  if (data.timezoneDetails && shouldIncludeParent('timezoneDetails')) {
    filtered.timezoneDetails = {};
    if (shouldInclude('timezoneDetails.id')) filtered.timezoneDetails.id = data.timezoneDetails.id;
    if (shouldInclude('timezoneDetails.abbr')) filtered.timezoneDetails.abbr = data.timezoneDetails.abbr;
    if (shouldInclude('timezoneDetails.utc')) filtered.timezoneDetails.utc = data.timezoneDetails.utc;
    if (shouldInclude('timezoneDetails.isDst')) filtered.timezoneDetails.isDst = data.timezoneDetails.isDst;
    if (shouldInclude('timezoneDetails.offset')) filtered.timezoneDetails.offset = data.timezoneDetails.offset;
    if (shouldInclude('timezoneDetails.currentTime')) filtered.timezoneDetails.currentTime = data.timezoneDetails.currentTime;
    
    // If no timezoneDetails fields were included, remove the object
    if (Object.keys(filtered.timezoneDetails).length === 0) {
      delete filtered.timezoneDetails;
    }
  }

  if (data.flag && shouldIncludeParent('flag')) {
    filtered.flag = {};
    // Only include specific flag fields if they're explicitly in the include list
    if (shouldInclude('flag.emoji')) filtered.flag.emoji = data.flag.emoji;
    if (shouldInclude('flag.img')) filtered.flag.img = data.flag.img;
    if (shouldInclude('flag.emojiUnicode')) filtered.flag.emojiUnicode = data.flag.emojiUnicode;
    
    // If no specific flag fields are included, don't add the flag object
    if (Object.keys(filtered.flag).length === 0) {
      delete filtered.flag;
    }
  }

  if (data.firstTouch && shouldInclude('firstTouch')) {
    filtered.firstTouch = data.firstTouch;
  }

  if (data.lastTouch && shouldInclude('lastTouch')) {
    filtered.lastTouch = data.lastTouch;
  }

  // Remove null and undefined values to reduce payload size
  const cleanValue = (val: any): any => {
    if (val === null || val === undefined) {
      return undefined; // Will be filtered out
    }
    
    // For objects, recursively clean nested null/undefined values
    if (typeof val === 'object' && !Array.isArray(val) && val !== null) {
      const cleaned: Record<string, any> = {};
      let hasAnyValue = false;
      
      Object.keys(val).forEach(key => {
        const cleanedChild = cleanValue(val[key]);
        if (cleanedChild !== undefined) {
          cleaned[key] = cleanedChild;
          hasAnyValue = true;
        }
      });
      
      return hasAnyValue ? cleaned : undefined;
    }
    
    // For arrays, clean each element
    if (Array.isArray(val)) {
      const cleaned = val.map(cleanValue).filter(item => item !== undefined);
      return cleaned.length > 0 ? cleaned : undefined;
    }
    
    return val;
  };

  const cleaned: Record<string, any> = {};
  Object.keys(filtered).forEach(key => {
    const cleanedValue = cleanValue(filtered[key]);
    if (cleanedValue !== undefined) {
      cleaned[key] = cleanedValue;
    }
  });

  return cleaned as T;
}

