"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { type OnChangeFn, type PaginationState, useTable } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { QueryError } from "@/components/layout/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Paginated } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./data-table-pagination";
import { type ColumnClasses, type DataTableColumns, pageTableFeatures } from "./table-features";

const SKELETON_ROWS = 5;
const noRows: never[] = [];
const defaultSkeleton = <Skeleton className="h-3.5 w-20" />;

export interface DataTableProps<TData extends { id: string }> {
  query: UseQueryResult<Paginated<TData>>;
  columns: DataTableColumns<TData>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  /* shown in place of the table when the list fails to load */
  errorTitle: string;
  /* shown when the list loaded with no rows */
  empty: ReactNode;
  onRowClick?: (row: TData) => void;
  columnClasses?: ColumnClasses;
  /* per-column loading placeholder; a column mapped to null renders nothing while loading */
  skeletons?: Partial<Record<string, ReactNode>>;
}

/* a server-paginated list: loading skeleton, inline error with retry, empty state, rows and pager */
export function DataTable<TData extends { id: string }>({
  query,
  columns,
  pagination,
  onPaginationChange,
  errorTitle,
  empty,
  onRowClick,
  columnClasses = {},
  skeletons = {},
}: DataTableProps<TData>) {
  const { data, isPending, isError, error, isFetching, isPlaceholderData, refetch } = query;
  const total = data?.meta.total ?? 0;

  const table = useTable({
    features: pageTableFeatures,
    columns,
    data: data?.items ?? noRows,
    rowCount: total,
    getRowId: (row) => row.id,
    manualPagination: true,
    state: { pagination },
    onPaginationChange,
  });

  if (isError)
    return <QueryError title={errorTitle} error={error} onRetry={() => refetch()} isRetrying={isFetching} />;
  if (!isPending && total === 0) return empty;

  const cellClass = (columnId: string) => cn("first:pl-4 last:pr-4", columnClasses[columnId]);

  return (
    <>
      <Table className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
        <TableHeader className="bg-muted/50">
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {group.headers.map((header) => (
                <TableHead key={header.id} className={cn("h-9 text-xs font-medium text-muted-foreground", cellClass(header.column.id))}>
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isPending
            ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <TableRow key={i}>
                  {table.getAllLeafColumns().map((column) => (
                    <TableCell key={column.id} className={cn("h-14", cellClass(column.id))}>
                      {column.id in skeletons ? skeletons[column.id] : defaultSkeleton}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={onRowClick && (() => onRowClick(row.original))}
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className={cn("h-14", cellClass(cell.column.id))}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {total > 0 && (
        <DataTablePagination
          pagination={pagination}
          total={total}
          pageCount={table.getPageCount()}
          onPrevious={() => table.previousPage()}
          onNext={() => table.nextPage()}
          canPrevious={table.getCanPreviousPage()}
          canNext={table.getCanNextPage() && !isPlaceholderData}
        />
      )}
    </>
  );
}
