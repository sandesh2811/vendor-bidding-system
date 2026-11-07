import { type ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';
import { DatabaseException } from '../exceptions/database.exception';

@Catch(QueryFailedError)
export class DatabaseExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(error: QueryFailedError, host: ArgumentsHost): void {
    const exception = DatabaseException.fromQueryError(error);

    /* error.parameters holds the bound values (possible PII), so only the message and stack are logged */
    this.logger.error(
      {
        method: 'catch',
        message: 'Database query failed',
        code: exception.code,
        status: exception.getStatus(),
        reason: error.message,
      },
      error.stack,
    );

    super.catch(exception, host);
  }
}
