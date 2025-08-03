// Centralized logging system
import { LogLevel } from '../types/types';
import type { LoggerConfig, LogEntry } from '../types/types';
import { LOG_LEVEL_NAMES, LOG_LEVEL_EMOJIS, LOGGER_CONFIG } from '../constants/constants';

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  level: LOGGER_CONFIG.DEFAULT_LEVEL,
  enableConsole: LOGGER_CONFIG.DEFAULT_CONSOLE,
  format: LOGGER_CONFIG.DEFAULT_FORMAT,
  includeTimestamp: LOGGER_CONFIG.DEFAULT_TIMESTAMP,
  includeLevel: LOGGER_CONFIG.DEFAULT_LEVEL_DISPLAY,
  includeContext: LOGGER_CONFIG.DEFAULT_CONTEXT,
};

// Main Logger class
export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Format log entry
  private formatLogEntry(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry) + '\n';
    }

    // Text format
    let formatted = '';

    if (this.config.includeTimestamp) {
      formatted += `[${entry.timestamp}] `;
    }

    if (this.config.includeLevel) {
      formatted += `${LOG_LEVEL_EMOJIS[entry.level]} ${LOG_LEVEL_NAMES[entry.level]} `;
    }

    if (this.config.includeContext && entry.context) {
      formatted += `[${entry.context}] `;
    }

    formatted += entry.message;

    if (entry.data) {
      formatted += ` ${JSON.stringify(entry.data)}`;
    }

    if (entry.error) {
      formatted += `\nError: ${entry.error.message}\nStack: ${entry.error.stack}`;
    }

    return formatted + '\n';
  }

  // Write log entry
  private writeLog(entry: LogEntry): void {
    if (entry.level < this.config.level) return;

    const formatted = this.formatLogEntry(entry);

    // Console output
    if (this.config.enableConsole) {
      const consoleMethod =
        entry.level >= LogLevel.ERROR
          ? 'error'
          : entry.level >= LogLevel.WARN
            ? 'warn'
            : entry.level >= LogLevel.INFO
              ? 'info'
              : 'log';
      console[consoleMethod](formatted.trim());
    }
  }

  // Log methods
  debug(message: string, context?: string, data?: unknown): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context,
      data,
    });
  }

  info(message: string, context?: string, data?: unknown): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
      data,
    });
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context,
      data,
    });
  }

  error(
    message: string,
    context?: string,
    error?: Error,
    data?: unknown
  ): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
      data,
      error,
    });
  }

  fatal(
    message: string,
    context?: string,
    error?: Error,
    data?: unknown
  ): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.FATAL,
      message,
      context,
      data,
      error,
    });
  }

  // Cleanup method (no-op for console-only logging)
  cleanup(): void {
    // No cleanup needed for console-only logging
  }

  // Get log statistics (no-op for console-only logging)
  getStats(): { logFiles: string[]; totalSize: number } {
    return { logFiles: [], totalSize: 0 };
  }
}

// Create default logger instance
export const logger = new Logger();

// Export convenience methods
export const debug = (message: string, context?: string, data?: unknown) =>
  logger.debug(message, context, data);
export const info = (message: string, context?: string, data?: unknown) =>
  logger.info(message, context, data);
export const warn = (message: string, context?: string, data?: unknown) =>
  logger.warn(message, context, data);
export const error = (
  message: string,
  context?: string,
  error?: Error,
  data?: unknown
) => logger.error(message, context, error, data);
export const fatal = (
  message: string,
  context?: string,
  error?: Error,
  data?: unknown
) => logger.fatal(message, context, error, data);
