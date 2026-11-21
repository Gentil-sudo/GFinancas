import { round2, somar, somarMeses } from '@/lib/format'
import type { CompraParcelada, Lancamento } from '@/types/db'

export type ParcelaResumo = Pick<
  Lancamento,
  'id' | 'numero_parcela' | 'status' | 'valor' | 'valor_pago' | 'competencia' | 'vencimento'
>
export type CompraComParcelas = CompraParcelada & { lancamentos: ParcelaResumo[] }

export interface ResumoCompra {
  compra: CompraParcelada
  /** Parcelas no app (não excluídas), em ordem. */
  parcelas: ParcelaResumo[]
  /** Parcelas pagas antes de cadastrar (compra "em andamento"): não existem no app. */
  pagasAntes: number
  /** Total de parcelas pagas (inclui as de antes do cadastro). */
  pagas: number
  total: number
  /** Quanto ainda falta pagar. */
  falta: number
  ultimaCompetencia: string
  finalizada: boolean
}

export function resumirCompra(c: CompraComParcelas): ResumoCompra {
  const parcelas = [...c.lancamentos].sort(
    (a, b) => (a.numero_parcela ?? 0) - (b.numero_parcela ?? 0),
  )
  const menor = parcelas[0]?.numero_parcela ?? 1
  const pagasAntes = Math.max(0, menor - 1)
  const pagasNoApp = parcelas.filter((p) => p.status === 'pago').length
  const pendentes = parcelas.filter((p) => p.status !== 'pago')
  return {
    compra: c,
    parcelas,
    pagasAntes,
    pagas: pagasAntes + pagasNoApp,
    total: c.total_parcelas,
    falta: somar(pendentes.map((p) => Number(p.valor) - Number(p.valor_pago))),
    ultimaCompetencia: somarMeses(c.primeira_competencia, c.total_parcelas - 1),
    finalizada: parcelas.length > 0 && pendentes.length === 0,
  }
}

/** Soma das parcelas que caem num mês (todas as compras). */
export function valorNoMes(resumos: ResumoCompra[], comp: string): number {
  return somar(
    resumos.flatMap((r) => r.parcelas.filter((p) => p.competencia === comp).map((p) => p.valor)),
  )
}

/**
 * Primeiro mês, depois de `apartir`, em que o total de parcelas fica menor que o de `apartir`.
 * Ex.: { mes: '2027-08-01', valor: 135 } → "Em ago/2027 cai para R$ 135,00".
 */
export function proximaQueda(
  resumos: ResumoCompra[],
  apartir: string,
): { mes: string; valor: number } | null {
  const atual = valorNoMes(resumos, apartir)
  if (atual <= 0) return null
  const ultimo = resumos.reduce(
    (max, r) => (r.ultimaCompetencia > max ? r.ultimaCompetencia : max),
    apartir,
  )
  for (let m = somarMeses(apartir, 1); m <= somarMeses(ultimo, 1); m = somarMeses(m, 1)) {
    const v = valorNoMes(resumos, m)
    if (round2(v) < round2(atual)) return { mes: m, valor: v }
  }
  return null
}

/** Até 6 compras ganham cor própria (paleta validada); da 7ª em diante, "Outras". */
export const MAX_SERIES = 6

export function corDaSerie(indice: number): string {
  return indice < MAX_SERIES ? `var(--serie-${indice + 1})` : 'var(--muted)'
}

/** Compras em andamento, ordenadas por quem termina primeiro. */
export function ordenarEmAndamento(resumos: ResumoCompra[]): ResumoCompra[] {
  return resumos
    .filter((r) => !r.finalizada)
    .sort((a, b) => a.ultimaCompetencia.localeCompare(b.ultimaCompetencia))
}
