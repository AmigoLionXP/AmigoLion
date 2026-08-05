-- 7MARKET — Etapa 1: tipos enumerados usados pelo core do schema.
-- Ver brief, Seção 3 (Modelo de dados) e Seção 2 (Papéis e autenticação).

create type papel_usuario as enum (
  'publico',
  'empreendedor',
  'representante',
  'especialista',
  'admin'
);

create type segmento_empresa as enum ('online', 'fisico', 'atacado');

-- Faixa de faturamento do cliente (empresas.faixa_faturamento).
-- Não confundir com os "níveis da escada" de comissão da Seção 6 (ver 0005_assinaturas_comissoes.sql).
create type faixa_faturamento as enum ('7M1', '7M2', '7M3', '7M4', '7M5', '7M6', '7M7');

create type status_empresa as enum ('ativo', 'inadimplente', 'cancelado');

create type nivel_representante as enum (
  'Comunit',
  'City',
  'Estadual',
  'Regional',
  'Nacional',
  'Continental',
  'Internacional'
);

create type status_representante as enum ('ativo', 'inativo', 'suspenso');

create type area_especialista as enum (
  'contabil',
  'administrativo',
  'marketing',
  'ti',
  'rh',
  'capital',
  'juridico'
);

create type status_assinatura as enum ('pendente', 'ativa', 'inadimplente', 'cancelada');

create type status_pagamento_comissao as enum ('pendente', 'pago', 'cancelado');
