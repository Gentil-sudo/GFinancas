import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo'

const estilos: Record<Variante, string> = {
  primario: 'bg-marca text-white hover:bg-teal-800',
  secundario: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  fantasma: 'text-slate-700 hover:bg-slate-100',
  perigo: 'bg-saida text-white hover:bg-rose-700',
}

interface Props extends ComponentProps<'button'> {
  variante?: Variante
  /** Mostra o spinner e bloqueia cliques (ex.: enquanto espera o servidor). */
  carregando?: boolean
  larguraTotal?: boolean
}

export function Botao({
  variante = 'primario',
  carregando = false,
  larguraTotal = false,
  type = 'button',
  disabled,
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca',
        'disabled:cursor-not-allowed disabled:opacity-60',
        estilos[variante],
        larguraTotal && 'w-full',
        className,
      )}
      {...props}
    >
      {carregando && <Spinner className="size-4" />}
      {children}
    </button>
  )
}
