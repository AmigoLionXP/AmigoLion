/**
 * Growth Score — deterministic, bank-credit-analysis-style heuristic (0-1000).
 * `respostas` maps question keys to a 0-10 answer; each carries a weight so the
 * total reflects financial health, predictability, risk and capacity to grow
 * (see design_handoff_7market_app/README.md).
 */
const WEIGHTS: Record<string, number> = {
  saude_financeira: 1.4,
  previsibilidade_receita: 1.3,
  risco_operacional: 1.1,
  capacidade_crescimento: 1.2,
  governanca: 1.0,
};
const MAX_PER_ANSWER = 10;

export function computeGrowthScore(respostas: Record<string, number>): number {
  const entries = Object.entries(respostas);
  if (entries.length === 0) return 300; // baseline for an empty/partial diagnostic

  let weightedSum = 0;
  let weightTotal = 0;
  for (const [key, raw] of entries) {
    const weight = WEIGHTS[key] ?? 1;
    const answer = Math.max(0, Math.min(MAX_PER_ANSWER, Number(raw) || 0));
    weightedSum += answer * weight;
    weightTotal += MAX_PER_ANSWER * weight;
  }
  const ratio = weightTotal > 0 ? weightedSum / weightTotal : 0;
  return Math.round(ratio * 1000);
}
