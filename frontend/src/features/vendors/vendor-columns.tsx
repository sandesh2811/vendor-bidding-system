"use client";

import { createColumnHelper, rowPaginationFeature, tableFeatures } from "@tanstack/react-table";
import { MoreHorizontalIcon, PencilIcon, PowerIcon, PowerOffIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, initials } from "@/lib/format";
import { CATEGORY_LABELS, type Vendor } from "./vendors.api";
import { VendorStatusBadge } from "./vendor-status-badge";

export const vendorTableFeatures = tableFeatures({ rowPaginationFeature });

const helper = createColumnHelper<typeof vendorTableFeatures, Vendor>();

/* lower-priority columns drop out as the viewport narrows; the vendor cell picks up the phone instead */
export const responsiveColumnClass: Record<string, string> = {
  category: "hidden sm:table-cell",
  phone: "hidden md:table-cell",
  createdAt: "hidden lg:table-cell",
};

export interface VendorRowActions {
  onEdit: (vendor: Vendor) => void;
  onToggleActive: (vendor: Vendor) => void;
}

export function vendorColumns({ onEdit, onToggleActive }: VendorRowActions) {
  return helper.columns([
    helper.accessor("name", {
      header: "Vendor",
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <div className="flex max-w-64 items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary/5 text-xs font-medium text-primary">
                {initials(vendor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">{vendor.name}</div>
              {vendor.contactName && (
                <div className="hidden truncate text-xs text-muted-foreground md:block">{vendor.contactName}</div>
              )}
              <div className="truncate text-xs text-muted-foreground tabular-nums md:hidden">{vendor.phone}</div>
            </div>
          </div>
        );
      },
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
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="tabular-nums">{row.original.phone}</div>
          {row.original.email && (
            <div className="max-w-56 truncate text-xs text-muted-foreground">{row.original.email}</div>
          )}
        </div>
      ),
    }),
    helper.accessor("isActive", {
      header: "Status",
      cell: ({ getValue }) => <VendorStatusBadge isActive={getValue()} />,
    }),
    helper.accessor("createdAt", {
      header: "Added",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground tabular-nums">{formatDate(getValue())}</span>
      ),
    }),
    helper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          /* stop row-level click (open editor) from firing when using the menu */
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${vendor.name}`} />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuItem onClick={() => onEdit(vendor)}>
                  <PencilIcon />
                  Edit details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {vendor.isActive ? (
                  <DropdownMenuItem variant="destructive" onClick={() => onToggleActive(vendor)}>
                    <PowerOffIcon />
                    Deactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onToggleActive(vendor)}>
                    <PowerIcon />
                    Reactivate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }),
  ]);
}
