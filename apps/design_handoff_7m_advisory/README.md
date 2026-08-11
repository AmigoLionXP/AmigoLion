# Handoff: 7M Advisory — Plataforma Web + PWA

## Overview
7M Advisory é uma consultoria de crescimento para PMEs estruturada em torno do **Método 7M** (7 passos, do diagnóstico ao patrimônio, conduzidos por especialistas humanos + agentes de IA). Este pacote entrega o **site/plataforma unificado**: uma landing pública de conversão, um funil de convicção (wizard de cadastro), e três áreas logadas por papel — **7M Member**, **Advisory Rep** (City Leader) e **Advisory Admin** (sede/HQ). Há também um app mobile (PWA) irmão e um documento de arquitetura de negócio.

O objetivo do produto é converter visitantes em assinantes de um plano por nível (7M0–7M7), operar a esteira do método por empresa, rodar um marketplace/rede de negócios entre membros, e dar à sede visão de MRR, comissões e usuários.

## About the Design Files
Os arquivos deste pacote são **referências de design criadas em HTML** — protótipos que mostram aparência e comportamento pretendidos, **não código de produção para copiar diretamente**. Eles usam um runtime de preview (React em runtime, arquivo `support.js`) com **dados totalmente fake** e **logins-demo**. A tarefa é **recriar estes designs no ambiente do codebase-alvo** (React/Next.js recomendado; ou o framework que a equipe escolher) com autenticação, banco de dados e integrações reais, seguindo os padrões estabelecidos do projeto.

## Fidelity
**Alta fidelidade (hifi).** Cores, tipografia, espaçamentos, estados e microcopy estão definidos e devem ser reproduzidos fielmente. A responsividade (mobile → desktop) já está resolvida via CSS classes utilitárias no `<helmet>` do arquivo principal.

---

## Marca & Design Tokens

### Cores
| Token | Hex | Uso |
|---|---|---|
| Navy base (fundo) | `#0a1436` | fundo principal do site |
| Navy elevado | `#0d183f` | cards, footer, aside dos dashboards |
| Navy do ícone | `#0c1a3a` | placa de fundo do monograma |
| Dourado claro | `#E7C871` | destaques, números, "ADVISORY", CTA gradiente |
| Dourado médio | `#C99A2E` | kickers/labels mono, gradientes |
| Laranja (topo escada) | `#E9611A` | níveis 7M6–7M7, camada Capital & Deals |
| Azul (base escada) | `#8FB4FF` | níveis 7M1–7M3, papel público/member |
| Verde receita | `#7bd88f` | tags de receita recorrente |
| Texto claro | `#ffffff` / `#e8eaf0` | títulos e corpo em fundo escuro |
| Texto secundário | `#aab1c2` / `#8891a3` / `#6b7488` | subtítulos, legendas |

### Tipografia (Google Fonts)
- **Space Grotesk** (400–700) — títulos, números, wordmark.
- **Manrope** (400–800) — corpo de texto.
- **JetBrains Mono** (400–700) — kickers/labels em caixa alta com `letter-spacing:.14–.24em`, códigos de nível (7M0…), valores mono.
- **Instrument Serif** — acento serifado eventual.

### Outros
- Raio de borda: cards 14–22px; botões/inputs 10–13px; ícone da marca 9–14px.
- Sombra da logo no header: `0 6px 20px rgba(201,154,46,.18)`.
- Kicker padrão: JetBrains Mono, 11–13px, uppercase, `letter-spacing:.16–.18em`, cor `#C99A2E`.

### Logo
- **Monograma dourado "7M"** sobre navy — header, aside dos dashboards, footer, ícones do PWA. Arquivo: `assets/7m-gold-mono.png` (512²) e `assets/icons/gold-{512,192,180}.png`.
- **Lockup completo** (7M + ADVISORY + tagline "Trust. Clarity. Results.") — `assets/7m-gold-lockup.png`, para hero/login/telas premium.
- No header, ao lado do monograma: palavra **"ADVISORY"** em Space Grotesk 700, `letter-spacing:.14em`, cor `#E7C871`, com sub-linha "Strategy · Growth · Performance" em JetBrains Mono.
- ⚠️ **Assets atuais são recortes de mockup com fundo navy embutido** (não vetor). Para produção, obter a logo em **SVG/PNG com fundo transparente** e regenerar os ícones do PWA a partir dela.

---

