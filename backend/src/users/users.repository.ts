import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { User } from './entities/user.entity';

export type NewUser = Pick<User, 'name' | 'email' | 'passwordHash' | 'role'>;

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  /* ON CONFLICT DO NOTHING: a repeated insert for an existing email is a no-op instead of an error */
  async insertIfAbsent(data: NewUser): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(data)
      .orIgnore()
      .execute();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email });
  }

  findByEmailWithHash(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        vendorId: true,
        createdAt: true,
        passwordHash: true,
      },
    });
  }

  findByVendorId(vendorId: string): Promise<User | null> {
    return this.repo.findOneBy({ vendorId });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }
}
