import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
import { nomeExibicao, usePerfil } from '@/features/perfil/api'
import { cn } from '@/lib/cn'

/** Título da página + avatar (no celular, o avatar leva para Configurações). */
export function CabecalhoPagina({ titulo, acoes }: { titulo: string; acoes?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <h1 className="text-[26px] font-bold tracking-tight">{titulo}</h1>
      <div className="flex items-center gap-2">
        {acoes}
        <AvatarUsuario className="md:hidden" />
      </div>
    </header>
  )
}

export function AvatarUsuario({ className }: { className?: string }) {
  const { user } = useAuth()
  const { data: perfil } = usePerfil()
  const nome = nomeExibicao(perfil, user?.email)

  return (
    <Link
      to="/configuracoes"
      aria-label="Conta e configurações"
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-full bg-primary font-bold text-on-primary',
        className,
      )}
    >
      {nome.charAt(0).toUpperCase()}
    </Link>
  )
}
