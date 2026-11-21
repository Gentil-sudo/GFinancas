import { Etiqueta } from '@/components/ui/Etiqueta'
import { IconeCategoria } from '@/components/ui/IconeCategoria'
import { cn } from '@/lib/cn'
import { formatBRL } from '@/lib/format'
import type { Categoria, Lancamento } from '@/types/db'
import { detalheLancamento, etiquetaLancamento } from './status'

/** Linha do extrato: ícone da categoria, descrição, situação e valor à direita. */
export function ItemLancamento({
  lancamento: l,
  categoria,
  onClick,
}: {
  lancamento: Lancamento
  categoria: Categoria | undefined
  onClick: () => void
}) {
  const etiqueta = etiquetaLancamento(l)
  const entrada = l.tipo === 'entrada'

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl py-2.5 text-left transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-primary"
    >
      <IconeCategoria icone={categoria?.icone} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[15px] font-semibold text-text">{l.descricao}</span>
        <span className="truncate text-[13px] text-muted">
          {detalheLancamento(l, categoria?.nome)}
        </span>
        {etiqueta && <Etiqueta tom={etiqueta.tom}>{etiqueta.texto}</Etiqueta>}
      </div>
      <span
        className={cn(
          'text-[15px] font-bold whitespace-nowrap valor',
          entrada ? 'text-success' : 'text-text',
        )}
      >
        <span className="sr-only">{entrada ? 'Entrada de' : 'Saída de'} </span>
        <span aria-hidden>{entrada ? '+ ' : '− '}</span>
        {formatBRL(l.valor)}
      </span>
    </button>
  )
}
