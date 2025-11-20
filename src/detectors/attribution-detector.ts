import type { AttributionInfo } from '../types';
import { loadJSON, saveJSON, saveSessionJSON, loadSessionJSON } from '../utils/storage';

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'ttclid',
  'msclkid',
  'dmclid',
] as const;

type UtmKey = typeof UTM_KEYS[number];

const FIRST_TOUCH_KEY = 'analytics:firstTouch';
const LAST_TOUCH_KEY = 'analytics:lastTouch';
const SESSION_START_KEY = 'analytics:sessionStart';

function pickUtm(url: URL): Record<UtmKey, string | null> {
  const out: Record<UtmKey, string | null> = {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    gclid: null,
    fbclid: null,
    ttclid: null,
    msclkid: null,
    dmclid: null,
  };
  UTM_KEYS.forEach((k) => {
    const v = url.searchParams.get(k);
    if (v) out[k] = v;
  });
  return out;
}

function anyCampaignParams(utm: Record<UtmKey, string | null>): boolean {
  return UTM_KEYS.some((k) => !!utm[k]);
}

function getReferrerDomain(ref: string | null): string | null {
  if (!ref) return null;
  try {
    return new URL(ref).hostname;
  } catch {
    return null;
  }
}

function getNavigationType(): {
  type: AttributionInfo['navigationType'];
  isReload: boolean;
  isBackForward: boolean;
} {
  if (typeof window === 'undefined' || typeof performance === 'undefined') {
    return { type: 'unknown', isReload: false, isBackForward: false };
  }

  const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  const navType = entries?.[0]?.type || 'navigate';
  const typeMap: Record<string, AttributionInfo['navigationType']> = {
    navigate: 'navigate',
    reload: 'reload',
    back_forward: 'back_forward',
    prerender: 'prerender',
  };
  const type = typeMap[navType] ?? 'unknown';
  return {
    type,
    isReload: type === 'reload',
    isBackForward: type === 'back_forward',
  };
}

/**
 * Attribution Detector
 * Detects UTM parameters, referrer, navigation type, and tracks first/last touch
 */
export class AttributionDetector {
  static detect(): AttributionInfo {
    if (typeof window === 'undefined') {
      return this.getDefaultAttribution();
    }

    const landingUrl = window.location.href;
    const url = new URL(landingUrl);
    const { type, isReload, isBackForward } = getNavigationType();
    const referrerUrl = document.referrer || null;
    const referrerDomain = getReferrerDomain(referrerUrl);
    const utm = pickUtm(url);

    // Per-tab session start
    const sessionStart =
      loadSessionJSON<string>(SESSION_START_KEY) ||
      (() => {
        const ts = new Date().toISOString();
        saveSessionJSON(SESSION_START_KEY, ts);
        return ts;
      })();

    // First/last touch tracking
    const existingFirst = loadJSON<Record<string, string | null>>(FIRST_TOUCH_KEY);
    if (!existingFirst && anyCampaignParams(utm)) {
      saveJSON(FIRST_TOUCH_KEY, { ...utm, referrerDomain, ts: new Date().toISOString() });
    }
    if (anyCampaignParams(utm)) {
      saveJSON(LAST_TOUCH_KEY, { ...utm, referrerDomain, ts: new Date().toISOString() });
    }

    const firstTouch = loadJSON<Record<string, string | null>>(FIRST_TOUCH_KEY);
    const lastTouch = loadJSON<Record<string, string | null>>(LAST_TOUCH_KEY);

    return {
      landingUrl,
      path: url.pathname + url.search,
      hostname: url.hostname,
      referrerUrl,
      referrerDomain,
      navigationType: type,
      isReload,
      isBackForward,
      ...utm,
      firstTouch,
      lastTouch,
      sessionStart,
    };
  }

  private static getDefaultAttribution(): AttributionInfo {
    return {
      landingUrl: '',
      path: '',
      hostname: '',
      referrerUrl: null,
      referrerDomain: null,
      navigationType: 'unknown',
      isReload: false,
      isBackForward: false,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      gclid: null,
      fbclid: null,
      ttclid: null,
      msclkid: null,
      dmclid: null,
      firstTouch: null,
      lastTouch: null,
      sessionStart: null,
    };
  }
}

