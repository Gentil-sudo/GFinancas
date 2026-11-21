import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Folha modal: sobe de baixo no celular, centralizada no desktop.
 * Usa <dialog> nativo (foco preso, Esc fecha, acessível).
 */
export function Folha({
  aberta,
  onFechar,
  titulo,
  subtitulo,
  children,
}: {
  aberta: boolean
  onFechar: () => void
  titulo: string
  subtitulo?: ReactNode
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (aberta && !d.open) d.showModal()
    if (!aberta && d.open) d.close()
  }, [aberta])

  return (
    <dialog
      ref={ref}
      onClose={onFechar}
      // Clique no fundo escuro (fora do conteúdo) fecha.
      onClick={(e) => e.target === ref.current && onFechar()}
      aria-labelledby="folha-titulo"
      className="folha border border-border bg-surface p-0 text-text"
    >
      <div className="flex max-h-[90dvh] flex-col gap-4 overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="folha-titulo" className="text-lg font-bold break-words">
              {titulo}
            </h2>
            {subtitulo && <div className="mt-0.5 text-sm text-muted">{subtitulo}</div>}
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="grid size-11 shrink-0 place-items-center rounded-full border border-border text-text hover:bg-track"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {aberta && children}
      </div>
    </dialog>
  )
}
