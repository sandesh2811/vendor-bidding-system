import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  type BidStatus,
  QUOTATION_PHOTO,
  QuotationStatus,
  UNIQUE_CONSTRAINTS,
} from '../common/constants';
import type { PaginationQueryDto } from '../common/dto/pagination.dto';
import { sha256 } from '../common/hash';
import { detectImageType } from '../common/image-type';
import {
  type Paginated,
  toPaginated,
  toSkipTake,
} from '../common/pagination.helper';
import type { UploadedFileData } from '../common/validators/image-file.validator';
import type { CreateQuotationDto } from './dto/create-quotation.dto';
import type {
  ListedQuotationDto,
  ListQuotationsQueryDto,
  ReceivedQuotationDto,
} from './dto/list-quotations.dto';
import type { UpdateQuotationDto } from './dto/update-quotation.dto';
import type { QuotationPhoto } from './entities/quotation-photo.entity';
import type { QuotationRecipient } from './entities/quotation-recipient.entity';
import type { Quotation } from './entities/quotation.entity';
import {
  type NewPhoto,
  PhotoLimitError,
  QuotationStateError,
  QuotationsRepository,
  UnknownItemError,
  UnknownVendorsError,
} from './quotations.repository';
import {
  FILE_STORAGE,
  type FileStorage,
  type TypedFile,
} from '../common/storage/file-storage';

export type PhotoFile = TypedFile;

@Injectable()
export class QuotationsService {
  private readonly logger = new Logger(QuotationsService.name);

  constructor(
    private readonly quotations: QuotationsRepository,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
  ) {}

  /**
   * Creates a quotation with its items, optionally sending it to vendors. Idempotent on the event
   * (title, eventDate, location).
   *
   * @remarks
   * - Quotation, items and recipients are written in one transaction: no half-created quotation.
   * - A repeat of the same event (double submit, network retry) returns the existing quotation and writes nothing.
   * - Two concurrent creates of one event: the unique constraint makes the second wait, then return the first.
   *
   * @param {CreateQuotationDto} dto - Event details, items and optional vendorIds
   * @param {string} adminId - The admin creating it
   * @returns {Promise<Quotation>} The quotation with items, photos and recipients
   * @throws {BadRequestException} Throws a `BadRequestException` with HTTP status code 400 (Bad request) if a vendor is unknown or inactive, or responseDeadline is after eventDate
   *
   * @example
   * ```ts
   * await quotationsService.create({ title: 'Gurung wedding', eventType: EventType.Wedding, eventDate: '2026-12-12', location: 'Kathmandu', items: [{ name: 'Stage decor', quantity: 1 }] }, adminId);
   * ```
   */
  async create(
    { items, vendorIds = [], ...details }: CreateQuotationDto,
    adminId: string,
  ): Promise<Quotation> {
    const created = await this.quotations
      .createWithItems({ ...details, createdById: adminId }, items, vendorIds)
      .catch((error: unknown) => this.rethrowDomainError(error, 'create'));

    if (created) {
      this.logger.log({
        method: 'create',
        message: 'Quotation created',
        quotationId: created.id,
        items: items.length,
        recipients: vendorIds.length,
      });
      return this.findById(created.id);
    }

    /* the event already has a quotation: a repeat of this request, or another admin got there first */
    const existing = await this.quotations.findIdByEvent(details);

    if (!existing) {
      /* the conflicting row was renamed between our insert and this read */
      this.logger.warn({
        method: 'create',
        message: 'Conflicting quotation changed',
      });
      throw new ConflictException(UNIQUE_CONSTRAINTS.QUOTATION_EVENT.message);
    }

    this.logger.log({
      method: 'create',
      message: 'Quotation already exists, returning it',
      quotationId: existing.id,
    });

    return this.findById(existing.id);
  }

  /**
   * Lists quotations, newest first, with their recipients and bid count.
   *
   * @param {ListQuotationsQueryDto} query - page, limit, and optional search (title or location), eventType and effective status
   * @returns {Promise<Paginated<ListedQuotationDto>>} One page plus pagination meta
   *
   * @example
   * ```ts
   * const { items, meta } = await quotationsService.findAll({ page: 1, limit: 20 });
   * ```
   */
  async findAll({
    search,
    eventType,
    status,
    ...page
  }: ListQuotationsQueryDto): Promise<Paginated<ListedQuotationDto>> {
    const [items, total] = await this.quotations.findAndCount({
      ...toSkipTake(page),
      search,
      eventType,
      status,
    });
    const bidCounts = await this.quotations.countBids(
      items.map((item) => item.id),
    );

    this.logger.debug({
      method: 'findAll',
      message: 'Listed quotations',
      ...page,
      total,
      eventType,
      status,
      searched: Boolean(search),
    });

    /* keep the entity instances so serialization groups still apply */
    return toPaginated(
      items.map((item) =>
        Object.assign(item, { bidCount: bidCounts.get(item.id) ?? 0 }),
      ),
      total,
      page,
    );
  }