## O Método 7M (esteira 7M1–7M7)
Os 7 passos, do diagnóstico ao patrimônio: **1 Diagnosticar · 2 Qualificar · 3 Organizar · 4 Crescer · 5 Capitalizar · 6 Escalar · 7 Valorizar.** Cada passo tem um especialista responsável + apoio de IA.

### Planos por nível (mensalidade sobe com a evolução da empresa)
| Nível | Nome | Escala | Preço/mês | Comissão sobre deals |
|---|---|---|---|---|
| 7M0 | Entrada | MEI / micro | R$ 497 | — |
| 7M1 | Empreendedor | 1 CNPJ | R$ 1.000 | 1% |
| 7M2 | Núcleo | até 12 empresas | R$ 2.000 | 2% |
| 7M3 | Capítulo | até 40 empresas | R$ 3.000 | 3% |
| 7M4 | Região | multi-capítulo | R$ 4.000 | 4% |
| 7M5 | Hub Estadual | estado | R$ 5.000 | 5% |
| 7M6 | Rede Nacional | país | R$ 6.000 | 6% |
| 7M7 | Rede Global | global | R$ 7.000 | 7% |

Cores de nível: 7M1–7M3 azul `#8FB4FF`; 7M4–7M5 dourado `#E7C871`; 7M6–7M7 laranja `#E9611A`.

---

## Screens / Views

### 1. Landing (pública) — `view:'landing'`
Fluxo: **Header fixo → Hero → Dores → O que fazemos por porte → Método (revela após o wizard) → Pacotes por nível → Prova social → Footer.** CTA global: "Ver meu próximo passo — grátis" (abre o wizard) e "Acessar plataforma" (login).
- **Header** (sticky, `blur`, `rgba(10,20,54,.72)`): monograma + "ADVISORY" + tagline à esquerda; nav ("O que fazemos", "Área do Member", "FAQ") + botão "Acesso" + CTA dourado à direita.
- **Hero**: título grande (Space Grotesk 62px, `letter-spacing:-.035em`), sub, CTA, e um card "Prévia do seu próximo passo". Faixa de 3 métricas (+38%, 12h, R$ 220k).
- **Pacotes por nível**: título "Você paga pelo nível em que joga"; linha 7M0 (R$ 497) + tabela 7M1–7M7. **Decisão de produto em aberto:** manter 7 níveis ou colapsar em 3 planos comerciais (Start/Growth/Elite) por porte.
- Botão flutuante **WhatsApp** (canto inferior esquerdo) e **Guia 7M AI** (canto inferior direito).

### 2. Wizard / Funil de convicção — `view:'wizard'`
Substitui o antigo "diagnóstico". Passos: dados da empresa (nome, setor, idade, faixa de faturamento) → **desafio principal** (dor) → cadastro (nome, e-mail). Saída: mostra **o próximo passo do método, o especialista que conduz e o plano do porte**, e convida a assinar/agendar. Linguagem honesta — sem números inventados, sem "Growth Score" abstrato.
- Chips de faixa de faturamento: "Até R$ 20 mil/mês", "R$ 20–100 mil", "R$ 100–500 mil", "Acima de R$ 500 mil".

### 3. Login / Acesso — `view` gate
Card com senha. **Logins-demo (substituir por auth real):** `member` → 7M Member · `rep` → Advisory Rep · `admin` → Advisory Admin. Link "Ver meu próximo passo →" abre o wizard.

### 4. Dashboard — 7M Member — `role:'my'/'member'`, `dash` views
Aside de navegação (logo + `panelLabel` "Área do 7M Member" + itens). Views: visão geral (evolução no Método 7M, esteira de passos, tarefas), agentes/7M AI, **marketplace** (ofertas de produtos/serviços da rede, com publicar oferta), seu capítulo/Give7 (indicações dadas/recebidas, negócios gerados). Multi-tenant: o Member só vê a própria empresa.

### 5. Dashboard — Advisory Rep (City Leader) — `role:'rep'`
`panelLabel` "Advisory Rep". Título "Advisory Rep — Seu nível, sua faixa e sua comissão". Vê **só a sua praça**: membros, capítulos, ocupação de Seats, agenda de Rounds/Connect, sua faixa de comissão, minha rede.

### 6. Dashboard — Advisory Admin (sede) — `role:'admin'`
`panelLabel` "Advisory Admin". Vê **tudo**: KPIs (usuários ativos, MRR, transações/mês, comissão média), tabela de transações intermediadas (com fee), usuários & permissões, comissões, 7M Capital.

---

