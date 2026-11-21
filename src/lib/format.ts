import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  parseISO,
  setDate,
  startOfMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ---------- Dinheiro ----------

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Arredonda para 2 casas evitando erro de float (ex.: 0.1 + 0.2). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Soma valores em dinheiro sem acumular erro de float (soma em centavos inteiros). */
export function somar(valores: Array<number | string | null | undefined>): number {
  const centavos = valores.reduce<number>((acc, v) => acc + Math.round(Number(v ?? 0) * 100), 0)
  return centavos / 100
}

/** 1234.5 → "R$ 1.234,50". Aceita string também (ex.: valores lidos de um backup). */
export function formatBRL(valor: number | string | null | undefined): string {
  return brl.format(round2(Number(valor ?? 0)))
}

/**
 * Converte o que o usuário digitou em número. Aceita vírgula ou ponto:
 * "1.234,56" → 1234.56 · "1234,5" → 1234.5 · "1234.56" → 1234.56 · "1.500" → 1500 (milhar).
 * Retorna `null` se inválido.
 */
export function parseValor(texto: string): number | null {
  let s = texto.trim().replace(/[R$\s]/g, '')
  if (!s) return null
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // Só pontos em grupos de 3 dígitos: separador de milhar ("1.500", "12.345.678").
    s = s.replace(/\./g, '')
  }
  const n = Number(s)
  return Number.isFinite(n) ? round2(n) : null
}

// ---------- Datas e competência (mês) ----------

/** Data → "dd/mm/aaaa". */
export function formatData(data: Date | string): string {
  const d = typeof data === 'string' ? parseISO(data) : data
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

/** Competência = dia 1 do mês, no formato do banco ("2026-11-01"). */
export function competencia(data: Date = new Date()): string {
  return format(startOfMonth(data), 'yyyy-MM-dd')
}

/** "2026-11-01" + 1 → "2026-12-01". */
export function somarMeses(comp: string, meses: number): string {
  return competencia(addMonths(parseISO(comp), meses))
}

/** "2026-11-01" → "Novembro 2026". */
export function formatMes(comp: string): string {
  const s = format(parseISO(comp), 'MMMM yyyy', { locale: ptBR })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "2026-11-01" → "nov/2026". */
export function formatMesCurto(comp: string): string {
  return format(parseISO(comp), 'MMM/yyyy', { locale: ptBR })
}

/** "2026-11-01" → "outubro" (nome do mês, minúsculo). */
export function nomeMes(comp: string): string {
  return format(parseISO(comp), 'MMMM', { locale: ptBR })
}

// ---------- Dias ----------

/** Hoje no formato do banco ("2026-11-21"), no fuso do aparelho. */
export function hoje(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Quantos dias faltam até a data (negativo = já passou). */
export function diasAte(dataISO: string): number {
  return differenceInCalendarDays(parseISO(dataISO), new Date())
}

/** "2026-11-23" → "23/11". */
export function formatDiaMes(dataISO: string): string {
  return format(parseISO(dataISO), 'dd/MM')
}

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

/** Cabeçalho de grupo do extrato: "Hoje · sáb, 21 nov", "Ontem · sex, 20 nov", "Qui, 19 nov". */
export function formatDiaCabecalho(dataISO: string): string {
  const d = parseISO(dataISO)
  const base = `${DIAS_SEMANA[d.getDay()]}, ${format(d, 'd MMM', { locale: ptBR })}`
  const dias = differenceInCalendarDays(d, new Date())
  if (dias === 0) return `Hoje · ${base}`
  if (dias === -1) return `Ontem · ${base}`
  return base.charAt(0).toUpperCase() + base.slice(1)
}

/** Mesma data em outro mês, limitando ao último dia ("2026-10-31" → nov = "2026-11-30"). */
export function mesmoDiaEm(dataISO: string, comp: string): string {
  const dia = parseISO(dataISO).getDate()
  const inicio = parseISO(comp)
  const ultimo = endOfMonth(inicio).getDate()
  return format(setDate(inicio, Math.min(dia, ultimo)), 'yyyy-MM-dd')
}

/** Formata número para o campo de valor: 1234.5 → "1.234,50". */
export function formatValorCampo(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
