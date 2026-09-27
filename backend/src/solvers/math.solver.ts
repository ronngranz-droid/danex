import { SolverContext } from '../types/solver.types';
import { BaseSolver } from './base.solver';

export class MathSolver extends BaseSolver {
  getSubject(): string {
    return 'mathematics';
  }

  buildSpecializedPrompt(prompt: string, context: SolverContext): string {
    return `[MATHEMATICS SPECIALIST INSTRUCTION]
Solve the mathematical problem with canonical mathematical rigor.
Requirements:
1. Always format final mathematical expressions in standard LaTeX (e.g., \\frac{a}{b}, \\sqrt{x}, x^2, \\int, \\sum) inside the "latex" JSON field.
2. In ${context.mode} mode:
   - QUICK: Give the precise final numerical or algebraic answer immediately in "answer" and "shortAnswer".
   - LEARN: Show detailed algebraic steps in "steps", listing equation transformations step-by-step.
3. If options (A-E) are present, verify each option against the computed value and set "answerOption".
4. Never return unformatted raw formulas.

Problem:
${prompt}`;
  }
}
