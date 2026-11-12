import { rateLimit, type RateLimitRequestHandler } from 'express-rate-limit';
import { RATE_LIMIT } from './constants';

/* same body shape as Nest's HttpException responses, so the frontend reads `message` as usual */
const tooManyRequests = (message: string) => ({
  statusCode: 429,
  message,
  error: 'Too Many Requests',
});

/**
 * Fixed-window limiters, counted per client IP (IPv6 grouped by /56, the library default) in
 * process memory. Behind a reverse proxy, set TRUST_PROXY so `req.ip` is the client, not the proxy.
 * Several API instances would each count separately; give them a shared store (e.g. Redis) then.
 */

/* every API request, before authentication, so floods of 401s are counted too */
export const apiRateLimit = (): RateLimitRequestHandler =>
  rateLimit({
    windowMs: RATE_LIMIT.API.WINDOW_MS,
    limit: RATE_LIMIT.API.LIMIT,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: tooManyRequests('Too many requests. Try again in a minute'),
  });

/* failed logins only: stops password guessing and bcrypt CPU exhaustion; a successful login doesn't count */
export const loginRateLimit = (): RateLimitRequestHandler =>
  rateLimit({
    windowMs: RATE_LIMIT.LOGIN.WINDOW_MS,
    limit: RATE_LIMIT.LOGIN.LIMIT,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: tooManyRequests(
      'Too many failed login attempts. Try again in 15 minutes',
    ),
  });
