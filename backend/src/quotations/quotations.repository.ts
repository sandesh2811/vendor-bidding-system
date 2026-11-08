import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  type EntityManager,
  type FindOptionsWhere,
  ILike,
  type Repository,
} from 'typeorm';
import type { EventType } from '../common/constants';
import { QuotationItem } from './entities/quotation-item.entity';
import { QuotationPhoto } from './entities/quotation-photo.entity';
import { QuotationRecipient } from './entities/quotation-recipient.entity';
import { Quotation } from './entities/quotation.entity';

export type NewQuotation = Pick<
  Quotation,
  'title' | 'eventType' | 'eventDate' | 'location' | 'createdById'
> &
  Partial<Pick<Quotation, 'guestCount' | 'responseDeadline' | 'description'>>;
export type QuotationChanges = Partial<
  Pick<
    Quotation,
    | 'title'
    | 'eventType'
    | 'eventDate'
    | 'location'
    | 'guestCount'
    | 'responseDeadline'
    | 'description'
  >
>;
export type NewItem = Pick<QuotationItem, 'name' | 'quantity'> &
  Partial<Pick<QuotationItem, 'unit' | 'notes'>>;
export type ItemChange = NewItem & { id?: string };
export type NewPhoto = Pick<
  QuotationPhoto,
  'originalName' | 'mimeType' | 'size' | 'sha256' | 'storageKey'
>;

export interface QuotationFilter {
  skip: number;
  take: number;
  search?: string;
  eventType?: EventType;
}

/* thrown inside a transaction to roll it back; the service maps each to a 400 */
export class UnknownVendorsError extends Error {
  constructor(readonly vendorIds: string[]) {
    super('Vendors not found or inactive');
  }
}
export class UnknownItemError extends Error {
  constructor(readonly itemId: string) {
    super('Item does not belong to this quotation');
  }
}
export class PhotoLimitError extends Error {
  constructor(readonly limit: number) {
    super('Photo limit reached');
  }
}

@Injectable()
export class QuotationsRepository {
  constructor(
    @InjectRepository(Quotation) private readonly repo: Repository<Quotation>,
    @InjectRepository(QuotationRecipient)
    private readonly recipients: Repository<QuotationRecipient>,
    @InjectRepository(QuotationPhoto)
    private readonly photos: Repository<QuotationPhoto>,
  ) {}

  /* one transaction; ON CONFLICT DO NOTHING on (title, event_date, location) returns null for a repeated create */
  createWithItems(
    quotation: NewQuotation,
    items: NewItem[],
    vendorIds: string[],
  ): Promise<Quotation | null> {
    return this.repo.manager.transaction(async (manager) => {
      const result = await manager
        .createQueryBuilder()
        .insert()
        .into(Quotation)
        .values(quotation)
        .orIgnore()
        .returning(this.returningColumns())
        .execute();

      const [row] = result.raw as Quotation[];
      if (!row) return null;

      await this.insertItems(manager, row.id, items, 0);
      if (vendorIds.length)
        await this.insertRecipients(manager, row.id, vendorIds);

      return manager.create(Quotation, row);
    });
  }

  /**
   * Edits fields and/or reconciles the item list under a row lock, so concurrent edits serialize
   * instead of interleaving their item diffs. Returns false if the quotation doesn't exist.
   */
  updateWithItems(
    id: string,
    changes: QuotationChanges,
    items: ItemChange[] | undefined,
  ): Promise<boolean> {
    return this.repo.manager.transaction(async (manager) => {
      if (!(await this.lock(manager, id, 'pessimistic_write'))) return false;

      /* bumps updated_at even for an items-only edit */
      await manager
        .createQueryBuilder()
        .update(Quotation)
        .set({ ...changes, updatedAt: () => 'now()' })
        .where('id = :id', { id })
        .execute();

      if (items) await this.reconcileItems(manager, id, items);

      return true;
    });
  }

  /**
   * Sends the quotation to more vendors. Idempotent: vendors already on it are skipped by the
   * unique (quotation_id, vendor_id). Returns null if the quotation doesn't exist.
   */
  addRecipients(
    quotationId: string,
    vendorIds: string[],
  ): Promise<string[] | null> {
    return this.repo.manager.transaction(async (manager) => {
      if (!(await this.lock(manager, quotationId, 'pessimistic_read')))
        return null;

      return this.insertRecipients(manager, quotationId, vendorIds);
    });
  }

