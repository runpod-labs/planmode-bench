import { describe, it, expect } from "vitest";
import {
  groupByCategory,
  findDuplicates,
  calculateRunningBalance,
  topSpenders,
  searchTransactions,
  processAll,
} from "../src/pipeline.js";
import { Transaction } from "../src/types.js";

const sampleTransactions: Transaction[] = [
  {
    id: "t1",
    userId: "alice",
    amount: 50.0,
    category: "food",
    date: "2025-01-15",
    description: "Grocery store purchase",
  },
  {
    id: "t2",
    userId: "bob",
    amount: 30.0,
    category: "transport",
    date: "2025-01-15",
    description: "Bus pass",
  },
  {
    id: "t3",
    userId: "alice",
    amount: 20.0,
    category: "food",
    date: "2025-01-16",
    description: "Coffee shop",
  },
  {
    id: "t4",
    userId: "alice",
    amount: 100.0,
    category: "shopping",
    date: "2025-01-17",
    description: "Online order",
  },
  {
    id: "t5",
    userId: "bob",
    amount: 50.0,
    category: "food",
    date: "2025-01-15",
    description: "Restaurant dinner",
  },
  {
    id: "t6",
    userId: "charlie",
    amount: 200.0,
    category: "travel",
    date: "2025-01-18",
    description: "Flight booking",
  },
  {
    id: "t7",
    userId: "alice",
    amount: 50.0,
    category: "food",
    date: "2025-01-15",
    description: "Another grocery purchase",
  },
  {
    id: "t8",
    userId: "bob",
    amount: 75.0,
    category: "entertainment",
    date: "2025-01-19",
    description: "Concert tickets",
  },
];

describe("groupByCategory", () => {
  it("should group transactions by category", () => {
    const groups = groupByCategory(sampleTransactions);

    expect(groups.length).toBeGreaterThan(0);

    const foodGroup = groups.find((g) => g.category === "food");
    expect(foodGroup).toBeDefined();
    expect(foodGroup!.transactions).toHaveLength(4);
    // t1: 50, t3: 20, t5: 50, t7: 50 = 170
    expect(foodGroup!.total).toBeCloseTo(170.0);
  });

  it("should include all categories", () => {
    const groups = groupByCategory(sampleTransactions);
    const categories = groups.map((g) => g.category).sort();
    expect(categories).toEqual([
      "entertainment",
      "food",
      "shopping",
      "transport",
      "travel",
    ]);
  });

  it("should correctly calculate totals", () => {
    const groups = groupByCategory(sampleTransactions);

    const transportGroup = groups.find((g) => g.category === "transport");
    expect(transportGroup).toBeDefined();
    expect(transportGroup!.total).toBeCloseTo(30.0);

    const shoppingGroup = groups.find((g) => g.category === "shopping");
    expect(shoppingGroup).toBeDefined();
    expect(shoppingGroup!.total).toBeCloseTo(100.0);
  });

  it("should handle empty input", () => {
    const groups = groupByCategory([]);
    expect(groups).toEqual([]);
  });
});

describe("findDuplicates", () => {
  it("should find transactions with same userId, amount, and date", () => {
    const duplicates = findDuplicates(sampleTransactions);

    // alice has two transactions with amount 50.00 on 2025-01-15 (t1 and t7)
    const aliceDup = duplicates.find(
      (d) => d.key === "alice|50|2025-01-15"
    );
    expect(aliceDup).toBeDefined();
    expect(aliceDup!.transactions).toHaveLength(2);
    expect(aliceDup!.transactions.map((t) => t.id).sort()).toEqual([
      "t1",
      "t7",
    ]);
  });

  it("should not flag non-duplicates", () => {
    const unique: Transaction[] = [
      {
        id: "u1",
        userId: "alice",
        amount: 10,
        category: "food",
        date: "2025-01-01",
        description: "A",
      },
      {
        id: "u2",
        userId: "alice",
        amount: 20,
        category: "food",
        date: "2025-01-01",
        description: "B",
      },
      {
        id: "u3",
        userId: "bob",
        amount: 10,
        category: "food",
        date: "2025-01-01",
        description: "C",
      },
    ];
    const duplicates = findDuplicates(unique);
    expect(duplicates).toHaveLength(0);
  });

  it("should handle empty input", () => {
    const duplicates = findDuplicates([]);
    expect(duplicates).toEqual([]);
  });

  it("should group more than two duplicates together", () => {
    const triplicates: Transaction[] = [
      {
        id: "x1",
        userId: "alice",
        amount: 25,
        category: "food",
        date: "2025-03-01",
        description: "A",
      },
      {
        id: "x2",
        userId: "alice",
        amount: 25,
        category: "transport",
        date: "2025-03-01",
        description: "B",
      },
      {
        id: "x3",
        userId: "alice",
        amount: 25,
        category: "shopping",
        date: "2025-03-01",
        description: "C",
      },
    ];
    const duplicates = findDuplicates(triplicates);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].transactions).toHaveLength(3);
  });
});

