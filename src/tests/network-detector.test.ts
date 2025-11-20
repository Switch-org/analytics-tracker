import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NetworkDetector } from '../detectors/network-detector';

describe('NetworkDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect wifi connection', () => {
    (navigator as any).connection = {
      type: 'wifi',
      effectiveType: '4g',
      downlink: 25,
      rtt: 50,
    };

    const result = NetworkDetector.detect();
    expect(result.type).toBe('wifi');
    expect(result.downlink).toBe(25);
  });

  it('should detect cellular connection', () => {
    (navigator as any).connection = {
      type: 'cellular',
      effectiveType: '4g',
      downlink: 5,
      rtt: 100,
    };

    const result = NetworkDetector.detect();
    expect(result.type).toBe('cellular');
  });

  it('should detect hotspot with heuristics', () => {
    (navigator as any).connection = {
      downlink: 0.5,
      rtt: 350,
      saveData: false,
    };
    (navigator as any).userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';

    const result = NetworkDetector.detect();
    expect(result.type).toBe('hotspot');
  });

  it('should fallback to mobile guess when connection API unavailable', () => {
    delete (navigator as any).connection;
    (navigator as any).userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';

    const result = NetworkDetector.detect();
    expect(result.type).toBe('cellular');
  });
});

