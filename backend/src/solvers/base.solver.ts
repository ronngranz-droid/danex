import { SolverContext, SolverRawResponse } from '../types/solver.types';
import { SolverProvider } from '../providers/solver-provider.interface';

export abstract class BaseSolver {
  constructor(protected provider: SolverProvider) {}

  abstract getSubject(): string;
  abstract buildSpecializedPrompt(prompt: string, context: SolverContext): string;

  async solve(prompt: string, context: SolverContext): Promise<SolverRawResponse> {
    const specializedPrompt = this.buildSpecializedPrompt(prompt, context);
    return this.provider.solveText(specializedPrompt, context);
  }
}
