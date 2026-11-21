import { useInfiniteQuery } from '@tanstack/react-query'
import { formatBRL, formatData, formatMes } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type { Historico, Json } from '@/types/db'

const POR_PAGINA = 50

/** Histórico de alterações, do mais recente para o mais antigo, 50 por vez. */
export function useHistorico() {
  return useInfiniteQuery({
    queryKey: ['historico'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<Historico[]> => {
      const { data, error } = await supabase
        .from('historico')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(pageParam, pageParam + POR_PAGINA - 1)
      if (error) throw error
      return data
    },
    getNextPageParam: (ultima, todas) =>
      ultima.length < POR_PAGINA ? undefined : todas.length * POR_PAGINA,
  })
}

const NOME_TABELA: Record<string, string> = {
  lancamentos: 'Lançamento',
  compras_parceladas: 'Compra parcelada',
  metas: 'Meta',
  meta_movimentos: 'Aporte/retirada',
  investimentos: 'Investimento',
  categorias: 'Categoria',
}

const NOME_CAMPO: Record<string, string> = {
  descricao: 'descrição',
  nome: 'nome',
  valor: 'valor',
  valor_pago: 'valor pago',
  valor_parcela: 'valor da parcela',
  total_parcelas: 'nº de parcelas',
  status: 'situação',
  categoria_id: 'categoria',
  competencia: 'mês',
  data: 'data',
  vencimento: 'vencimento',
  data_pagamento: 'data do pagamento',
  observacao: 'observação',
  tipo: 'tipo',
  valor_alvo: 'valor-alvo',
  aporte_mensal_planejado: 'aporte planejado',
  inicio: 'início',
  fim: 'prazo',
  arquivada: 'arquivada',
  cotacao: 'cotação',
  moeda: 'moeda',
  icone: 'ícone',
  dia_vencimento: 'dia do vencimento',
}

const IGNORAR = new Set([
  'updated_at',
  'created_at',
  'user_id',
  'id',
  'valor_brl',
  'numero_parcela',
])
const DINHEIRO = new Set([
  'valor',
  'valor_pago',
  'valor_parcela',
  'valor_alvo',
  'aporte_mensal_planejado',
])

function formatarValor(campo: string, v: Json | undefined): string {
  if (v === null || v === undefined || v === '') return '—'
  if (DINHEIRO.has(campo)) return formatBRL(Number(v))
  if (campo === 'competencia' || campo === 'inicio' || campo === 'fim') return formatMes(String(v))
  if (campo === 'data' || campo === 'vencimento' || campo === 'data_pagamento')
    return formatData(String(v))
  if (typeof v === 'boolean') return v ? 'sim' : 'não'
  if (campo === 'categoria_id') return '(alterada)'
  return String(v)
}

export interface LinhaHistorico {
  id: number
  quando: string
  titulo: string
  acao: string
  mudancas: string[]
}

/** Transforma um registro do histórico em texto legível. */
export function descreverHistorico(h: Historico): LinhaHistorico {
  const antes = (h.antes ?? {}) as Record<string, Json>
  const depois = (h.depois ?? {}) as Record<string, Json>
  const ref = h.acao === 'delete' ? antes : depois
  const nome = String(ref.descricao ?? ref.nome ?? '')
  const tipo = NOME_TABELA[h.tabela] ?? h.tabela

  let acao = h.acao === 'insert' ? 'criado' : h.acao === 'delete' ? 'excluído de vez' : 'alterado'
  const mudancas: string[] = []
  if (h.acao === 'update') {
    if (antes.deleted_at == null && depois.deleted_at != null) acao = 'foi para a lixeira'
    else if (antes.deleted_at != null && depois.deleted_at == null) acao = 'restaurado da lixeira'
    else {
      for (const campo of Object.keys(depois)) {
        if (IGNORAR.has(campo) || campo === 'deleted_at') continue
        if (JSON.stringify(antes[campo]) === JSON.stringify(depois[campo])) continue
        mudancas.push(
          `${NOME_CAMPO[campo] ?? campo}: ${formatarValor(campo, antes[campo])} → ${formatarValor(campo, depois[campo])}`,
        )
      }
    }
  }
  return {
    id: h.id,
    quando: h.created_at,
    titulo: `${tipo}${nome ? ` "${nome}"` : ''}`,
    acao,
    mudancas,
  }
}
