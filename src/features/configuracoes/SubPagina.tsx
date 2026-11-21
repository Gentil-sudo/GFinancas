import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** Moldura das telas dentro de Configurações: "‹ Configurações" + título. */
export function SubPagina({
  titulo,
  acoes,
  children,
}: {
  titulo: string
  acoes?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <Link
          to="/configuracoes"
          className="-ml-1 flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-primary"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Configurações
        </Link>
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-[26px] font-bold tracking-tight">{titulo}</h1>
          {acoes}
        </header>
      </div>
      {children}
    </>
  )
}
