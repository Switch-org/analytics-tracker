/**
 * Metrics collection for analytics tracker
 * Tracks performance and usage statistics
 */

import { logger } from './logger';

export interface AnalyticsMetrics {
  eventsSent: number;
  eventsQueued: number;
  eventsFailed: number;
  eventsFiltered: number;
  averageSendTime: number;
  retryCount: number;
  queueSize: number;
  lastFlushTime: number | null;
  errors: Array<{ timestamp: number; error: string }>;
}

class MetricsCollector {
  private metrics: AnalyticsMetrics = {
    eventsSent: 0,
    eventsQueued: 0,
    eventsFailed: 0,
    eventsFiltered: 0,
    averageSendTime: 0,
    retryCount: 0,
    queueSize: 0,
    lastFlushTime: null,
    errors: [],
  };

  private sendTimes: number[] = [];
  private maxErrors = 100; // Keep last 100 errors

  /**
   * Record an event being queued
   */
  recordQueued(): void {
    this.metrics.eventsQueued++;
  }

  /**
   * Record an event being sent
   */
  recordSent(sendTime: number): void {
    this.metrics.eventsSent++;
    this.sendTimes.push(sendTime);
    
    // Keep only last 100 send times for average calculation
    if (this.sendTimes.length > 100) {
      this.sendTimes.shift();
    }
    
    // Calculate average
    const sum = this.sendTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageSendTime = sum / this.sendTimes.length;
  }

  /**
   * Record a failed event
   */
  recordFailed(error?: Error): void {
    this.metrics.eventsFailed++;
    
    if (error) {
      this.metrics.errors.push({
        timestamp: Date.now(),
        error: error.message || String(error),
      });
      
      // Keep only last N errors
      if (this.metrics.errors.length > this.maxErrors) {
        this.metrics.errors.shift();
      }
    }
  }

  /**
   * Record a filtered event
   */
  recordFiltered(): void {
    this.metrics.eventsFiltered++;
  }

  /**
   * Record a retry
   */
  recordRetry(): void {
    this.metrics.retryCount++;
  }

  /**
   * Update queue size
   */
  updateQueueSize(size: number): void {
    this.metrics.queueSize = size;
  }

  /**
   * Record flush time
   */
  recordFlush(): void {
    this.metrics.lastFlushTime = Date.now();
  }

  /**
   * Get current metrics
   */
  getMetrics(): AnalyticsMetrics {
    return {
      ...this.metrics,
      errors: [...this.metrics.errors], // Return copy
    };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      eventsSent: 0,
      eventsQueued: 0,
      eventsFailed: 0,
      eventsFiltered: 0,
      averageSendTime: 0,
      retryCount: 0,
      queueSize: 0,
      lastFlushTime: null,
      errors: [],
    };
    this.sendTimes = [];
    logger.debug('Metrics reset');
  }

  /**
   * Get metrics summary (for logging)
   */
  getSummary(): string {
    const m = this.metrics;
    return `Metrics: ${m.eventsSent} sent, ${m.eventsQueued} queued, ${m.eventsFailed} failed, ${m.eventsFiltered} filtered, ${m.retryCount} retries, avg send time: ${m.averageSendTime.toFixed(2)}ms`;
  }
}

// Global metrics collector instance
export const metricsCollector = new MetricsCollector();

