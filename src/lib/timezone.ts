const TIME_ZONE = "Australia/Sydney";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatSydneyDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatSydneyTime(date: Date): string {
  return timeFormatter.format(date);
}
