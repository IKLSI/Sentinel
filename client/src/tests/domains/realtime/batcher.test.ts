import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInvalidationBatcher } from "@/domains/realtime/batcher";

const BATCH_MS = 300;

describe("createInvalidationBatcher", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should flush deduplicated keys once per window", () => {
    const flush = vi.fn();
    const batcher = createInvalidationBatcher(flush, BATCH_MS);

    batcher.enqueue([["projects"], ["dashboard"]]);
    batcher.enqueue([["projects"], ["tickets", "42"]]);
    vi.advanceTimersByTime(BATCH_MS - 1);

    expect(flush).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(flush).toHaveBeenCalledTimes(1);
    expect(flush).toHaveBeenCalledWith([
      ["projects"],
      ["dashboard"],
      ["tickets", "42"],
    ]);
  });

  it("should open a new window after a flush", () => {
    const flush = vi.fn();
    const batcher = createInvalidationBatcher(flush, BATCH_MS);

    batcher.enqueue([["projects"]]);
    vi.advanceTimersByTime(BATCH_MS);
    batcher.enqueue([["projects"]]);
    vi.advanceTimersByTime(BATCH_MS);

    expect(flush).toHaveBeenCalledTimes(2);
  });

  it("should drop pending keys when cleared", () => {
    const flush = vi.fn();
    const batcher = createInvalidationBatcher(flush, BATCH_MS);

    batcher.enqueue([["projects"]]);
    batcher.clear();
    vi.advanceTimersByTime(BATCH_MS);

    expect(flush).not.toHaveBeenCalled();
  });

  it("should not schedule a flush for an empty event", () => {
    const flush = vi.fn();
    const batcher = createInvalidationBatcher(flush, BATCH_MS);

    batcher.enqueue([]);
    vi.advanceTimersByTime(BATCH_MS);

    expect(flush).not.toHaveBeenCalled();
  });
});
