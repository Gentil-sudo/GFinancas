import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { formatBRL, somar } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { useExecutarAcao } from '@/lib/useExecutarAcao'
import type { Investimento, TablesInsert, TablesUpdate, TipoInvestimento } from '@/types/db'

/** Tipos na ordem fixa de exibição (e de cor no gráfico: --serie-1..6). */
export const TIPOS_INVESTIMENTO: Array<{ valor: TipoInvestimento; nome: string }> = [
  { valor: 'acoes', nome: 'Ações' },
  { valor: 'fundos', nome: 'Fundos' },
  { valor: 'etf', nome: 'ETF' },
  { valor: 'exterior', nome: 'Exterior' },
  { valor: 'renda_fixa', nome: 'Renda Fixa' },
  { valor: 'outros', nome: 'Outros' },
]

export const nomeTipo = (t: TipoInvestimento) =>
  TIPOS_INVESTIMENTO.find((x) => x.valor === t)?.nome ?? t

export const corTipo = (t: TipoInvestimento) =>
  `var(--serie-${TIPOS_INVESTIMENTO.findIndex((x) => x.valor === t) + 1})`

/** Saldos de investimento de um intervalo de meses (inclusive). */
export function useInvestimentos(de: string, ate: string) {
  return useQuery({
    queryKey: ['investimentos', de, ate],
    queryFn: async (): Promise<Investimento[]> => {
      const { data, error } = await supabase
        .from('investimentos')
        .select('*')
        .gte('competencia', de)
        .lte('competencia', ate)
        .is('deleted_at', null)
        .order('competencia')
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

/** Total investido (em R$) de um mês. */
export function totalDoMes(lista: Investimento[], comp: string): number {
  return somar(lista.filter((i) => i.competencia === comp).map((i) => i.valor_brl))
}

export type DadosInvestimento = Omit<
  TablesInsert<'investimentos'>,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'valor_brl'
>

async function marcarExcluidos(ids: string[], excluido: boolean) {
  const { error } = await supabase
    .from('investimentos')
    .update({ deleted_at: excluido ? new Date().toISOString() : null })
    .in('id', ids)
  if (error) throw error
}

export function useAcoesInvestimento() {
  const executar = useExecutarAcao()

  const criar = useCallback(
    (dados: DadosInvestimento) =>
      executar(
        async () => {
          const { data, error } = await supabase
            .from('investimentos')
            .insert(dados)
            .select()
            .single()
          if (error) throw error
          return data
        },
        {
          sucesso: (i) => `Salvo ✓ ${nomeTipo(i.tipo)} · ${formatBRL(i.valor_brl)}`,
          desfazer: (i) => marcarExcluidos([i.id], true),
        },
      ),
    [executar],
  )

  const editar = useCallback(
    (antes: Investimento, dados: TablesUpdate<'investimentos'>) =>
      executar(
        async () => {
          const { data, error } = await supabase
            .from('investimentos')
            .update(dados)
            .eq('id', antes.id)
            .select()
            .single()
          if (error) throw error
          return data
        },
        {
          sucesso: (i) => `Salvo ✓ ${nomeTipo(i.tipo)} · ${formatBRL(i.valor_brl)}`,
          desfazer: async () => {
            const { error } = await supabase
              .from('investimentos')
              .update({
                tipo: antes.tipo,
                descricao: antes.descricao,
                competencia: antes.competencia,
                moeda: antes.moeda,
                valor: antes.valor,
                cotacao: antes.cotacao,
              })
              .eq('id', antes.id)
            if (error) throw error
          },
        },
      ),
    [executar],
  )

  const excluir = useCallback(
    (i: Investimento) =>
      executar(() => marcarExcluidos([i.id], true), {
        sucesso: `Movido para a lixeira: ${nomeTipo(i.tipo)}${i.descricao ? ` · ${i.descricao}` : ''}`,
        desfazer: () => marcarExcluidos([i.id], false),
      }),
    [executar],
  )

  /** "Copiar saldos do mês anterior": mesmos tipos/valores no mês novo, para só ajustar. */
  const copiar = useCallback(
    (origem: Investimento[], para: string) =>
      executar(
        async () => {
          const { data, error } = await supabase
            .from('investimentos')
            .insert(
              origem.map((i) => ({
                tipo: i.tipo,
                descricao: i.descricao,
                competencia: para,
                moeda: i.moeda,
                valor: i.valor,
                cotacao: i.cotacao,
              })),
            )
            .select('id')
          if (error) throw error
          return data
        },
        {
          sucesso: `${origem.length} ${origem.length === 1 ? 'saldo copiado' : 'saldos copiados'} ✓ Ajuste o que mudou.`,
          desfazer: (criados) =>
            marcarExcluidos(
              criados.map((c) => c.id),
              true,
            ),
        },
      ),
    [executar],
  )

  return { criar, editar, excluir, copiar }
}
