import { Wallet } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Logo + nome do app. */
export function Marca({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 font-display font-bold text-text', className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-on-primary">
        <Wallet className="size-5" aria-hidden />
      </span>
      Minhas Finanças
    </div>
  )
}
