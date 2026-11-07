import {
  Injectable,
  type NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ACCESS_TOKEN_COOKIE } from '../common/constants';
import { getRequestContext } from '../common/request-context';
import type { User } from '../users/user.entity';
import { AuthService } from './auth.service';

export interface AuthedRequest extends Request {
  user?: User;
}

/* Cookie for the browser portals, Bearer header for other clients */
const extractToken = (req: Request): string | undefined => {
  const cookie: unknown = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (typeof cookie === 'string' && cookie) return cookie;

  const [scheme, token] = req.header('authorization')?.split(' ') ?? [];

  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
};

/* Blocks every request without a valid session (login/logout are excluded in AppModule), then attaches the user */
@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  constructor(private readonly auth: AuthService) {}

  async use(
    req: AuthedRequest,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const token = extractToken(req);
    const user = token ? await this.auth.resolveSession(token) : null;

    if (!user) throw new UnauthorizedException();

    req.user = user;
    Object.assign(getRequestContext() ?? {}, {
      userId: user.id,
      role: user.role,
    });

    next();
  }
}
