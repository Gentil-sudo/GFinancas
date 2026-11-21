import { ChevronLeft, ChevronRight } from 'lucide-react'
import { competencia, formatMes } from '@/lib/format'
import { useMes } from '@/lib/mesContext'

/** "← Novembro 2026 →". No celular, deslizar a tela também troca o mês (ver useDeslizar). */
export function SeletorMes() {
  const { mes, mudarMes, definirMes } = useMes()
  const atual = competencia()

  return (
    <div className="flex items-center justify-between rounded-full border border-border bg-surface px-1">
      <button
        type="button"
        onClick={() => mudarMes(-1)}
        aria-label="Mês anterior"
        className="grid size-11 place-items-center rounded-full text-text hover:bg-track"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <div className="flex flex-col items-center py-1 leading-tight">
        <span className="text-[15px] font-bold" aria-live="polite">
          {formatMes(mes)}
        </span>
        {mes !== atual && (
          <button
            type="button"
            onClick={() => definirMes(atual)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Voltar para o mês atual
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => mudarMes(1)}
        aria-label="Próximo mês"
        className="grid size-11 place-items-center rounded-full text-text hover:bg-track"
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </div>
  )
}
