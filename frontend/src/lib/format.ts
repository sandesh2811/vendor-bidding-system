const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

const moneyFormat = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* NPR; the API sends amounts as decimal strings */
export const formatMoney = (amount: string | number) => `Rs ${moneyFormat.format(Number(amount))}`;

/* largest NPR amount the API accepts (numeric(12,2)); mirrors BID.MAX_UNIT_PRICE and PAYMENT.MAX_AMOUNT */
export const MONEY_MAX = 9_999_999_999.99;
