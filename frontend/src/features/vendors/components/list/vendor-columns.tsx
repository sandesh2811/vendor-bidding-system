"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { type ColumnClasses, columnHelper } from "@/components/data-table/table-features";
import { formatDate } from "@/lib/format";
import { CATEGORY_LABELS } from "../../constants";
import type { Vendor } from "../../types";
import { VendorIdentity } from "../shared/vendor-identity";
import { VendorStatusBadge } from "../shared/vendor-status-badge";
import { type VendorRowActionHandlers, VendorRowActions } from "./vendor-row-actions";

const helper = columnHelper<Vendor>();

/* lower-priority columns drop out as the viewport narrows; the vendor cell picks up the phone instead */
export const vendorColumnClasses: ColumnClasses = {
  category: "hidden sm:table-cell",
  phone: "hidden md:table-cell",
  createdAt: "hidden lg:table-cell",
};

export const vendorSkeletons = {
  name: (
    <div className="flex items-center gap-3">
      <Skeleton className="size-8 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  ),
  actions: null,
};

export function vendorColumns(handlers: VendorRowActionHandlers) {
  return helper.columns([
    helper.accessor("name", {
      header: "Vendor",
      cell: ({ row: { original: vendor } }) => (
        <VendorIdentity name={vendor.name} className="max-w-64">
          {vendor.contactName && (
            <div className="hidden truncate text-xs text-muted-foreground md:block">{vendor.contactName}</div>
          )}
          <div className="truncate text-xs text-muted-foreground tabular-nums md:hidden">{vendor.phone}</div>
        </VendorIdentity>
      ),
    }),
    helper.accessor("category", {
      header: "Category",
      cell: ({ getValue }) => (
        <Badge variant="secondary" className="font-normal">
          {CATEGORY_LABELS[getValue()]}
        </Badge>
      ),
    }),
    helper.accessor("phone", {
      header: "Contact",
      cell: ({ row: { original: vendor } }) => (
        <div className="min-w-0">
          <div className="tabular-nums">{vendor.phone}</div>
          {vendor.email && <div className="max-w-56 truncate text-xs text-muted-foreground">{vendor.email}</div>}
        </div>
      ),
    }),
    helper.accessor("isActive", {
      header: "Status",
      cell: ({ getValue }) => <VendorStatusBadge isActive={getValue()} />,
    }),
    helper.accessor("createdAt", {
      header: "Added",
      cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{formatDate(getValue())}</span>,
    }),
    helper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <VendorRowActions vendor={row.original} {...handlers} />,
    }),
  ]);
}
