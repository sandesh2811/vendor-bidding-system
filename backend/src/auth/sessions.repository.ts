import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Raw, type Repository } from 'typeorm';
import type { User } from '../users/entities/user.entity';
import { Session } from './entities/session.entity';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectRepository(Session) private readonly repo: Repository<Session>,
  ) {}

  /* also prunes this user's expired and revoked sessions, so the table only holds live logins plus recent dead ones */
  async create(userId: string, expiresAt: Date): Promise<Session> {
    await this.repo.delete([
      { userId, expiresAt: Raw((column) => `${column} <= now()`) },
      { userId, revokedAt: Not(IsNull()) },
    ]);

    return this.repo.save(this.repo.create({ userId, expiresAt }));
  }

  /* the session's user, in one query; null if the session is revoked, expired (by the DB clock) or doesn't belong to userId */
  async findActiveUser(id: string, userId: string): Promise<User | null> {
    const session = await this.repo.findOne({
      where: {
        id,
        userId,
        revokedAt: IsNull(),
        expiresAt: Raw((column) => `${column} > now()`),
      },
      relations: { user: true },
    });

    return session?.user ?? null;
  }

  /* conditional: revoking twice changes nothing; false when nothing was revoked */
  async revoke(id: string): Promise<boolean> {
    const { affected } = await this.repo.update(
      { id, revokedAt: IsNull() },
      { revokedAt: () => 'now()' },
    );
    return Boolean(affected);
  }
}
