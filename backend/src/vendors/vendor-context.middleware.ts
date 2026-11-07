import {
  ForbiddenException,
  Injectable,
  type NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from '../auth/user-context.middleware';
import { UserRole } from '../common/constants';
import { getRequestContext } from '../common/request-context';
import { VendorsService } from './vendors.service';

/* Runs after UserContextMiddleware: a vendor user passes only with an active vendor, which is attached as user.vendor */
@Injectable()
export class VendorContextMiddleware implements NestMiddleware {
  constructor(private readonly vendors: VendorsService) {}

  async use(
    req: AuthedRequest,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { user } = req;
    if (user?.role !== UserRole.Vendor) return next();

    const vendor = await this.vendors.findActiveById(user.vendorId);

    if (!vendor) throw new ForbiddenException('Vendor account is inactive');

    user.vendor = vendor;
    Object.assign(getRequestContext() ?? {}, { vendorId: vendor.id });

    next();
  }
}
