import { Transaction } from "./types.js";

const CATEGORIES = [
  "food",
  "transport",
  "entertainment",
  "utilities",
  "shopping",
  "health",
  "education",
  "travel",
];

const DESCRIPTIONS = [
  "Grocery store purchase",
  "Monthly subscription",
  "Online order",
  "Restaurant dinner",
  "Gas station",
  "Pharmacy",
  "Coffee shop",
  "Movie tickets",
  "Bus pass",
  "Electric bill",
  "Water bill",
  "Book purchase",
  "Gym membership",
  "Flight booking",
  "Hotel stay",
  "Taxi ride",
  "Concert tickets",
  "Clothing store",
  "Hardware store",
  "Insurance premium",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function generateTransactions(
  count: number,
  seed: number = 42
): Transaction[] {
  const random = seededRandom(seed);
  const transactions: Transaction[] = [];
  const userCount = Math.max(10, Math.floor(count / 100));

  for (let i = 0; i < count; i++) {
    const userId = `user-${Math.floor(random() * userCount)}`;
    const category = CATEGORIES[Math.floor(random() * CATEGORIES.length)];
    const description =
      DESCRIPTIONS[Math.floor(random() * DESCRIPTIONS.length)];
    const amount = Math.round(random() * 50000) / 100;
    const dayOffset = Math.floor(random() * 365);
    const date = new Date(2025, 0, 1 + dayOffset).toISOString().split("T")[0];

    transactions.push({
      id: `txn-${i}`,
      userId,
      amount,
      category,
      date,
      description,
    });
  }

  return transactions;
}

export function generateTransactionsWithDuplicates(
  count: number,
  duplicateCount: number,
  seed: number = 42
): Transaction[] {
  const transactions = generateTransactions(count, seed);

  const random = seededRandom(seed + 999);

  for (let i = 0; i < duplicateCount; i++) {
    const sourceIdx = Math.floor(random() * Math.min(count, transactions.length));
    const source = transactions[sourceIdx];

    transactions.push({
      id: `txn-dup-${i}`,
      userId: source.userId,
      amount: source.amount,
      category: source.category,
      date: source.date,
      description: source.description + " (duplicate)",
    });
  }

  return transactions;
}
