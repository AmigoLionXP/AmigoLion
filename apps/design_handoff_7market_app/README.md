# Handoff: 7MARKET Growth Office — App (mobile-first PWA)

## Visão geral
Este pacote entrega o **app do empreendedor** do 7MARKET: o sistema operacional do crescimento
diário que responde a 4 perguntas — *Como está minha empresa? / O que preciso fazer hoje? /
Quem pode me ajudar? / Estou evoluindo?* — através de Growth Score, Método 7M, Cabine do CEO,
tarefas geradas por IA, Growth Manager e a 7M AI.

Ele é o **frontend `client`** do sistema descrito em `design_handoff_backend/README.md`. Aquele
README continua sendo a **fonte de verdade do backend** (modelo de dados, papéis, regras de
override, pipeline de auditoria, API REST). Este documento cobre só o app e como cada tela
consome aquela API.

## Sobre os arquivos deste pacote
`7MARKET App.dc.html` é um **artefato de design em HTML** — protótipo hi-fi mostrando aparência,
copy (PT/EN) e comportamento pretendidos. **Não é código de produção para copiar.** A tarefa é
**recriar estas telas no ambiente alvo** (recomendado: **Next.js / React** no front, consumindo a
API NestJS/Postgres/Prisma do pacote de backend) usando os padrões do próprio codebase. Não jogue
o HTML inteiro no gerador de código — use este README e abra o HTML só para conferir um detalhe.

## Fidelidade
**Hi-fi.** Cores, tipografia, espaçamentos, estados e fluxo são finais. Recrie pixel-a-pixel com a
biblioteca de UI do codebase.

## Plataforma / responsividade / PWA
- **PWA instalável.** `manifest.webmanifest` (display `standalone`, orientação `portrait`, tema
  `#0B2149`, ícones 192/512/maskable + apple-touch) e `sw.js` (service worker, cache offline
  stale-while-revalidate do shell).
- **Registro do SW:** só quando roda como página top-level em http(s); dentro de iframe/editor o
  script se auto-desregistra e limpa cache (evita servir versão velha). Replicar essa guarda em
  produção conforme o ambiente.
- **Responsivo por dispositivo** (breakpoint **760px**):
  - **< 760px (celular / PWA instalado):** tela cheia edge-to-edge, sem moldura. Navegação por
    **bottom tab bar** (5 abas). Respeitar safe-areas (topo ~58px, base ~26px para o home indicator).
  - **≥ 760px (notebook/desktop):** vira **web app** — grid de 2 colunas: **sidebar** fixa de
    236px à esquerda (mesmas 5 abas na vertical) + cabeçalho e conteúdo largo à direita, conteúdo
    com `max-width` 920–1040px centralizado; grids de cards passam a 3 colunas.

## Design tokens
- **Cores:** fundo `#08132C` / navy `#0B2149` / azul profundo `#0d2a5e`; dourado da marca
  `#C99A2E`→`#F4D48A` (gradiente 140deg em CTAs e destaques); azul-IA `#8FB4FF`; verde-status
  `#5ee08a`; texto `#e8eef7`, secundário `#8ea0bc`/`#b6c4db`; bordas `rgba(255,255,255,.06–.1)`.
- **Superfícies:** cards `rgba(255,255,255,.035)` com borda `rgba(255,255,255,.08)`.
- **Tipografia:** títulos/números **Space Grotesk** (700); corpo **Manrope** (400–800); rótulos e
  métricas monoespaçados **JetBrains Mono** (letter-spacing .1–.16em, uppercase).
- **Raios:** cards 16–22px; chips/botões 9–15px; nav-item 13px. **Blur** 14–18px em barras.
- **Animações:** `msgin` (fade+slide 8px, .2s) em bolhas de chat; `ovin` (fade+slide 24px, .28s)
  em overlays.

## Estrutura de navegação
5 abas principais + hub "Mais" (grid no topo direito da app bar) que abre 11 telas secundárias.
Overlays cobrem o app (`position:absolute; inset:0`) para detalhe de passo, "Mais" e telas do hub.

### Abas principais
1. **Início (Home)** — header da empresa com Growth Score circular (ex.: 612/1000, lógica de score
   de crédito), **Next Best Action** (hero: gargalo detectado → recomendação da 7M AI + CTA, ex.:
   "falta de clientes novos" → 7M4 Crescer) e trilha visual do Método 7M (7 passos).
2. **Painel** — 6 cards: Growth Score, Receita, Clientes, Plano 7M, Manager, IA (grid 2 col mobile / 3 col desktop).
3. **Método 7M** — barra de progresso geral + 7 passos (Diagnosticar, Qualificar, Organizar,
   Crescer, Capitalizar, Escalar, Valorizar) com status `done/em andamento/próximo/bloqueado`.
   Toque abre **overlay de detalhe**: objetivo, especialista, prazo, checklist, recursos, "Resolver agora".
4. **7M AI** — chat contextual (conhece empresa, score, planos); chips de sugestão; input.
5. **Cabine do CEO** — 5 indicadores executivos (saúde, crescimento, caixa, oportunidades, próxima prioridade).

### Hub "Mais" (11 telas)
Tarefas · Growth Manager · Minha empresa · Financeiro · Documentos · Oportunidades · Marketplace ·
Business Circle · Relatórios · Notificações · Configurações.

## Estado (frontend)
`lang` (pt|en), `tab` (home|painel|metodo|ai|ceo), `openStep`, `more` (hub aberto), `screen` (tela do hub),
`tasks[]`, `chat[]`. Todo o app é **bilíngue** — cada string tem par pt/en; toggle no header.

## Mapa Tela → Endpoint (consome a API do pacote de backend)
| Tela | Endpoint(s) |
|---|---|
| Início / header + Growth Score | `GET /me/company` |
| Início / Next Best Action | `GET /me/company` (gargalo, growth_score) + `POST /agent-runs` (recomendação IA) |
| Início / trilha 7M | `GET /me/company/steps` |
| Painel (6 cards) | `GET /me/company` + `GET /me/commissions` (se aplicável) |
| Método 7M (lista + detalhe) | `GET /me/company/steps` — **gated** por `diagnostics.status=complete` |
| Método / "Resolver agora" | `POST /agent-runs` |
| 7M AI (chat) | `POST /agent-runs` (via `AgentProvider` abstrato) |
| Cabine do CEO | `GET /admin/metrics` escopado ao tenant, ou derivado de `GET /me/company` |
| Tarefas | `GET/POST /tasks` *(criar no backend; hoje mock no protótipo)* |
| Growth Manager | dados do `rep`/manager vinculado à `membership` |
| Financeiro | `subscriptions` do tenant |
| Notificações | eventos/agent_runs do tenant |

> Todas as rotas resolvem o papel `client` e aplicam RLS por `tenant_id`. Método só libera após
> diagnóstico completo. Ações em serviço regulado passam pela `audit_queue` (ver backend README).

## Assets
Ícones/logos em `/assets` do projeto (`7m-icon.png`, etc.) e ícones PWA em `/assets/icons/`
(`pwa-192.png`, `pwa-512.png`, `apple-touch.png`). Fontes via Google Fonts (Space Grotesk, Manrope,
JetBrains Mono). Fotos de especialistas/manager são placeholders — substituir por reais.

## Arquivos neste pacote
- `7MARKET App.dc.html` — protótipo hi-fi, todas as telas, bilíngue, responsivo, PWA.
- `manifest.webmanifest`, `sw.js` — configuração PWA.
- `../design_handoff_backend/README.md` — **contrato de backend (fonte de verdade dos dados/API)**.