describe("calculateRunningBalance", () => {
  it("should calculate running balance for a user", () => {
    const entries = calculateRunningBalance(sampleTransactions, "alice");

    expect(entries).toHaveLength(4);

    // alice's transactions sorted by date:
    // t1: 2025-01-15, 50.00, balance: 50.00
    // t7: 2025-01-15, 50.00, balance: 100.00
    // t3: 2025-01-16, 20.00, balance: 120.00
    // t4: 2025-01-17, 100.00, balance: 220.00
    expect(entries[0].balance).toBeCloseTo(50.0);
    expect(entries[entries.length - 1].balance).toBeCloseTo(220.0);
  });

  it("should return empty array for unknown user", () => {
    const entries = calculateRunningBalance(sampleTransactions, "unknown");
    expect(entries).toEqual([]);
  });

  it("should sort by date", () => {
    const entries = calculateRunningBalance(sampleTransactions, "alice");
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].date >= entries[i - 1].date).toBe(true);
    }
  });

  it("should handle single transaction", () => {
    const single: Transaction[] = [
      {
        id: "s1",
        userId: "zoe",
        amount: 42.5,
        category: "food",
        date: "2025-06-01",
        description: "Single",
      },
    ];
    const entries = calculateRunningBalance(single, "zoe");
    expect(entries).toHaveLength(1);
    expect(entries[0].balance).toBeCloseTo(42.5);
    expect(entries[0].transactionId).toBe("s1");
  });
});

describe("topSpenders", () => {
  it("should return top N spenders sorted by total", () => {
    const result = topSpenders(sampleTransactions, 2);

    expect(result).toHaveLength(2);
    // alice: 50 + 20 + 100 + 50 = 220
    // charlie: 200
    // bob: 30 + 50 + 75 = 155
    expect(result[0].userId).toBe("alice");
    expect(result[0].totalSpent).toBeCloseTo(220.0);
    expect(result[1].userId).toBe("charlie");
    expect(result[1].totalSpent).toBeCloseTo(200.0);
  });

  it("should include transaction counts", () => {
    const result = topSpenders(sampleTransactions, 3);
    const alice = result.find((s) => s.userId === "alice");
    expect(alice).toBeDefined();
    expect(alice!.transactionCount).toBe(4);
  });

  it("should handle N larger than user count", () => {
    const result = topSpenders(sampleTransactions, 100);
    expect(result).toHaveLength(3); // only 3 unique users
  });

  it("should handle empty input", () => {
    const result = topSpenders([], 5);
    expect(result).toEqual([]);
  });
});

describe("searchTransactions", () => {
  it("should find transactions by description substring", () => {
    const results = searchTransactions(sampleTransactions, "grocery");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((t) => /grocery/i.test(t.description))).toBe(true);
  });

  it("should be case-insensitive", () => {
    const results = searchTransactions(sampleTransactions, "COFFEE");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("t3");
  });

  it("should return empty for no matches", () => {
    const results = searchTransactions(sampleTransactions, "nonexistent");
    expect(results).toEqual([]);
  });

  it("should handle special regex characters in query", () => {
    const special: Transaction[] = [
      {
        id: "sp1",
        userId: "alice",
        amount: 10,
        category: "food",
        date: "2025-01-01",
        description: "Price was $5.00 (discounted)",
      },
    ];
    const results = searchTransactions(special, "$5.00");
    expect(results).toHaveLength(1);
  });
});

describe("processAll", () => {
  it("should return combined results", () => {
    const result = processAll(sampleTransactions, 2);

    expect(result.categoryGroups.length).toBeGreaterThan(0);
    expect(result.duplicates.length).toBeGreaterThanOrEqual(0);
    expect(result.topSpenders).toHaveLength(2);
  });

  it("should produce consistent results", () => {
    const result1 = processAll(sampleTransactions, 3);
    const result2 = processAll(sampleTransactions, 3);

    expect(result1.categoryGroups.length).toBe(result2.categoryGroups.length);
    expect(result1.topSpenders.length).toBe(result2.topSpenders.length);
    expect(result1.duplicates.length).toBe(result2.duplicates.length);
  });
});
