import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { EnvironmentVariables } from '../config/env.validation';
import type { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import type { LoginDto } from './dto/login.dto';
import { SessionsRepository } from './sessions.repository';

interface JwtPayload {
  sub: string;
  /* session id; tokens issued before sessions existed have none and are rejected */
  jti?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly sessions: SessionsRepository,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  /**
   * Verifies credentials, opens a session and issues its JWT.
   *
   * @remarks
   * - Unknown email and wrong password produce the same error (but not the same response time, see README).
   * - The JWT's `jti` is the new session's id, and both expire at the same moment.
   * - Also prunes the user's expired and revoked sessions.
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

    const ttlSeconds = this.config.get('JWT_EXPIRES_IN_SECONDS', {
      infer: true,
    });
    const session = await this.sessions.create(
      user.id,
      new Date(Date.now() + ttlSeconds * 1000),
    );
    const token = await this.jwt.signAsync(
      { sub: user.id } satisfies JwtPayload,
      { jwtid: session.id },
    );

    this.logger.log({
      method: 'login',
      message: 'Login succeeded',
      userId: user.id,
      role: user.role,
      sessionId: session.id,
    });

    return { user, token };
  }

  /**
   * Resolves a session token to its user.
   *
   * @remarks
   * - Never throws: an invalid token, a revoked or expired session, or a deleted user returns null, and UserContextMiddleware answers 401.
   * - The session and its user are loaded in one query.
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
    const payload = await this.verify(token);

    if (!payload?.jti) {
      this.logger.debug({
        method: 'resolveSession',
        message: 'Invalid or expired token',
      });
      return null;
    }

    const user = await this.sessions.findActiveUser(payload.jti, payload.sub);

    if (!user) {
      this.logger.debug({
        method: 'resolveSession',
        message: 'Session revoked, expired or user gone',
        sessionId: payload.jti,
      });
      return null;
    }

    return user;
  }

  /**
   * Revokes the token's session, so the JWT stops working even if someone copied it.
   *
   * @remarks
   * - Never throws: no token, an invalid token or an already revoked session changes nothing, so logout is idempotent.
   *
   * @param {string | undefined} token - JWT from the session cookie or the Bearer header
   * @returns {Promise<void>}
   *
   * @example
   * ```ts
   * await authService.logout(req.cookies.access_token);
   * ```
   */
  async logout(token: string | undefined): Promise<void> {
    const payload = token ? await this.verify(token) : null;
    const revoked = payload?.jti
      ? await this.sessions.revoke(payload.jti)
      : false;

    this.logger.log({
      method: 'logout',
      message: revoked ? 'Session revoked' : 'No active session to revoke',
      sessionId: payload?.jti,
    });
  }

  /* signature and expiry check; null instead of an error */
  private verify(token: string): Promise<JwtPayload | null> {
    return this.jwt.verifyAsync<JwtPayload>(token).catch(() => null);
  }
}
