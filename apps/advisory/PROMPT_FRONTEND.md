# Prompt para finalizar o frontend do 7M Advisory

Cole o texto abaixo (a partir de "## Contexto") em uma nova sessão do Claude Code apontada para
o repositório `AmigoLionXP/AmigoLion`, branch `claude/nextjs-nestjs-implementation-qdwo5t`.

---

## Contexto

Você vai construir o frontend do **7M Advisory** em `apps/advisory` (Next.js 14 App Router +
TypeScript + Tailwind). O **backend já está pronto e commitado** nesse mesmo diretório: schema
Drizzle, RLS multi-tenant no Postgres/Supabase, 19 rotas de API validadas com Zod, Stripe,
providers de WhatsApp/e-mail/IA, e PWA. Leia `apps/advisory/README.md` primeiro — ele explica
exatamente como a autenticação e o isolamento por tenant funcionam.

**Fonte de verdade do design** (não copiar código, é referência visual/comportamental):
- `apps/design_handoff_7m_advisory/README.md` — tokens, cópia, comportamento de cada tela.
- `apps/design_handoff_7m_advisory/7M Advisory.dc.html` — protótipo completo (landing + wizard +
  login + os 3 dashboards). Abra e navegue nele para ver layout, estados e microcopy reais.
- `apps/design_handoff_7m_advisory/screenshots/` — landing, login, dashboard do Member.
- `apps/design_handoff_7m_advisory/assets/` — logo dourada real (`7m-gold-mono.png`,
  `7m-gold-lockup.png`) — já copiada para `apps/advisory/public/assets/` e `public/icons/`, use-a.

## O que construir

Cinco telas, todas dentro de `apps/advisory/app/`:

1. **Landing pública** (`app/page.tsx`, hoje é um placeholder — substitua) — Header fixo com logo +
   "ADVISORY" + tagline, Hero com CTA "Ver meu próximo passo — grátis" (abre o wizard) e "Acessar
   plataforma" (login), seção de dores, o que fazemos por porte, tabela de planos 7M0-7M7, prova
   social, footer. Botões flutuantes de WhatsApp e "Guia 7M AI" em todas as telas.
2. **Wizard** (`app/wizard/` ou modal sobre a landing) — mesmos passos do protótipo: dados da
   empresa → maior desafio → cadastro (nome/e-mail) → resultado (próximo passo + especialista +
   plano sugerido). Chama `POST /api/wizard` (rota pública, já existe e está testada).
3. **Login/Cadastro** (`app/login/`) — use `lib/supabase/client.ts` (já existe):
   `supabase.auth.signInWithPassword()` para login, `supabase.auth.signUp({ email, password,
   options: { data: { full_name, role: 'member' } } })` para cadastro de Member. Depois do
   cadastro, chame `POST /api/me/company` (acabei de adicionar essa rota) para criar a empresa
   antes de mandar o usuário pro dashboard. Redirecione por papel após o login: leia o profile via
   `GET /api/me/company` (member) — se der 404, ainda não criou a empresa, manda pro formulário de
   setup; se dado o papel for rep/admin, redirecione para as rotas correspondentes.
4. **Dashboard do Member** (`app/dashboard/` com nav lateral) — 6 itens: Minha empresa, Minha
   esteira 7 passos, O Método 7M, Meus agentes de IA, Rede 7M · Circle, Marketplace. Puxe dados de
   `GET /api/me/company`, `GET /api/me/method-progress` (+ `PATCH .../method-progress/:stepN` para
   marcar progresso), `GET /api/marketplace` (+ `POST` para publicar, `POST .../interest` para
   demonstrar interesse), `GET/POST /api/me/give7`.
5. **Dashboard do Rep (Advisory Rep / City Leader)** — painel, minha rede, minhas comissões, meus
   eventos. Puxe de `GET /api/rep/region`.
