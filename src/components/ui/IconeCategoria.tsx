import { createElement } from 'react'
import { cn } from '@/lib/cn'
import { iconeDaCategoria } from './icones'

/** Só o ícone (lucide) correspondente ao nome guardado na categoria. */
export function IconeLucide({
  nome,
  className,
}: {
  nome: string | null | undefined
  className?: string
}) {
  return createElement(iconeDaCategoria(nome), { className, 'aria-hidden': true })
}

/** Quadradinho com o ícone da categoria (usado nas listas). */
export function IconeCategoria({
  icone,
  className,
}: {
  icone: string | null | undefined
  className?: string
}) {
  return (
    <span
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary',
        className,
      )}
    >
      <IconeLucide nome={icone} className="size-5" />
    </span>
  )
}
