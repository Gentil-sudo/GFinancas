import type { TomEtiqueta } from '@/components/ui/Etiqueta'
import { formatBRL, formatMesCurto } from '@/lib/format'
import type { ResumoMeta } from './calculos'

/** Frase da previsão: "No ritmo atual, você chega lá em jan/2028" / "Atrasada: aporte R$ X/mês...". */
export function textoPrevisao(r: ResumoMeta): { texto: string; tom: TomEtiqueta } | null {
  const p = r.previsao
  if (!p) return null
  switch (p.tipo) {
    case 'atingida':
      return { texto: 'Meta atingida!', tom: 'success' }
    case 'sem-ritmo':
      return { texto: 'Faça um aporte para ver a previsão.', tom: 'neutro' }
    case 'no-ritmo':
      return { texto: `No ritmo atual, você chega lá em ${formatMesCurto(p.mes)}`, tom: 'success' }
    case 'aumentar':
      return {
        texto: r.atrasada
          ? `Atrasada: aporte ${formatBRL(p.aporte)}/mês para fechar em ${formatMesCurto(p.prazo)}`
          : `Para chegar no prazo, aporte ${formatBRL(p.aporte)}/mês`,
        tom: 'warning',
      }
  }
}

/** "Prazo jan/2028 · faltam 14 meses". */
export function textoPrazo(r: ResumoMeta): string {
  if (!r.meta.fim || r.mesesRestantes === null) return 'Sem prazo definido'
  const m = r.mesesRestantes
  const resto =
    m < 0
      ? 'prazo encerrado'
      : m === 0
        ? 'termina este mês'
        : `faltam ${m} ${m === 1 ? 'mês' : 'meses'}`
  return `Prazo ${formatMesCurto(r.meta.fim)} · ${resto}`
}
