/* NPR with 2 decimals as integer cents: exact, unlike float math. Amounts are never negative (DB CHECKs) */

/* for DTO numbers with at most 2 decimals */
export const toCents = (amount: number): bigint =>
  BigInt(Math.round(amount * 100));

/* for numeric(12,2) strings from the DB, e.g. "125000.00" */
export const parseCents = (amount: string): bigint => {
  const [whole, fraction = ''] = amount.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2));
};

export const formatCents = (cents: bigint): string =>
  `${cents / 100n}.${(cents % 100n).toString().padStart(2, '0')}`;
