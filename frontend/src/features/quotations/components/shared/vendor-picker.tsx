"use client";

import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { activeVendorsQuery } from "@/features/vendors/api/vendors.api";
import { CATEGORY_LABELS } from "@/features/vendors/constants";
import type { Vendor } from "@/features/vendors/types";

const NONE: string[] = [];

/* multi-select of active vendors, as ids; `excludeIds` hides vendors that already have the quotation */
export function VendorPicker({
  id,
  value,
  onChange,
  excludeIds = NONE,
}: {
  id?: string;
  value: string[];
  onChange: (vendorIds: string[]) => void;
  excludeIds?: string[];
}) {
  const anchor = useComboboxAnchor();
  const { data: vendors = [], isPending, isError, refetch } = useQuery(activeVendorsQuery());

  const options = useMemo(() => vendors.filter((vendor) => !excludeIds.includes(vendor.id)), [vendors, excludeIds]);
  const selected = useMemo(() => options.filter((vendor) => value.includes(vendor.id)), [options, value]);

  if (isError)
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
        Couldn&apos;t load vendors
        <Button type="button" variant="ghost" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );

  return (
    <Combobox
      multiple
      items={options}
      value={selected}
      onValueChange={(next: Vendor[]) => onChange(next.map((vendor) => vendor.id))}
      itemToStringLabel={(vendor: Vendor) => vendor.name}
      isItemEqualToValue={(a: Vendor, b: Vendor) => a.id === b.id}
    >
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(chosen: Vendor[]) => (
            <Fragment>
              {chosen.map((vendor) => (
                <ComboboxChip key={vendor.id}>{vendor.name}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                id={id}
                disabled={isPending}
                placeholder={isPending ? "Loading vendors…" : chosen.length ? "" : "Search vendors"}
              />
            </Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No active vendors match.</ComboboxEmpty>
        <ComboboxList>
          {(vendor: Vendor) => (
            <ComboboxItem key={vendor.id} value={vendor}>
              <span className="truncate">{vendor.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{CATEGORY_LABELS[vendor.category]}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
