/* date-only values (YYYY-MM-DD) travel as strings: an event happens on a local day, with no time zone */

/* mirrors BUSINESS_TIME_ZONE in the backend: "today" is judged in Nepal time, wherever the browser is */
const BUSINESS_TIME_ZONE = "Asia/Kathmandu";

const isoDay = new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE });
const longDay = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export const businessToday = (): string => isoDay.format(new Date());

/* a calendar-picked Date (local midnight) to YYYY-MM-DD */
export const toDateOnly = (date: Date): string =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((part) => String(part).padStart(2, "0")).join("-");

/* YYYY-MM-DD to a local-midnight Date, for the calendar */
export const fromDateOnly = (day: string): Date => {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
};

/* formatted as UTC so the browser's offset never shifts the day */
export const formatDay = (day: string): string => longDay.format(new Date(`${day}T00:00:00Z`));

/* whole days from today (business time) until `day`; negative once it has passed */
export const daysUntil = (day: string): number =>
  Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${businessToday()}T00:00:00Z`)) / 86_400_000);
