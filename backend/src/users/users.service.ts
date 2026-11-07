import { ConflictException, Injectable, Logger } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { BCRYPT_COST, UserRole } from '../common/constants';
import type { User } from './user.entity';
import { UsersRepository } from './users.repository';

export interface NewAdmin {
  name: string;
  email: string;
  password: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly users: UsersRepository) {}

  /**
   * Hashes a plain-text password with bcrypt.
   *
   * @param {string} password - Plain-text password
   * @returns {Promise<string>} The bcrypt hash to store
   *
   * @example
   * ```ts
   * const passwordHash = await usersService.hashPassword('Secret@123');
   * ```
   */
  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
  }

  /**
   * Checks a password against a stored hash.
   *
   * @param {string} password - Plain-text password from the request
   * @param {string | undefined} passwordHash - Stored hash, or undefined when the user was not found
   * @returns {Promise<boolean>} True only if a hash exists and matches
   *
   * @example
   * ```ts
   * const valid = await usersService.verifyPassword(dto.password, user?.passwordHash);
   * ```
   */
  async verifyPassword(
    password: string,
    passwordHash: string | undefined,
  ): Promise<boolean> {
    if (!passwordHash) return false;

    return bcrypt.compare(password, passwordHash);
  }

  /**
   * Creates an admin user (no vendor relation). Idempotent on email.
   *
   * @remarks
   * - Uses insert-or-ignore on the unique email, so repeating the call returns the existing admin instead of failing.
   *
   * @param {NewAdmin} admin - Name, email and plain-text password
   * @returns {Promise<User>} The created or already existing admin
   * @throws {ConflictException} Throws a `ConflictException` with HTTP status code 409 (Conflict) if the email belongs to a non-admin user
   *
   * @example
   * ```ts
   * await usersService.createAdmin({ name: 'Admin', email: 'admin@meroevent.com', password: 'Admin@12345' });
   * ```
   */
  async createAdmin({ name, email, password }: NewAdmin): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await this.hashPassword(password);

    await this.users.insertIfAbsent({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: UserRole.Admin,
    });

    const admin = await this.users.findByEmail(normalizedEmail);

    if (admin?.role !== UserRole.Admin) {
      this.logger.warn({
        method: 'createAdmin',
        message: 'Email belongs to a non-admin user',
      });
      throw new ConflictException('Email is already used by a non-admin user');
    }

    this.logger.log({
      method: 'createAdmin',
      message: 'Admin ensured',
      userId: admin.id,
    });

    return admin;
  }

  /**
   * Finds a user by email, including the password hash, for login.
   *
   * @param {string} email - Normalized (lowercase) email
   * @returns {Promise<User | null>} The user with `passwordHash`, or null if not found
   *
   * @example
   * ```ts
   * const user = await usersService.findByEmailWithHash('decor@vendor.test');
   * ```
   */
  async findByEmailWithHash(email: string): Promise<User | null> {
    const user = await this.users.findByEmailWithHash(email);

    this.logger.debug({
      method: 'findByEmailWithHash',
      message: 'Looked up login user',
      found: Boolean(user),
    });

    return user;
  }

  /**
   * Finds the portal login linked to a vendor.
   *
   * @param {string} vendorId - Vendor id
   * @returns {Promise<User | null>} The vendor's user, or null if it has none
   *
   * @example
   * ```ts
   * const login = await usersService.findByVendorId(vendor.id);
   * ```
   */
  async findByVendorId(vendorId: string): Promise<User | null> {
    const user = await this.users.findByVendorId(vendorId);

    this.logger.debug({
      method: 'findByVendorId',
      message: 'Looked up vendor login',
      vendorId,
      found: Boolean(user),
    });

    return user;
  }

  /**
   * Loads the user behind a session token.
   *
   * @param {string} id - User id from the JWT `sub`
   * @returns {Promise<User | null>} The user, or null if it no longer exists
   *
   * @example
   * ```ts
   * const user = await usersService.findSessionUser(payload.sub);
   * ```
   */
  async findSessionUser(id: string): Promise<User | null> {
    const user = await this.users.findById(id);

    this.logger.debug({
      method: 'findSessionUser',
      message: 'Loaded session user',
      userId: id,
      found: Boolean(user),
    });

    return user;
  }
}
