import {
  applyDecorators,
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ACCESS_TOKEN_COOKIE,
  ROLES_KEY,
  type UserRole,
} from '../common/constants';
import type { User } from '../users/user.entity';
import { AuthGuard } from './auth.guard';
import type { AuthedRequest } from './user-context.middleware';

/* @Auth() = any logged-in user; @Auth(UserRole.Admin) = admins only */
export const Auth = (
  ...roles: UserRole[]
): ReturnType<typeof applyDecorators> =>
  applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(AuthGuard),
    ApiCookieAuth(ACCESS_TOKEN_COOKIE),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Not logged in' }),
    ApiForbiddenResponse({ description: 'Wrong role or inactive vendor' }),
  );

/* the user attached by UserContextMiddleware (with `vendor` for vendor users); use behind @Auth() */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const { user } = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!user) throw new UnauthorizedException();

    return user;
  },
);
