import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tipo = 'erro' | 'sucesso' | 'atencao' | 'info'

const config: Record<Tipo, { icone: LucideIcon; classe: string }> = {
  erro: { icone: CircleAlert, classe: 'border-danger/30 bg-danger-soft text-danger' },
  sucesso: { icone: CircleCheck, classe: 'border-success/40 bg-surface text-success' },
  atencao: { icone: TriangleAlert, classe: 'border-warning/30 bg-warning-soft text-warning' },
  info: { icone: Info, classe: 'border-border bg-bg text-muted' },
}

/** Caixa de mensagem com ícone (a cor nunca é a única pista: sempre há ícone e texto). */
export function Aviso({
  tipo,
  children,
  className,
}: {
  tipo: Tipo
  children: ReactNode
  className?: string
}) {
  const { icone: Icone, classe } = config[tipo]
  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-2xl border px-3.5 py-3 text-sm font-medium',
        classe,
        className,
      )}
    >
      <Icone className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
