/**
 * Tipos do banco (espelham supabase/migrations/).
 *
 * Escritos à mão no mesmo formato do `supabase gen types typescript`, mas com uniões
 * literais nos campos que têm `check (... in (...))` — o gerador transformaria em `string`.
 * Ao mudar uma migration, atualize este arquivo.
 *
 * Valores `numeric` chegam como `number` pelo supabase-js (PostgREST serializa como número).
 * Datas (`date`) e `timestamptz` chegam como string ISO ("2026-11-01", "2026-11-21T14:00:00+00:00").
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type TipoLancamento = 'entrada' | 'saida'
export type StatusLancamento = 'pendente' | 'pago' | 'parcial'
export type TipoMovimentoMeta = 'aporte' | 'retirada'
export type TipoInvestimento = 'acoes' | 'fundos' | 'etf' | 'exterior' | 'renda_fixa' | 'outros'
export type Moeda = 'BRL' | 'USD'
export type AcaoHistorico = 'insert' | 'update' | 'delete'
export type Tema = 'automatico' | 'clareza' | 'noite' | 'lavanda'

/** Insert: `Obrigatorios` precisam ser enviados; o resto tem default no banco. `Bloqueados` nunca são enviados. */
type InsertDe<Row, Obrigatorios extends keyof Row, Bloqueados extends keyof Row = never> = {
  [K in Obrigatorios]: Row[K]
} & {
  [K in Exclude<keyof Row, Obrigatorios | Bloqueados>]?: Row[K]
} & {
  [K in Bloqueados]?: never
}

type UpdateDe<Row, Bloqueados extends keyof Row = never> = {
  [K in Exclude<keyof Row, Bloqueados>]?: Row[K]
} & {
  [K in Bloqueados]?: never
}

type CategoriaRow = {
  id: string
  user_id: string
  nome: string
  tipo: TipoLancamento
  cor: string | null
  icone: string | null
  arquivada: boolean
  created_at: string
}

