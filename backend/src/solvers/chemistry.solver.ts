import { SolverContext } from '../types/solver.types';
import { BaseSolver } from './base.solver';

export class ChemistrySolver extends BaseSolver {
  getSubject(): string {
    return 'chemistry';
  }

  buildSpecializedPrompt(prompt: string, context: SolverContext): string {
    return `[CHEMISTRY SPECIALIST INSTRUCTION]
Solve the chemistry problem accurately.
Requirements:
1. Preserve chemical formulas with proper subscripts and superscripts (e.g., H₂O, CO₂, SO₄²⁻).
2. For chemical reactions, ensure all reaction equations are balanced with stoichiometric coefficients and reaction arrows (→).
3. If stoichiometry/molarity is involved, show unit conversions (mol, gram, L) clearly.
4. Mode: ${context.mode}.

Problem:
${prompt}`;
  }
}
