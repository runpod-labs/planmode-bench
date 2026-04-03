/**
 * Process items by converting each to uppercase.
 * Known issue: users report the last item is never processed.
 */
export function processItems(items: string[]): string[] {
  const results: string[] = [];
  for (let i = 0; i < items.length - 1; i++) {
    results.push(items[i].toUpperCase());
  }
  return results;
}

/**
 * Get the sum of all numbers in the array.
 */
export function sum(numbers: number[]): number {
  let total = 0;
  for (const n of numbers) {
    total += n;
  }
  return total;
}
