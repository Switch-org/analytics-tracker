/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DeviceInfo, DeviceType } from '../types';

/**
 * Device Information Detector
 * Detects device type, OS, browser, and hardware specs
 */
export class DeviceDetector {
  private static async getRealDeviceInfo() {
    const nau: any = (navigator as any).userAgentData;
    if (nau?.getHighEntropyValues) {
      try {
        const v = await nau.getHighEntropyValues([
          'platform',
          'platformVersion',
          'model',
          'uaFullVersion',
          'brands',
        ]);
        return {
          platform: v.platform || 'Unknown',
          platformVersion: v.platformVersion || 'Unknown',
          model: v.model || 'Unknown',
          fullVersion: v.uaFullVersion || 'Unknown',
          brands: v.brands || [],
        };
      } catch {
        // Fallback to UA parsing
      }
    }

    const ua = navigator.userAgent;
    let platform = 'Unknown',
      platformVersion = 'Unknown',
      model = 'Unknown';

    if (/Android/i.test(ua)) {
      platform = 'Android';
      platformVersion = ua.match(/Android\s([\d.]+)/)?.[1] || 'Unknown';

      const androidModelMatch = ua.match(/;\s*([^;)]+)\s*\)/);
      if (androidModelMatch) {
        const deviceStr = androidModelMatch[1];
        if (deviceStr && deviceStr.length < 50) {
          model = deviceStr.trim();
        }
      }

      if (model === 'Unknown') {
        const buildMatch = ua.match(/Build\/([A-Z0-9_-]+)/);
        if (buildMatch) {
          const codename = buildMatch[1].split('_')[0];
          if (codename && codename.length > 2 && codename.length < 20) {
            model = codename;
          }
        }
      }
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      platform = 'iOS';
      const m = ua.match(/OS\s(\d+[._]\d+(?:[._]\d+)?)/);
      platformVersion = m ? m[1].replace(/_/g, '.') : 'Unknown';

