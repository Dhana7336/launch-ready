// launchDate is stored as a date-only ISO string (e.g. "2026-09-15"). Parsing it as UTC
// and formatting in UTC keeps the calendar day stable regardless of the viewer's timezone
// (otherwise `new Date("2026-09-15")` at midnight UTC renders as the previous day west of it).
export function formatLaunchDate(
  isoDate: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "2-digit" }
): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    ...options,
    timeZone: "UTC",
  });
}

// completedAt is a full ISO timestamp (from Date.toISOString()), not a date-only string
// like launchDate — so, unlike formatLaunchDate, this doesn't need to synthesize a
// T00:00:00Z suffix; the timestamp already carries a time. Still formatted in UTC so the
// displayed date can't shift a day depending on the viewer's timezone.
export function formatCompletedDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
