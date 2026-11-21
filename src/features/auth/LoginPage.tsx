import { Wallet } from 'lucide-react'
import { Link } from 'react-router'

/** Placeholder — a tela de login de verdade chega na Fase 3. */
export function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-marca text-white">
          <Wallet className="size-6" aria-hidden />
        </span>
        <h1 className="text-xl font-semibold">Minhas Finanças</h1>
        <p className="mt-2 text-sm text-slate-500">Login e cadastro chegam na Fase 3.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-marca hover:underline">
          Voltar para o início
        </Link>
      </div>
    </div>
  )
}
