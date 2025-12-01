/**
 * Queue Manager for Analytics Events
 * Handles batching, persistence, and offline support
 */

import type { AnalyticsEvent } from '../types';
import { saveJSON, loadJSON } from './storage';
import { logger } from './logger';

export interface QueuedEvent {
  event: AnalyticsEvent;
  retries: number;
  timestamp: number;
  id: string;
}

export interface QueueConfig {
  batchSize: number;
  batchInterval: number;
  maxQueueSize: number;
  storageKey: string;
}

export class QueueManager {
  private queue: QueuedEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;
  private config: QueueConfig;
  private flushCallback: ((events: AnalyticsEvent[]) => Promise<void>) | null = null;

  constructor(config: QueueConfig) {
    this.config = config;
    this.loadFromStorage();
    this.startAutoFlush();
    this.setupPageUnloadHandler();
  }

  /**
   * Set the callback function to flush events
   */
  setFlushCallback(callback: (events: AnalyticsEvent[]) => Promise<void>): void {
    this.flushCallback = callback;
  }

  /**
   * Add an event to the queue
   */
  enqueue(event: AnalyticsEvent): boolean {
    if (this.queue.length >= this.config.maxQueueSize) {
      logger.warn(`Queue full (${this.config.maxQueueSize} events). Dropping oldest event.`);
      this.queue.shift(); // Remove oldest event
    }

    const queuedEvent: QueuedEvent = {
      event,
      retries: 0,
      timestamp: Date.now(),
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };

    this.queue.push(queuedEvent);
    this.saveToStorage();
    
    logger.debug(`Event queued. Queue size: ${this.queue.length}`);

    // Auto-flush if batch size reached
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }

    return true;
  }

  /**
   * Flush events from the queue
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0 || !this.flushCallback) {
      return;
    }

    this.isFlushing = true;
    const eventsToFlush = this.queue.splice(0, this.config.batchSize);
    
    if (eventsToFlush.length === 0) {
      this.isFlushing = false;
      return;
    }

    try {
      const events = eventsToFlush.map((q) => q.event);
      await this.flushCallback(events);
      
      // Remove successfully flushed events from storage
      this.saveToStorage();
      logger.debug(`Flushed ${events.length} events. Queue size: ${this.queue.length}`);
    } catch (error) {
      // On failure, put events back in queue (they'll be retried)
      this.queue.unshift(...eventsToFlush);
      this.saveToStorage();
      logger.warn(`Failed to flush events. Re-queued ${eventsToFlush.length} events.`, error);
      throw error;
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get all queued events (for debugging)
   */
  getQueue(): QueuedEvent[] {
    return [...this.queue];
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    this.saveToStorage();
    logger.debug('Queue cleared');
  }

  /**
   * Load queue from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = loadJSON<QueuedEvent[]>(this.config.storageKey);
      if (stored && Array.isArray(stored)) {
        // Only load events from last 24 hours to prevent stale data
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.queue = stored.filter((q) => q.timestamp > oneDayAgo);
        
        if (this.queue.length > 0) {
          logger.debug(`Loaded ${this.queue.length} events from storage`);
        }
      }
    } catch (error) {
      logger.warn('Failed to load queue from storage', error);
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      saveJSON(this.config.storageKey, this.queue);
    } catch (error) {
      logger.warn('Failed to save queue to storage', error);
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    if (typeof window === 'undefined') return;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush().catch((error) => {
          logger.warn('Auto-flush failed', error);
        });
      }
    }, this.config.batchInterval);
  }

  /**
   * Setup page unload handler to flush events
   */
  private setupPageUnloadHandler(): void {
    if (typeof window === 'undefined') return;

    // Use sendBeacon for reliable delivery on page unload
    window.addEventListener('beforeunload', () => {
      if (this.queue.length > 0 && this.flushCallback) {
        const events = this.queue.splice(0, this.config.batchSize).map((q) => q.event);
        
        // Try to send via sendBeacon (more reliable on unload)
        if (navigator.sendBeacon) {
          try {
            const blob = new Blob([JSON.stringify(events)], {
              type: 'application/json',
            });
            navigator.sendBeacon(this.getEndpointFromCallback(), blob);
            this.saveToStorage();
          } catch (error) {
            // Fallback: put events back in queue
            this.queue.unshift(
              ...events.map((e) => ({
                event: e,
                retries: 0,
                timestamp: Date.now(),
                id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
              }))
            );
          }
        }
      }
    });

    // Also use visibilitychange for better mobile support
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.queue.length > 0) {
        this.flush().catch(() => {
          // Silently fail on visibility change
        });
      }
    });
  }

  /**
   * Get endpoint for sendBeacon
   */
  private getEndpointFromCallback(): string {
    // Try to get from window or return default
    if (typeof window !== 'undefined' && (window as any).__analyticsEndpoint) {
      return (window as any).__analyticsEndpoint;
    }
    return '/api/analytics';
  }

  /**
   * Update storage key (for configuration changes)
   */
  updateConfig(config: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.batchInterval) {
      this.startAutoFlush();
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