## Interactions & Behavior
- **Navegação por estado** (não por rota no protótipo): `state.view` (landing/wizard/login/dash) e `state.dash` (sub-view do dashboard). **Em produção, transformar em rotas reais** com guarda por papel.
- CTAs abrem wizard ou login; wizard avança por etapas com validação leve dos campos.
- Marketplace: modal de publicar oferta (tipo, categoria, preço, descrição).
- 7M AI: chat com respostas roteadas por regex sobre nível/preço/comissão/passos — **placeholder**; conectar a um LLM real.
- Botões flutuantes WhatsApp e Guia 7M AI presentes em todas as telas.
- Responsivo: classes `l-nav-links`, `dash-aside`, grids `g2/g3/g4` colapsam no mobile (definidas no `<style>` do helmet).

## State Management (protótipo → produção)
Variáveis-chave hoje em `state`: `view`, `dash`, `role`, `authed`, `pwd`, wizard (`fName`, `fSector`, `fArch`, `wAge`, `wRev`, `wChallenge`, `wEmail`), marketplace (`pubOpen`, `pubType`, `pubTitle`, `pubCat`, `pubPrice`…), simulador (`simVolume`, `simCounts`), chat (`chatLevel`).
**Em produção:** substituir por auth/sessão (papel + tenant), dados vindos de API, e persistência real. Nada de senha em texto no cliente.

---

## Backend, Integrações e Deploy (o que falta para ativar)
1. **Framework de produção**: portar do runtime de preview para React/Vite ou Next.js; rotas reais + RBAC (member/rep/admin) + multi-tenant.
2. **Auth**: Supabase/Firebase/Auth0 — trocar os logins-demo. Papéis e escopo (Member vê só a empresa; Rep vê só a praça; Admin vê tudo).
3. **Banco de dados**: usuários, empresas (CNPJ, setor, nível 7M), respostas do wizard, esteira/tarefas do método, capítulos/praças/Seats, ofertas do marketplace, transações + comissões, MRR.
4. **Pagamentos/assinatura**: Stripe ou Pagar.me para os planos por nível (7M0–7M7) e cobrança de comissão sobre deals (1%–7%).
5. **WhatsApp**: botão flutuante → link/API real (WhatsApp Business).
6. **E-mail transacional**: confirmação de cadastro, onboarding, agendamento.
7. **7M AI**: conectar a um modelo real (as respostas atuais são scripts fixos por regex).
8. **PWA em produção**: HTTPS, `manifest-advisory.webmanifest` servido corretamente, service worker `sw.js` (hoje network-first para navegações, cache `7madvisory-v3`) com escopo real; regenerar ícones a partir da logo vetor.
9. **Deploy/ativação**: domínio + hospedagem (Vercel/Netlify), SEO/meta tags, analytics, e **LGPD** (consentimento de cookies, política de privacidade).
10. **Assets finais**: logo dourada em vetor/PNG transparente.

## Assets
- `assets/7m-gold-mono.png` — monograma 7M dourado (header, aside, footer, base dos ícones PWA).
- `assets/7m-gold-lockup.png` — lockup completo (hero/login).
- `assets/icons/gold-{512,192,180}.png` — ícones do PWA.
- Google Fonts: Space Grotesk, Manrope, JetBrains Mono, Instrument Serif.
- ⚠️ Todos os assets de logo são recortes de mockup com fundo navy embutido — substituir por vetor/transparente em produção.

## Files (referências de design neste pacote)
- `screenshots/` — capturas de referência: `01-landing.png` (hero da landing), `02-login.png` (tela de acesso com logins-demo), `03-dashboard-member.png` (dashboard do 7M Member). Os dashboards **Advisory Rep** e **Advisory Admin** reutilizam o mesmo shell (aside + header + grid), variando apenas navegação e dados por papel — ver seções 5 e 6.
- `7M Advisory.dc.html` — **site/plataforma unificado** (landing + wizard + login + 3 dashboards). Arquivo principal.
- `7MARKET - Arquitetura.dc.html` — documento de arquitetura de negócio (3 camadas, papéis/governança, unidades Praça/Capítulo/Member/Seat, modelo econômico, 4 papéis de acesso, roadmap). Fonte de verdade para o modelo de dados e RBAC.
- `7MARKET App.dc.html` — app mobile (PWA) irmão: funil de convicção do cliente.
- `manifest-advisory.webmanifest`, `sw.js` — config do PWA.
- `assets/` — logos e ícones.

> Observação: os arquivos `.dc.html` usam um runtime de preview (`support.js`) e **dados fake**. Trate-os como especificação visual/comportamental, não como código a portar linha a linha.
