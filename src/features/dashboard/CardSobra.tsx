import { ArrowDown, ArrowDownLeft, ArrowUp, ArrowUpRight } from 'lucide-react'
import { formatBRL, nomeMes, round2 } from '@/lib/format'
import type { ResumoMensal } from '@/types/db'

/** Card principal: "Sobra do mês" grande, entradas e saídas, comparação com o mês anterior. */
export function CardSobra({
  atual,
  anterior,
  mesAnterior,
}: {
  atual: ResumoMensal
  anterior: ResumoMensal | undefined
  mesAnterior: string
}) {
  const resultado = Number(atual.resultado)
  const negativo = resultado < 0
  const diferenca = anterior ? round2(resultado - Number(anterior.resultado)) : null

  return (
    <section
      aria-label="Resumo do mês"
      className="flex flex-col gap-4 rounded-card border border-border bg-hero-bg p-[22px] text-hero-text"
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-hero-muted">
          {negativo ? 'Faltou no mês' : 'Sobra do mês'}
        </span>
        <span className="font-display text-[40px] leading-tight font-bold tracking-tight text-hero-value valor">
          {negativo && '− '}
          {formatBRL(Math.abs(resultado))}
        </span>
        {diferenca !== null && (
          <span className="flex items-center gap-1 text-[13px] text-hero-muted">
            {diferenca === 0 ? (
              `Igual a ${nomeMes(mesAnterior)}`
            ) : (
              <>
                {diferenca > 0 ? (
                  <ArrowUp className="size-3.5" aria-hidden />
                ) : (
                  <ArrowDown className="size-3.5" aria-hidden />
                )}
                {formatBRL(Math.abs(diferenca))} a {diferenca > 0 ? 'mais' : 'menos'} que{' '}
                {nomeMes(mesAnterior)}
              </>
            )}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs text-hero-muted">
            <ArrowDownLeft className="size-3.5" aria-hidden /> Entradas
          </span>
          <span className="text-[17px] font-bold valor">{formatBRL(atual.total_entradas)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs text-hero-muted">
            <ArrowUpRight className="size-3.5" aria-hidden /> Saídas
          </span>
          <span className="text-[17px] font-bold valor">{formatBRL(atual.total_saidas)}</span>
        </div>
      </div>
    </section>
  )
}