6. **Dashboard do Admin (Advisory Admin)** — visão geral, arquitetura, simulador, moderar
   marketplace, admin. Puxe de `GET /api/admin/companies`, `GET /api/admin/metrics`,
   `GET /api/admin/transactions`, `PATCH /api/admin/verifications/:id`,
   `POST /api/admin/transactions/:id/charge-commission`.

## Tokens de design (de `design_handoff_7m_advisory/README.md`)

- Navy base `#0a1436` · Navy elevado `#0d183f` · Dourado claro `#E7C871` · Dourado médio `#C99A2E`
  · Laranja `#E9611A` (níveis 7M6-7M7) · Azul `#8FB4FF` (níveis 7M1-7M3) · Verde `#7bd88f`
  (receita recorrente).
- Fontes: Space Grotesk (títulos/números), Manrope (corpo), JetBrains Mono (kickers em caixa alta,
  `letter-spacing:.16-.18em`), Instrument Serif (acento pontual).
- `tailwind.config.ts` já tem esses tokens configurados (`navy`, `gold`, `orange`, `blue`, `green`,
  `text.*`, `font-display/body/mono/serif`) — use as classes Tailwind, não hardcode hex.

## Requisitos técnicos

- Next.js 14 App Router + Server Components onde fizer sentido; Client Components para forms e
  interatividade (wizard, chat, publicar oferta).
- Sessão: `lib/supabase/server.ts` (Server Components/Route Handlers) e
  `lib/supabase/client.ts` (Client Components) já existem — use-os, não crie um novo cliente
  Supabase.
- `middleware.ts` já refresca a sessão automaticamente — não mexer.
- Toda chamada a `/api/me/*`, `/api/rep/*`, `/api/admin/*` exige sessão válida — sem sessão, a API
  responde 401 (`{"error":"Não autenticado."}`), já testado. Trate esse caso na UI (redirecionar
  pro login).
- Zod já valida o corpo de cada rota — se o formulário mandar um campo com formato errado, a API
  responde 400 com `{"error":"Dados inválidos.","issues":[...]}` — mostre esses erros no form,
  não invente sua própria validação duplicada nem re-declare os schemas.
- 7M Copilot AI (`/api/chat`, já pronto e testado) — o botão flutuante "Guia 7M AI" chama essa
  rota com `{ question, diagDone, level }`.

## Restrições — não pular estas

1. **Sem prova social falsa.** O protótipo tem cases fictícios (Padaria do Bairro, MotoTech Peças
   +38%, etc.) — são dados de mockup, não clientes reais. **Não copie esses números/depoimentos
   como se fossem reais.** Ou usa placeholder visualmente marcado como exemplo ("ilustrativo"), ou
   deixa a seção vazia com um comentário `{/* TODO: casos reais aqui antes de lançar */}`. Isso é
   questão de propaganda enganosa (CDC), não só de estilo.
2. **Consentimento LGPD no wizard.** Antes de chamar `POST /api/wizard`, o formulário precisa de
   um checkbox de consentimento (linkando pra política de privacidade) — hoje isso não existe em
   lugar nenhum do backend nem do design, você precisa adicionar.
3. **Nunca chame Supabase Admin API do lado do cliente.** `SUPABASE_SERVICE_ROLE_KEY` é
   server-only — se algum fluxo parecer precisar dela no browser, é sinal que deveria ser uma
   nova rota em `app/api/`, não uma chamada direta do client.
4. **Não recrie lógica de tenant no frontend.** Não filtre listas por `companyId`/`regionId` no
   client "pra garantir" — a API já devolve só o que o RLS permite. Filtrar de novo no frontend
   esconde bug de permissão em vez de expor.

## Como saber que terminou

- `npm run build` limpo em `apps/advisory`.
- Fluxo completo testável manualmente: visitante → wizard → cadastro → dashboard do Member vazio
  → preenche a empresa → vê a esteira de 7 passos.
- Login como rep/admin (crie via `db/seed.ts`, que já cria os 3 logins demo — rodar
  `npm run db:seed` primeiro) mostra o dashboard certo pro papel certo.
- Nenhuma tela mostra dado inventado como se fosse real (ver restrição 1).
