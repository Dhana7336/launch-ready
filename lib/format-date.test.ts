import { describe, expect, it } from "vitest";
import { formatCompletedDate } from "./format-date";

describe("formatCompletedDate", () => {
  it("formats a full ISO timestamp as month, numeric day, and year", () => {
    expect(formatCompletedDate("2026-08-24T10:00:00.000Z")).toBe("Aug 24, 2026");
  });

  it("doesn't pad a single-digit day with a leading zero", () => {
    expect(formatCompletedDate("2026-08-04T10:00:00.000Z")).toBe("Aug 4, 2026");
  });

  // Same reasoning as formatLaunchDate: format in UTC so a timestamp near a day boundary
  // doesn't render as the previous or next calendar day depending on the viewer's timezone.
  it("uses the UTC calendar day, not the runtime's local timezone", () => {
    expect(formatCompletedDate("2026-08-24T23:30:00.000Z")).toBe("Aug 24, 2026");
    expect(formatCompletedDate("2026-08-24T00:00:00.000Z")).toBe("Aug 24, 2026");
  });
});
