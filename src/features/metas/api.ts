import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { competencia, formatBRL } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { useExecutarAcao } from '@/lib/useExecutarAcao'
import type { Meta, MetaMovimento, TablesInsert, TablesUpdate } from '@/types/db'
import type { MetaComMovimentos } from './calculos'

/** Metas (não excluídas) com aportes e retiradas (não excluídos). */
export function useMetas() {
  return useQuery({
    queryKey: ['metas'],
    queryFn: async (): Promise<MetaComMovimentos[]> => {
      const { data, error } = await supabase
        .from('metas')
        .select('*, meta_movimentos(*)')
        .is('deleted_at', null)
        .is('meta_movimentos.deleted_at', null)
        .order('created_at')
      if (error) throw error
      return data as MetaComMovimentos[]
    },
  })
}

export type DadosMeta = Omit<
  TablesInsert<'metas'>,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'
>
export type DadosMovimento = Omit<
  TablesInsert<'meta_movimentos'>,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'
>

async function marcarMetaExcluida(id: string, excluida: boolean) {
  const { error } = await supabase
    .from('metas')
    .update({ deleted_at: excluida ? new Date().toISOString() : null })
    .eq('id', id)
  if (error) throw error
}

async function marcarMovimentoExcluido(id: string, excluido: boolean) {
  const { error } = await supabase
    .from('meta_movimentos')
    .update({ deleted_at: excluido ? new Date().toISOString() : null })
    .eq('id', id)
  if (error) throw error
}

export function useAcoesMeta() {
  const executar = useExecutarAcao()

  /** Cria a meta; `saldoInicial` (se houver) entra como aporte "Saldo inicial" neste mês. */
  const criar = useCallback(
    (dados: DadosMeta, saldoInicial: number | null) =>
      executar(
        async () => {
          const { data: meta, error } = await supabase.from('metas').insert(dados).select().single()
          if (error) throw error
          if (saldoInicial && saldoInicial > 0) {
            const { error: e2 } = await supabase.from('meta_movimentos').insert({
              meta_id: meta.id,
              tipo: 'aporte',
              valor: saldoInicial,
              competencia: competencia(),
              descricao: 'Saldo inicial',
            })
            if (e2) {
              // Não deixa a meta pela metade: desfaz e avisa.
              await supabase.from('metas').delete().eq('id', meta.id)
              throw e2
            }
          }
          return meta
        },
        { sucesso: `Salvo ✓ ${dados.nome}`, desfazer: (m) => marcarMetaExcluida(m.id, true) },
      ),
    [executar],
  )

  const editar = useCallback(
    (id: string, dados: TablesUpdate<'metas'>) =>
      executar(
        async () => {
          const { data, error } = await supabase
            .from('metas')
            .update(dados)
            .eq('id', id)
            .select()
            .single()
          if (error) throw error
          return data
        },
        { sucesso: `Salvo ✓ ${dados.nome ?? ''}` },
      ),
    [executar],
  )

  const excluir = useCallback(
    (meta: Meta) =>
      executar(() => marcarMetaExcluida(meta.id, true), {
        sucesso: `Meta movida para a lixeira: ${meta.nome}`,
        desfazer: () => marcarMetaExcluida(meta.id, false),
      }),
    [executar],
  )

  const registrarMovimento = useCallback(
    (dados: DadosMovimento) =>
      executar(
        async () => {
          const { data, error } = await supabase
            .from('meta_movimentos')
            .insert(dados)
            .select()
            .single()
          if (error) throw error
          return data
        },
        {
          sucesso: `${dados.tipo === 'aporte' ? 'Aporte' : 'Retirada'} salvo ✓ ${formatBRL(dados.valor)}`,
          desfazer: (mv) => marcarMovimentoExcluido(mv.id, true),
        },
      ),
    [executar],
  )

  const excluirMovimento = useCallback(
    (mv: MetaMovimento) =>
      executar(() => marcarMovimentoExcluido(mv.id, true), {
        sucesso: `${mv.tipo === 'aporte' ? 'Aporte' : 'Retirada'} movido para a lixeira`,
        desfazer: () => marcarMovimentoExcluido(mv.id, false),
      }),
    [executar],
  )

  return { criar, editar, excluir, registrarMovimento, excluirMovimento }
}
