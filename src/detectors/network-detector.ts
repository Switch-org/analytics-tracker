import type { NetworkInfo, NetworkType } from '../types';

/**
 * Network Type Detector
 * Detects WiFi, Mobile Data (Cellular), Hotspot, Ethernet, or Unknown
 */
export class NetworkDetector {
  static detect(): NetworkInfo {
    if (typeof navigator === 'undefined') {
      return { type: 'unknown' };
    }

    const c =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (!c) {
      // Fallback: guess based on user agent
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      return { type: isMobile ? 'cellular' : 'wifi' };
    }

    let type: NetworkType = 'unknown';

    // Method 1: Direct type property (most reliable)
    if (c.type) {
      const connectionType = c.type.toLowerCase();
      switch (connectionType) {
        case 'wifi':
        case 'wlan':
          type = 'wifi';
          break;
        case 'cellular':
        case '2g':
        case '3g':
        case '4g':
        case '5g':
          type = 'cellular';
          break;
        case 'ethernet':
          type = 'ethernet';
          break;
        case 'none':
          type = 'unknown';
          break;
        default:
          type = connectionType as NetworkType;
      }
    }
    // Method 2: Use effectiveType to infer
    else if (c.effectiveType) {
      const effType = c.effectiveType.toLowerCase();
      if (['slow-2g', '2g', '3g', '4g'].includes(effType)) {
        type = 'cellular';
      } else {
        type = 'wifi';
      }
    }
    // Method 3: Heuristic-based detection using multiple signals
    else {
      const downlink = c.downlink || 0;
      const rtt = c.rtt || 0;
      const saveData = c.saveData || false;

      const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (saveData) {
        type = 'cellular';
      } else if (isMobileDevice) {
        // Mobile device: check if it's likely hotspot
        if (downlink > 0 && downlink < 1 && rtt > 300) {
          type = 'hotspot';
        } else if (downlink > 10) {
          // Fast connection on mobile = likely wifi
          type = 'wifi';
        } else if (downlink > 1) {
          // Medium speed = could be mobile data or hotspot
          // Check RTT: hotspots often have higher latency
          type = rtt > 200 ? 'hotspot' : 'cellular';
        } else {
          type = 'cellular';
        }
      } else {
        // Desktop/laptop: likely wifi or ethernet
        type = downlink > 10 ? 'wifi' : 'ethernet';
      }
    }

    // Additional hotspot detection: Check for tethering indicators
    // Some browsers expose this via connection.type = 'wifi' but with mobile-like characteristics
    if (type === 'wifi' && c.downlink && c.downlink < 5 && c.rtt && c.rtt > 200) {
      const isMobileUA = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobileUA) {
        // Mobile device with wifi but slow connection = likely hotspot
        type = 'hotspot';
      }
    }

    return {
      type,
      effectiveType: c?.effectiveType,
      downlink: c?.downlink,
      rtt: c?.rtt,
      saveData: c?.saveData,
      connectionType: c?.type,
    };
  }
}

