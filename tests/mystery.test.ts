import { describe, expect, it } from "vitest";
import { mysteryKitDescription } from "@/lib/mystery";

describe("mystery kit copy", () => {
  it("always describes replica inventory without authenticity guarantees", () => {
    const copy = mysteryKitDescription();
    expect(copy.toLowerCase()).toContain("replica");
    expect(copy.toLowerCase()).not.toContain("genuine");
    expect(copy.toLowerCase()).not.toContain("guaranteed");
    expect(copy).not.toContain("$25");
  });
});
