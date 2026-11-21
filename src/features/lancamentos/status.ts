import type { TomEtiqueta } from '@/components/ui/Etiqueta'
import { diasAte, formatBRL, formatDiaMes } from '@/lib/format'
import type { Lancamento, StatusLancamento, TipoLancamento } from '@/types/db'

/** "Pago"/"Recebido", "Pendente"/"A receber", "Parcial". */
export function nomeStatus(status: StatusLancamento, tipo: TipoLancamento): string {
  if (status === 'pago') return tipo === 'entrada' ? 'Recebido' : 'Pago'
  if (status === 'pendente') return tipo === 'entrada' ? 'A receber' : 'Pendente'
  return 'Parcial'
}

/** Texto sobre o vencimento para a etiqueta: "Venceu ontem", "Vence em 2 dias", "Vence dia 28". */
export function textoVencimento(vencimento: string): { texto: string; tom: TomEtiqueta } {
  const d = diasAte(vencimento)
  if (d < -1) return { texto: `Vencida há ${-d} dias`, tom: 'danger' }
  if (d === -1) return { texto: 'Venceu ontem', tom: 'danger' }
  if (d === 0) return { texto: 'Vence hoje', tom: 'warning' }
  if (d === 1) return { texto: 'Vence amanhã', tom: 'warning' }
  if (d <= 7) return { texto: `Vence em ${d} dias`, tom: 'warning' }
  return { texto: `Vence dia ${Number(vencimento.slice(8, 10))}`, tom: 'neutro' }
}

/** Etiqueta de situação para listas. `null` quando já está pago (sem destaque). */
export function etiquetaLancamento(l: Lancamento): { texto: string; tom: TomEtiqueta } | null {
  if (l.status === 'pago') return null
  if (l.vencimento && l.tipo === 'saida') {
    const v = textoVencimento(l.vencimento)
    if (v.tom === 'danger') return { texto: 'Vencida', tom: 'danger' }
  }
  if (l.status === 'parcial') {
    return {
      texto: `Parcial · ${formatBRL(l.valor_pago)} de ${formatBRL(l.valor)}`,
      tom: 'warning',
    }
  }
  return { texto: nomeStatus(l.status, l.tipo), tom: 'warning' }
}

/** Linha de detalhe sob a descrição: "Mercado · Pago", "Cartão · vence 23/11". */
export function detalheLancamento(l: Lancamento, nomeCategoria: string | undefined): string {
  const partes: string[] = []
  if (nomeCategoria) partes.push(nomeCategoria)
  if (l.status !== 'pago' && l.vencimento) {
    partes.push(`${diasAte(l.vencimento) < 0 ? 'venceu' : 'vence'} ${formatDiaMes(l.vencimento)}`)
  } else {
    partes.push(nomeStatus(l.status, l.tipo))
  }
  return partes.join(' · ')
}

/** Quanto ainda falta pagar de um lançamento. */
export function faltaPagar(l: Lancamento): number {
  return l.status === 'pago' ? 0 : Math.max(0, Number(l.valor) - Number(l.valor_pago))
}
