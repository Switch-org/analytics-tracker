/**
 * Plugin system types for analytics tracker
 */

import type { AnalyticsEvent } from '../types';

/**
 * Plugin interface for event transformation
 */
export interface AnalyticsPlugin {
  /**
   * Plugin name (for debugging)
   */
  name: string;

  /**
   * Called before an event is sent
   * Can modify, filter, or enrich the event
   * 
   * @param event - The analytics event
   * @returns Modified event, or null/undefined to filter out the event
   */
  beforeSend?: (event: AnalyticsEvent) => AnalyticsEvent | null | undefined | Promise<AnalyticsEvent | null | undefined>;

  /**
   * Called after an event is successfully sent
   * 
   * @param event - The analytics event that was sent
   */
  afterSend?: (event: AnalyticsEvent) => void | Promise<void>;

  /**
   * Called when an event fails to send
   * 
   * @param event - The analytics event that failed
   * @param error - The error that occurred
   */
  onError?: (event: AnalyticsEvent, error: Error) => void | Promise<void>;
}

/**
 * Plugin manager configuration
 */
export interface PluginManagerConfig {
  plugins: AnalyticsPlugin[];
}

