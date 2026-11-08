import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type FindOptionsWhere, ILike, type Repository } from 'typeorm';
import type { VendorCategory } from '../common/constants';
import { User } from '../users/entities/user.entity';
import type { NewUser } from '../users/users.repository';
import { Vendor } from './entities/vendor.entity';

export type NewVendor = Omit<Vendor, 'id' | 'isActive' | 'createdAt'>;
export type VendorChanges = Partial<Omit<Vendor, 'id' | 'createdAt'>>;

export interface VendorFilter {
  skip: number;
  take: number;
  search?: string;
  category?: VendorCategory;
  isActive?: boolean;
}

@Injectable()
export class VendorsRepository {
  constructor(
    @InjectRepository(Vendor) private readonly repo: Repository<Vendor>,
  ) {}

  /* one transaction; ON CONFLICT DO NOTHING on phone returns null instead of creating a duplicate vendor */
  createWithLogin(
    vendor: Partial<NewVendor>,
    login: NewUser,
  ): Promise<Vendor | null> {
    return this.repo.manager.transaction(async (manager) => {
      const result = await manager
        .createQueryBuilder()
        .insert()
        .into(Vendor)
        .values(vendor)
        .orIgnore()
        .returning(this.returningColumns())
        .execute();

      const [row] = result.raw as Vendor[];
      if (!row) return null;

      await manager.save(manager.create(User, { ...login, vendorId: row.id }));

      return manager.create(Vendor, row);
    });
  }

  /* RETURNING * gives snake_case keys; aliasing back to property names lets create() map the row */
  private returningColumns(): string {
    return this.repo.metadata.columns
      .map((column) => `"${column.databaseName}" AS "${column.propertyName}"`)
      .join(', ');
  }

  findByPhone(phone: string): Promise<Vendor | null> {
    return this.repo.findOneBy({ phone });
  }

  findActiveById(id: string): Promise<Vendor | null> {
    return this.repo.findOneBy({ id, isActive: true });
  }

  findById(id: string): Promise<Vendor | null> {
    return this.repo.findOneBy({ id });
  }

  findAndCount({
    skip,
    take,
    search,
    category,
    isActive,
  }: VendorFilter): Promise<[Vendor[], number]> {
    /* TypeORM 1.x throws on undefined where values, so only set filters are added */
    const base: FindOptionsWhere<Vendor> = {};
    if (category) base.category = category;
    if (isActive !== undefined) base.isActive = isActive;

    const pattern = search && ILike(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
    const where = pattern
      ? [
          { ...base, name: pattern },
          { ...base, contactName: pattern },
        ]
      : base;

    return this.repo.findAndCount({
      where,
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  /* single UPDATE ... RETURNING: no read-then-write window; null means no row matched */
  async updateById(id: string, changes: VendorChanges): Promise<Vendor | null> {
    const result = await this.repo
      .createQueryBuilder()
      .update(Vendor)
      .set(changes)
      .where('id = :id', { id })
      .returning(this.returningColumns())
      .execute();

    const [row] = result.raw as Vendor[];

    return row ? this.repo.create(row) : null;
  }
}
