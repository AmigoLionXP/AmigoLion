# Handoff: 7MARKET — Backend

## Por que este pacote existe
O arquivo `7MARKET Plataforma.dc.html` é um **artefato de design** (HTML único, ~1.500 linhas, com estilos, dados mock e todas as telas inline). Ele é ótimo como referência visual, mas **pesado e inadequado como ponto de partida de backend** — não jogue o HTML inteiro no Claude Code. Use **este pacote** em vez disso: ele descreve o modelo de dados, a API, os papéis/permissões e as regras de negócio em texto enxuto. Abra as telas HTML só quando precisar conferir um detalhe específico.

## Stack sugerida
Stack-agnóstico, mas otimizado para: **Postgres + Supabase** (auth, RLS multi-tenant e Row Level Security prontos) ou **Node/Express + Postgres + Prisma**. A camada de IA deve ser **abstraída** (provider-agnostic: Claude/OpenAI/outro) atrás de uma interface `AgentProvider`.

## Papéis de acesso (4)
| Papel | Quem | Vê | NÃO vê |
|---|---|---|---|
| `public` | visitante | vitrine + diagnóstico gratuito | método, preços, dados de empresas |
| `client` | empreendedor (1 CNPJ = 1 tenant) | só a própria empresa: Growth Score, esteira, tarefas, agentes, rede, marketplace | outras empresas, MRR, comissões, backoffice |
| `rep` | representante 7M1–7M7 | seu nível/faixa, sua rede (downline), comissões, eventos | dados de admin, empresas fora da sua rede |
| `admin` | sede 7MARKET | tudo: todas as empresas, MRR/ARR, comissões, usuários, moderação | — |

**Isolamento é crítico:** cliente nunca acessa dados de outro cliente; representante só vê a própria downline; método só libera após diagnóstico concluído. Implementar via RLS por `tenant_id` / `owner_id`, não só no frontend.

## Modelo de dados (entidades principais)
- **users** — id, email, role (`public|client|rep|admin`), created_at
- **companies** (tenant) — id, owner_user_id, cnpj, nome, setor, faturamento_anual, growth_score (0–7), nivel_7m (1–7), created_at
- **diagnostics** — id, company_id, gargalo, respostas(jsonb), growth_score, status (`partial|complete`), created_at
- **method_steps** — 7 passos fixos (Diagnosticar…Valorizar); progresso por empresa em **company_step_progress** (company_id, step_n, pct, status)
- **reps** — id, user_id, nivel (1–7 = Comunit…Internacional), faixa_faturamento, upline_rep_id (auto-relacional p/ downline), city
- **memberships** — liga company_id ↔ rep_id (quem trouxe o cliente) — base do override empilhado
- **subscriptions** — id, company_id, plano, valor_mensal, status, started_at
- **commissions** — id, subscription_id, rep_id, nivel, pct, valor, mes_referencia
- **events** — id, rep_id, tipo (`comunit|connect|round|summit`), data, faixa, status
- **agents** / **agent_runs** — execuções de IA; ver pipeline de auditoria abaixo
- **audit_queue** — runs classificados como alto risco aguardando validação humana + assinatura digital

## Regras de negócio (o núcleo)
1. **Override empilhado.** Numa assinatura, cada nível da cadeia acima do cliente recebe seu %: 7M1=1% … 7M7=7%. Cadeia completa repassa até **28%**. Calcular subindo `upline_rep_id` a partir do rep da `membership`. Persistir cada fatia em `commissions`.
2. **Teto e margem-piso.** O total de override por assinatura nunca pode passar de 28%; a sede mantém uma margem-piso configurável. Validar antes de gravar comissões.
3. **Comissão incide sobre a assinatura (produto entregue)**, nunca sobre recrutamento — importante para enquadramento jurídico (BR + Europa).
4. **Gate do método.** `method_steps` detalhados só ficam acessíveis a um `client` cujo `diagnostics.status = complete`.
5. **Pipeline de auditoria (diferenciador).** agente executa → mestre classifica risco → **baixo risco: processa em lote** / **alto risco: entra na `audit_queue`** para especialista humano validar e assinar digitalmente. Toda ação em serviço regulado (contábil/jurídico/capital) exige validação humana obrigatória.
6. **Faixa por moeda/mercado.** faixas de faturamento são por praça; guardar moeda no tenant para internacionalização (BR R$, Europa CHF/EUR).

## API (esboço REST)
```
POST /diagnostics                 público → cria diagnóstico parcial, retorna growth_score
POST /leads                       captura contato (WhatsApp/email) do diagnóstico
GET  /me/company                  client → sua empresa (RLS)
GET  /me/company/steps            client → progresso da esteira (gated por diagnóstico)
GET  /me/network                  rep → downline
GET  /me/commissions?mes=         rep → comissões do mês
POST /events                      rep → cria evento
GET  /admin/companies             admin → todas (paginado)
GET  /admin/metrics               admin → MRR/ARR/comissões
GET  /admin/audit-queue           admin/especialista → fila de alto risco
POST /agent-runs                  dispara agente (via AgentProvider abstrato)
POST /audit-queue/:id/sign        especialista valida + assina
```
Auth por sessão/JWT; toda rota resolve papel e aplica escopo (tenant/downline). 

## Arquivos de referência (abrir só quando necessário)
- `7MARKET - Modelo Simplificado.dc.html` — escada, faixas, override, conta ilustrativa (a fonte das regras)
- `7MARKET - Arquitetura.dc.html` — camadas, papéis, taxonomia da marca
- `7MARKET - Brief para Consultor.dc.html` — visão de negócio completa
- `7MARKET Plataforma.dc.html` — UI de referência (pesado; consultar por trecho, não inteiro)

## Fidelidade
As telas HTML são **hi-fi** (cores, tipografia e fluxo finais). Recrie-as no ambiente alvo (React/Vue/etc.) com os padrões do próprio codebase — não copie o HTML. Este backend serve exatamente os dados que essas telas consomem.
