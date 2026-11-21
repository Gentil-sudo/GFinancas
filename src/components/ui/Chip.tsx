import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/** Botão-filtro em formato de pílula (ligado = cor primária). */
export function Chip({
  ativo,
  className,
  ...props
}: ComponentProps<'button'> & { ativo: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      className={cn(
        'min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors',
        ativo
          ? 'border-primary bg-primary text-on-primary'
          : 'border-border bg-surface text-text hover:bg-track',
        className,
      )}
      {...props}
    />
  )
}
