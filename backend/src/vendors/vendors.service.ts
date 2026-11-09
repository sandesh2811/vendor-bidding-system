import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../common/constants';
import {
  type Paginated,
  toPaginated,
  toSkipTake,
} from '../common/pagination.helper';
import { UsersService } from '../users/users.service';
import type { CreateVendorDto } from './dto/create-vendor.dto';
import type { ListVendorsQueryDto } from './dto/list-vendors.dto';
import type { UpdateVendorDto } from './dto/update-vendor.dto';
import type { VendorSummaryDto } from './dto/vendor-summary.dto';
import type { Vendor } from './entities/vendor.entity';
import { VendorsRepository } from './vendors.repository';

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(
    private readonly vendors: VendorsRepository,
    private readonly users: UsersService,
  ) {}

  /**
   * Counts what needs the vendor's attention, for the portal home.
   *
   * @param {string} vendorId - The logged-in vendor (from the session, never the request)
   * @returns {Promise<VendorSummaryDto>} New requests (open, no bid, not declined), bids in progress, upcoming (confirmed) bookings
   *
   * @example
   * ```ts
   * const { newRequests } = await vendorsService.summary(vendor.id);
   * ```
   */
  async summary(vendorId: string): Promise<VendorSummaryDto> {
    const summary = await this.vendors.summary(vendorId);

    this.logger.debug({
      method: 'summary',
      message: 'Vendor summary',
      summary,
    });

    return summary;
  }

  /**
   * Creates a vendor and its one-to-one portal login. Idempotent on phone.
   *
   * @remarks
   * - The vendor and its user are written in one transaction, so no orphan vendor is ever left behind.
   * - A repeat with the same phone and login email returns the existing vendor and creates nothing.
   *
   * @param {CreateVendorDto} dto - Vendor details plus `login` (name, email, password)
   * @returns {Promise<Vendor>} The created vendor, or the existing one on a repeat
   * @throws {ConflictException} Throws a `ConflictException` with HTTP status code 409 (Conflict) if the phone belongs to a vendor with a different login email
   * @throws {DatabaseException} Throws a `DatabaseException` with HTTP status code 409 (Conflict) if the login email is already used by another user
   *
   * @example
   * ```ts
   * await vendorsService.create({ name: 'Everest Sound', category: VendorCategory.Sound, phone: '9800000003', login: { name: 'Everest Sound', email: 'sound@vendor.test', password: 'Vendor@12345' } });
   * ```
   */
  async create({ login, ...details }: CreateVendorDto): Promise<Vendor> {
    const passwordHash = await this.users.hashPassword(login.password);

    const created = await this.vendors.createWithLogin(details, {
      name: login.name,
      email: login.email,
      passwordHash,
      role: UserRole.Vendor,
    });

    if (created) {
      this.logger.log({
        method: 'create',
        message: 'Vendor and login created',
        vendorId: created.id,
        category: created.category,
      });
      return created;
    }

    /* phone already taken: a repeat of the same request, or a different vendor using that phone */
    const existing = await this.vendors.findByPhone(details.phone);
    const existingLogin =
      existing && (await this.users.findByVendorId(existing.id));

    if (!existing || existingLogin?.email !== login.email) {
      this.logger.warn({
        method: 'create',
        message: 'Phone belongs to another vendor',
        vendorId: existing?.id,
      });
      throw new ConflictException('Phone already exists');
    }

    this.logger.log({
      method: 'create',
      message: 'Vendor already exists, returning it',
      vendorId: existing.id,
    });

    return existing;
  }

  /**
   * Lists vendors with pagination and optional filters.
   *
   * @param {ListVendorsQueryDto} query - page, limit, and optional search, category and isActive
   * @returns {Promise<Paginated<Vendor>>} One page of vendors, newest first, plus pagination meta
   *
   * @example
   * ```ts
   * const { items, meta } = await vendorsService.findAll({ page: 1, limit: 20, category: VendorCategory.Decor });
   * ```
   */
  async findAll({
    search,
    category,
    isActive,
    ...page
  }: ListVendorsQueryDto): Promise<Paginated<Vendor>> {
    const [items, total] = await this.vendors.findAndCount({
      ...toSkipTake(page),
      search,
      category,
      isActive,
    });

    this.logger.debug({
      method: 'findAll',
      message: 'Listed vendors',
      ...page,
      total,
      category,
      isActive,
      searched: Boolean(search),
    });

    return toPaginated(items, total, page);
  }

  /**
   * Gets one vendor by id.
   *
   * @param {string} id - Vendor id
   * @returns {Promise<Vendor>} The vendor
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if no vendor has this id
   *
   * @example
   * ```ts
   * const vendor = await vendorsService.findById(id);
   * ```
   */
  async findById(id: string): Promise<Vendor> {
    const vendor = await this.vendors.findById(id);

    if (!vendor) {
      this.logger.warn({
        method: 'findById',
        message: 'Vendor not found',
        vendorId: id,
      });
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  /**
   * Gets a vendor only if it exists and is active, for the vendor portal session check.
   *
   * @param {string | null} id - The vendor id from the session user, null for non-vendor users
   * @returns {Promise<Vendor | null>} The active vendor, or null if missing, deactivated or no id
   *
   * @example
   * ```ts
   * const vendor = await vendorsService.findActiveById(user.vendorId);
   * ```
   */
  async findActiveById(id: string | null): Promise<Vendor | null> {
    const vendor = id ? await this.vendors.findActiveById(id) : null;

    if (!vendor)
      this.logger.warn({
        method: 'findActiveById',
        message: 'No active vendor for vendor user',
        vendorId: id,
      });

    return vendor;
  }

  /**
   * Updates the given vendor fields in a single statement.
   *
   * @remarks
   * - No read before the write: one `UPDATE ... RETURNING`, and zero affected rows means 404.
   * - `isActive: false` deactivates the vendor, and its login stops working on the next request.
   * - An empty body changes nothing and returns the current vendor.
   *
   * @param {string} id - Vendor id
   * @param {UpdateVendorDto} dto - Fields to change
   * @returns {Promise<Vendor>} The updated vendor
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if no vendor has this id
   *
   * @example
   * ```ts
   * await vendorsService.update(id, { isActive: false });
   * ```
   */
  async update(id: string, dto: UpdateVendorDto): Promise<Vendor> {
    /* DTO fields that weren't sent exist as undefined keys; drop them so they don't overwrite stored values */
    const changes = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );

    if (Object.keys(changes).length === 0) return this.findById(id);

    const vendor = await this.vendors.updateById(id, changes);

    if (!vendor) {
      this.logger.warn({
        method: 'update',
        message: 'Vendor not found',
        vendorId: id,
      });
      throw new NotFoundException('Vendor not found');
    }

    this.logger.log({
      method: 'update',
      message: 'Vendor updated',
      vendorId: id,
      fields: Object.keys(changes).join(','),
      isActive: vendor.isActive,
    });

    return vendor;
  }
}
