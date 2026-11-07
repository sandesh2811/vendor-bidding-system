import { HttpException, HttpStatus } from '@nestjs/common';
import type { DatabaseError } from 'pg';
import type { QueryFailedError } from 'typeorm';
import { PG_ERROR_CODE } from '../constants';

/* pg detail: `Key (email)=(a@b.com) already exists.` Only the column name is kept; the value may be PII. */
const DETAIL_COLUMN = /Key \(([^)]+)\)=/;

export class DatabaseException extends HttpException {
  constructor(
    status: HttpStatus,
    message: string,
    readonly code?: string,
  ) {
    super(message, status);
  }

  static fromQueryError(error: QueryFailedError): DatabaseException {
    const { code, detail } = error.driverError as Partial<DatabaseError>;
    const column = detail?.match(DETAIL_COLUMN)?.[1]?.replaceAll('"', '');

    switch (code) {
      case PG_ERROR_CODE.UNIQUE_VIOLATION:
        return new DatabaseException(
          HttpStatus.CONFLICT,
          `${column ?? 'Value'} already exists`,
          code,
        );

      case PG_ERROR_CODE.FOREIGN_KEY_VIOLATION:
        return new DatabaseException(
          HttpStatus.CONFLICT,
          'Related record is missing or still in use',
          code,
        );

      default:
        return new DatabaseException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Internal server error',
          code,
        );
    }
  }
}