  /**
   * Gets one quotation with items (in order), photos and recipients.
   *
   * @param {string} id - Quotation id
   * @returns {Promise<Quotation>} The quotation
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if no quotation has this id
   *
   * @example
   * ```ts
   * const quotation = await quotationsService.findById(id);
   * ```
   */
  async findById(id: string): Promise<Quotation> {
    const quotation = await this.quotations.findDetail(id);

    if (!quotation) throw this.notFound('findById', id);

    return quotation;
  }

  /**
   * Edits event details and/or the item list.
   *
   * @remarks
   * - Runs under a row lock, so concurrent edits apply one after another, never interleaved.
   * - `items` is the full desired list: items with an `id` are updated, new ones added, unlisted ones removed.
   * - responseDeadline ≤ eventDate is checked by the database against the merged result.
   * - Draft: anything can change. Sent (open or closed): only responseDeadline. Awarded or cancelled: nothing.
   *
   * @param {string} id - Quotation id
   * @param {UpdateQuotationDto} dto - Fields to change, and optionally the full item list
   * @returns {Promise<Quotation>} The updated quotation
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if no quotation has this id
   * @throws {BadRequestException} Throws a `BadRequestException` with HTTP status code 400 (Bad request) if an item id is repeated or belongs to another quotation, or the dates conflict
   * @throws {ConflictException} Throws a `ConflictException` with HTTP status code 409 (Conflict) if the quotation is awarded or cancelled, or is sent and anything other than responseDeadline was sent
   *
   * @example
   * ```ts
   * await quotationsService.update(id, { guestCount: 300, items: [{ id: itemId, name: 'Chairs', quantity: 300 }] });
   * ```
   */
  async update(
    id: string,
    { items, ...dto }: UpdateQuotationDto,
  ): Promise<Quotation> {
    /* DTO fields that weren't sent exist as undefined keys; drop them so they don't overwrite stored values */
    const changes = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );

    if (!items && Object.keys(changes).length === 0) return this.findById(id);

    const itemIds = items?.flatMap((item) => (item.id ? [item.id] : [])) ?? [];
    if (new Set(itemIds).size !== itemIds.length)
      throw new BadRequestException('Each item id may appear only once');

    const updated = await this.quotations
      .updateWithItems(id, changes, items)
      .catch((error: unknown) => this.rethrowDomainError(error, 'update'));

    if (!updated) throw this.notFound('update', id);

    this.logger.log({
      method: 'update',
      message: 'Quotation updated',
      quotationId: id,
      fields: Object.keys(changes).join(','),
      items: items?.length,
    });

