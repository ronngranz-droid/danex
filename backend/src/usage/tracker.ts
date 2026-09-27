export interface UsageStats {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  errorCount: number;
  budgetTokens: number;
  remainingTokens: number;
  usagePercentage: number;
  warning80Exceeded: boolean;
  warning95Exceeded: boolean;
  budgetExhausted: boolean;
}

export class UsageTracker {
  private totalRequests: number = 0;
  private totalInputTokens: number = 0;
  private totalOutputTokens: number = 0;
  private errorCount: number = 0;
  private budgetTokens: number;

  constructor(budgetTokens?: number) {
    const envBudget = process.env.DANEX_TOKEN_BUDGET
      ? parseInt(process.env.DANEX_TOKEN_BUDGET, 10)
      : undefined;
    this.budgetTokens = budgetTokens || envBudget || 1_000_000;
  }

  recordUsage(inputTokens: number, outputTokens: number, isError: boolean = false): void {
    this.totalRequests += 1;
    this.totalInputTokens += Math.max(0, inputTokens);
    this.totalOutputTokens += Math.max(0, outputTokens);
    if (isError) {
      this.errorCount += 1;
    }
  }

  recordError(): void {
    this.totalRequests += 1;
    this.errorCount += 1;
  }

  getStats(): UsageStats {
    const totalTokens = this.totalInputTokens + this.totalOutputTokens;
    const remainingTokens = Math.max(0, this.budgetTokens - totalTokens);
    const usagePercentage = Number(((totalTokens / this.budgetTokens) * 100).toFixed(2));

    return {
      totalRequests: this.totalRequests,
      totalInputTokens: this.totalInputTokens,
      totalOutputTokens: this.totalOutputTokens,
      totalTokens,
      errorCount: this.errorCount,
      budgetTokens: this.budgetTokens,
      remainingTokens,
      usagePercentage,
      warning80Exceeded: usagePercentage >= 80,
      warning95Exceeded: usagePercentage >= 95,
      budgetExhausted: totalTokens >= this.budgetTokens
    };
  }

  setBudget(newBudget: number): void {
    if (newBudget > 0) {
      this.budgetTokens = newBudget;
    }
  }

  reset(): void {
    this.totalRequests = 0;
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
    this.errorCount = 0;
  }
}

// Global shared singleton for the backend process
export const globalUsageTracker = new UsageTracker();
