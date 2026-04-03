import { describe, it, expect } from "vitest";
import { processItems, sum } from "../src/utils.js";

describe("processItems", () => {
  it("should process all items in the array", () => {
    expect(processItems(["hello", "world", "foo"])).toEqual([
      "HELLO",
      "WORLD",
      "FOO",
    ]);
  });

  it("should handle a single item", () => {
    expect(processItems(["test"])).toEqual(["TEST"]);
  });

  it("should handle two items", () => {
    expect(processItems(["a", "b"])).toEqual(["A", "B"]);
  });

  it("should return empty array for empty input", () => {
    expect(processItems([])).toEqual([]);
  });
});

describe("sum", () => {
  it("should sum numbers correctly", () => {
    expect(sum([1, 2, 3])).toBe(6);
  });

  it("should return 0 for empty array", () => {
    expect(sum([])).toBe(0);
  });
});
