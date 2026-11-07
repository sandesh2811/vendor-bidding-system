import { ConsoleLogger, type LogLevel } from '@nestjs/common';
import { getRequestContext } from './request-context';

/* Nest's ConsoleLogger, plus the current request context (requestId, userId, role, vendorId) merged into object messages */
export class ContextLogger extends ConsoleLogger {
  protected printMessages(
    messages: unknown[],
    context?: string,
    logLevel?: LogLevel,
    writeStreamType?: 'stdout' | 'stderr',
    errorStack?: unknown,
    params?: Record<string, unknown>,
  ): void {
    const requestContext = getRequestContext();

    const enriched = requestContext
      ? messages.map((message) =>
          typeof message === 'object' &&
          message !== null &&
          !(message instanceof Error)
            ? { ...requestContext, ...message }
            : message,
        )
      : messages;

    super.printMessages(
      enriched,
      context,
      logLevel,
      writeStreamType,
      errorStack,
      params,
    );
  }
}
