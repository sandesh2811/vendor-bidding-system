import type {
  PaginationMetaDto,
  PaginationQueryDto,
} from './dto/pagination.dto';

export interface Paginated<T> {
  items: T[];
  meta: PaginationMetaDto;
}

export const toSkipTake = ({
  page,
  limit,
}: PaginationQueryDto): { skip: number; take: number } => ({
  skip: (page - 1) * limit,
  take: limit,
});

export const toPaginated = <T>(
  items: T[],
  total: number,
  { page, limit }: PaginationQueryDto,
): Paginated<T> => ({
  items,
  meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
});
