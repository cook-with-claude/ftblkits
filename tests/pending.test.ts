import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { begin, isPending, reset } from "@/lib/pending";

// This store is the single source of truth for the navigation progress bar and
// the favicon spinner, so the property that actually matters is that it always
// drains. A leaked slot means a bar and a spinning tab that never stop, which
// reads as a hung page — strictly worse than showing no feedback at all.

describe("pending store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    reset();
  });

  it("stays pending until every overlapping slot ends", () => {
    const navigation = begin();
    const upload = begin();

    // A route change and an admin upload can overlap. The first to finish must
    // not clear the indicators while the other is still running.
    navigation();
    expect(isPending()).toBe(true);

    upload();
    expect(isPending()).toBe(false);
  });

  it("releases a leaked slot after the hard cap", () => {
    begin(); // never ended — a rejected promise with no catch, say
    expect(isPending()).toBe(true);

    vi.advanceTimersByTime(10_000);
    expect(isPending()).toBe(false);
  });

  it("ignores an end() called twice", () => {
    const first = begin();
    const second = begin();

    first();
    first();
    // Two begins, one genuinely ended, so still pending. Without the guard the
    // repeat call would have released the second slot as well.
    expect(isPending()).toBe(true);

    second();
    expect(isPending()).toBe(false);
  });

  it("disarms the cap timer once a slot ends normally", () => {
    const end = begin();
    end();
    expect(isPending()).toBe(false);

    // A still-armed timeout would decrement again here. The counter floors at
    // zero so it could not go negative, but a later begin() must still register.
    vi.advanceTimersByTime(20_000);

    const next = begin();
    expect(isPending()).toBe(true);
    next();
    expect(isPending()).toBe(false);
  });

  it("drains everything on reset", () => {
    begin();
    begin();
    begin();
    expect(isPending()).toBe(true);

    // What a settled navigation calls: anything still outstanding belonged to
    // the page that was just left.
    reset();
    expect(isPending()).toBe(false);
  });
});
