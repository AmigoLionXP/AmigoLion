# 7MARKET — Brief para Claude Code (Backend)

> Como usar: cole este documento como prompt no Claude Code (local ou Claude Code Web), depois do front-end da landing já estar implementado. Peça para ele ler este brief inteiro antes de gerar qualquer código, e implementar na ordem da seção 9 ("Ordem de implementação sugerida") — não tudo de uma vez.

---

## 1. Contexto

A 7MARKET é uma plataforma de consultoria empresarial por método (método 7M), com 7 especialistas humanos apoiados por agentes de IA, uma escada de representação comercial (Comunit/City/Estadual...) e assinatura mensal por faixa de faturamento do cliente. O front-end (Claude Design → handoff) está sendo implementado em paralelo — este brief cobre exclusivamente o back-end: modelo de dados, regras de negócio, pipeline de auditoria e integrações.

**Stack sugerida** (ajuste se o Claude Code recomendar algo melhor para o caso): Next.js (React) hospedado na Vercel, Supabase para banco de dados Postgres + autenticação + storage — ambos já conectados no ambiente deste projeto, então priorize usá-los em vez de provisionar infraestrutura nova do zero.

---

## 2. Papéis e autenticação

Quatro perfis, com permissões estritamente separadas:

| Papel | Acesso |
|---|---|
| Público | Sem login — landing, diagnóstico gratuito |
| Empreendedor | Só a própria empresa: dashboard, tarefas, agentes, comunidade |
| Representante | Sua rede/downline, comissões, eventos — nunca dados de empresas fora da sua carteira |
| Especialista | Fila de tarefas da sua área (lote + individual), histórico de assinaturas |
| Admin (sede) | Acesso total: todas as empresas, MRR, comissões, capacidade, expansão |

Implementar via Supabase Auth com Row Level Security (RLS) por papel — não confiar em checagem só no front-end.

---

## 3. Modelo de dados — entidades principais

Sugestão de schema (ajustar tipos/relacionamentos conforme o ORM escolhido):

- **usuarios**: id, email, telefone, papel (enum: publico/empreendedor/representante/especialista/admin), criado_em
- **empresas**: id, usuario_id, razao_social, cnpj, segmento (online/fisico/atacado), faixa_faturamento (enum 7M1-7M7), representante_id, status (ativo/inadimplente/cancelado), premium (bool), criado_em
- **assinaturas**: id, empresa_id, nivel, valor_mensal, premium (bool), status, ciclo_cobranca, data_inicio
- **representantes**: id, usuario_id, nivel (Comunit/City/Estadual/Regional/Nacional/Continental/Internacional), territorio (municipio ou regiao_administrativa), upline_id (representante acima na escada, nullable), status, tipo_contrato
- **comissoes**: id, representante_id, assinatura_id, percentual, valor, mes_referencia, status_pagamento — **gerada exclusivamente a partir de pagamento confirmado de assinatura real, nunca a partir de cadastro de novo representante** (ver Seção 6)
- **especialistas**: id, usuario_id, area (enum: contabil/administrativo/marketing/ti/rh/capital/juridico), licenca (CRC/OAB/registro — nullable), capacidade_mensal
- **agentes_ia**: id, especialista_id, funcao, configuracao (json)
- **tarefas**: id, empresa_id, especialista_id, agente_ia_id, area, conteudo, status (enum: em_execucao/em_auditoria/fila_lote/fila_individual/aprovado/assinado/enviado), risco (baixo/alto), classificado_por, criado_em, atualizado_em
- **assinaturas_digitais**: id, tarefa_id, especialista_id, metodo (icp_brasil/clicksign/docusign), hash_documento, assinado_em
- **growth_score**: id, empresa_id, dimensao (financeiro/gestao/marketing/tecnologia/pessoas/capital/juridico), valor, mes_referencia
- **eventos**: id, representante_id, tipo (presencial/online), data, local, inscritos, conversoes
- **indicacoes** (marketplace B2B): id, empresa_origem_id, empresa_destino_id, valor_negocio, status, criado_em
- **certificacoes**: id, empresa_id, etapa_metodo, data, publico (bool)
- **consentimentos_lgpd**: id, empresa_id, tipo (comunidade/licenciamento_growth_score), aceito_em
- **integracoes_externas**: id, empresa_id, tipo (banco/erp/folha), provider, credenciais (referência a secret, nunca armazenar em texto puro), status

---

## 4. Pipeline de auditoria — a lógica mais importante do sistema

Fluxo obrigatório para toda tarefa gerada por agente de IA, sem exceção:

1. **Agente de IA executa** a tarefa → `status = em_auditoria`
2. **Assistente mestre classifica risco** (`baixo` ou `alto`) com base em regras explícitas, não em julgamento livre do modelo. Regras mínimas a codificar:
   - Área regulada (contábil, jurídico-tributário, capital) + cliente novo ou primeira ocorrência do tipo de documento → **sempre alto risco**
   - Valor financeiro acima de um limite configurável → **sempre alto risco**
   - Item recorrente, cliente com histórico, mesmo padrão já aprovado antes → elegível a baixo risco
   - Área não regulada (marketing, administrativo, RH, TI) → limite de risco mais permissivo, mas nunca pula a auditoria do mestre
