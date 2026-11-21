import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { addDays, format } from 'date-fns'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { formatBRL } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type { Lancamento, ResumoMensal, TablesInsert, TablesUpdate } from '@/types/db'

// =====================================================================
// Consultas
// =====================================================================

export const chavesLancamentos = {
  tudo: ['lancamentos'] as const,
  mes: (comp: string) => ['lancamentos', 'mes', comp] as const,
  um: (id: string) => ['lancamentos', 'um', id] as const,
  vencimentos: (limite: string) => ['lancamentos', 'vencimentos', limite] as const,
  sugestoes: ['lancamentos', 'sugestoes'] as const,
  resumo: (de: string, ate: string) => ['resumo', de, ate] as const,
}

export function invalidarLancamentos(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: chavesLancamentos.tudo }),
    qc.invalidateQueries({ queryKey: ['resumo'] }),
  ])
}

/** Lançamentos de um mês (sem os da lixeira), do mais recente para o mais antigo. */
export function useLancamentosMes(comp: string) {
  return useQuery({
    queryKey: chavesLancamentos.mes(comp),
    queryFn: async (): Promise<Lancamento[]> => {
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('competencia', comp)
        .is('deleted_at', null)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useLancamento(id: string | undefined) {
  return useQuery({
    queryKey: chavesLancamentos.um(id ?? ''),
    enabled: Boolean(id),
    queryFn: async (): Promise<Lancamento | null> => {
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('id', id!)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

/** Saídas não pagas vencidas ou vencendo nos próximos 7 dias (de qualquer mês). */
export function useProximosVencimentos() {
  const limite = format(addDays(new Date(), 7), 'yyyy-MM-dd')
  return useQuery({
    queryKey: chavesLancamentos.vencimentos(limite),
    queryFn: async (): Promise<Lancamento[]> => {
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('tipo', 'saida')
        .neq('status', 'pago')
        .is('deleted_at', null)
        .not('vencimento', 'is', null)
        .lte('vencimento', limite)
        .order('vencimento')
        .limit(8)
      if (error) throw error
      return data
    },
  })
}

/** Resumo (view resumo_mensal) de um intervalo de meses, inclusive. */
export function useResumo(de: string, ate: string) {
  return useQuery({
    queryKey: chavesLancamentos.resumo(de, ate),
    queryFn: async (): Promise<ResumoMensal[]> => {
      const { data, error } = await supabase
        .from('resumo_mensal')
        .select('*')
        .gte('competencia', de)
        .lte('competencia', ate)
        .order('competencia')
      if (error) throw error
      return data
    },
  })
}

export interface Sugestao {
  descricao: string
  categoria_id: string | null
  tipo: Lancamento['tipo']
  valor: number
}

/** Descrições já usadas (mais recentes primeiro, sem repetir), para o autocompletar. */
export function useSugestoesDescricao() {
  return useQuery({
    queryKey: chavesLancamentos.sugestoes,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Sugestao[]> => {
      const { data, error } = await supabase
        .from('lancamentos')
        .select('descricao, categoria_id, tipo, valor')
        .is('deleted_at', null)
        .is('compra_parcelada_id', null)
        .order('created_at', { ascending: false })
        .limit(400)
      if (error) throw error
      const vistas = new Set<string>()
      return data.filter((s) => {
        const chave = `${s.tipo}|${normalizarTexto(s.descricao)}`
        if (vistas.has(chave)) return false
        vistas.add(chave)
        return true
      })
    },
  })
}

/** Minúsculas e sem acentos, para buscas ("Salário" acha "salario"). */
export function normalizarTexto(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// =====================================================================
// Ações (com confirmação do servidor, toasts e "Desfazer")
// =====================================================================

export type DadosLancamento = Omit<
  TablesInsert<'lancamentos'>,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'
>

/** Campos que uma edição pode mudar (e que o "Desfazer" restaura). */
const CAMPOS_EDITAVEIS = [
  'tipo',
  'descricao',
  'categoria_id',
  'valor',
  'competencia',
  'data',
  'vencimento',
  'status',
  'valor_pago',
  'data_pagamento',
  'observacao',
] as const

function camposEditaveis(l: Lancamento): TablesUpdate<'lancamentos'> {
  const r: Record<string, unknown> = {}
  for (const c of CAMPOS_EDITAVEIS) r[c] = l[c]
  return r as TablesUpdate<'lancamentos'>
}

async function atualizar(id: string, mudancas: TablesUpdate<'lancamentos'>) {
  const { data, error } = await supabase
    .from('lancamentos')
    .update(mudancas)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

async function marcarExcluidos(ids: string[], excluido: boolean) {
  const { error } = await supabase
    .from('lancamentos')
    .update({ deleted_at: excluido ? new Date().toISOString() : null })
    .in('id', ids)
  if (error) throw error
}

interface OpcoesExecucao<T> {
  sucesso: string
  /** Se informado, o toast ganha o botão "Desfazer". */
  desfazer?: (resultado: T) => Promise<unknown>
}

/**
 * Ações sobre lançamentos. Cada uma:
 *  - recusa se estiver offline (nada de "fingir que salvou");
 *  - mostra "Salvo ✓" só DEPOIS da confirmação do servidor, com "Desfazer";
 *  - em erro, mostra "Não foi salvo — tentar de novo" e devolve `undefined`.
 */
export function useAcoesLancamento() {
  const qc = useQueryClient()

  const executar = useCallback(
    async function tentar<T>(
      acao: () => Promise<T>,
      opcoes: OpcoesExecucao<T>,
    ): Promise<T | undefined> {
      if (!navigator.onLine) {
        toast.error('Sem internet: nada foi salvo. Tente quando a conexão voltar.')
        return undefined
      }
      try {
        const resultado = await acao()
        await invalidarLancamentos(qc)
        const desfazer = opcoes.desfazer
        toast.success(
          opcoes.sucesso,
          desfazer && {
            action: {
              label: 'Desfazer',
              onClick: () => {
                desfazer(resultado)
                  .then(() => invalidarLancamentos(qc))
                  .then(() => toast.success('Desfeito ✓'))
                  .catch((e) => {
                    console.error(e)
                    toast.error('Não foi possível desfazer. Tente de novo.')
                  })
              },
            },
          },
        )
        return resultado
      } catch (e) {
        console.error('[lancamentos]', e)
        toast.error('Não foi salvo — tentar de novo', {
          action: { label: 'Tentar de novo', onClick: () => void tentar(acao, opcoes) },
        })
        return undefined
      }
    },
    [qc],
  )

  const criar = useCallback(
    (dados: DadosLancamento) =>
      executar(
        async () => {
          const { data, error } = await supabase.from('lancamentos').insert(dados).select().single()
          if (error) throw error
          return data
        },
        { sucesso: `Salvo ✓ ${dados.descricao}`, desfazer: (l) => marcarExcluidos([l.id], true) },
      ),
    [executar],
  )

  const editar = useCallback(
    (antes: Lancamento, dados: DadosLancamento) =>
      executar(() => atualizar(antes.id, dados), {
        sucesso: `Salvo ✓ ${dados.descricao}`,
        desfazer: () => atualizar(antes.id, camposEditaveis(antes)),
      }),
    [executar],
  )

  const pagar = useCallback(
    (l: Lancamento) =>
      executar(() => atualizar(l.id, { status: 'pago' }), {
        sucesso: `${l.tipo === 'entrada' ? 'Recebido' : 'Pago'} ✓ ${l.descricao} · ${formatBRL(l.valor)}`,
        desfazer: () =>
          atualizar(l.id, {
            status: l.status,
            valor_pago: l.valor_pago,
            data_pagamento: l.data_pagamento,
          }),
      }),
    [executar],
  )

  const excluir = useCallback(
    (l: Lancamento) =>
      executar(() => marcarExcluidos([l.id], true), {
        sucesso: `Movido para a lixeira: ${l.descricao}`,
        desfazer: () => marcarExcluidos([l.id], false),
      }),
    [executar],
  )

  const criarVarios = useCallback(
    (lista: DadosLancamento[]) =>
      executar(
        async () => {
          const { data, error } = await supabase.from('lancamentos').insert(lista).select('id')
          if (error) throw error
          return data
        },
        {
          sucesso: `${lista.length} ${lista.length === 1 ? 'lançamento copiado' : 'lançamentos copiados'} ✓`,
          desfazer: (criados) =>
            marcarExcluidos(
              criados.map((c) => c.id),
              true,
            ),
        },
      ),
    [executar],
  )

  return { criar, editar, pagar, excluir, criarVarios }
}
