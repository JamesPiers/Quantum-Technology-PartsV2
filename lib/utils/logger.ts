/**
 * Logging utility for structured logs
 */

export interface LogContext {
  provider?: string;
  documentId?: string;
  extractionId?: string;
  responseTimeMs?: number;
  tokenUsage?: number;
  error?: Error | string;
  [key: string]: any;
}

class Logger {
  private log(level: string, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    if (level === 'error') {
      console.error(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, context);
    }
  }
}

export const logger = new Logger();

