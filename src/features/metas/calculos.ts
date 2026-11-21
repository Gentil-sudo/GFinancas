import { differenceInCalendarMonths, parseISO } from 'date-fns'
import { round2, somar, somarMeses } from '@/lib/format'
import type { Meta, MetaMovimento } from '@/types/db'

export type MetaComMovimentos = Meta & { meta_movimentos: MetaMovimento[] }

export type Previsao =
  | { tipo: 'atingida' }
  | { tipo: 'sem-ritmo' }
  | { tipo: 'no-ritmo'; mes: string }
  /** Precisa de `aporte` por mês para chegar em `prazo`. */
  | { tipo: 'aumentar'; aporte: number; prazo: string; mesNoRitmo: string | null }

export interface ResumoMeta {
  meta: Meta
  saldo: number
  alvo: number | null
  /** 0–100, ou null sem valor-alvo. */
  porcentagem: number | null
  /** Meses até o prazo (nov/2026 → jan/2028 = 14). */
  mesesRestantes: number | null
  /** Quanto o plano previa guardado até este mês. */
  planejadoAteAgora: number | null
  /** Guardado menos do que o planejado até agora. */
  atrasada: boolean
  previsao: Previsao | null
}

const mesesEntre = (de: string, ate: string) =>
  differenceInCalendarMonths(parseISO(ate), parseISO(de))

export function saldoMeta(movs: MetaMovimento[]): number {
  return somar(movs.map((m) => (m.tipo === 'aporte' ? Number(m.valor) : -Number(m.valor))))
}

/** Primeiro mês da meta: o início informado ou o do movimento mais antigo. */
export function inicioMeta(m: MetaComMovimentos, atual: string): string {
  if (m.inicio) return m.inicio
  const primeiro = [...m.meta_movimentos].sort((a, b) =>
    a.competencia.localeCompare(b.competencia),
  )[0]
  return primeiro?.competencia ?? atual
}

export function resumirMeta(m: MetaComMovimentos, atual: string): ResumoMeta {
  const saldo = saldoMeta(m.meta_movimentos)
  const alvo = m.valor_alvo !== null ? Number(m.valor_alvo) : null
  const plano = m.aporte_mensal_planejado !== null ? Number(m.aporte_mensal_planejado) : null
  const inicio = inicioMeta(m, atual)
  const decorridos = Math.max(1, mesesEntre(inicio, atual) + 1)

  const planejadoAteAgora =
    plano !== null && inicio <= atual
      ? round2(Math.min(alvo ?? Infinity, plano * decorridos))
      : null
  const atrasada = planejadoAteAgora !== null && saldo < planejadoAteAgora - 0.005

  let previsao: Previsao | null = null
  if (alvo !== null) {
    if (saldo >= alvo) {
      previsao = { tipo: 'atingida' }
    } else {
      const falta = alvo - saldo
      const ritmo = saldo / decorridos
      const mesNoRitmo = ritmo > 0 ? somarMeses(atual, Math.ceil(falta / ritmo)) : null
      const aporteNesteMes = m.meta_movimentos.some(
        (mv) => mv.tipo === 'aporte' && mv.competencia === atual,
      )
      if (m.fim && (atrasada || !mesNoRitmo || mesNoRitmo > m.fim)) {
        const meses = Math.max(1, mesesEntre(atual, m.fim) + (aporteNesteMes ? 0 : 1))
        previsao = { tipo: 'aumentar', aporte: round2(falta / meses), prazo: m.fim, mesNoRitmo }
      } else if (mesNoRitmo) {
        previsao = { tipo: 'no-ritmo', mes: mesNoRitmo }
      } else {
        previsao = { tipo: 'sem-ritmo' }
      }
    }
  }

  return {
    meta: m,
    saldo,
    alvo,
    porcentagem: alvo ? Math.max(0, Math.min(100, (saldo / alvo) * 100)) : null,
    mesesRestantes: m.fim ? mesesEntre(atual, m.fim) : null,
    planejadoAteAgora,
    atrasada,
    previsao,
  }
}

export interface PontoMeta {
  competencia: string
  planejado: number | null
  realizado: number | null
}

/** Série do gráfico planejado × realizado (realizado só até o mês atual). */
export function serieMeta(m: MetaComMovimentos, atual: string): PontoMeta[] {
  const inicio = inicioMeta(m, atual)
  const fim = m.fim && m.fim > atual ? m.fim : somarMeses(atual, 6)
  const plano = m.aporte_mensal_planejado !== null ? Number(m.aporte_mensal_planejado) : null
  const alvo = m.valor_alvo !== null ? Number(m.valor_alvo) : Infinity

  const pontos: PontoMeta[] = []
  let acumulado = saldoMeta(m.meta_movimentos.filter((mv) => mv.competencia < inicio))
  let i = 0
  for (let c = inicio; c <= fim && i < 240; c = somarMeses(c, 1), i++) {
    acumulado += saldoMeta(m.meta_movimentos.filter((mv) => mv.competencia === c))
    pontos.push({
      competencia: c,
      planejado: plano !== null ? round2(Math.min(alvo, plano * (i + 1))) : null,
      realizado: c <= atual ? round2(acumulado) : null,
    })
  }
  return pontos
}
