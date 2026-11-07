export const API_PREFIX = 'api';
export const API_DEFAULT_VERSION = '1';
export const SWAGGER_PATH = 'api/docs';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const ROLES_KEY = 'roles';

export const BCRYPT_COST = 12;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const EMAIL_MAX_LENGTH = 254;
export const NAME_MAX_LENGTH = 100;
export const TEXT_MAX_LENGTH = 255;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const PG_ERROR_CODE = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
} as const;

export enum UserRole {
  Admin = 'admin',
  Vendor = 'vendor',
}

export enum VendorCategory {
  Catering = 'catering',
  Decor = 'decor',
  Sound = 'sound',
  Venue = 'venue',
  Photo = 'photo',
  Other = 'other',
}
