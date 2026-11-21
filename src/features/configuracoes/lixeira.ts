import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useExecutarAcao } from '@/lib/useExecutarAcao'

export type TipoItemLixeira = 'lancamento' | 'compra' | 'meta' | 'movimento' | 'investimento'

export interface ItemLixeira {
  tipo: TipoItemLixeira
  id: string
  titulo: string
  detalhe: string
  valor: number | null
  excluidoEm: string
}

const TABELA: Record<
  TipoItemLixeira,
  'lancamentos' | 'compras_parceladas' | 'metas' | 'meta_movimentos' | 'investimentos'
> = {
  lancamento: 'lancamentos',
  compra: 'compras_parceladas',
  meta: 'metas',
  movimento: 'meta_movimentos',
  investimento: 'investimentos',
}

export const NOME_TIPO_LIXEIRA: Record<TipoItemLixeira, string> = {
  lancamento: 'Lançamento',
  compra: 'Compra parcelada',
  meta: 'Meta',
  movimento: 'Aporte/retirada',
  investimento: 'Investimento',
}

/** Tudo que está na lixeira (deleted_at preenchido), do mais recente para o mais antigo. */
export function useLixeira() {
  return useQuery({
    queryKey: ['lixeira'],
    queryFn: async (): Promise<ItemLixeira[]> => {
      const [l, c, m, mv, i] = await Promise.all([
        supabase
          .from('lancamentos')
          .select('id, descricao, valor, tipo, competencia, compra_parcelada_id, deleted_at')
          .not('deleted_at', 'is', null),
        supabase
          .from('compras_parceladas')
          .select('id, descricao, valor_parcela, total_parcelas, deleted_at')
          .not('deleted_at', 'is', null),
        supabase.from('metas').select('id, nome, deleted_at').not('deleted_at', 'is', null),
        supabase
          .from('meta_movimentos')
          .select('id, tipo, valor, descricao, deleted_at, metas(nome)')
          .not('deleted_at', 'is', null),
        supabase
          .from('investimentos')
          .select('id, tipo, descricao, valor_brl, competencia, deleted_at')
          .not('deleted_at', 'is', null),
      ])
      for (const r of [l, c, m, mv, i]) if (r.error) throw r.error

      // Parcelas apagadas junto com a compra cancelada voltam com ela: não aparecem soltas.
      const canceladas = new Map((c.data ?? []).map((x) => [x.id, x.deleted_at]))
      const itens: ItemLixeira[] = [
        ...(l.data ?? [])
          .filter(
            (x) =>
              !(x.compra_parcelada_id && canceladas.get(x.compra_parcelada_id) === x.deleted_at),
          )
          .map((x) => ({
            tipo: 'lancamento' as const,
            id: x.id,
            titulo: x.descricao,
            detalhe: `${x.tipo === 'entrada' ? 'Entrada' : 'Saída'} · ${x.competencia.slice(5, 7)}/${x.competencia.slice(0, 4)}`,
            valor: Number(x.valor),
            excluidoEm: x.deleted_at!,
          })),
        ...(c.data ?? []).map((x) => ({
          tipo: 'compra' as const,
          id: x.id,
          titulo: x.descricao,
          detalhe: `${x.total_parcelas} parcelas`,
          valor: Number(x.valor_parcela),
          excluidoEm: x.deleted_at!,
        })),
        ...(m.data ?? []).map((x) => ({
          tipo: 'meta' as const,
          id: x.id,
          titulo: x.nome,
          detalhe: 'Meta (com aportes)',
          valor: null,
          excluidoEm: x.deleted_at!,
        })),
        ...(mv.data ?? []).map((x) => ({
          tipo: 'movimento' as const,
          id: x.id,
          titulo: x.descricao || (x.tipo === 'aporte' ? 'Aporte' : 'Retirada'),
          detalhe: `Meta ${(x.metas as { nome: string } | null)?.nome ?? ''}`,
          valor: Number(x.valor),
          excluidoEm: x.deleted_at!,
        })),
        ...(i.data ?? []).map((x) => ({
          tipo: 'investimento' as const,
          id: x.id,
          titulo: x.descricao || 'Investimento',
          detalhe: `${x.competencia.slice(5, 7)}/${x.competencia.slice(0, 4)}`,
          valor: Number(x.valor_brl),
          excluidoEm: x.deleted_at!,
        })),
      ]
      return itens.sort((a, b) => b.excluidoEm.localeCompare(a.excluidoEm))
    },
  })
}

export function useAcoesLixeira() {
  const executar = useExecutarAcao()

  const restaurar = useCallback(
    (item: ItemLixeira) =>
      executar(
        async () => {
          if (item.tipo === 'compra') {
            const { error } = await supabase.rpc('restaurar_compra_parcelada', {
              p_compra_id: item.id,
              p_quando: item.excluidoEm,
            })
            if (error) throw error
            return
          }
          const { error } = await supabase
            .from(TABELA[item.tipo])
            .update({ deleted_at: null })
            .eq('id', item.id)
          if (error) throw error
        },
        { sucesso: `Restaurado ✓ ${item.titulo}` },
      ),
    [executar],
  )

  /** Apaga de verdade (sem volta). Compra: leva junto as parcelas que estavam na lixeira. */
  const excluirDeVez = useCallback(
    (itens: ItemLixeira[]) =>
      executar(
        async () => {
          for (const item of itens) {
            if (item.tipo === 'compra') {
              const { error: e1 } = await supabase
                .from('lancamentos')
                .delete()
                .eq('compra_parcelada_id', item.id)
                .not('deleted_at', 'is', null)
              if (e1) throw e1
            }
            const { error } = await supabase.from(TABELA[item.tipo]).delete().eq('id', item.id)
            if (error) throw error
          }
        },
        {
          sucesso:
            itens.length === 1
              ? `Excluído de vez: ${itens[0].titulo}`
              : `${itens.length} itens excluídos de vez`,
        },
      ),
    [executar],
  )

  return { restaurar, excluirDeVez }
}
