/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Debug utilities for analytics tracker
 * Provides debugging tools in development mode
 */

import { AnalyticsService } from '../services/analytics-service';
import { logger } from './logger';
import { metricsCollector } from './metrics';

export interface AnalyticsDebugStats {
  queueSize: number;
  queue: any[];
  config: any;
}

/**
 * Initialize debug utilities (only in development)
 */
export function initDebug(): void {
  if (typeof window === 'undefined') return;
  
  const isDevelopment =
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'development';

  if (!isDevelopment) {
    return;
  }

  const debug = {
    /**
     * Get current queue state
     */
    getQueue: () => {
      const queueManager = AnalyticsService.getQueueManager();
      if (!queueManager) {
        logger.warn('Queue manager not initialized');
        return [];
      }
      return queueManager.getQueue();
    },

    /**
     * Get queue size
     */
    getQueueSize: () => {
      return AnalyticsService.getQueueSize();
    },

    /**
     * Manually flush the queue
     */
    flushQueue: async () => {
      logger.info('Manually flushing queue...');
      await AnalyticsService.flushQueue();
      logger.info('Queue flushed');
    },

    /**
     * Clear the queue
     */
    clearQueue: () => {
      logger.info('Clearing queue...');
      AnalyticsService.clearQueue();
      logger.info('Queue cleared');
    },

    /**
     * Get debug statistics
     */
    getStats: (): AnalyticsDebugStats => {
      const queueManager = AnalyticsService.getQueueManager();
      const metrics = AnalyticsService.getMetrics();
      return {
        queueSize: AnalyticsService.getQueueSize(),
        queue: queueManager?.getQueue() ?? [],
        config: {
          metrics: metrics,
          metricsSummary: metrics ? metricsCollector.getSummary() : 'Metrics disabled',
        },
      };
    },

    /**
     * Set log level
     */
    setLogLevel: (level: 'silent' | 'error' | 'warn' | 'info' | 'debug') => {
      logger.setLevel(level);
      logger.info(`Log level set to: ${level}`);
    },
  };

  // Expose to window for console access
  (window as any).__analyticsDebug = debug;

  logger.info('Analytics debug tools available at window.__analyticsDebug');
  logger.info('Available methods: getQueue(), getQueueSize(), flushQueue(), clearQueue(), getStats(), setLogLevel()');
}

