import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { requestContext } from './request-context';

export function requestIdMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  requestContext.run({ requestId: randomUUID() }, next);
}
