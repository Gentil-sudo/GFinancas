import { addMonths, format, parseISO, startOfMonth } from 'date-fns'
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

/** 1234.5 → "R$ 1.234,50". Aceita string porque o Postgres devolve `numeric` como texto. */
export function formatBRL(valor: number | string | null | undefined): string {
  return brl.format(round2(Number(valor ?? 0)))
}

/**
 * Converte o que o usuário digitou em número. Aceita vírgula ou ponto:
 * "1.234,56" → 1234.56 · "1234,5" → 1234.5 · "1234.56" → 1234.56. Retorna `null` se inválido.
 */
export function parseValor(texto: string): number | null {
  let s = texto.trim().replace(/[R$\s]/g, '')
  if (!s) return null
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.')
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
