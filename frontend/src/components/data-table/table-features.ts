import {
  type ColumnHelper,
  createColumnHelper,
  type RowData,
  rowPaginationFeature,
  tableFeatures,
} from "@tanstack/react-table";

/* every list in the app is server-paginated: one feature set, so column helpers and DataTable agree on types */
export const pageTableFeatures = tableFeatures({ rowPaginationFeature });
export type PageTableFeatures = typeof pageTableFeatures;

export const columnHelper = <TData extends RowData>() => createColumnHelper<PageTableFeatures, TData>();

export type DataTableColumns<TData extends RowData> = ReturnType<ColumnHelper<PageTableFeatures, TData>["columns"]>;

/* column id to classes applied to its header and cells, e.g. hiding low-priority columns on narrow screens */
export type ColumnClasses = Partial<Record<string, string>>;
