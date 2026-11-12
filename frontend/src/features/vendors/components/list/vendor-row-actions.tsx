"use client";

import { LandmarkIcon, MoreHorizontalIcon, PencilIcon, PowerIcon, PowerOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Vendor } from "../../types";

export interface VendorRowActionHandlers {
  onEdit: (vendor: Vendor) => void;
  onPaymentDetails: (vendor: Vendor) => void;
  onToggleActive: (vendor: Vendor) => void;
}

export function VendorRowActions({ vendor, onEdit, onPaymentDetails, onToggleActive }: VendorRowActionHandlers & { vendor: Vendor }) {
  return (
    /* stop the row-level click (open editor) from firing when using the menu */
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${vendor.name}`} />}
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem onClick={() => onEdit(vendor)}>
            <PencilIcon />
            Edit details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPaymentDetails(vendor)}>
            <LandmarkIcon />
            Payment details
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
}