    return this.findById(id);
  }

  /**
   * Sends the quotation to more vendors. Idempotent: vendors who already have it are skipped.
   *
   * @remarks
   * - A draft becomes open; an open quotation stays open.
   *
   * @param {string} id - Quotation id
   * @param {string[]} vendorIds - Vendors to add; each must exist and be active
   * @returns {Promise<Quotation>} The quotation with its full recipient list
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if no quotation has this id
   * @throws {BadRequestException} Throws a `BadRequestException` with HTTP status code 400 (Bad request) if any vendor is unknown or inactive (none are added)
   * @throws {ConflictException} Throws a `ConflictException` with HTTP status code 409 (Conflict) if the quotation is closed, awarded or cancelled
   *
   * @example
   * ```ts
   * await quotationsService.addRecipients(id, [decorVendorId, soundVendorId]);
   * ```
   */
  async addRecipients(id: string, vendorIds: string[]): Promise<Quotation> {
    const added = await this.quotations
      .addRecipients(id, vendorIds)
      .catch((error: unknown) =>
        this.rethrowDomainError(error, 'addRecipients'),
      );

    if (!added) throw this.notFound('addRecipients', id);

    this.logger.log({
      method: 'addRecipients',
      message: 'Quotation sent to vendors',
      quotationId: id,
      requested: vendorIds.length,
      added: added.length,
    });

    return this.findById(id);
  }

  /**
   * Closes an open quotation early: vendors can no longer submit or edit bids.
   *
   * @param {string} id - Quotation id
   * @returns {Promise<Quotation>} The closed quotation
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if no quotation has this id
   * @throws {ConflictException} Throws a `ConflictException` with HTTP status code 409 (Conflict) if the quotation isn't open
   *
   * @example
   * ```ts
   * await quotationsService.close(id);
   * ```
   */
  async close(id: string): Promise<Quotation> {
    const closed = await this.quotations.close(id);

    if (closed === null) throw this.notFound('close', id);

    if (!closed) {
      this.logger.warn({
        method: 'close',
        message: 'Quotation not open',
        quotationId: id,
      });
      throw new ConflictException('Only an open quotation can be closed');
    }

    this.logger.log({
      method: 'close',
      message: 'Quotation closed',
      quotationId: id,
    });

    return this.findById(id);
  }

  /**
   * Cancels a quotation and rejects every submitted bid on it.
   *
   * @remarks
   * - One transaction under the quotation's row lock, so it can't race a bid submission or a selection.
   * - Vendors still see the quotation, marked cancelled.
   *
   * @param {string} id - Quotation id
   * @returns {Promise<Quotation>} The cancelled quotation
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if no quotation has this id
   * @throws {ConflictException} Throws a `ConflictException` with HTTP status code 409 (Conflict) if it is already awarded or cancelled
   *
   * @example
   * ```ts
   * await quotationsService.cancel(id);
   * ```
   */
  async cancel(id: string): Promise<Quotation> {
    const cancelled = await this.quotations
      .cancel(id)
      .catch((error: unknown) => this.rethrowDomainError(error, 'cancel'));

    if (!cancelled) throw this.notFound('cancel', id);

    this.logger.log({
      method: 'cancel',
      message: 'Quotation cancelled',
      quotationId: id,
    });

    return this.findById(id);
  }

  /**
   * Stores reference photos on local disk and attaches them to the quotation.
   *
   * @remarks
   * - The type comes from the file's bytes (JPEG, PNG or WebP), never the client's mimetype.
   * - Idempotent per image: the same file uploaded again to the same quotation is not duplicated.
   * - The per-quotation limit is checked under a row lock, so parallel uploads can't exceed it.
   * - If the database write fails, files written by this call are removed again.
   *
   * @param {string} id - Quotation id
   * @param {UploadedFileData[]} files - Validated uploads (memory storage)
   * @returns {Promise<QuotationPhoto[]>} The photo records for the uploaded images
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if no quotation has this id
   * @throws {BadRequestException} Throws a `BadRequestException` with HTTP status code 400 (Bad request) if a file isn't a supported image or the photo limit would be exceeded
   *
   * @example
   * ```ts
   * await quotationsService.addPhotos(id, files);
   * ```
   */
  async addPhotos(
    id: string,
    files: UploadedFileData[],
  ): Promise<QuotationPhoto[]> {
    const candidates = files.map((file) => this.toNewPhoto(id, file));
    const buffers = new Map(
      candidates.map((photo, index) => [photo.sha256, files[index].buffer]),
    );
    const written: string[] = [];

    const photos = await this.quotations
      .addPhotos(
        id,
        candidates,
        QUOTATION_PHOTO.MAX_PER_QUOTATION,
        async (fresh) => {
          for (const photo of fresh) {
            written.push(photo.storageKey);
            await this.storage.save(
              photo.storageKey,
              buffers.get(photo.sha256)!,
            );
          }
        },
      )
      .catch(async (error: unknown) => {
        await Promise.all(written.map((key) => this.storage.remove(key)));
        return this.rethrowDomainError(error, 'addPhotos');
      });

    if (!photos) throw this.notFound('addPhotos', id);

    this.logger.log({
      method: 'addPhotos',
      message: 'Photos attached',
      quotationId: id,
      uploaded: files.length,
      stored: written.length,
    });

    return photos;
  }

  /**
   * Removes a photo record and its file. Only while the quotation is a draft.
   *
   * @param {string} id - Quotation id
   * @param {string} photoId - Photo id
   * @returns {Promise<void>}
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if the quotation or photo doesn't exist
   * @throws {ConflictException} Throws a `ConflictException` with HTTP status code 409 (Conflict) if the quotation isn't a draft
   *
   * @example
   * ```ts
   * await quotationsService.removePhoto(id, photoId);
   * ```
   */
  async removePhoto(id: string, photoId: string): Promise<void> {
    const removed = await this.quotations
      .deletePhoto(id, photoId, (key) => this.storage.remove(key))
      .catch((error: unknown) => this.rethrowDomainError(error, 'removePhoto'));

    if (!removed) {
      this.logger.warn({
        method: 'removePhoto',
        message: 'Photo not found',
        quotationId: id,
        photoId,
      });
      throw new NotFoundException('Photo not found');
    }

    this.logger.log({
      method: 'removePhoto',
      message: 'Photo removed',
      quotationId: id,
      photoId,
    });
  }

  /**
   * Opens a photo's file for an admin.
   *
   * @param {string} id - Quotation id
   * @param {string} photoId - Photo id
   * @returns {Promise<PhotoFile>} A read stream with its size and type
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if the photo or its file doesn't exist
   *
   * @example
   * ```ts
   * const { stream, mimeType } = await quotationsService.openPhoto(id, photoId);
   * ```
   */
  async openPhoto(id: string, photoId: string): Promise<PhotoFile> {
    return this.openFile(await this.quotations.findPhoto(id, photoId));
  }

  /**
   * Lists the quotations sent to a vendor, most recently received first.
   *
   * @param {string} vendorId - The logged-in vendor (from the session, never the request)
   * @param {PaginationQueryDto} page - page and limit
   * @returns {Promise<Paginated<ReceivedQuotationDto>>} Quotations with `receivedAt` and `bidStatus`, without other recipients
   *
   * @example
   * ```ts
   * const { items } = await quotationsService.findReceived(vendor.id, { page: 1, limit: 20 });
   * ```
   */
  async findReceived(
    vendorId: string,
    page: PaginationQueryDto,
  ): Promise<Paginated<ReceivedQuotationDto>> {
    const { skip, take } = toSkipTake(page);
    const [rows, total] = await this.quotations.findReceivedAndCount(
      vendorId,
      skip,
      take,
    );

    const bidStatuses = await this.quotations.findBidStatuses(
      vendorId,
      rows.map((row) => row.quotationId),
    );

    this.logger.debug({
      method: 'findReceived',
      message: 'Listed received quotations',
      page: page.page,
      limit: page.limit,
      total,
    });

    return toPaginated(
      rows.map((row) => toReceived(row, bidStatuses.get(row.quotationId))),
      total,
      page,
    );
  }

  /**
   * Gets one quotation sent to a vendor, with items and photos.
   *
   * @remarks
   * - A quotation not sent to this vendor is reported as not found, so ids of others' work don't leak.
   *
   * @param {string} vendorId - The logged-in vendor
   * @param {string} id - Quotation id
   * @returns {Promise<ReceivedQuotationDto>} The quotation with `receivedAt` and `bidStatus`
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if it wasn't sent to this vendor
   *
   * @example
   * ```ts
   * const quotation = await quotationsService.findReceivedById(vendor.id, id);
   * ```
   */
  async findReceivedById(
    vendorId: string,
    id: string,
  ): Promise<ReceivedQuotationDto> {
    await this.quotations.markViewed(vendorId, id);
    const row = await this.quotations.findReceived(vendorId, id);

    if (!row) throw this.notFound('findReceivedById', id);

    const bidStatuses = await this.quotations.findBidStatuses(vendorId, [id]);

    return toReceived(row, bidStatuses.get(id));
  }

  /**
   * Declines a quotation sent to the vendor, with an optional reason the admin sees.
   *
   * @remarks
   * - Only while the quotation is open and the vendor hasn't bid. A declined vendor can't bid until the admin sends it again.
   * - Idempotent: declining again keeps the first decline and reason.
   *
   * @param {string} vendorId - The logged-in vendor
   * @param {string} id - Quotation id
   * @param {string | null} reason - Optional reason
   * @returns {Promise<ReceivedQuotationDto>} The quotation as the vendor sees it, now declined
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if it wasn't sent to this vendor
   * @throws {ConflictException} Throws a `ConflictException` with HTTP status code 409 (Conflict) if the quotation isn't open or the vendor has bid on it
   *
   * @example
   * ```ts
   * await quotationsService.decline(vendor.id, id, 'Booked that day');
   * ```
   */
  async decline(
    vendorId: string,
    id: string,
    reason: string | null,
  ): Promise<ReceivedQuotationDto> {
    const row = await this.quotations.findReceived(vendorId, id);
    if (!row) throw this.notFound('decline', id);
    if (row.declinedAt) return toReceived(row, undefined);

    const bidStatus = (
      await this.quotations.findBidStatuses(vendorId, [id])
    ).get(id);
    if (bidStatus || row.quotation!.status !== QuotationStatus.Open) {
      this.logger.warn({
        method: 'decline',
        message: 'Decline not allowed',
        quotationId: id,
        status: row.quotation!.status,
        bidStatus,
      });
      throw new ConflictException(
        bidStatus
          ? "You've already bid on this request"
          : `This request is ${row.quotation!.status}`,
      );
    }

    /* shortcut: no lock against this vendor bidding at the same instant (only its own two clicks can race); add one if declines ever trigger side effects */
    if (await this.quotations.decline(vendorId, id, reason)) {
      row.declinedAt = new Date();
      row.declineReason = reason;
    }

    this.logger.log({
      method: 'decline',
      message: 'Quotation declined',
      quotationId: id,
      withReason: Boolean(reason),
    });

    return toReceived(row, undefined);
  }

  /**
   * Opens a photo's file for a vendor the quotation was sent to.
   *
   * @param {string} vendorId - The logged-in vendor
   * @param {string} id - Quotation id
   * @param {string} photoId - Photo id
   * @returns {Promise<PhotoFile>} A read stream with its size and type
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if the photo doesn't exist or the quotation wasn't sent to this vendor
   *
   * @example
   * ```ts
   * const file = await quotationsService.openReceivedPhoto(vendor.id, id, photoId);
   * ```
   */
  async openReceivedPhoto(
    vendorId: string,
    id: string,
    photoId: string,
  ): Promise<PhotoFile> {
    return this.openFile(
      await this.quotations.findReceivedPhoto(vendorId, id, photoId),
    );
  }

  private async openFile(photo: QuotationPhoto | null): Promise<PhotoFile> {
    const file = photo && (await this.storage.open(photo.storageKey));

    if (!photo || !file) throw new NotFoundException('Photo not found');

    return { stream: file.stream, size: file.size, mimeType: photo.mimeType };
  }

  private toNewPhoto(quotationId: string, file: UploadedFileData): NewPhoto {
    const mimeType = detectImageType(file.buffer);
    const extension = mimeType && QUOTATION_PHOTO.EXTENSIONS[mimeType];

    /* ImageFileValidator already rejects these; kept so this method is safe on its own */
    if (!mimeType || !extension)
      throw new BadRequestException(
        `${file.originalname} is not a JPEG, PNG or WebP image`,
      );

    const hash = sha256(file.buffer);

    return {
      originalName: file.originalname.slice(0, 255),
      mimeType,
      size: file.buffer.length,
      sha256: hash,
      /* stable per image: the same bytes for the same quotation always map to one key */
      storageKey: `quotations/${quotationId}/${hash}.${extension}`,
    };
  }

  /* repository errors thrown to roll back a transaction, as HTTP errors */
  private rethrowDomainError(error: unknown, method: string): never {
    if (error instanceof UnknownVendorsError) {
      this.logger.warn({
        method,
        message: 'Unknown or inactive vendors',
        count: error.vendorIds.length,
      });
      throw new BadRequestException(
        `Vendors not found or inactive: ${error.vendorIds.join(', ')}`,
      );
    }

    if (error instanceof UnknownItemError)
      throw new BadRequestException(
        `Item ${error.itemId} does not belong to this quotation`,
      );

    if (error instanceof QuotationStateError) {
      this.logger.warn({ method, message: error.message });
      throw new ConflictException(error.message);
    }

    if (error instanceof PhotoLimitError)
      throw new BadRequestException(
        `A quotation can have at most ${error.limit} photos`,
      );

    throw error;
  }

  private notFound(method: string, quotationId: string): NotFoundException {
    this.logger.warn({ method, message: 'Quotation not found', quotationId });
    return new NotFoundException('Quotation not found');
  }
}

/* keep the Quotation entity instance (so @Exclude/@Expose still apply) and add this vendor's invitation and bid state */
const toReceived = (
  recipient: QuotationRecipient,
  bidStatus: BidStatus | undefined,
): ReceivedQuotationDto =>
  Object.assign(recipient.quotation as Quotation, {
    receivedAt: recipient.sentAt,
    bidStatus: bidStatus ?? null,
    viewedAt: recipient.viewedAt,
    declinedAt: recipient.declinedAt,
  });
