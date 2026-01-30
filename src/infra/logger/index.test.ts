import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsoleLoggerAdapter } from './index.js';

describe('ConsoleLoggerAdapter', () => {
  let logger: ConsoleLoggerAdapter;

  beforeEach(() => {
    logger = new ConsoleLoggerAdapter();
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
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'info';
      // Re-create logger to pick up new env
      const infoLogger = new ConsoleLoggerAdapter();

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      infoLogger.info('Test info message');
      expect(consoleSpy).toHaveBeenCalledWith('[INFO] Test info message', '');
      consoleSpy.mockRestore();

      process.env.LOG_LEVEL = originalLogLevel;
    });

    it('does not log info when LOG_LEVEL is error', () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'error';
      const errorLogger = new ConsoleLoggerAdapter();

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      errorLogger.info('Test info message');
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();

      process.env.LOG_LEVEL = originalLogLevel;
    });
  });

  describe('warn', () => {
    it('logs warn message when LOG_LEVEL is warn', () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'warn';
      const warnLogger = new ConsoleLoggerAdapter();

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      warnLogger.warn('Test warn message');
      expect(consoleSpy).toHaveBeenCalledWith('[WARN] Test warn message', '');
      consoleSpy.mockRestore();

      process.env.LOG_LEVEL = originalLogLevel;
    });

    it('does not log warn when LOG_LEVEL is error', () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'error';
      const errorLogger = new ConsoleLoggerAdapter();

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      errorLogger.warn('Test warn message');
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();

      process.env.LOG_LEVEL = originalLogLevel;
    });
  });

  describe('debug', () => {
    it('respects LOG_LEVEL', () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'error';
      const errorLogger = new ConsoleLoggerAdapter();

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      errorLogger.debug('Test debug message');
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();

      process.env.LOG_LEVEL = originalLogLevel;
    });

    it('logs debug when LOG_LEVEL is debug', () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'debug';
      const debugLogger = new ConsoleLoggerAdapter();

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      debugLogger.debug('Test debug message');
      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] Test debug message', '');
      consoleSpy.mockRestore();

      process.env.LOG_LEVEL = originalLogLevel;
    });
  });
});
