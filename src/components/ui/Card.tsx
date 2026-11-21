import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Cartão padrão: superfície com borda e o raio do tema. */
export function Card({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'flex flex-col gap-3.5 rounded-card border border-border bg-surface p-5',
        className,
      )}
      {...props}
    />
  )
}

/** Título de card com algo opcional à direita (ex.: "77% pago", "Ver todos"). */
export function TituloCard({ children, direita }: { children: ReactNode; direita?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-[17px] font-bold text-text">{children}</h2>
      {direita && <div className="shrink-0 text-[13px] text-muted">{direita}</div>}
    </div>
  )
}
