import { Wallet } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Logo + nome do app. */
export function Marca({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 font-semibold text-slate-900', className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-marca text-white">
        <Wallet className="size-4.5" aria-hidden />
      </span>
      Minhas Finanças
    </div>
  )
}
