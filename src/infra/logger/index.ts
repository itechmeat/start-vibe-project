import { inspect } from 'node:util';
import type { LoggerPort } from '../../app/ports/index.js';
import { parseEnv } from '../../domain/schemas/env.js';

function safeStringify(context: Record<string, unknown>): string {
  try {
    return JSON.stringify(context);
  } catch {
    return inspect(context, { depth: 3 });
  }
}

export class ConsoleLoggerAdapter implements LoggerPort {
  private env = parseEnv();

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.env.LOG_LEVEL === 'debug') {
      console.log(`[DEBUG] ${message}`, context ? safeStringify(context) : '');
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (['debug', 'info'].includes(this.env.LOG_LEVEL)) {
      console.log(`[INFO] ${message}`, context ? safeStringify(context) : '');
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (['debug', 'info', 'warn'].includes(this.env.LOG_LEVEL)) {
      console.warn(`[WARN] ${message}`, context ? safeStringify(context) : '');
    }
  }

  error(message: string, context?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, context ? safeStringify(context) : '');
  }
}
