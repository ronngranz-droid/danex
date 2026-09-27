import { SolverContext } from '../types/solver.types';
import { BaseSolver } from './base.solver';

export class ProgrammingSolver extends BaseSolver {
  getSubject(): string {
    return 'programming';
  }

  buildSpecializedPrompt(prompt: string, context: SolverContext): string {
    return `[PROGRAMMING & COMPUTER SCIENCE SPECIALIST INSTRUCTION]
Solve the coding, debugging, algorithm, or logic problem.
Requirements:
1. Provide readable, idiomatic code inside the "codeSnippet" JSON field ({ "language": "...", "code": "..." }).
2. For syntax errors or debugging questions, pinpoint the exact line, reason for bug, and corrected snippet.
3. For output prediction, trace variable values step-by-step through loops and conditionals.
4. Mode: ${context.mode}.

Question / Code:
${prompt}`;
  }
}
