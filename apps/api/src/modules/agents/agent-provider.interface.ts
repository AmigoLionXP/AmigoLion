export interface AgentRunInput {
  agentKey: string;
  companyId: string;
  message: string;
  context: Record<string, unknown>;
  lang: 'pt' | 'en';
}

export interface AgentRunOutput {
  reply: string;
  /** high risk == regulated service (accounting/legal/capital) → must go through audit_queue */
  riskLevel: 'low' | 'high';
  suggestedActions?: string[];
}

/**
 * Provider-agnostic interface (backend_contract.md: "camada de IA deve ser
 * abstraída atrás de uma interface AgentProvider"). Swap MockAgentProvider for
 * a Claude/OpenAI-backed implementation without touching callers.
 */
export abstract class AgentProvider {
  abstract run(input: AgentRunInput): Promise<AgentRunOutput>;
}
