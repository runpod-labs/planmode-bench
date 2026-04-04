export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default: 3 */
  maxAttempts?: number;
  /** Base delay in milliseconds. Default: 1000 */
  baseDelayMs?: number;
  /** Maximum delay cap in milliseconds. Default: 30000 */
  maxDelayMs?: number;
  /** Optional label for logging */
  label?: string;
}

/**
 * Determine if an error is a transient API failure worth retrying.
 * Retries: network errors, rate limits (429), server errors (5xx), Anthropic overload.
 * Does NOT retry: auth errors (401, 403), bad request (400), logic errors.
 */
export function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const msg = error.message.toLowerCase();

  // Network-level errors
  if (
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("etimedout") ||
    msg.includes("socket hang up") ||
    msg.includes("network") ||
    msg.includes("fetch failed")
  ) {
    return true;
  }

  // Anthropic-specific transient errors
  if (msg.includes("overloaded") || msg.includes("rate limit")) {
    return true;
  }

  // Check for status property (common in API SDK errors)
  if ("status" in error) {
    const status = (error as any).status;
    if (typeof status === "number" && (status === 429 || (status >= 500 && status < 600))) {
      return true;
    }
  }

  return false;
}

/**
 * Execute an async function with exponential backoff retry.
 * Only retries transient errors; non-transient errors throw immediately.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    label = "operation",
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !isTransientError(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const jitter = delay * 0.3 * (Math.random() * 2 - 1);
      const totalDelay = Math.max(0, Math.round(delay + jitter));

      console.warn(
        `  [retry] ${label} attempt ${attempt}/${maxAttempts} failed: ${(error as Error).message}. Retrying in ${totalDelay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError;
}
