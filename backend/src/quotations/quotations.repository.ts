import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  type EntityManager,
  type FindOptionsWhere,
  ILike,
  In,
  IsNull,
  LessThan,
  MoreThanOrEqual,
  Not,
  type Repository,
} from 'typeorm';
import { Bid } from '../bids/entities/bid.entity';
import {
  BidStatus,
  type EventType,
  QuotationStatus,
} from '../common/constants';
import { QuotationItem } from './entities/quotation-item.entity';
import { QuotationPhoto } from './entities/quotation-photo.entity';
import { QuotationRecipient } from './entities/quotation-recipient.entity';
import { Quotation } from './entities/quotation.entity';
import { businessToday } from '../common/validators/is-not-past-date.validator';

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
  status?: QuotationStatus;
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
/* the quotation's status doesn't allow this action; mapped to 409 with this message */
export class QuotationStateError extends Error {}

const FINAL_STATUSES = [QuotationStatus.Awarded, QuotationStatus.Cancelled];

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
        .values({
          ...quotation,
          status: vendorIds.length
            ? QuotationStatus.Open
            : QuotationStatus.Draft,
        })
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
   * Once sent (not draft), only responseDeadline may change; awarded and cancelled can't change.
   */
  updateWithItems(
    id: string,
    changes: QuotationChanges,
    items: ItemChange[] | undefined,
  ): Promise<boolean> {
    return this.repo.manager.transaction(async (manager) => {
      if (!(await this.lock(manager, id, 'pessimistic_write'))) return false;

      /* anything beyond the deadline is a draft-only edit */
      const restricted =
        Boolean(items) ||
        Object.keys(changes).some((key) => key !== 'responseDeadline');

      /* conditional: the status check and the write are one statement. Bumps updated_at even for an items-only edit */
      const query = manager
        .createQueryBuilder()
        .update(Quotation)
        .set({ ...changes, updatedAt: () => 'now()' });
      const result = await (
        restricted
          ? query.where('id = :id AND status = :draft', {
              id,
              draft: QuotationStatus.Draft,
            })
          : query.where('id = :id AND status NOT IN (:...final)', {
              id,
              final: FINAL_STATUSES,
            })
      ).execute();

      if (!result.affected)
        throw new QuotationStateError(
          restricted
            ? 'Once a quotation is sent, only its response deadline can change. Cancel it and create a new one to change anything else'
            : 'An awarded or cancelled quotation can no longer be edited',
        );

      if (items) await this.reconcileItems(manager, id, items);

      return true;
    });
  }

  /**
   * Sends the quotation to more vendors and opens a draft. Idempotent: vendors already on it are
   * skipped by the unique (quotation_id, vendor_id), and an open quotation stays open.
   * The conditional UPDATE is both the status check (draft, or open and before its deadline) and
   * the transition. Returns null if the quotation doesn't exist.
   */
  addRecipients(
    quotationId: string,
    vendorIds: string[],
  ): Promise<string[] | null> {
    return this.repo.manager.transaction(async (manager) => {
      const opened = await manager.update(
        Quotation,
        [
          { id: quotationId, status: QuotationStatus.Draft },
          {
            id: quotationId,
            status: QuotationStatus.Open,
            responseDeadline: IsNull(),
          },
          {
            id: quotationId,
            status: QuotationStatus.Open,
            responseDeadline: MoreThanOrEqual(businessToday()),
          },
        ],
        { status: QuotationStatus.Open },
      );

      if (!opened.affected) {
        if (!(await manager.existsBy(Quotation, { id: quotationId })))
          return null;
        throw new QuotationStateError(
          'A closed, awarded or cancelled quotation can no longer be sent',
        );
      }

      return this.insertRecipients(manager, quotationId, vendorIds);
    });
  }

  /* single conditional UPDATE: true if closed, false if it exists but isn't open, null if missing */
  async close(id: string): Promise<boolean | null> {
    const result = await this.repo.update(
      { id, status: QuotationStatus.Open },
      { status: QuotationStatus.Closed },
    );

    if (result.affected) return true;

    return (await this.repo.existsBy({ id })) ? false : null;
  }

  /**
   * Cancels the quotation and rejects its submitted bids in one transaction. Returns false if it
   * doesn't exist; throws QuotationStateError if it is already awarded or cancelled.
   */
  cancel(id: string): Promise<boolean> {
    return this.repo.manager.transaction(async (manager) => {
      const cancelled = await manager.update(
        Quotation,
        { id, status: Not(In(FINAL_STATUSES)) },
        { status: QuotationStatus.Cancelled },
      );

      if (!cancelled.affected) {
        if (!(await manager.existsBy(Quotation, { id }))) return false;
        throw new QuotationStateError(
          'This quotation is already awarded or cancelled',
        );
      }

      await manager.update(
        Bid,
        { quotationId: id, status: BidStatus.Submitted },
        { status: BidStatus.Rejected },
      );

      return true;
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
      const status = await this.lock(manager, quotationId, 'pessimistic_write');
      if (!status) return false;
      if (status !== QuotationStatus.Draft)
        throw new QuotationStateError(
          'Photos can be removed only while the quotation is a draft',
        );

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
    status,
  }: QuotationFilter): Promise<[Quotation[], number]> {
    /* TypeORM 1.x throws on undefined where values, so only set filters are added */
    const base: FindOptionsWhere<Quotation> = {};
    if (eventType) base.eventType = eventType;

    /* every (status variant × search column) pair, OR'd: one where array, one query */
    const statuses = status ? effectiveStatusWhere(status) : [{}];
    const pattern = search && ILike(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
    const columns = pattern
      ? [{ title: pattern }, { location: pattern }]
      : [{}];
    const where = statuses.flatMap((variant) =>
      columns.map((column) => ({ ...base, ...variant, ...column })),
    );

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

  /* first open only: later opens (and non-recipients) match no row */
  async markViewed(vendorId: string, quotationId: string): Promise<void> {
    await this.recipients.update(
      { vendorId, quotationId, viewedAt: IsNull() },
      { viewedAt: () => 'now()' },
    );
  }

  /* conditional: an existing decline (and its reason) is never overwritten; false when nothing changed */
  async decline(
    vendorId: string,
    quotationId: string,
    declineReason: string | null,
  ): Promise<boolean> {
    const { affected } = await this.recipients.update(
      { vendorId, quotationId, declinedAt: IsNull() },
      { declinedAt: () => 'now()', declineReason },
    );
    return Boolean(affected);
  }

  /* number of bids per quotation id; quotations without bids are absent */
  async countBids(quotationIds: string[]): Promise<Map<string, number>> {
    if (!quotationIds.length) return new Map();

    const rows = await this.repo.manager
      .createQueryBuilder(Bid, 'bid')
      .select('bid.quotationId', 'quotationId')
      .addSelect('COUNT(*)::int', 'count')
      .where({ quotationId: In(quotationIds) })
      .groupBy('bid.quotationId')
      .getRawMany<{ quotationId: string; count: number }>();

    return new Map(rows.map((row) => [row.quotationId, row.count]));
  }

  /* this vendor's bid status per quotation id; quotations without a bid are absent */
  async findBidStatuses(
    vendorId: string,
    quotationIds: string[],
  ): Promise<Map<string, BidStatus>> {
    if (!quotationIds.length) return new Map();

    const bids = await this.repo.manager.find(Bid, {
      where: { vendorId, quotationId: In(quotationIds) },
      select: { quotationId: true, status: true },
    });

    return new Map(bids.map((bid) => [bid.quotationId, bid.status]));
  }

  /* SELECT ... FOR UPDATE on the quotation row; its stored status, or null if it doesn't exist */
  private async lock(
    manager: EntityManager,
    id: string,
    mode: 'pessimistic_write',
  ): Promise<QuotationStatus | null> {
    const row = await manager.findOne(Quotation, {
      where: { id },
      select: { id: true, status: true },
      lock: { mode },
    });

    return row?.status ?? null;
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
   * Sending again to a vendor that declined clears the decline; other existing recipients are untouched.
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
       ON CONFLICT ("quotation_id", "vendor_id") DO UPDATE
         SET "declined_at" = NULL, "decline_reason" = NULL
         WHERE "quotation_recipients"."declined_at" IS NOT NULL
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

/* the stored conditions behind an effective status (see effectiveStatus on the entity) */
const effectiveStatusWhere = (
  status: QuotationStatus,
): FindOptionsWhere<Quotation>[] => {
  const today = businessToday();
  if (status === QuotationStatus.Open)
    return [
      { status, responseDeadline: IsNull() },
      { status, responseDeadline: MoreThanOrEqual(today) },
    ];
  if (status === QuotationStatus.Closed)
    return [
      { status },
      { status: QuotationStatus.Open, responseDeadline: LessThan(today) },
    ];
  return [{ status }];
};
