import type { ComparedBid } from "../types";

/* a 0 price means "not offered": such a bid doesn't cover all the work */
export const isComplete = (bid: ComparedBid) => bid.items.every((item) => Number(item.unitPrice) > 0);

/**
 * The comparison hints (never a decision): the lowest offered price per item, and the cheapest
 * bid among those that price every item. Ties highlight every tied bid.
 */
export function compareBids(bids: ComparedBid[]) {
  const cheapestPerItem = new Map<string, number>();
  for (const bid of bids)
    for (const item of bid.items) {
      const price = Number(item.unitPrice);
      const best = cheapestPerItem.get(item.quotationItemId);
      if (price > 0 && (best === undefined || price < best)) cheapestPerItem.set(item.quotationItemId, price);
    }

  const complete = bids.filter(isComplete);
  const cheapestTotal = complete.length ? Math.min(...complete.map((bid) => Number(bid.totalAmount))) : null;

  return {
    isCheapestItem: (quotationItemId: string, unitPrice: string) =>
      Number(unitPrice) > 0 && cheapestPerItem.get(quotationItemId) === Number(unitPrice),
    isCheapestTotal: (bid: ComparedBid) => isComplete(bid) && Number(bid.totalAmount) === cheapestTotal,
  };
}
