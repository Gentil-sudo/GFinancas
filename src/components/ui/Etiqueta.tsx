import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type TomEtiqueta = 'danger' | 'warning' | 'neutro' | 'success'

const estilos: Record<TomEtiqueta, string> = {
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  neutro: 'bg-track text-muted',
  success: 'bg-success/10 text-success',
}

/** Etiqueta de status ("Vencida", "Vence em 2 dias", "Pendente"). */
export function Etiqueta({ tom, children }: { tom: TomEtiqueta; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex self-start rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
        estilos[tom],
      )}
    >
      {children}
    </span>
  )
}