  /**
   * Adds photos under a row lock: the count check and the inserts can't race another upload.
   * Photos already on the quotation (same sha256) are skipped; `persist` runs only for new ones,
   * before their rows are inserted. Returns null if the quotation doesn't exist.
   */
  addPhotos(
    quotationId: string,
    candidates: NewPhoto[],
    limit: number,
    persist: (photos: NewPhoto[]) => Promise<void>,
  ): Promise<QuotationPhoto[] | null> {
    return this.repo.manager.transaction(async (manager) => {
      if (!(await this.lock(manager, quotationId, 'pessimistic_write')))
        return null;

      const existing = await manager.find(QuotationPhoto, {
        where: { quotationId },
        select: { sha256: true },
      });
      /* skip images already on the quotation and duplicates within this batch */
      const known = new Set(existing.map((photo) => photo.sha256));
      const fresh: NewPhoto[] = [];
      for (const photo of candidates) {
        if (known.has(photo.sha256)) continue;
        known.add(photo.sha256);
        fresh.push(photo);
      }

      if (existing.length + fresh.length > limit)
        throw new PhotoLimitError(limit);

      if (fresh.length) {
        await persist(fresh);
        await manager
          .createQueryBuilder()
          .insert()
          .into(QuotationPhoto)
          .values(fresh.map((photo) => ({ ...photo, quotationId })))
          .orIgnore()
          .execute();
      }

      return manager.find(QuotationPhoto, {
        where: candidates.map(({ sha256 }) => ({ quotationId, sha256 })),
        order: { createdAt: 'ASC', id: 'ASC' },
      });
    });
  }

  /* row delete and file removal happen under the same lock an upload takes, so a concurrent
     re-upload of the same image can't have its file deleted underneath it */
  deletePhoto(
    quotationId: string,
    photoId: string,
    removeFile: (storageKey: string) => Promise<void>,
  ): Promise<boolean> {
    return this.repo.manager.transaction(async (manager) => {
      if (!(await this.lock(manager, quotationId, 'pessimistic_write')))
        return false;

      const result = await manager
        .createQueryBuilder()
        .delete()
        .from(QuotationPhoto)
        .where('id = :photoId AND quotation_id = :quotationId', {
          photoId,
          quotationId,
        })
        .returning('"storage_key" AS "storageKey"')
        .execute();

      const [row] = result.raw as Pick<QuotationPhoto, 'storageKey'>[];
      if (!row) return false;

      await removeFile(row.storageKey);

      return true;
    });
  }

  findIdByEvent({
    title,
    eventDate,
    location,
  }: Pick<
    Quotation,
    'title' | 'eventDate' | 'location'
  >): Promise<Quotation | null> {
    return this.repo.findOne({
      where: { title, eventDate, location },
      select: { id: true },
    });
  }

