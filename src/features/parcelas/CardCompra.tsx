import { BarraProgresso } from '@/components/ui/BarraProgresso'
import { IconeCategoria } from '@/components/ui/IconeCategoria'
import { useMapaCategorias } from '@/features/categorias/api'
import { formatBRL, formatMesCurto } from '@/lib/format'
import type { ResumoCompra } from './calculos'

/** Card de uma compra: valor/mês, "termina em", barra "4 de 12 pagas" e quanto falta. */
export function CardCompra({
  resumo: r,
  cor,
  onClick,
}: {
  resumo: ResumoCompra
  /** Cor da compra no gráfico (token CSS). */
  cor: string
  onClick: () => void
}) {
  const categorias = useMapaCategorias()
  const c = r.compra
  const pct = r.total > 0 ? (r.pagas / r.total) * 100 : 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3.5 rounded-card border border-border bg-surface p-5 text-left transition-colors hover:border-primary"
    >
      <div className="flex w-full items-center gap-3">
        <IconeCategoria icone={categorias.get(c.categoria_id ?? '')?.icone} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-base font-bold">{c.descricao}</span>
          <span className="text-[13px] text-muted">
            <span className="valor">{formatBRL(c.valor_parcela)}</span>/mês ·{' '}
            {r.finalizada ? 'finalizada' : `termina ${formatMesCurto(r.ultimaCompetencia)}`}
          </span>
        </div>
        <span aria-hidden className="size-3 shrink-0 rounded" style={{ background: cor }} />
      </div>
      <BarraProgresso
        porcentagem={pct}
        cor={cor}
        rotulo={`${c.descricao}: ${r.pagas} de ${r.total} parcelas pagas`}
      />
      <div className="flex w-full justify-between gap-3 text-[13px]">
        <span className="font-semibold">
          {r.pagas} de {r.total} pagas
        </span>
        <span className="text-muted valor">
          {r.falta > 0 ? `Faltam ${formatBRL(r.falta)}` : 'Tudo pago'}
        </span>
      </div>
    </button>
  )
}
