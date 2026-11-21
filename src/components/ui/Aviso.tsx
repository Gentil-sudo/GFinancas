import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tipo = 'erro' | 'sucesso' | 'atencao' | 'info'

const config: Record<Tipo, { icone: LucideIcon; classe: string }> = {
  erro: { icone: CircleAlert, classe: 'border-rose-200 bg-saida-suave text-rose-900' },
  sucesso: { icone: CircleCheck, classe: 'border-emerald-200 bg-entrada-suave text-emerald-900' },
  atencao: { icone: TriangleAlert, classe: 'border-amber-200 bg-pendente-suave text-amber-900' },
  info: { icone: Info, classe: 'border-slate-200 bg-slate-50 text-slate-700' },
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
        'flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm',
        classe,
        className,
      )}
    >
      <Icone className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
