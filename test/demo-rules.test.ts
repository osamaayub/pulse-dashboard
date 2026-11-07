import { describe, expect, it } from "vitest";
import { resetDue, tooSoon } from "../src/server/demo-rules";

const now = new Date("2026-11-07T20:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);

describe("automatic demo reset", () => {
  it("is due once the data is older than the limit", () => {
    expect(resetDue(hoursAgo(25), now, 24)).toBe(true);
    expect(resetDue(hoursAgo(24), now, 24)).toBe(true);
  });
  it("is not due for fresh data", () => {
    expect(resetDue(hoursAgo(3), now, 24)).toBe(false);
  });
  it("never runs when turned off or when the age is unknown", () => {
    expect(resetDue(hoursAgo(500), now, 0)).toBe(false);
    expect(resetDue(null, now, 24)).toBe(false);
  });
});

describe("reset button limit", () => {
  it("blocks a second reset within a minute", () => {
    expect(tooSoon(new Date(now.getTime() - 30_000), now)).toBe(true);
    expect(tooSoon(new Date(now.getTime() - 61_000), now)).toBe(false);
    expect(tooSoon(null, now)).toBe(false);
  });
});
