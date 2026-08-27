import { describe, expect, it } from "vitest";
import { toggleCheckpoint } from "./actions";

// Only the validation-failure path is testable here without a request/cookie context —
// the success path calls readOverrides() (cookies()), which throws outside a real request
// the same way it would for lib/products.ts's cookie-aware functions. That's fine: this
// test exists specifically to prove the thing that changed — invalid input returns a typed
// error instead of throwing — and the success/persistence path is already covered by
// e2e/checkpoint-toggle.spec.ts against a real running app.
describe("toggleCheckpoint", () => {
  it("returns a typed error for an unknown product instead of throwing", async () => {
    const result = await toggleCheckpoint(
      "does-not-exist",
      "info",
      { status: "idle" },
      new FormData()
    );
    expect(result.status).toBe("error");
  });

  it("returns a typed error for a real product but an unknown checkpoint id", async () => {
    const result = await toggleCheckpoint(
      "spring-comfort-set",
      "does-not-exist",
      { status: "idle" },
      new FormData()
    );
    expect(result.status).toBe("error");
  });
});
