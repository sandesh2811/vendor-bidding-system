"use client";

import { useQuery } from "@tanstack/react-query";
import { type PaginationState, useTable } from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon, StoreIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { QueryError } from "@/components/layout/query-error";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { CreateVendorSheet } from "./create-vendor-sheet";
import { EditVendorSheet } from "./edit-vendor-sheet";
import { ToggleVendorDialog } from "./toggle-vendor-dialog";
import { responsiveColumnClass, vendorColumns, vendorTableFeatures } from "./vendor-columns";
import { CATEGORY_LABELS, VENDOR_CATEGORIES, type Vendor, type VendorCategory, vendorsQuery } from "./vendors.api";

const PAGE_SIZE = 10;
const emptyRows: Vendor[] = [];

const ALL = "all";
const categoryItems = { [ALL]: "All categories", ...CATEGORY_LABELS };
const statusItems = { [ALL]: "Any status", active: "Active", inactive: "Inactive" };
type StatusFilter = keyof typeof statusItems;

export function VendorsView() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<VendorCategory | typeof ALL>(ALL);
  const [status, setStatus] = useState<StatusFilter>(ALL);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [toggling, setToggling] = useState<Vendor | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim());
  const params = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearch || undefined,
    category: category === ALL ? undefined : category,
    isActive: status === ALL ? undefined : status === "active",
  };
  const { data, isPending, isError, error, isFetching, isPlaceholderData, refetch } = useQuery(
    vendorsQuery(params),
  );

  /* setState functions are stable, so columns are built once */
  const columns = useMemo(() => vendorColumns({ onEdit: setEditing, onToggleActive: setToggling }), []);

  const table = useTable({
    features: vendorTableFeatures,
    columns,
    data: data?.items ?? emptyRows,
    rowCount: data?.meta.total ?? 0,
    getRowId: (row) => row.id,
    manualPagination: true,
    state: { pagination },
    onPaginationChange: setPagination,
  });

  /* a deactivation under the "Active" filter can empty the last page; step back to the new last page */
  const totalPages = data?.meta.totalPages ?? 0;
  if (totalPages > 0 && pagination.pageIndex >= totalPages) {
    setPagination({ ...pagination, pageIndex: totalPages - 1 });
  }

  const hasFilters = Boolean(search || category !== ALL || status !== ALL);
  const resetPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));
  const clearFilters = () => {
    setSearch("");
    setCategory(ALL);
    setStatus(ALL);
    resetPage();
  };

  const total = data?.meta.total ?? 0;
  const firstShown = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const lastShown = Math.min(total, (pagination.pageIndex + 1) * pagination.pageSize);

  return (
    <>
      <PageHeader
        section="Vendors"
        title="Vendors"
        description="Partners who receive work requests and bid on events."
        actions={
          <Button onClick={() => setCreating(true)}>
            <PlusIcon data-icon="inline-start" />
            Add vendor
          </Button>
        }
      />

      <div className="px-4 pb-8 md:px-8">
        <Card className="gap-0 py-0">
          <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
            <InputGroup className="w-full sm:max-w-xs">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by vendor or contact"
                aria-label="Search vendors"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
              />
              {search && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearch("");
                      resetPage();
                    }}
                  >
                    <XIcon />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>

            <div className="flex min-w-0 gap-2">
              <Select
                items={categoryItems}
                value={category}
                onValueChange={(value) => {
                  setCategory(value as VendorCategory | typeof ALL);
                  resetPage();
                }}
              >
                <SelectTrigger aria-label="Filter by category" className="min-w-0 flex-1 sm:w-44 sm:flex-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All categories</SelectItem>
                  {VENDOR_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                items={statusItems}
                value={status}
                onValueChange={(value) => {
                  setStatus(value as StatusFilter);
                  resetPage();
                }}
              >
                <SelectTrigger aria-label="Filter by status" className="min-w-0 flex-1 sm:w-36 sm:flex-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground sm:ml-auto">
                Clear filters
              </Button>
            )}
          </div>

          {isError ? (
            <QueryError
              title="Couldn't load vendors"
              error={error}
              onRetry={() => refetch()}
              isRetrying={isFetching}
            />
          ) : !isPending && total === 0 ? (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <StoreIcon />
                </EmptyMedia>
                <EmptyTitle>{hasFilters ? "No matching vendors" : "No vendors yet"}</EmptyTitle>
                <EmptyDescription>
                  {hasFilters
                    ? "Try a different search or clear the filters."
                    : "Add your first vendor to start sending work requests."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button onClick={() => setCreating(true)}>
                    <PlusIcon data-icon="inline-start" />
                    Add vendor
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          ) : (
            <Table className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
              <TableHeader className="bg-muted/50">
                {table.getHeaderGroups().map((group) => (
                  <TableRow key={group.id} className="hover:bg-transparent">
                    {group.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "h-9 text-xs font-medium text-muted-foreground first:pl-4 last:pr-4",
                          responsiveColumnClass[header.column.id],
                        )}
                      >
                        {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isPending
                  ? Array.from({ length: 5 }, (_, i) => (
                      <TableRow key={i}>
                        {table.getAllLeafColumns().map((column) => (
                          <TableCell
                            key={column.id}
                            className={cn("h-14 first:pl-4 last:pr-4", responsiveColumnClass[column.id])}
                          >
                            {column.id === "name" ? (
                              <div className="flex items-center gap-3">
                                <Skeleton className="size-8 rounded-full" />
                                <div className="space-y-1.5">
                                  <Skeleton className="h-3.5 w-32" />
                                  <Skeleton className="h-3 w-20" />
                                </div>
                              </div>
                            ) : column.id === "actions" ? null : (
                              <Skeleton className="h-3.5 w-20" />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        onClick={() => setEditing(row.original)}
                      >
                        {row.getAllCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cn("h-14 first:pl-4 last:pr-4", responsiveColumnClass[cell.column.id])}
                          >
                            <table.FlexRender cell={cell} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          )}

          {!isError && total > 0 && (
            <div className="flex items-center justify-between gap-4 border-t px-4 py-3 text-sm text-muted-foreground">
              <span className="tabular-nums">
                {firstShown} to {lastShown} of {total}
              </span>
              <div className="flex items-center gap-2">
                <span className="hidden tabular-nums sm:inline">
                  Page {pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Previous page"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Next page"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage() || isPlaceholderData}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <CreateVendorSheet open={creating} onOpenChange={setCreating} />
      <EditVendorSheet
        vendor={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onToggleActive={(vendor) => {
          setEditing(null);
          setToggling(vendor);
        }}
      />
      <ToggleVendorDialog vendor={toggling} onOpenChange={(open) => !open && setToggling(null)} />
    </>
  );
}
