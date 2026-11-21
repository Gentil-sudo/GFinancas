import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Estado vazio que ensina: ícone, frase e uma ação (PLANO §4.0). */
export function EstadoVazio({
  icone: Icone,
  titulo,
  texto,
  acao,
  compacto = false,
}: {
  icone: LucideIcon
  titulo: string
  texto?: string
  acao?: ReactNode
  compacto?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        compacto ? 'py-4' : 'rounded-card border border-dashed border-border bg-surface px-6 py-10',
      )}
    >
      <span className="mb-3 grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
        <Icone className="size-6" aria-hidden />
      </span>
      <p className="font-semibold text-text">{titulo}</p>
      {texto && <p className="mt-1 max-w-sm text-sm text-muted">{texto}</p>}
      {acao && <div className="mt-4 flex flex-wrap justify-center gap-2">{acao}</div>}
    </div>
  )
}
