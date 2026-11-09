import { HttpException, HttpStatus } from '@nestjs/common';
import type { DatabaseError } from 'pg';
import type { QueryFailedError } from 'typeorm';
import {
  CHECK_CONSTRAINTS,
  PG_ERROR_CODE,
  UNIQUE_CONSTRAINTS,
} from '../constants';

/* pg detail: `Key (email)=(a@b.com) already exists.` Only the column name is kept; the value may be PII. */
const DETAIL_COLUMN = /Key \(([^)]+)\)=/;

/* snake_case column back to the camelCase property clients send */
const toPropertyName = (column?: string): string | undefined =>
  column?.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

const CONSTRAINT_MESSAGES = new Map<string, string>(
  [
    ...Object.values(CHECK_CONSTRAINTS),
    ...Object.values(UNIQUE_CONSTRAINTS),
  ].map(({ name, message }) => [name, message]),
);

export class DatabaseException extends HttpException {
  constructor(
    status: HttpStatus,
    message: string,
    readonly code?: string,
  ) {
    super(message, status);
  }

  static fromQueryError(error: QueryFailedError): DatabaseException {
    const {
      code,
      detail,
      constraint,
      column: nullColumn,
    } = error.driverError as Partial<DatabaseError>;
    const column = detail?.match(DETAIL_COLUMN)?.[1]?.replaceAll('"', '');

    switch (code) {
      case PG_ERROR_CODE.UNIQUE_VIOLATION:
        return new DatabaseException(
          HttpStatus.CONFLICT,
          (constraint && CONSTRAINT_MESSAGES.get(constraint)) ??
            `${column ?? 'Value'} already exists`,
          code,
        );

      case PG_ERROR_CODE.FOREIGN_KEY_VIOLATION:
        return new DatabaseException(
          HttpStatus.CONFLICT,
          'Related record is missing or still in use',
          code,
        );

      /* a business rule enforced by the DB itself, so it holds even under concurrent writes */
      case PG_ERROR_CODE.CHECK_VIOLATION:
        return new DatabaseException(
          HttpStatus.BAD_REQUEST,
          (constraint && CONSTRAINT_MESSAGES.get(constraint)) ??
            'Invalid value',
          code,
        );

      /* e.g. PATCH { "title": null }: optional in the DTO, but the column is required */
      case PG_ERROR_CODE.NOT_NULL_VIOLATION:
        return new DatabaseException(
          HttpStatus.BAD_REQUEST,
          `${toPropertyName(nullColumn) ?? 'Value'} must not be null`,
          code,
        );

      /* e.g. a bid line total (unit price × quantity) beyond numeric(12,2) */
      case PG_ERROR_CODE.NUMERIC_OUT_OF_RANGE:
        return new DatabaseException(
          HttpStatus.BAD_REQUEST,
          'Amount is too large',
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
