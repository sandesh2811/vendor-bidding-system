import { SectionCard } from "@/components/layout/section-card";
import type { QuotationContents, QuotationEvent } from "../../types";
import { EventFacts } from "./event-facts";
import { QuotationItemsTable } from "./quotation-items-table";

/* event facts, description and items: the part of a quotation the admin and its vendors both read */
export function QuotationOverview({ quotation }: { quotation: QuotationEvent & Pick<QuotationContents, "items"> }) {
  return (
    <>
      <SectionCard title="Event">
        <EventFacts quotation={quotation} />
        {quotation.description && (
          <p className="mt-5 border-t pt-5 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
            {quotation.description}
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Items"
        description={`${quotation.items.length} item${quotation.items.length === 1 ? "" : "s"} to price`}
        contentClassName="px-0"
      >
        <QuotationItemsTable items={quotation.items} />
      </SectionCard>
    </>
  );
}
