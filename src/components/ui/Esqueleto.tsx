import { cn } from '@/lib/cn'

/** Bloco cinza pulsante enquanto os dados carregam. */
export function Esqueleto({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-card bg-track', className)} />
}

/** Vários blocos + texto para leitores de tela. */
export function CarregandoLista({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status">
      <span className="sr-only">Carregando…</span>
      {Array.from({ length: linhas }, (_, i) => (
        <Esqueleto key={i} className="h-20" />
      ))}
    </div>
  )
}