      if (/iPad/i.test(ua)) {
        if (/iPad13/i.test(ua)) model = 'iPad Pro 12.9" (5th gen)';
        else if (/iPad14/i.test(ua)) model = 'iPad Pro 11" (3rd gen)';
        else if (/iPad11/i.test(ua)) model = 'iPad (9th gen)';
        else if (/iPad12/i.test(ua)) model = 'iPad mini (6th gen)';
        else model = 'iPad';
      } else if (/iPhone/i.test(ua)) {
        if (/iPhone15/i.test(ua)) model = 'iPhone 15';
        else if (/iPhone14/i.test(ua)) model = 'iPhone 14';
        else if (/iPhone13/i.test(ua)) model = 'iPhone 13';
        else if (/iPhone12/i.test(ua)) model = 'iPhone 12';
        else if (/iPhone11/i.test(ua)) model = 'iPhone 11';
        else {
          const modelMatch = ua.match(/iPhone\s*OS\s+\d+[._]\d+[^;]*;\s*([^)]+)/);
          model = modelMatch ? modelMatch[1].trim() : 'iPhone';
        }
      } else {
        model = 'iOS Device';
      } 
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
      platform = 'macOS';
      const m = ua.match(/Mac OS X\s(\d+[._]\d+(?:[._]\d+)?)/);
      platformVersion = m ? m[1].replace(/_/g, '.') : 'Unknown';
      // Prefer specific model from UA when present (Safari often includes it)
      if (/MacBookPro/i.test(ua)) model = 'MacBook Pro';
      else if (/MacBookAir/i.test(ua)) model = 'MacBook Air';
      else if (/MacBook/i.test(ua)) model = 'MacBook';
      else if (/iMac/i.test(ua)) model = 'iMac';
      else if (/Mac\s*Pro|MacPro/i.test(ua)) model = 'Mac Pro';
      else if (/Mac\s*mini|MacMini/i.test(ua)) model = 'Mac mini';
      else model = 'Mac';
    } else if (/Windows NT/i.test(ua)) {
      platform = 'Windows';
      if (/Windows NT 10\.0/i.test(ua)) platformVersion = '10/11';
      else if (/Windows NT 6\.3/i.test(ua)) platformVersion = '8.1';
      else if (/Windows NT 6\.2/i.test(ua)) platformVersion = '8';
      else if (/Windows NT 6\.1/i.test(ua)) platformVersion = '7';
    } else if (/CrOS/i.test(ua)) {
      platform = 'Chrome OS';
      const versionMatch = ua.match(/CrOS\s+[^\s]+\s+(\d+\.\d+\.\d+)/);
      platformVersion = versionMatch ? versionMatch[1] : 'Unknown';
    } else if (/Linux/i.test(ua)) {
      platform = 'Linux';
      if (/Ubuntu/i.test(ua)) {
        platform = 'Ubuntu';
        const ubuntuMatch = ua.match(/Ubuntu[/\s](\d+\.\d+)/);
        platformVersion = ubuntuMatch ? ubuntuMatch[1] : 'Unknown';
      }
    }

    return { platform, platformVersion, model, fullVersion: 'Unknown' };
  }

  private static detectBrowser(ua: string) {
    if (/Chrome/i.test(ua) && !/Edg|OPR/i.test(ua))
      return {
        browser: 'Chrome',
        version: ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown',
      };
    if (/Firefox/i.test(ua))
      return {
        browser: 'Firefox',
        version: ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown',
      };
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua))
      return {
        browser: 'Safari',
        version: ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown',
      };
    if (/Edg/i.test(ua))
      return {
        browser: 'Edge',
        version: ua.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown',
      };
    if (/OPR/i.test(ua))
      return {
        browser: 'Opera',
        version: ua.match(/OPR\/(\d+\.\d+)/)?.[1] || 'Unknown',
      };
    return { browser: 'Unknown', version: 'Unknown' };
  }

  static async detect(): Promise<DeviceInfo> {
    if (typeof navigator === 'undefined') {
      return this.getDefaultDeviceInfo();
    }

    const ua = navigator.userAgent;
    const real = await this.getRealDeviceInfo();

    // OS detection
    let os = real.platform || 'Unknown';
    let osVersion = real.platformVersion || 'Unknown';

    if (/Android/i.test(ua)) {
      os = 'Android';
      osVersion =
        real.platformVersion !== 'Unknown'
          ? real.platformVersion
          : ua.match(/Android\s([\d.]+)/)?.[1] || 'Unknown';
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      os = 'iOS';
      osVersion =
        ua.match(/OS\s(\d+[._]\d+(?:[._]\d+)?)/)?.[1]?.replace(/_/g, '.') || 'Unknown';
    } else if (/Mac OS X/i.test(ua)) {
      os = 'macOS';
      osVersion =
        real.platformVersion !== 'Unknown'
          ? real.platformVersion
          : ua.match(/Mac OS X\s(\d+[._]\d+(?:[._]\d+)?)/)?.[1]?.replace(/_/g, '.') ||
            'Unknown';
    } else if (/Windows NT 10/i.test(ua)) {
      os = 'Windows';
      osVersion = '10/11';
    } else if (/CrOS/i.test(ua)) {
      os = 'Chrome OS';
    } else if (/Linux/i.test(ua)) {
      os = 'Linux';
    }

    // Device type
    const type: DeviceType = /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
      ? 'mobile'
      : /iPad|Tablet|PlayBook|Silk/i.test(ua)
        ? 'tablet'
        : 'desktop';

    // Brand detection
    const brand = this.detectBrand(ua);

    // Browser detection
    const { browser, version: browserVersion } = this.detectBrowser(ua);

    // Model detection
    let deviceModel = real.model !== 'Unknown' ? real.model : 'Unknown';

    if (deviceModel === 'Unknown' || deviceModel === brand) {
      if (/Android/i.test(ua)) {
        const buildMatch = ua.match(/Build\/([A-Z0-9_-]+)/);
        if (buildMatch) {
          const codename = buildMatch[1].split('_')[0];
          if (codename && codename.length > 2 && codename.length < 20) {
            deviceModel = codename;
          }
        }

        if (deviceModel === 'Unknown' || deviceModel === brand) {
          const deviceMatch = ua.match(/;\s*([^;)]+)\s*\)/);
          if (deviceMatch) {
            const cleaned = deviceMatch[1]
              .replace(/^Linux\s+/, '')
              .replace(/^Android\s+/, '')
              .replace(/\s+Build\/.*$/, '')
              .trim();
            if (cleaned && cleaned.length < 50) {
              deviceModel = cleaned;
            }
          }
        }
      }

      if ((deviceModel === 'Unknown' || deviceModel === brand) && /iPhone|iPad|iPod/i.test(ua)) {
        const iosModelMatch = ua.match(/(iPhone|iPad|iPod)[\s\d,]+/);
        if (iosModelMatch) {
          deviceModel = iosModelMatch[0].trim();
        }
      }
    }

    if (deviceModel === 'Unknown' || deviceModel === brand) {
      // Avoid "Apple Apple": for desktop Mac use "Mac" or keep real.model if already set (e.g. MacBook Pro)
      if (type === 'desktop' && brand === 'Apple' && /Macintosh|Mac OS X/i.test(ua)) {
        deviceModel = real.model !== 'Unknown' ? real.model : 'Mac';
      } else if (deviceModel === 'Unknown') {
        deviceModel = brand;
      }
    }

    // CPU architecture
    const cpuArchitecture = /ARM|ARM64|aarch64/i.test(ua)
      ? 'ARM'
      : /x64|WOW64|Win64|x86_64/i.test(ua)
        ? 'x64'
        : 'x86';

    return {
      type,
      os,
      osVersion,
      browser,
      browserVersion,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      deviceModel,
      deviceBrand: brand,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userAgent: ua,
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      pixelRatio: window.devicePixelRatio || 1,
      colorDepth: window.screen.colorDepth,
      orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown',
      cpuArchitecture,
    };
  }

  private static detectBrand(ua: string): string {
    return /iPhone|iPad|iPod|Macintosh|Mac OS X/i.test(ua)
      ? 'Apple'
      : /Samsung|SM-|GT-|SCH-|SGH-|SHV-|SHM-|Galaxy|Note|S[0-9]+|A[0-9]+|J[0-9]+|M[0-9]+|F[0-9]+/i.test(
          ua
        )
        ? 'Samsung'
        : /Pixel|Nexus|Google|Chrome|Chromebook/i.test(ua)
          ? 'Google'
          : /OnePlus|ONEPLUS|OP[A-Z0-9]+/i.test(ua)
            ? 'OnePlus'
            : /Mi\s|Redmi|Xiaomi|POCO|MI\s|HM\s|M[0-9]+[A-Z]/i.test(ua)
              ? 'Xiaomi'
              : /Huawei|HWI-|HUAWEI|Honor|HONOR|ELE-|VOG-|LIO-|ANA-/i.test(ua)
                ? 'Huawei'
                : /Oppo|OPPO|CPH|OPD|OP[A-Z0-9]+|Reno|Find/i.test(ua)
                  ? 'Oppo'
                  : /Vivo|VIVO|V[0-9]+|Y[0-9]+|X[0-9]+/i.test(ua)
                    ? 'Vivo'
                    : /Motorola|Moto|XT[0-9]+|Moto\s/i.test(ua)
                      ? 'Motorola'
                      : /LG|LGE|LM-|LG-[A-Z0-9]+/i.test(ua)
                        ? 'LG'
                        : /Sony|Xperia|SO-|SOV|XQ-[A-Z0-9]+/i.test(ua)
                          ? 'Sony'
                          : /Nokia|TA-[0-9]+|Nokia\s/i.test(ua)
                            ? 'Nokia'
                            : /Realme|RMX|RM[A-Z0-9]+/i.test(ua)
                              ? 'Realme'
                              : /Infinix|Infinix\s|X[0-9]+/i.test(ua)
                                ? 'Infinix'
                                : /Tecno|TECNO|TECNO\s|T[A-Z0-9]+/i.test(ua)
                                  ? 'Tecno'
                                  : /Asus|ASUS|ZenFone|ROG/i.test(ua)
                                    ? 'Asus'
                                    : /Lenovo|ThinkPad|IdeaPad/i.test(ua)
                                      ? 'Lenovo'
                                      : /HP|Hewlett-Packard/i.test(ua)
                                        ? 'HP'
                                        : /Dell/i.test(ua)
                                          ? 'Dell'
                                          : /Acer/i.test(ua)
                                            ? 'Acer'
                                            : /Microsoft|Surface/i.test(ua)
                                              ? 'Microsoft'
                                              : 'Unknown';
  }

  private static getDefaultDeviceInfo(): DeviceInfo {
    return {
      type: 'desktop',
      os: 'Unknown',
      osVersion: 'Unknown',
      browser: 'Unknown',
      browserVersion: 'Unknown',
      screenResolution: 'Unknown',
      deviceModel: 'Unknown',
      deviceBrand: 'Unknown',
      language: 'en-US',
      timezone: 'UTC',
      userAgent: 'Server',
      touchSupport: false,
      pixelRatio: 1,
      colorDepth: 24,
      orientation: 'unknown',
      cpuArchitecture: 'x86',
      hardwareConcurrency: 0,
    };
  }
}

