/** Mirrors the `challenges` table baked into the design prototype's wizardVals(). */
export const WIZARD_CHALLENGES = {
  growth: { spec: 'Growth & Marketing Specialist', step: 4, plan: '7M3' },
  finance: { spec: 'Financial Advisor', step: 3, plan: '7M2' },
  owner: { spec: 'Business Strategist', step: 2, plan: '7M2' },
  capital: { spec: 'Financial Advisor', step: 5, plan: '7M4' },
  scale: { spec: 'Operations & Scale Specialist', step: 6, plan: '7M5' },
  legacy: { spec: 'Wealth & Legacy Advisor', step: 7, plan: '7M6' },
} as const;

export type WizardChallenge = keyof typeof WIZARD_CHALLENGES;

export function resolveWizardOutcome(challenge: WizardChallenge) {
  return WIZARD_CHALLENGES[challenge];
}
