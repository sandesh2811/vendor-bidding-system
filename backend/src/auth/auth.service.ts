import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import type { LoginDto } from './dto/login.dto';

interface JwtPayload {
  sub: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Verifies credentials and issues a session JWT.
   *
   * @remarks
   * - Unknown email and wrong password produce the same error.
   *
   * @param {LoginDto} dto - Email and password
   * @returns {Promise<{ user: User; token: string }>} The user and the signed JWT for the session cookie
   * @throws {UnauthorizedException} Throws an `UnauthorizedException` with HTTP status code 401 (Unauthorized) if the email or password is wrong
   *
   * @example
   * ```ts
   * const { user, token } = await authService.login({ email: 'admin@meroevent.com', password: 'Admin@12345' });
   * ```
   */
  async login({
    email,
    password,
  }: LoginDto): Promise<{ user: User; token: string }> {
    const user = await this.users.findByEmailWithHash(email);
    const valid = await this.users.verifyPassword(password, user?.passwordHash);

    if (!user || !valid) {
      this.logger.warn({
        method: 'login',
        message: 'Login failed',
        userFound: Boolean(user),
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.jwt.signAsync({
      sub: user.id,
    } satisfies JwtPayload);

    this.logger.log({
      method: 'login',
      message: 'Login succeeded',
      userId: user.id,
      role: user.role,
    });

    return { user, token };
  }

  /**
   * Resolves a session token to its user.
   *
   * @remarks
   * - Never throws: an invalid token or a deleted user returns null, and UserContextMiddleware answers 401.
   * - Vendor checks happen afterwards in VendorContextMiddleware.
   *
   * @param {string} token - JWT from the session cookie or the Bearer header
   * @returns {Promise<User | null>} The user, or null if the session is not valid
   *
   * @example
   * ```ts
   * const user = await authService.resolveSession(req.cookies.access_token);
   * ```
   */
  async resolveSession(token: string): Promise<User | null> {
    const payload = await this.jwt
      .verifyAsync<JwtPayload>(token)
      .catch(() => null);

    if (!payload) {
      this.logger.debug({
        method: 'resolveSession',
        message: 'Invalid or expired token',
      });
      return null;
    }

    const user = await this.users.findSessionUser(payload.sub);

    if (!user) {
      this.logger.warn({
        method: 'resolveSession',
        message: 'Session user no longer exists',
        userId: payload.sub,
      });
      return null;
    }

    return user;
  }
}
