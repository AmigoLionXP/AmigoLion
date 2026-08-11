export interface ChatContext {
  diagDone: boolean;
  level: string; // 7M1..7M7 — which plan the chip selector was on when they asked
}

export interface AiProvider {
  reply(question: string, context: ChatContext): Promise<string>;
}

const PRICE_MAP: Record<string, string> = {
  '7M1': 'R$ 1.000/mês',
  '7M2': 'R$ 2.000/mês',
  '7M3': 'R$ 3.000/mês',
  '7M4': 'R$ 4.000/mês',
  '7M5': 'R$ 5.000/mês',
  '7M6': 'R$ 6.000/mês',
  '7M7': 'R$ 7.000/mês',
};
const COMM_MAP: Record<string, string> = { '7M1': '1%', '7M2': '2%', '7M3': '3%', '7M4': '4%', '7M5': '5%', '7M6': '6%', '7M7': '7%' };
const NAME_MAP: Record<string, string> = {
  '7M1': 'Empreendedor',
  '7M2': 'Núcleo',
  '7M3': 'Capítulo',
  '7M4': 'Região',
  '7M5': 'Hub Estadual',
  '7M6': 'Rede Nacional',
  '7M7': 'Rede Global',
};

/**
 * Ports the design prototype's `botAnswer()` verbatim (same regex routing, same copy) — a real,
 * deterministic assistant, not a placeholder that just echoes the question. This is the default
 * provider so the platform never pretends to have a live LLM connected when it doesn't.
 */
class ScriptedAiProvider implements AiProvider {
  async reply(question: string, context: ChatContext): Promise<string> {
    const q = question.toLowerCase();

    if (!context.diagDone) {
      if (/quem|somos|7market|voc[eê]|consultor|time|equipe/.test(q)) {
        return 'Somos uma equipe de consultores especializados no mercado de varejo e em empreendedores. Criamos o método 7M para levar empresas do diagnóstico ao patrimônio, unindo especialistas humanos e agentes de IA. O primeiro passo é o diagnóstico gratuito — em 1 clique você descobre onde o seu negócio trava.';
      }
      if (/diagn|come[cç]|primeiro|start|come[cç]ar/.test(q)) {
        return 'É gratuito e leva 2 minutos: você responde duas perguntas, vê o seu próximo passo e quem conduz. É a partir dele que o método se revela para o seu caso. Quer começar agora?';
      }
      if (/atend|meu neg|tipo|serve|varejo|setor/.test(q)) {
        return 'Atendemos pequenos, médios e grandes empreendedores — com foco em varejo e serviços, do Brasil à Europa. O jeito de saber se serve para você é o diagnóstico gratuito: ele mostra exatamente onde podemos ajudar.';
      }
      return 'Antes dos detalhes, vamos entender o seu negócio. Somos consultores especializados em varejo e empreendedores e criamos o método 7M (especialistas humanos + IA, do diagnóstico ao patrimônio). Faça o diagnóstico gratuito em 1 clique — depois eu te explico exatamente o que se aplica a você.';
    }

    const lv = context.level in PRICE_MAP ? context.level : '7M1';
    if (/pre|valor|custa|mensal|quanto/.test(q)) {
      return `No nível ${lv} (${NAME_MAP[lv]}) a mensalidade é ${PRICE_MAP[lv]}, com todos os 7 passos inclusos. Existe também o plano de entrada 7M0 a R$ 497/mês para quem está começando.`;
    }
    if (/comiss|taxa|intermedia/.test(q)) {
      return `A comissão do ${lv} é de ${COMM_MAP[lv]} sobre qualquer transação de compra e venda intermediada pela 7M Advisory — dentro ou fora do ecossistema. Ela sobe 1 ponto a cada nível.`;
    }
    if (/passo|método|metodo|etapa/.test(q)) {
      return 'O método 7M Advisory tem 7 passos: 1 Diagnosticar, 2 Qualificar, 3 Organizar, 4 Crescer, 5 Capitalizar, 6 Escalar, 7 Valorizar. Do diagnóstico ao patrimônio. Cada passo é conduzido por um especialista + um agente de IA.';
    }
    if (/market|vender|anunci|comprar/.test(q)) {
      return `No Marketplace você publica produtos, serviços ou intenções de compra. No ${lv}, negócios fechados pela 7M Advisory pagam ${COMM_MAP[lv]} de comissão.`;
    }
    if (/sobe|avan|próx|proxi|evolu|nível|nivel/.test(q)) {
      return `Você sobe de nível quando a empresa cresce — do ${lv} (${NAME_MAP[lv]}) para o próximo. A mensalidade só reajusta quando você sobe.`;
    }
    if (/whats|falar|contato|humano|especialista/.test(q)) {
      return `Você pode falar com um especialista humano pelo WhatsApp. No ${lv}, seu especialista responsável acompanha os passos correspondentes.`;
    }
    return `Boa pergunta! No seu nível ${lv} (${NAME_MAP[lv]}, ${PRICE_MAP[lv]}, comissão ${COMM_MAP[lv]}), isso é acompanhado pelo seu especialista + agente de IA. Quer que eu detalhe método, preços, comissões ou marketplace?`;
  }
}

/** Real LLM-backed provider. Activate with ANTHROPIC_API_KEY in .env. */
class AnthropicAiProvider implements AiProvider {
  constructor(private apiKey: string) {}

  async reply(question: string, context: ChatContext): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 400,
        system: `Você é o Guia 7M AI da 7M Advisory. Responda em português, curto e direto. Contexto do usuário: diagnóstico ${context.diagDone ? 'concluído' : 'não concluído'}, nível ${context.level}. Preços: 7M0 R$497, 7M1 R$1000 (1%) … 7M7 R$7000 (7%). Método: Diagnosticar, Qualificar, Organizar, Crescer, Capitalizar, Escalar, Valorizar.`,
        messages: [{ role: 'user', content: question }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { content: { type: string; text?: string }[] };
    return data.content.find((c) => c.type === 'text')?.text ?? 'Não consegui responder agora — tente de novo em instantes.';
  }
}

export function getAiProvider(): AiProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) return new AnthropicAiProvider(apiKey);
  return new ScriptedAiProvider();
}
