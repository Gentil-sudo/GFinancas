import { CircleUserRound, LogOut } from 'lucide-react'
import { Botao } from '@/components/ui/Botao'
import { useAuth } from '@/features/auth/authContext'

export function ConfiguracoesPage() {
  const { user, sair } = useAuth()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">Conta</h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <CircleUserRound className="size-9 shrink-0 text-slate-400" aria-hidden />
            <p className="truncate font-medium">{user?.email}</p>
          </div>
          <Botao variante="secundario" onClick={sair}>
            <LogOut className="size-4" aria-hidden />
            Sair
          </Botao>
        </div>
      </section>

      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
        Categorias, lixeira, histórico de alterações, backup e troca de senha chegam na Fase 6.
      </p>
    </div>
  )
}
