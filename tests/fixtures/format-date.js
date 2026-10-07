const formatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
});

/**
Formats `date` as a long date in UTC, such as "October 7, 2026".
*/
export function formatDate(date) {
  return formatter.format(date);
}
