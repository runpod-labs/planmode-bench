import { describe, it, expect } from "vitest";
import {
  groupByCategory,
  findDuplicates,
  calculateRunningBalance,
  topSpenders,
  searchTransactions,
  processAll,
} from "../src/pipeline.js";
import {
  generateTransactions,
  generateTransactionsWithDuplicates,
} from "../src/data-generator.js";

describe("performance: groupByCategory", () => {
  it("should process 50k transactions in under 50ms", () => {
    const transactions = generateTransactions(50_000, 1);

    const start = performance.now();
    const result = groupByCategory(transactions);
    const elapsed = performance.now() - start;

    expect(result.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(50);
  });
});

describe("performance: findDuplicates", () => {
  it("should process 10k transactions in under 100ms", () => {
    const transactions = generateTransactionsWithDuplicates(9_000, 1_000, 2);

    const start = performance.now();
    const result = findDuplicates(transactions);
    const elapsed = performance.now() - start;

    expect(result.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(100);
  });
});

describe("performance: calculateRunningBalance", () => {
  it("should process 50k transactions in under 50ms", () => {
    const transactions = generateTransactions(50_000, 3);
    const userId = "user-0";

    const start = performance.now();
    const result = calculateRunningBalance(transactions, userId);
    const elapsed = performance.now() - start;

    expect(result.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(50);
  });
});

describe("performance: topSpenders", () => {
  it("should process 50k transactions in under 50ms", () => {
    const transactions = generateTransactions(50_000, 4);

    const start = performance.now();
    const result = topSpenders(transactions, 10);
    const elapsed = performance.now() - start;

    expect(result).toHaveLength(10);
    expect(elapsed).toBeLessThan(50);
  });
});

describe("performance: searchTransactions", () => {
  it("should search 100k transactions in under 50ms", () => {
    const transactions = generateTransactions(100_000, 5);

    const start = performance.now();
    const result = searchTransactions(transactions, "grocery");
    const elapsed = performance.now() - start;

    expect(result.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(50);
  });
});

describe("performance: processAll", () => {
  it("should process full pipeline on 20k transactions in under 200ms", () => {
    const transactions = generateTransactionsWithDuplicates(18_000, 2_000, 6);

    const start = performance.now();
    const result = processAll(transactions, 10);
    const elapsed = performance.now() - start;

    expect(result.categoryGroups.length).toBeGreaterThan(0);
    expect(result.topSpenders).toHaveLength(10);
    expect(elapsed).toBeLessThan(200);
  });
});
