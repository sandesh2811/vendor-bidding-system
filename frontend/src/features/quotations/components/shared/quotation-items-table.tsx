import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { QuotationItem } from "../../types";

/* the line items a vendor prices, in their saved order */
export function QuotationItemsTable({ items }: { items: QuotationItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-10 pl-4 text-xs text-muted-foreground">#</TableHead>
          <TableHead className="text-xs text-muted-foreground">Item</TableHead>
          <TableHead className="pr-4 text-right text-xs text-muted-foreground">Quantity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <TableRow key={item.id} className="hover:bg-transparent">
            <TableCell className="pl-4 align-top text-muted-foreground tabular-nums">{index + 1}</TableCell>
            <TableCell className="align-top whitespace-normal">
              <div className="font-medium">{item.name}</div>
              {item.notes && <div className="mt-0.5 text-xs text-muted-foreground">{item.notes}</div>}
            </TableCell>
            <TableCell className="pr-4 text-right align-top tabular-nums">
              {item.quantity.toLocaleString()}
              {item.unit && <span className="ml-1 text-muted-foreground">{item.unit}</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
