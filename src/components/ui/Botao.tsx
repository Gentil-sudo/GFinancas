import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

type Variante = 'primario' | 'secundario' | 'contorno' | 'fantasma' | 'perigo'
type Tamanho = 'normal' | 'grande'

const estilos: Record<Variante, string> = {
  primario: 'bg-primary text-on-primary hover:opacity-90',
  secundario: 'border border-border bg-surface text-text hover:bg-track',
  contorno: 'border border-primary bg-transparent text-primary hover:bg-primary-soft',
  fantasma: 'text-text hover:bg-track',
  perigo: 'bg-danger text-on-primary hover:opacity-90',
}

const tamanhos: Record<Tamanho, string> = {
  normal: 'min-h-11 rounded-xl px-4 text-sm',
  grande: 'min-h-14 rounded-card px-5 text-base',
}

interface Props extends ComponentProps<'button'> {
  variante?: Variante
  tamanho?: Tamanho
  /** Mostra o spinner e bloqueia cliques (ex.: enquanto espera o servidor). */
  carregando?: boolean
  larguraTotal?: boolean
}

export function Botao({
  variante = 'primario',
  tamanho = 'normal',
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
        'inline-flex items-center justify-center gap-2 font-semibold transition',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:cursor-not-allowed disabled:opacity-60',
        estilos[variante],
        tamanhos[tamanho],
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
