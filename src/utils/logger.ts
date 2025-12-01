/**
 * Logger utility for analytics tracker
 * Provides configurable logging levels for development and production
 */

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private level: LogLevel = 'warn';
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment =
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'development';
    
    // Default to 'info' in development, 'warn' in production
    if (this.isDevelopment && this.level === 'warn') {
      this.level = 'info';
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['silent', 'error', 'warn', 'info', 'debug'];
    const currentIndex = levels.indexOf(this.level);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= 0 && messageIndex <= currentIndex;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`[Analytics] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[Analytics] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(`[Analytics] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(`[Analytics] [DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();

