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

  it('should detect wifi on mobile when type is missing but downlink is high', () => {
    // This is the bug fix: WiFi connection without explicit type property
    // but with good downlink speed should be detected as WiFi, not cellular
    (navigator as any).connection = {
      // type is undefined (not set by browser)
      effectiveType: '4g', // This indicates speed, NOT connection type
      downlink: 10,
      rtt: 150,
      saveData: false,
    };
    (navigator as any).userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';

    const result = NetworkDetector.detect();
    expect(result.type).toBe('wifi'); // Should be WiFi, not cellular
  });

  it('should detect wifi on desktop when type is missing', () => {
    (navigator as any).connection = {
      effectiveType: '4g',
      downlink: 25,
      rtt: 50,
      saveData: false,
    };
    (navigator as any).userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

    const result = NetworkDetector.detect();
    expect(result.type).toBe('wifi');
  });

  it('should detect cellular when saveData is enabled', () => {
    (navigator as any).connection = {
      downlink: 5,
      rtt: 100,
      saveData: true, // Data saver = cellular
    };
    (navigator as any).userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';

    const result = NetworkDetector.detect();
    expect(result.type).toBe('cellular');
  });

  it('should fallback to mobile guess when connection API unavailable', () => {
    delete (navigator as any).connection;
    (navigator as any).userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';

    const result = NetworkDetector.detect();
    expect(result.type).toBe('cellular');
  });
});

