import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn('size-5 animate-spin', className)} aria-hidden />
}

/** Tela inteira de carregamento (ex.: enquanto descobre se há sessão salva). */
export function TelaCarregando() {
  return (
    <div className="grid min-h-dvh place-items-center text-muted" role="status">
      <div className="flex items-center gap-2 text-sm">
        <Spinner />
        Carregando…
      </div>
    </div>
  )
}