3. **Baixo risco** → `fila_lote`: especialista aprova por amostragem, em lote
4. **Alto risco** → `fila_individual`: especialista revisa item a item, sem atalho — **bloquear no banco qualquer tentativa de pular essa etapa via API**
5. **Especialista aprova** → assinatura digital (Seção 7) → `status = assinado`
6. **Envio** ao destino (cliente, órgão, terceiro) → `status = enviado`, log completo preservado (quem classificou, quem assinou, quando)

Cada mudança de status precisa gerar um registro de auditoria imutável (append-only log), não sobrescrever o histórico — é o que protege o especialista humano em caso de disputa.

---

## 5. Compliance a codificar como regra de sistema, não como política informal

- **Override só é gerado por assinatura paga e ativa.** Nunca por representante cadastrar outro representante. Constraint de banco: `comissoes.assinatura_id` não pode ser nulo, e só é criada por um trigger/job disparado por confirmação de pagamento.
- **Ajuda de custo (se implementada) é sempre vinculada a `evento_id` específico**, nunca um valor recorrente automático — isso é o que evita caracterização de vínculo empregatício. Não criar rotina de pagamento fixo mensal para representante.
- **Especialista de área regulada não pode assinar sem `licenca` cadastrada.** Bloquear no backend, não só avisar no front-end.
- **Módulo de Capital tem um feature flag** `capital_module_mode` = `"consultivo"` (padrão, ainda pendente definição jurídica) ou `"correspondente_bancario"`. Em modo consultivo, bloquear qualquer ação que intermedeie ou origine crédito de fato (ex.: não permitir enviar dados do cliente diretamente a uma API de banco parceiro para abertura de proposta) — isso é decisão de negócio pendente (ver plano de negócios, Seção 8), o sistema só precisa estar pronto para os dois modos.
- **Growth Score agregado para licenciamento** só pode ser usado (mesmo anonimizado) se `consentimentos_lgpd.tipo = 'licenciamento_growth_score'` estiver aceito pela empresa — checar antes de qualquer exportação/agregação para terceiros.

---

## 6. Cálculo de comissão (override empilhado)

- Cada nível da escada (7M1 a 7M7) tem um percentual fixo (1% a 7%).
- Quando uma assinatura é paga, o sistema percorre a cadeia de `upline_id` a partir do representante que vendeu, e gera um registro de comissão para **cada** nível acima, aplicando o percentual daquele nível sobre o valor da assinatura.
- Teto: soma de todos os percentuais da cadeia não pode ultrapassar 28% — validar na configuração dos níveis, não deixar como responsabilidade do cálculo em runtime.
- Rodar como job mensal (ou por evento de pagamento confirmado via webhook do gateway de pagamento), nunca cálculo síncrono no fluxo de checkout.

---

## 7. Assinatura digital

- Integrar com um provedor real (Clicksign ou DocuSign para a maioria dos documentos; verificar caso a caso se algum tipo de documento exige certificado ICP-Brasil por lei — não assumir que um provedor cobre todos os casos).
- Cada `assinatura_digital` grava hash do documento assinado + timestamp + identificação do especialista — nunca só um campo booleano "assinado = true".

---

## 8. Integrações externas — API/MCP, nunca acesso a dispositivo

- Toda integração com sistemas do cliente (conta bancária, ERP, folha de pagamento) é via API oficial do provedor (Open Finance/PIX para banco, API do ERP, etc.), autenticada via OAuth do próprio cliente.
- **Nunca** implementar qualquer forma de controle remoto de dispositivo do cliente — isso foi decidido explicitamente por risco de segurança, responsabilidade legal e auditabilidade. Se um provedor não tiver API, a integração fica pendente, não se resolve com automação de tela.

---

## 9. Ordem de implementação sugerida

1. Autenticação + papéis + RLS no Supabase (usuarios, empresas, representantes, especialistas)
2. Modelo de assinatura + cálculo de comissão (Seção 6) — testável isoladamente, sem depender de IA
3. Growth Score básico (armazenar e exibir, sem agregação ainda)
4. Pipeline de tarefas e auditoria (Seção 4) — pode começar com classificação de risco mockada/manual antes de plugar o agente mestre de verdade
5. Integração real dos agentes de IA por especialista (Claude API/Agent SDK)
6. Assinatura digital (Seção 7)
7. Comunidade e marketplace de indicação
8. Integrações externas via API/MCP (Seção 8)
9. Agregação do Growth Score para licenciamento (só depois do consentimento LGPD estar implementado)

---

## 10. O que fica explicitamente pendente (não travar o desenvolvimento por causa disso)

- Definição jurídica final do modo do módulo de Capital (consultivo vs. correspondente bancário) — construir com o feature flag da Seção 5, decidir depois.
- Provedor definitivo de assinatura digital — pode começar com Clicksign como padrão e trocar depois, já que o modelo de dados (Seção 3) não depende do provedor específico.
- Parceiros licenciados reais (contábil, jurídico, capital) — o campo `licenca` em `especialistas` pode ficar vazio em ambiente de desenvolvimento/teste, mas a regra de bloqueio (Seção 5) deve estar ativa desde o início para não esquecer de implementar depois.
