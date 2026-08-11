/**
 * Business Health Engine — the scoring formula.
 * Pure function, kept separate from the DB-touching service so the weights/logic
 * are easy to read, test and tune without touching Prisma calls.
 *
 * Blends the intake diagnostic (financial health, revenue predictability, risk,
 * growth capacity, governance — each answered 0-10) with two *live* signals the
 * diagnostic can't see: how far the company has actually progressed through the
 * Método 7M, and how much of its 7M AI-generated task list it executes. That's
 * what makes this a "living" score instead of a snapshot frozen at onboarding.
 */
export interface HealthFactors {
  saudeFinanceira: number; // 0-10, from diagnostics.respostas
  previsibilidadeReceita: number; // 0-10
  riscoOperacional: number; // 0-10 (phrased so higher = better managed)
  capacidadeCrescimento: number; // 0-10
  governanca: number; // 0-10
  execucaoMetodo: number; // 0-100, avg % across the 7 method steps
  engajamentoTarefas: number; // 0-100, % of generated tasks completed
}

const WEIGHTS = {
  saudeFinanceira: 0.25,
  previsibilidadeReceita: 0.2,
  riscoOperacional: 0.15,
  capacidadeCrescimento: 0.15,
  governanca: 0.1,
  execucaoMetodo: 0.1,
  engajamentoTarefas: 0.05,
} as const;

/** Returns a 0-1000 score (same scale the app already shows: "612 / 1000"). */
export function computeHealthScore(f: HealthFactors): number {
  const weighted =
    f.saudeFinanceira * 10 * WEIGHTS.saudeFinanceira +
    f.previsibilidadeReceita * 10 * WEIGHTS.previsibilidadeReceita +
    f.riscoOperacional * 10 * WEIGHTS.riscoOperacional +
    f.capacidadeCrescimento * 10 * WEIGHTS.capacidadeCrescimento +
    f.governanca * 10 * WEIGHTS.governanca +
    f.execucaoMetodo * WEIGHTS.execucaoMetodo +
    f.engajamentoTarefas * WEIGHTS.engajamentoTarefas;
  return Math.round(weighted * 10);
}

export type HealthBand = 'critico' | 'fraco' | 'regular' | 'bom' | 'excelente';

export function bandForScore(score: number): HealthBand {
  if (score < 300) return 'critico';
  if (score < 500) return 'fraco';
  if (score < 700) return 'regular';
  if (score < 850) return 'bom';
  return 'excelente';
}

export const BAND_LABEL: Record<HealthBand, { pt: string; en: string }> = {
  critico: { pt: 'Crítico — atenção imediata', en: 'Critical — needs attention now' },
  fraco: { pt: 'Fraco — em estruturação', en: 'Weak — under construction' },
  regular: { pt: 'Regular — em evolução', en: 'Fair — improving' },
  bom: { pt: 'Bom — consolidado', en: 'Good — consolidated' },
  excelente: { pt: 'Excelente — referência', en: 'Excellent — benchmark' },
};
