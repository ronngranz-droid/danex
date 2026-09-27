import { SolverContext } from '../types/solver.types';
import { BaseSolver } from './base.solver';

export class PhysicsSolver extends BaseSolver {
  getSubject(): string {
    return 'physics';
  }

  buildSpecializedPrompt(prompt: string, context: SolverContext): string {
    return `[PHYSICS SPECIALIST INSTRUCTION]
Solve the physics problem with complete physical and scientific accuracy.
Requirements:
1. Always preserve SI units (m/s, N, J, W, kg, Pa, etc.) throughout the calculations and final answer.
2. State the governing physics laws and formulas explicitly in the explanation or steps.
3. Preserve standard scientific notation (e.g., 3.0 x 10^8 m/s, 9.8 m/s^2) without corrupting exponent formatting.
4. Mode: ${context.mode}. If LEARN, break down given variables (Diketahui), required target (Ditanya), and formula step (Penyelesaian).

Problem:
${prompt}`;
  }
}
