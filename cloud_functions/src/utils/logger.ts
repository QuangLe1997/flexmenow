import { logger as functionsLogger } from "firebase-functions/v2";

/**
 * Structured logging wrapper around Firebase Functions logger.
 *
 * All log entries are automatically collected by Cloud Logging
 * and are searchable/filterable in the Google Cloud Console.
 */

export interface LogContext {
  userId?: string;
  functionName?: string;
  generationId?: string;
  storyId?: string;
  templateId?: string;
  [key: string]: unknown;
}

function formatMessage(message: string, context?: LogContext): string {
  if (!context) return message;
  const prefix = context.functionName ? `[${context.functionName}]` : "";
  const userId = context.userId ? ` user=${context.userId}` : "";
  return `${prefix}${userId} ${message}`.trim();
}

export const logger = {
  /**
   * Log informational messages (normal operations).
   */
  info(message: string, context?: LogContext): void {
    functionsLogger.info(formatMessage(message, context), context);
  },

  /**
   * Log warnings (recoverable issues, degraded behavior).
   */
  warn(message: string, context?: LogContext): void {
    functionsLogger.warn(formatMessage(message, context), context);
  },

  /**
   * Log errors (failures, exceptions).
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    const errorInfo =
      error instanceof Error
        ? { errorMessage: error.message, errorStack: error.stack }
        : { errorMessage: String(error) };

    functionsLogger.error(formatMessage(message, context), {
      ...context,
      ...errorInfo,
    });
  },

  /**
   * Log debug messages (verbose, only useful in dev).
   */
  debug(message: string, context?: LogContext): void {
    functionsLogger.debug(formatMessage(message, context), context);
  },
};
