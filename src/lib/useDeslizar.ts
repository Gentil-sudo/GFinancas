import { useRef, type TouchEvent } from 'react'

/**
 * Detecta o gesto de deslizar na horizontal (celular).
 * Deslizar para a esquerda → `paraEsquerda` (ex.: próximo mês); para a direita → `paraDireita`.
 * Ignora gestos mais verticais que horizontais (rolagem da página).
 */
export function useDeslizar(paraEsquerda: () => void, paraDireita: () => void) {
  const inicio = useRef<{ x: number; y: number } | null>(null)

  return {
    onTouchStart(e: TouchEvent) {
      const t = e.touches[0]
      inicio.current = { x: t.clientX, y: t.clientY }
    },
    onTouchEnd(e: TouchEvent) {
      const i = inicio.current
      inicio.current = null
      if (!i) return
      const t = e.changedTouches[0]
      const dx = t.clientX - i.x
      const dy = t.clientY - i.y
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) paraEsquerda()
        else paraDireita()
      }
    },
  }
}
