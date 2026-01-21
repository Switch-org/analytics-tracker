/* eslint-disable @typescript-eslint/no-explicit-any */
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
    // Method 2: Heuristic-based detection using multiple signals
    // Note: effectiveType indicates speed/quality, NOT connection type
    // A WiFi connection can have effectiveType "4g" if it's fast
    else {
      const downlink = c.downlink || 0;
      const rtt = c.rtt || 0;
      const saveData = c.saveData || false;
      // const effectiveType = c.effectiveType?.toLowerCase() || ''; // Reserved for future use

      const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isDesktop = !isMobileDevice;

      // Data saver mode strongly suggests cellular
      if (saveData) {
        type = 'cellular';
      }
      // Desktop/laptop devices are almost always WiFi or Ethernet (not cellular)
      else if (isDesktop) {
        // Very high speeds (>50 Mbps) are likely Ethernet
        // Medium-high speeds (10-50 Mbps) are likely WiFi
        // Lower speeds could be WiFi or Ethernet depending on connection quality
        if (downlink > 50) {
          type = 'ethernet';
        } else if (downlink > 5) {
          type = 'wifi';
        } else {
          // Low speed on desktop - likely poor WiFi, but still WiFi
          type = 'wifi';
        }
      }
      // Mobile device: need to distinguish between WiFi, cellular, and hotspot
      else {
        // Very fast connection (>20 Mbps) on mobile = almost certainly WiFi
        if (downlink > 20) {
          type = 'wifi';
        }
        // Fast connection (10-20 Mbps) = likely WiFi (even with moderate RTT)
        // WiFi can have RTT up to ~150ms depending on router/network quality
        else if (downlink >= 10) {
          type = 'wifi';
        }
        // Medium-fast connection (5-10 Mbps) with reasonable latency = likely WiFi
        else if (downlink >= 5 && rtt < 150) {
          type = 'wifi';
        }
        // Medium speed (1-5 Mbps) with low latency = likely WiFi
        else if (downlink >= 1 && rtt < 100) {
          type = 'wifi';
        }
        // Very slow connection with high latency = likely hotspot
        else if (downlink > 0 && downlink < 1 && rtt > 300) {
          type = 'hotspot';
        }
        // Medium speed with high latency = likely hotspot
        else if (downlink >= 1 && downlink < 5 && rtt > 200) {
          type = 'hotspot';
        }
        // Low speed with very high latency = likely hotspot
        else if (downlink >= 1 && downlink < 3 && rtt > 250) {
          type = 'hotspot';
        }
        // Otherwise, default to cellular for mobile devices
        // But prefer WiFi if we have decent speed indicators
        else if (downlink >= 3) {
          type = 'wifi';
        } else {
          type = 'cellular';
        }
      }
    }

    // Additional hotspot detection: Check for tethering indicators
    // Some browsers expose this via connection.type = 'wifi' but with mobile-like characteristics
    // Only override if we're very confident it's a hotspot (very slow + high latency)
    if (type === 'wifi' && c.downlink && c.downlink < 2 && c.rtt && c.rtt > 250) {
      const isMobileUA = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobileUA) {
        // Mobile device with wifi but very slow connection + high latency = likely hotspot
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

