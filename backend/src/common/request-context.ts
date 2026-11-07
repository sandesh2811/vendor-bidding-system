import { AsyncLocalStorage } from 'node:async_hooks';
import type { UserRole } from './constants';

export interface RequestContext {
  requestId: string;
  userId?: string;
  role?: UserRole;
  vendorId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export const getRequestContext = (): RequestContext | undefined =>
  requestContext.getStore();
