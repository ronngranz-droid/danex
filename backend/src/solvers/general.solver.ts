import { SolverContext } from '../types/solver.types';
import { BaseSolver } from './base.solver';

export class GeneralAcademicSolver extends BaseSolver {
  getSubject(): string {
    return 'general';
  }

  buildSpecializedPrompt(prompt: string, context: SolverContext): string {
    return `[ACADEMIC STUDY ASSISTANT INSTRUCTION]
Solve the academic question with academic precision and clarity.
Subject Context: ${context.subject || 'general'}
Language: ${context.language || 'id'}
Mode: ${context.mode}

Requirements:
1. If multiple choice, identify the correct letter option (A-E) and explain why it is correct.
2. If options are incomplete or cut off, return status "INCOMPLETE_QUESTION" without guessing.
3. Be clear, concise, and focused on core learning concepts.

Question:
${prompt}`;
  }
}
