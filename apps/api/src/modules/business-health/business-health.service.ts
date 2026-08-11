import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BAND_LABEL, HealthFactors, bandForScore, computeHealthScore } from './health-score';

const DEFAULT_ANSWER = 5; // neutral 0-10 midpoint when a diagnostic sub-factor is missing

export interface HealthReport {
  score: number;
  band: string; // machine key, e.g. "regular"
  bandLabel: { pt: string; en: string };
  factors: HealthFactors;
  trend: { deltaPct: number; direction: 'up' | 'down' | 'flat' };
  history: { score: number; createdAt: Date }[];
}

@Injectable()
export class BusinessHealthService {
  constructor(private prisma: PrismaService) {}

  private async computeFactors(companyId: string): Promise<HealthFactors> {
    const [diagnostic, stepRows, tasks] = await Promise.all([
      this.prisma.diagnostic.findFirst({
        where: { companyId, status: 'complete' },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.companyStepProgress.findMany({ where: { companyId }, select: { pct: true } }),
      this.prisma.task.findMany({ where: { companyId }, select: { done: true } }),
    ]);

    const respostas = (diagnostic?.respostas as Record<string, number>) ?? {};
    const execucaoMetodo =
      stepRows.length > 0 ? Math.round(stepRows.reduce((a, s) => a + s.pct, 0) / stepRows.length) : 0;
    // A brand-new company with no tasks yet shouldn't be penalised for 0% engagement —
    // neutral 50 until the 7M AI has actually generated something to execute.
    const engajamentoTarefas =
      tasks.length > 0 ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : 50;

    return {
      saudeFinanceira: respostas.saude_financeira ?? DEFAULT_ANSWER,
      previsibilidadeReceita: respostas.previsibilidade_receita ?? DEFAULT_ANSWER,
      riscoOperacional: respostas.risco_operacional ?? DEFAULT_ANSWER,
      capacidadeCrescimento: respostas.capacidade_crescimento ?? DEFAULT_ANSWER,
      governanca: respostas.governanca ?? DEFAULT_ANSWER,
      execucaoMetodo,
      engajamentoTarefas,
    };
  }

  /** Cheap live score only — no history query. Use wherever the app just needs "the number" (e.g. the Home header) without the full report. */
  async getLiveScore(companyId: string): Promise<number> {
    return computeHealthScore(await this.computeFactors(companyId));
  }

  /** Recomputes the score from current data and appends a snapshot — call this on meaningful events (a diagnostic completes, a method step completes), not on every read. */
  async recomputeAndPersist(companyId: string, reason: string) {
    const factors = await this.computeFactors(companyId);
    const score = computeHealthScore(factors);

    await this.prisma.$transaction([
      this.prisma.company.update({ where: { id: companyId }, data: { growthScore: score } }),
      this.prisma.growthScoreSnapshot.create({
        data: { companyId, score, reason, factors: factors as unknown as Prisma.InputJsonValue },
      }),
    ]);

    return { score, factors };
  }

  /** Live read: always recomputes factors fresh (cheap, index-backed queries) so the report never lags behind reality, and pairs it with the persisted history for trend. */
  async getReport(companyId: string): Promise<HealthReport> {
    const [factors, history] = await Promise.all([
      this.computeFactors(companyId),
      this.prisma.growthScoreSnapshot.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { score: true, createdAt: true },
      }),
    ]);
    const score = computeHealthScore(factors);
    const band = bandForScore(score);

    // Trend = movement since the oldest snapshot in this window, not the newest — comparing
    // against the just-persisted snapshot from the same event would trivially read 0 every
    // time (the live score *is* that snapshot's value the instant it's written).
    const oldest = history[history.length - 1]?.score;
    let deltaPct = 0;
    if (oldest && oldest > 0) deltaPct = Math.round(((score - oldest) / oldest) * 1000) / 10;
    const direction = deltaPct > 0.5 ? 'up' : deltaPct < -0.5 ? 'down' : 'flat';

    return {
      score,
      band,
      bandLabel: BAND_LABEL[band],
      factors,
      trend: { deltaPct, direction },
      history: history.reverse(),
    };
  }
}
