import {
  Transaction,
  CategoryGroup,
  DuplicateGroup,
  RunningBalanceEntry,
  SpenderSummary,
  PipelineResult,
} from "./types.js";

/**
 * Groups transactions by category and calculates totals.
 *
 * KNOWN PERFORMANCE ISSUE: Uses array.find and array.filter instead of a Map,
 * and recalculates totals with reduce on every insert.
 */
export function groupByCategory(transactions: Transaction[]): CategoryGroup[] {
  const groups: CategoryGroup[] = [];

  for (const transaction of transactions) {
    // SLOW: Linear scan through groups for every transaction
    const existingGroup = groups.find(
      (g) => g.category === transaction.category
    );

    if (existingGroup) {
      existingGroup.transactions.push(transaction);
      // SLOW: Recalculate total using reduce instead of just adding the amount
      existingGroup.total = existingGroup.transactions.reduce(
        (sum, t) => sum + t.amount,
        0
      );
    } else {
      groups.push({
        category: transaction.category,
        transactions: [transaction],
        total: transaction.amount,
      });
    }
  }

  return groups;
}

/**
 * Finds duplicate transactions (same userId + amount + date).
 *
 * KNOWN PERFORMANCE ISSUE: Compares every pair of transactions O(n^2).
 */
export function findDuplicates(transactions: Transaction[]): DuplicateGroup[] {
  const duplicateGroups: DuplicateGroup[] = [];

  // SLOW: Compare every transaction against every other transaction
  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < transactions.length; j++) {
      const a = transactions[i];
      const b = transactions[j];

      if (
        a.userId === b.userId &&
        a.amount === b.amount &&
        a.date === b.date
      ) {
        const key = `${a.userId}|${a.amount}|${a.date}`;

        // SLOW: Linear scan to find if this duplicate group already exists
        let found = false;
        for (const group of duplicateGroups) {
          if (group.key === key) {
            let aExists = false;
            let bExists = false;
            for (const t of group.transactions) {
              if (t.id === a.id) aExists = true;
              if (t.id === b.id) bExists = true;
            }
            if (!aExists) group.transactions.push(a);
            if (!bExists) group.transactions.push(b);
            found = true;
            break;
          }
        }

        if (!found) {
          duplicateGroups.push({
            key,
            transactions: [a, b],
          });
        }
      }
    }
  }

  return duplicateGroups;
}

/**
 * Calculates running balance for a specific user, sorted by date.
 *
 * KNOWN PERFORMANCE ISSUE: For each user transaction, rescans the entire
 * transactions array to re-filter and re-sort user transactions, then
 * recalculates the running balance from scratch.
 */
export function calculateRunningBalance(
  transactions: Transaction[],
  userId: string
): RunningBalanceEntry[] {
  // First pass: count how many transactions this user has
  let userCount = 0;
  for (const t of transactions) {
    if (t.userId === userId) {
      userCount++;
    }
  }

  const entries: RunningBalanceEntry[] = [];

  // SLOW: For each user transaction position, rescan the ENTIRE transactions
  // array to filter, sort, and compute balance from scratch
  for (let position = 0; position < userCount; position++) {
    // Rescan all transactions to find this user's transactions
    const userTransactions: Transaction[] = [];
    for (const t of transactions) {
      if (t.userId === userId) {
        userTransactions.push(t);
      }
    }

    // Re-sort every iteration
    userTransactions.sort((a, b) => a.date.localeCompare(b.date));

    // Recalculate balance up to this position
    let balance = 0;
    for (let j = 0; j <= position; j++) {
      balance += userTransactions[j].amount;
    }
    balance = Math.round(balance * 100) / 100;

    entries.push({
      transactionId: userTransactions[position].id,
      amount: userTransactions[position].amount,
      balance,
      date: userTransactions[position].date,
    });
  }

  return entries;
}

/**
 * Returns the top N spenders.
 *
 * KNOWN PERFORMANCE ISSUE: For each unique user, rescans the entire
 * transactions array to calculate their total, then uses bubble sort.
 */
export function topSpenders(
  transactions: Transaction[],
  n: number
): SpenderSummary[] {
  // SLOW: Collect unique user IDs by scanning array with includes check
  const userIds: string[] = [];
  for (const t of transactions) {
    if (!userIds.includes(t.userId)) {
      userIds.push(t.userId);
    }
  }

  // SLOW: For each user, scan ALL transactions to calculate their total
  const summaries: SpenderSummary[] = [];
  for (const userId of userIds) {
    let total = 0;
    let count = 0;
    for (const t of transactions) {
      if (t.userId === userId) {
        total += t.amount;
        count++;
      }
    }
    summaries.push({
      userId,
      totalSpent: Math.round(total * 100) / 100,
      transactionCount: count,
    });
  }

  // SLOW: Bubble sort to order by totalSpent descending
  for (let i = 0; i < summaries.length; i++) {
    for (let j = 0; j < summaries.length - i - 1; j++) {
      if (summaries[j].totalSpent < summaries[j + 1].totalSpent) {
        const temp = summaries[j];
        summaries[j] = summaries[j + 1];
        summaries[j + 1] = temp;
      }
    }
  }

  return summaries.slice(0, n);
}

/**
 * Searches transactions by description text.
 *
 * KNOWN PERFORMANCE ISSUE: Creates a new RegExp for every transaction
 * and does a linear dedup scan on the results array.
 */
export function searchTransactions(
  transactions: Transaction[],
  query: string
): Transaction[] {
  const results: Transaction[] = [];

  for (const transaction of transactions) {
    // SLOW: Create a brand new RegExp for every transaction
    const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const match = pattern.test(transaction.description);

    if (match) {
      // SLOW: Check if already added by scanning results array
      let alreadyAdded = false;
      for (const r of results) {
        if (r.id === transaction.id) {
          alreadyAdded = true;
          break;
        }
      }

      if (!alreadyAdded) {
        results.push(transaction);
      }
    }
  }

  return results;
}

/**
 * Runs the full processing pipeline.
 */
export function processAll(
  transactions: Transaction[],
  topN: number = 10
): PipelineResult {
  const categoryGroups = groupByCategory(transactions);
  const duplicates = findDuplicates(transactions);
  const topSpendersList = topSpenders(transactions, topN);

  return {
    categoryGroups,
    duplicates,
    topSpenders: topSpendersList,
  };
}