  findAndCount({
    skip,
    take,
    search,
    eventType,
  }: QuotationFilter): Promise<[Quotation[], number]> {
    /* TypeORM 1.x throws on undefined where values, so only set filters are added */
    const base: FindOptionsWhere<Quotation> = {};
    if (eventType) base.eventType = eventType;

    const pattern = search && ILike(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
    const where = pattern
      ? [
          { ...base, title: pattern },
          { ...base, location: pattern },
        ]
      : base;

    return this.repo.findAndCount({
      where,
      relations: { recipients: { vendor: true } },
      skip,
      take,
      order: { createdAt: 'DESC', id: 'DESC', recipients: { sentAt: 'DESC' } },
    });
  }

  findDetail(id: string): Promise<Quotation | null> {
    return this.repo.findOne({
      where: { id },
      relations: { items: true, photos: true, recipients: { vendor: true } },
      order: {
        items: { position: 'ASC' },
        photos: { createdAt: 'ASC' },
        recipients: { sentAt: 'DESC' },
      },
    });
  }

  /* vendor portal reads always start from the vendor's own recipient rows: that is the isolation boundary */
  findReceivedAndCount(
    vendorId: string,
    skip: number,
    take: number,
  ): Promise<[QuotationRecipient[], number]> {
    return this.recipients.findAndCount({
      where: { vendorId },
      relations: { quotation: true },
      skip,
      take,
      order: { sentAt: 'DESC', id: 'DESC' },
    });
  }

  findReceived(
    vendorId: string,
    quotationId: string,
  ): Promise<QuotationRecipient | null> {
    return this.recipients.findOne({
      where: { vendorId, quotationId },
      relations: { quotation: { items: true, photos: true } },
      order: {
        quotation: { items: { position: 'ASC' }, photos: { createdAt: 'ASC' } },
      },
    });
  }

  findPhoto(
    quotationId: string,
    photoId: string,
  ): Promise<QuotationPhoto | null> {
    return this.photos.findOneBy({ id: photoId, quotationId });
  }

  /* the photo only if the quotation was sent to this vendor */
  findReceivedPhoto(
    vendorId: string,
    quotationId: string,
    photoId: string,
  ): Promise<QuotationPhoto | null> {
    return this.photos
      .createQueryBuilder('photo')
      .innerJoin(
        QuotationRecipient,
        'recipient',
        'recipient.quotation_id = photo.quotation_id AND recipient.vendor_id = :vendorId',
        { vendorId },
      )
      .where('photo.id = :photoId AND photo.quotation_id = :quotationId', {
        photoId,
        quotationId,
      })
      .getOne();
  }

  /* SELECT ... FOR UPDATE / FOR SHARE on the quotation row; false if it doesn't exist */
  private async lock(
    manager: EntityManager,
    id: string,
    mode: 'pessimistic_write' | 'pessimistic_read',
  ): Promise<boolean> {
    const row = await manager.findOne(Quotation, {
      where: { id },
      select: { id: true },
      lock: { mode },
    });

    return row !== null;
  }

  private async insertItems(
    manager: EntityManager,
    quotationId: string,
    items: NewItem[],
    offset: number,
  ): Promise<void> {
    if (!items.length) return;

    await manager.insert(
      QuotationItem,
      items.map((item, index) => ({
        ...item,
        quotationId,
        position: offset + index,
      })),
    );
  }

  /* listed ids are updated in place, new entries inserted, anything not listed deleted */
  private async reconcileItems(
    manager: EntityManager,
    quotationId: string,
    items: ItemChange[],
  ): Promise<void> {
    const keptIds = items.flatMap((item) => (item.id ? [item.id] : []));

    await manager
      .createQueryBuilder()
      .delete()
      .from(QuotationItem)
      .where('quotation_id = :quotationId', { quotationId })
      .andWhere(keptIds.length ? 'NOT (id = ANY(:keptIds))' : 'TRUE', {
        keptIds,
      })
      .execute();

    const added: { item: NewItem; position: number }[] = [];

    for (const [position, { id, ...item }] of items.entries()) {
      if (!id) {
        added.push({ item, position });
        continue;
      }

      /* scoped by quotation_id: an item id from another quotation matches nothing */
      const result = await manager
        .createQueryBuilder()
        .update(QuotationItem)
        .set({ ...item, position })
        .where('id = :id AND quotation_id = :quotationId', { id, quotationId })
        .execute();

      if (!result.affected) throw new UnknownItemError(id);
    }

    if (added.length)
      await manager.insert(
        QuotationItem,
        added.map(({ item, position }) => ({ ...item, quotationId, position })),
      );
  }

  /**
   * INSERT ... SELECT from active vendors only, then checks every requested vendor is now a
   * recipient (just added, or already was). Throws UnknownVendorsError to roll back otherwise.
   */
  private async insertRecipients(
    manager: EntityManager,
    quotationId: string,
    vendorIds: string[],
  ): Promise<string[]> {
    const added = (await manager.query(
      `INSERT INTO "quotation_recipients" ("quotation_id", "vendor_id")
       SELECT $1, v."id" FROM "vendors" v
       WHERE v."id" = ANY($2::uuid[]) AND v."is_active"
       ON CONFLICT ("quotation_id", "vendor_id") DO NOTHING
       RETURNING "vendor_id" AS "vendorId"`,
      [quotationId, vendorIds],
    )) as { vendorId: string }[];

    const present = await manager.find(QuotationRecipient, {
      where: vendorIds.map((vendorId) => ({ quotationId, vendorId })),
      select: { vendorId: true },
    });
    const presentIds = new Set(present.map((r) => r.vendorId));
    const missing = vendorIds.filter((vendorId) => !presentIds.has(vendorId));

    if (missing.length) throw new UnknownVendorsError(missing);

    return added.map((row) => row.vendorId);
  }

  /* RETURNING * gives snake_case keys; aliasing back to property names lets create() map the row */
  private returningColumns(): string {
    return this.repo.metadata.columns
      .map((column) => `"${column.databaseName}" AS "${column.propertyName}"`)
      .join(', ');
  }
}
