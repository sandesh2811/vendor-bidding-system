import { useState } from "react";

/* the "no filter" option value shared by every list filter select */
export const ALL = "all";
export type All = typeof ALL;

/* list filter state: changing or clearing any filter calls `onChange` (e.g. back to page one) */
export function useListFilters<TFilters extends Record<string, string>>(initial: TFilters, onChange: () => void) {
  const [filters, setFilters] = useState(initial);

  const setFilter = <TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    onChange();
  };

  const clearFilters = () => {
    setFilters(initial);
    onChange();
  };

  const hasFilters = (Object.keys(initial) as (keyof TFilters)[]).some((key) => filters[key] !== initial[key]);

  return { filters, setFilter, clearFilters, hasFilters };
}

/* the API param for a select filter: undefined for "all" */
export const unlessAll = <TValue extends string>(value: TValue | All): TValue | undefined =>
  value === ALL ? undefined : (value as TValue);
