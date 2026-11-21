import type { LucideIcon } from 'lucide-react'
import { useRef, useState, type ReactNode, type TouchEvent } from 'react'
import { cn } from '@/lib/cn'

interface Acao {
  rotulo: string
  icone: LucideIcon
  tom: 'success' | 'danger'
  executar: () => void
}

const LIMIAR = 88 // px arrastados para disparar a ação

/**
 * Linha de lista com gesto de deslizar (celular): para a direita → `aoDeslizarDireita`
 * (ex.: Pagar); para a esquerda → `aoDeslizarEsquerda` (ex.: Excluir).
 * As mesmas ações continuam disponíveis tocando na linha (acessível sem gesto).
 */
export function LinhaDeslizavel({
  children,
  aoDeslizarDireita,
  aoDeslizarEsquerda,
}: {
  children: ReactNode
  aoDeslizarDireita?: Acao
  aoDeslizarEsquerda?: Acao
}) {
  const [dx, setDx] = useState(0)
  const [arrastando, setArrastando] = useState(false)
  const inicio = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null)
  const ignorarClique = useRef(false)

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0]
    inicio.current = { x: t.clientX, y: t.clientY, horizontal: null }
  }

  function onTouchMove(e: TouchEvent) {
    const i = inicio.current
    if (!i) return
    const t = e.touches[0]
    const mx = t.clientX - i.x
    const my = t.clientY - i.y
    if (i.horizontal === null && (Math.abs(mx) > 10 || Math.abs(my) > 10)) {
      i.horizontal = Math.abs(mx) > Math.abs(my)
    }
    if (!i.horizontal) return
    let novo = mx
    if (novo > 0 && !aoDeslizarDireita) novo = 0
    if (novo < 0 && !aoDeslizarEsquerda) novo = 0
    setArrastando(true)
    setDx(Math.max(-140, Math.min(140, novo)))
  }

  function onTouchEnd(e: TouchEvent) {
    const i = inicio.current
    inicio.current = null
    if (!i?.horizontal) return
    // O gesto foi tratado aqui: não deixa a página trocar de mês.
    e.stopPropagation()
    ignorarClique.current = true
    setTimeout(() => (ignorarClique.current = false), 350)
    if (dx >= LIMIAR) aoDeslizarDireita?.executar()
    if (dx <= -LIMIAR) aoDeslizarEsquerda?.executar()
    setArrastando(false)
    setDx(0)
  }

  const acao = dx > 0 ? aoDeslizarDireita : dx < 0 ? aoDeslizarEsquerda : undefined
  const pronto = Math.abs(dx) >= LIMIAR

  return (
    <div className="relative overflow-hidden">
      {acao && (
        <div
          aria-hidden
          className={cn(
            'absolute inset-0 flex items-center gap-2 px-4 text-sm font-bold text-on-primary transition-opacity',
            acao.tom === 'success' ? 'bg-success' : 'bg-danger',
            dx > 0 ? 'justify-start' : 'justify-end',
            pronto ? 'opacity-100' : 'opacity-70',
          )}
        >
          <acao.icone className="size-5" />
          {acao.rotulo}
        </div>
      )}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClickCapture={(e) => {
          if (ignorarClique.current) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        className={cn(
          'relative touch-pan-y bg-surface',
          !arrastando && 'transition-transform duration-200',
        )}
        style={{ transform: `translateX(${dx}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
