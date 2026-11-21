import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useExecutarAcao } from '@/lib/useExecutarAcao'
import type { Database } from '@/types/db'
import { resumirCompra, type CompraComParcelas, type ResumoCompra } from './calculos'

const CAMPOS_PARCELA = 'id, numero_parcela, status, valor, valor_pago, competencia, vencimento'

/** Compras parceladas (não canceladas) com suas parcelas (não excluídas). */
export function useComprasParceladas() {
  const consulta = useQuery({
    queryKey: ['compras'],
    queryFn: async (): Promise<CompraComParcelas[]> => {
      const { data, error } = await supabase
        .from('compras_parceladas')
        .select(`*, lancamentos(${CAMPOS_PARCELA})`)
        .is('deleted_at', null)
        .is('lancamentos.deleted_at', null)
        .order('created_at')
      if (error) throw error
      return data as CompraComParcelas[]
    },
  })
  const resumos = useMemo<ResumoCompra[]>(
    () => (consulta.data ?? []).map(resumirCompra),
    [consulta.data],
  )
  return { ...consulta, resumos }
}

type ArgsCriar = Database['public']['Functions']['criar_compra_parcelada']['Args']
type ArgsAtualizar = Database['public']['Functions']['atualizar_compra_parcelada']['Args']

/** Criar, editar e cancelar compras: cada uma é uma transação no banco (RPC). */
export function useAcoesCompra() {
  const executar = useExecutarAcao()

  const criar = useCallback(
    (args: ArgsCriar) =>
      executar(
        async () => {
          const { data, error } = await supabase.rpc('criar_compra_parcelada', args)
          if (error) throw error
          return data
        },
        {
          sucesso: `Salvo ✓ ${args.p_descricao} · ${args.p_total_parcelas - (args.p_parcela_atual ?? 1) + 1} parcelas`,
          desfazer: async (id) => {
            const { error } = await supabase.rpc('cancelar_compra_parcelada', { p_compra_id: id })
            if (error) throw error
          },
        },
      ),
    [executar],
  )

  const atualizar = useCallback(
    (args: ArgsAtualizar) =>
      executar(
        async () => {
          const { error } = await supabase.rpc('atualizar_compra_parcelada', args)
          if (error) throw error
          return true
        },
        { sucesso: `Salvo ✓ ${args.p_descricao}` },
      ),
    [executar],
  )

  const cancelar = useCallback(
    (compraId: string, descricao: string) =>
      executar(
        async () => {
          const { data, error } = await supabase.rpc('cancelar_compra_parcelada', {
            p_compra_id: compraId,
          })
          if (error) throw error
          return data
        },
        {
          sucesso: `Compra cancelada: ${descricao}`,
          desfazer: async (quando) => {
            const { error } = await supabase.rpc('restaurar_compra_parcelada', {
              p_compra_id: compraId,
              p_quando: quando,
            })
            if (error) throw error
          },
        },
      ),
    [executar],
  )

  return { criar, atualizar, cancelar }
}