type MetaRow = {
  id: string
  user_id: string
  nome: string
  valor_alvo: number | null
  aporte_mensal_planejado: number | null
  inicio: string | null
  fim: string | null
  cor: string | null
  arquivada: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

type CompraParceladaRow = {
  id: string
  user_id: string
  descricao: string
  categoria_id: string | null
  valor_parcela: number
  total_parcelas: number
  /** Sempre dia 1 do mês da 1ª parcela. */
  primeira_competencia: string
  dia_vencimento: number | null
  meta_id: string | null
  observacao: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

type LancamentoRow = {
  id: string
  user_id: string
  tipo: TipoLancamento
  descricao: string
  categoria_id: string | null
  valor: number
  /** Dia 1 do mês ao qual o lançamento pertence. */
  competencia: string
  data: string
  vencimento: string | null
  /** pago → valor_pago = valor; pendente → valor_pago = 0 (ajustado por trigger no banco). */
  status: StatusLancamento
  valor_pago: number
  data_pagamento: string | null
  compra_parcelada_id: string | null
  numero_parcela: number | null
  observacao: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

type MetaMovimentoRow = {
  id: string
  user_id: string
  meta_id: string
  tipo: TipoMovimentoMeta
  valor: number
  competencia: string
  descricao: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

type InvestimentoRow = {
  id: string
  user_id: string
  tipo: TipoInvestimento
  descricao: string | null
  competencia: string
  moeda: Moeda
  valor: number
  cotacao: number | null
  /** Coluna calculada: valor × cotação (USD) ou valor (BRL). */
  valor_brl: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

type HistoricoRow = {
  id: number
  user_id: string
  tabela: string
  registro_id: string
  acao: AcaoHistorico
  antes: Json | null
  depois: Json | null
  created_at: string
}

type PerfilRow = {
  user_id: string
  nome: string | null
  tema: Tema
  created_at: string
  updated_at: string
}

type ResumoMensalRow = {
  user_id: string
  competencia: string
  total_entradas: number
  total_saidas: number
  total_pago: number
  total_pendente: number
  /** entradas − pago */
  resultado: number
  total_investido: number
  /** resultado + investido */
  total: number
}

export type Database = {
  public: {
    Tables: {
      categorias: {
        Row: CategoriaRow
        Insert: InsertDe<CategoriaRow, 'nome' | 'tipo'>
        Update: UpdateDe<CategoriaRow>
        Relationships: []
      }
      metas: {
        Row: MetaRow
        Insert: InsertDe<MetaRow, 'nome'>
        Update: UpdateDe<MetaRow>
        Relationships: []
      }
      compras_parceladas: {
        Row: CompraParceladaRow
        Insert: InsertDe<
          CompraParceladaRow,
          'descricao' | 'valor_parcela' | 'total_parcelas' | 'primeira_competencia'
        >
        Update: UpdateDe<CompraParceladaRow>
        Relationships: [
          {
            foreignKeyName: 'compras_parceladas_categoria_id_user_id_fkey'
            columns: ['categoria_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'categorias'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'compras_parceladas_meta_id_user_id_fkey'
            columns: ['meta_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'metas'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      lancamentos: {
        Row: LancamentoRow
        Insert: InsertDe<LancamentoRow, 'tipo' | 'descricao' | 'valor' | 'competencia'>
        Update: UpdateDe<LancamentoRow>
        Relationships: [
          {
            foreignKeyName: 'lancamentos_categoria_id_user_id_fkey'
            columns: ['categoria_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'categorias'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'lancamentos_compra_parcelada_id_user_id_fkey'
            columns: ['compra_parcelada_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'compras_parceladas'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      meta_movimentos: {
        Row: MetaMovimentoRow
        Insert: InsertDe<MetaMovimentoRow, 'meta_id' | 'tipo' | 'valor' | 'competencia'>
        Update: UpdateDe<MetaMovimentoRow>
        Relationships: [
          {
            foreignKeyName: 'meta_movimentos_meta_id_user_id_fkey'
            columns: ['meta_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'metas'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      investimentos: {
        Row: InvestimentoRow
        Insert: InsertDe<InvestimentoRow, 'tipo' | 'competencia' | 'valor', 'valor_brl'>
        Update: UpdateDe<InvestimentoRow, 'valor_brl'>
        Relationships: []
      }
      perfis: {
        Row: PerfilRow
        Insert: InsertDe<PerfilRow, never>
        Update: UpdateDe<PerfilRow, 'user_id'>
        Relationships: []
      }
      historico: {
        Row: HistoricoRow
        // O cliente não pode escrever no histórico (só o trigger de auditoria).
        Insert: { [K in keyof HistoricoRow]?: never }
        Update: { [K in keyof HistoricoRow]?: never }
        Relationships: []
      }
    }
    Views: {
      resumo_mensal: {
        Row: ResumoMensalRow
        Relationships: []
      }
    }
    Functions: {
      gerar_parcelas: {
        Args: { compra_id: string; a_partir_de?: number }
        /** Quantidade de parcelas criadas. */
        Returns: number
      }
      criar_compra_parcelada: {
        Args: {
          p_descricao: string
          p_valor_parcela: number
          p_total_parcelas: number
          /** Dia 1 do mês da 1ª parcela. */
          p_primeira_competencia: string
          p_dia_vencimento?: number | null
          p_categoria_id?: string | null
          p_meta_id?: string | null
          p_observacao?: string | null
          /** Compra em andamento: gera só desta parcela em diante. */
          p_parcela_atual?: number
        }
        /** id da compra criada. */
        Returns: string
      }
      atualizar_compra_parcelada: {
        Args: {
          p_compra_id: string
          p_descricao: string
          p_valor_parcela: number
          p_total_parcelas: number
          p_dia_vencimento?: number | null
          p_categoria_id?: string | null
          p_meta_id?: string | null
          p_observacao?: string | null
          /** false = muda só as parcelas não pagas. */
          p_incluir_pagas?: boolean
        }
        Returns: undefined
      }
      cancelar_compra_parcelada: {
        Args: { p_compra_id: string }
        /** Instante do cancelamento (para desfazer). */
        Returns: string
      }
      restaurar_compra_parcelada: {
        Args: { p_compra_id: string; p_quando: string }
        Returns: undefined
      }
      seed_categorias_padrao: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

type Public = Database['public']

/** Linha de uma tabela ou view: `Tables<'lancamentos'>`, `Tables<'resumo_mensal'>`. */
export type Tables<T extends keyof Public['Tables'] | keyof Public['Views']> =
  T extends keyof Public['Tables']
    ? Public['Tables'][T]['Row']
    : T extends keyof Public['Views']
      ? Public['Views'][T]['Row']
      : never

export type TablesInsert<T extends keyof Public['Tables']> = Public['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Public['Tables']> = Public['Tables'][T]['Update']

// Atalhos usados pelo app
export type Categoria = Tables<'categorias'>
export type Meta = Tables<'metas'>
export type CompraParcelada = Tables<'compras_parceladas'>
export type Lancamento = Tables<'lancamentos'>
export type MetaMovimento = Tables<'meta_movimentos'>
export type Investimento = Tables<'investimentos'>
export type Historico = Tables<'historico'>
export type Perfil = Tables<'perfis'>
export type ResumoMensal = Tables<'resumo_mensal'>
