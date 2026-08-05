// Tipos manuais refletindo as migrações em supabase/migrations (etapas 1 e 2).
// Formato compatível com o gerado por `supabase gen types typescript`. Quando
// o projeto Supabase estiver provisionado, prefira regenerar via:
//   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
//
// Observação: os "Insert" aqui descrevem o formato de linha, não quem pode
// inserir — isso é decidido pelas policies de RLS e pelos GRANTs no banco
// (ex.: `comissoes` e `usuarios` não têm policy de insert para
// authenticated; só são escritas por trigger/função `security definer`).

export type PapelUsuario = "publico" | "empreendedor" | "representante" | "especialista" | "admin";
export type SegmentoEmpresa = "online" | "fisico" | "atacado";
export type FaixaFaturamento = "7M1" | "7M2" | "7M3" | "7M4" | "7M5" | "7M6" | "7M7";
export type StatusEmpresa = "ativo" | "inadimplente" | "cancelado";
export type NivelRepresentante =
  | "Comunit"
  | "City"
  | "Estadual"
  | "Regional"
  | "Nacional"
  | "Continental"
  | "Internacional";
export type StatusRepresentante = "ativo" | "inativo" | "suspenso";
export type AreaEspecialista = "contabil" | "administrativo" | "marketing" | "ti" | "rh" | "capital" | "juridico";
export type StatusAssinatura = "pendente" | "ativa" | "inadimplente" | "cancelada";
export type StatusPagamentoComissao = "pendente" | "pago" | "cancelado";

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          email: string;
          telefone: string | null;
          papel: PapelUsuario;
          criado_em: string;
        };
        Insert: {
          id: string;
          email: string;
          telefone?: string | null;
          papel?: PapelUsuario;
          criado_em?: string;
        };
        Update: {
          id?: string;
          email?: string;
          telefone?: string | null;
          papel?: PapelUsuario;
          criado_em?: string;
        };
        Relationships: [];
      };
      representantes: {
        Row: {
          id: string;
          usuario_id: string;
          nivel: NivelRepresentante;
          territorio: string;
          upline_id: string | null;
          status: StatusRepresentante;
          tipo_contrato: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          nivel: NivelRepresentante;
          territorio: string;
          upline_id?: string | null;
          status?: StatusRepresentante;
          tipo_contrato: string;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["representantes"]["Insert"]>;
        Relationships: [];
      };
      empresas: {
        Row: {
          id: string;
          usuario_id: string;
          razao_social: string;
          cnpj: string;
          segmento: SegmentoEmpresa;
          faixa_faturamento: FaixaFaturamento;
          representante_id: string | null;
          status: StatusEmpresa;
          premium: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          razao_social: string;
          cnpj: string;
          segmento: SegmentoEmpresa;
          faixa_faturamento: FaixaFaturamento;
          representante_id?: string | null;
          status?: StatusEmpresa;
          premium?: boolean;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["empresas"]["Insert"]>;
        Relationships: [];
      };
      especialistas: {
        Row: {
          id: string;
          usuario_id: string;
          area: AreaEspecialista;
          licenca: string | null;
          capacidade_mensal: number;
          criado_em: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          area: AreaEspecialista;
          licenca?: string | null;
          capacidade_mensal?: number;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["especialistas"]["Insert"]>;
        Relationships: [];
      };
      assinaturas: {
        Row: {
          id: string;
          empresa_id: string;
          nivel: FaixaFaturamento;
          valor_mensal: number;
          premium: boolean;
          status: StatusAssinatura;
          ciclo_cobranca: string;
          data_inicio: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nivel: FaixaFaturamento;
          valor_mensal: number;
          premium?: boolean;
          status?: StatusAssinatura;
          ciclo_cobranca?: string;
          data_inicio?: string | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["assinaturas"]["Insert"]>;
        Relationships: [];
      };
      niveis_comissao: {
        Row: { nivel: NivelRepresentante; percentual: number };
        Insert: { nivel: NivelRepresentante; percentual: number };
        Update: { nivel?: NivelRepresentante; percentual?: number };
        Relationships: [];
      };
      pagamentos_assinatura: {
        Row: {
          id: string;
          assinatura_id: string;
          gateway_evento_id: string;
          valor: number;
          mes_referencia: string;
          confirmado_em: string;
        };
        Insert: {
          id?: string;
          assinatura_id: string;
          gateway_evento_id: string;
          valor: number;
          mes_referencia: string;
          confirmado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pagamentos_assinatura"]["Insert"]>;
        Relationships: [];
      };
      comissoes: {
        Row: {
          id: string;
          representante_id: string;
          assinatura_id: string;
          percentual: number;
          valor: number;
          mes_referencia: string;
          status_pagamento: StatusPagamentoComissao;
          criado_em: string;
        };
        Insert: {
          id?: string;
          representante_id: string;
          assinatura_id: string;
          percentual: number;
          valor: number;
          mes_referencia: string;
          status_pagamento?: StatusPagamentoComissao;
          criado_em?: string;
        };
        Update: { status_pagamento?: StatusPagamentoComissao };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      gerar_comissoes_por_pagamento: {
        Args: { p_assinatura_id: string; p_mes_referencia: string };
        Returns: undefined;
      };
      current_papel: {
        Args: Record<string, never>;
        Returns: PapelUsuario;
      };
      representante_id_atual: {
        Args: Record<string, never>;
        Returns: string | null;
      };
    };
    Enums: {
      papel_usuario: PapelUsuario;
      segmento_empresa: SegmentoEmpresa;
      faixa_faturamento: FaixaFaturamento;
      status_empresa: StatusEmpresa;
      nivel_representante: NivelRepresentante;
      status_representante: StatusRepresentante;
      area_especialista: AreaEspecialista;
      status_assinatura: StatusAssinatura;
      status_pagamento_comissao: StatusPagamentoComissao;
    };
    CompositeTypes: Record<string, never>;
  };
}
