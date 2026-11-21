import { LogOut, Plus } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
import { cn } from '@/lib/cn'
import { Marca } from './Marca'
import { itensNav } from './navegacao'

/**
 * Layout das telas principais: menu lateral no desktop (md+); no celular, barra inferior
 * com o botão "+" no centro (Novo lançamento).
 */
export function AppLayout() {
  const { user, sair } = useAuth()
  const doCelular = itensNav.filter((i) => i.noCelular)

  return (
    <div className="min-h-dvh md:flex">
      {/* Menu lateral — desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
        <Marca className="mb-6 px-2" />
        <Link
          to="/lancamentos/novo"
          className="mb-6 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary hover:opacity-90"
        >
          <Plus className="size-5" aria-hidden />
          Novo lançamento
        </Link>
        <nav className="flex flex-col gap-1" aria-label="Menu principal">
          {itensNav.map(({ to, label, icone: Icone }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted transition-colors hover:bg-track hover:text-text',
                  isActive &&
                    'bg-primary-soft font-semibold text-primary hover:bg-primary-soft hover:text-primary',
                )
              }
            >
              <Icone className="size-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-border px-2 pt-4">
          <p className="truncate text-xs text-muted" title={user?.email}>
            {user?.email}
          </p>
          <button
            type="button"
            onClick={sair}
            className="mt-2 -ml-2 flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-muted hover:bg-track hover:text-text"
          >
            <LogOut className="size-4" aria-hidden />
            Sair
          </button>
        </div>
      </aside>

      <main className="mx-auto flex w-full max-w-2xl min-w-0 flex-1 flex-col gap-[18px] px-5 pt-6 pb-32 md:px-8 md:pt-10 md:pb-16">
        <Outlet />
      </main>

      {/* Barra inferior — celular */}
      <nav
        aria-label="Menu principal"
        className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-border bg-surface px-3 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden"
      >
        {doCelular.slice(0, 2).map((item) => (
          <ItemBarra key={item.to} {...item} />
        ))}
        <BotaoNovo className="-mt-7" />
        {doCelular.slice(2).map((item) => (
          <ItemBarra key={item.to} {...item} />
        ))}
      </nav>

      {/* Botão flutuante — desktop */}
      <BotaoNovo className="fixed right-8 bottom-8 hidden md:flex" />
    </div>
  )
}

function ItemBarra({ to, label, icone: Icone }: (typeof itensNav)[number]) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex min-h-11 min-w-14 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted',
          isActive && 'font-bold text-primary',
        )
      }
    >
      <Icone className="size-[22px]" aria-hidden />
      <span>{label}</span>
    </NavLink>
  )
}

function BotaoNovo({ className }: { className?: string }) {
  return (
    <Link
      to="/lancamentos/novo"
      aria-label="Novo lançamento"
      className={cn(
        'z-20 flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition hover:opacity-90',
        className,
      )}
    >
      <Plus className="size-[26px]" strokeWidth={2.4} aria-hidden />
    </Link>
  )
}
