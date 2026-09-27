import { SolverProvider } from '../providers/solver-provider.interface';
import { SolverContext, SolverRawResponse, SubjectType } from '../types/solver.types';
import { BaseSolver } from './base.solver';
import { ChemistrySolver } from './chemistry.solver';
import { GeneralAcademicSolver } from './general.solver';
import { MathSolver } from './math.solver';
import { PhysicsSolver } from './physics.solver';
import { ProgrammingSolver } from './programming.solver';

export class SubjectRouter {
  private solvers: Map<string, BaseSolver> = new Map();
  private generalSolver: GeneralAcademicSolver;

  constructor(private provider: SolverProvider) {
    this.generalSolver = new GeneralAcademicSolver(provider);
    this.solvers.set('mathematics', new MathSolver(provider));
    this.solvers.set('physics', new PhysicsSolver(provider));
    this.solvers.set('chemistry', new ChemistrySolver(provider));
    this.solvers.set('programming', new ProgrammingSolver(provider));
    this.solvers.set('informatics', new ProgrammingSolver(provider));
  }

  getSolver(subject: SubjectType): BaseSolver {
    return this.solvers.get(subject) || this.generalSolver;
  }

  async routeAndSolve(prompt: string, context: SolverContext): Promise<SolverRawResponse> {
    const subject = context.subject || 'general';
    const solver = this.getSolver(subject);
    return solver.solve(prompt, context);
  }
}
