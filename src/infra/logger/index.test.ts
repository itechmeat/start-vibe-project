import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsoleLoggerAdapter } from './index.js';

describe('ConsoleLoggerAdapter', () => {
  let logger: ConsoleLoggerAdapter;
  let originalLogLevel: string | undefined;

  beforeEach(() => {
    originalLogLevel = process.env.LOG_LEVEL;
    // Set default log level for tests that don't override
    delete process.env.LOG_LEVEL;
    logger = new ConsoleLoggerAdapter();
  });

  afterEach(() => {
    // Restore original LOG_LEVEL
    if (originalLogLevel !== undefined) {
      process.env.LOG_LEVEL = originalLogLevel;
    } else {
      delete process.env.LOG_LEVEL;
    }
  });

  describe('error', () => {
    it('logs error message', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('Test error message');
      expect(consoleSpy).toHaveBeenCalledWith('[ERROR] Test error message', '');
      consoleSpy.mockRestore();
    });

    it('logs error with context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('Test error', { key: 'value' });
      expect(consoleSpy).toHaveBeenCalledWith('[ERROR] Test error', '{"key":"value"}');
      consoleSpy.mockRestore();
    });

    it('handles circular references in context safely', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const circular: Record<string, unknown> = { key: 'value' };
      circular.self = circular;
      logger.error('Test error', circular);
      // Should not throw, uses util.inspect fallback
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('info', () => {
    it('logs info message when LOG_LEVEL is info', () => {
      process.env.LOG_LEVEL = 'info';
      const infoLogger = new ConsoleLoggerAdapter();

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      infoLogger.info('Test info message');
      expect(consoleSpy).toHaveBeenCalledWith('[INFO] Test info message', '');
      consoleSpy.mockRestore();
    });

    it('does not log info when LOG_LEVEL is error', () => {
      process.env.LOG_LEVEL = 'error';
      const errorLogger = new ConsoleLoggerAdapter();

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      errorLogger.info('Test info message');
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('warn', () => {
    it('logs warn message when LOG_LEVEL is warn', () => {
      process.env.LOG_LEVEL = 'warn';
      const warnLogger = new ConsoleLoggerAdapter();

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      warnLogger.warn('Test warn message');
      expect(consoleSpy).toHaveBeenCalledWith('[WARN] Test warn message', '');
      consoleSpy.mockRestore();
    });

    it('does not log warn when LOG_LEVEL is error', () => {
      process.env.LOG_LEVEL = 'error';
      const errorLogger = new ConsoleLoggerAdapter();

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      errorLogger.warn('Test warn message');
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('debug', () => {
    it('respects LOG_LEVEL', () => {
      process.env.LOG_LEVEL = 'error';
      const errorLogger = new ConsoleLoggerAdapter();

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      errorLogger.debug('Test debug message');
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('logs debug when LOG_LEVEL is debug', () => {
      process.env.LOG_LEVEL = 'debug';
      const debugLogger = new ConsoleLoggerAdapter();

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      debugLogger.debug('Test debug message');
      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] Test debug message', '');
      consoleSpy.mockRestore();
    });
  });
});
