import { Settings, TriangleAlert, Wallet } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/cn'
import { supabaseConfigurado } from '@/lib/supabase'
import { itensNav } from './navegacao'

/**
 * Layout base: menu lateral no desktop (md+) e barra inferior no celular.
 */
export function AppLayout() {
  return (
    <div className="min-h-dvh md:flex">
      {/* Menu lateral — desktop */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 md:flex">
        <Marca className="mb-6 px-3" />
        <nav className="flex flex-col gap-1">
          {itensNav.map(({ to, label, icone: Icone }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900',
                  isActive && 'bg-marca-suave text-marca hover:bg-marca-suave hover:text-marca',
                )
              }
            >
              <Icone className="size-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topo — celular */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <Marca />
          <NavLink
            to="/configuracoes"
            aria-label="Configurações"
            className={({ isActive }) =>
              cn(
                'rounded-full p-2 text-slate-600 hover:bg-slate-100',
                isActive && 'bg-marca-suave text-marca',
              )
            }
          >
            <Settings className="size-5" aria-hidden />
          </NavLink>
        </header>

        {!supabaseConfigurado && <AvisoSupabase />}

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 md:px-8 md:pt-8 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Barra inferior — celular */}
      <nav
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Menu principal"
      >
        {itensNav
          .filter((i) => i.noCelular)
          .map(({ to, label, icone: Icone }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-500',
                  isActive && 'text-marca',
                )
              }
            >
              <Icone className="size-6" aria-hidden />
              <span className="max-w-full truncate px-0.5">{label}</span>
            </NavLink>
          ))}
      </nav>
    </div>
  )
}

function Marca({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 font-semibold text-slate-900', className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-marca text-white">
        <Wallet className="size-4.5" aria-hidden />
      </span>
      Minhas Finanças
    </div>
  )
}

function AvisoSupabase() {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 border-b border-amber-200 bg-pendente-suave px-4 py-2.5 text-sm text-amber-900 md:px-8"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        Supabase não configurado: copie <code>.env.example</code> para <code>.env.local</code>,
        preencha a URL e a publishable key e reinicie o <code>npm run dev</code>.
      </p>
    </div>
  )
}
