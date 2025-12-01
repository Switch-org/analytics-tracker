/**
 * Plugin Manager for Analytics Tracker
 * Manages plugin registration and execution
 */

import type { AnalyticsEvent } from '../types';
import type { AnalyticsPlugin } from './types';
import { logger } from '../utils/logger';

export class PluginManager {
  private plugins: AnalyticsPlugin[] = [];

  /**
   * Register a plugin
   */
  register(plugin: AnalyticsPlugin): void {
    if (!plugin.name) {
      throw new Error('Plugin must have a name');
    }

    this.plugins.push(plugin);
    logger.debug(`Plugin registered: ${plugin.name}`);
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginName: string): void {
    const index = this.plugins.findIndex((p) => p.name === pluginName);
    if (index !== -1) {
      this.plugins.splice(index, 1);
      logger.debug(`Plugin unregistered: ${pluginName}`);
    }
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): AnalyticsPlugin[] {
    return [...this.plugins];
  }

  /**
   * Execute beforeSend hooks for all plugins
   * Returns the transformed event, or null if filtered out
   */
  async executeBeforeSend(event: AnalyticsEvent): Promise<AnalyticsEvent | null> {
    let transformedEvent: AnalyticsEvent | null = event;

    for (const plugin of this.plugins) {
      if (!plugin.beforeSend) continue;

      try {
        const result = await plugin.beforeSend(transformedEvent);
        
        // If plugin returns null/undefined, filter out the event
        if (result === null || result === undefined) {
          logger.debug(`Event filtered out by plugin: ${plugin.name}`);
          return null;
        }

        transformedEvent = result;
      } catch (error) {
        logger.warn(`Plugin ${plugin.name} beforeSend hook failed:`, error);
        // Continue with other plugins even if one fails
      }
    }

    return transformedEvent;
  }

  /**
   * Execute afterSend hooks for all plugins
   */
  async executeAfterSend(event: AnalyticsEvent): Promise<void> {
    for (const plugin of this.plugins) {
      if (!plugin.afterSend) continue;

      try {
        await plugin.afterSend(event);
      } catch (error) {
        logger.warn(`Plugin ${plugin.name} afterSend hook failed:`, error);
      }
    }
  }

  /**
   * Execute onError hooks for all plugins
   */
  async executeOnError(event: AnalyticsEvent, error: Error): Promise<void> {
    for (const plugin of this.plugins) {
      if (!plugin.onError) continue;

      try {
        await plugin.onError(event, error);
      } catch (err) {
        logger.warn(`Plugin ${plugin.name} onError hook failed:`, err);
      }
    }
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins = [];
    logger.debug('All plugins cleared');
  }
}

// Global plugin manager instance
export const pluginManager = new PluginManager();

