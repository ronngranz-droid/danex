import { FollowUpMessage, SolverContext, SolverRawResponse } from '../types/solver.types';

export interface SolverProvider {
  readonly id: string;
  readonly name: string;

  solveText(prompt: string, context: SolverContext): Promise<SolverRawResponse>;

  solveImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    context: SolverContext
  ): Promise<SolverRawResponse>;

  solveFollowUp(
    history: FollowUpMessage[],
    context: SolverContext
  ): Promise<SolverRawResponse>;
}
