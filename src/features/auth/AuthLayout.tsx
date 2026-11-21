import type { ReactNode } from 'react'
import { Marca } from '@/components/layout/Marca'
import { Aviso } from '@/components/ui/Aviso'
import { supabaseConfigurado } from '@/lib/supabase'

interface Props {
  titulo: string
  subtitulo?: string
  children: ReactNode
  /** Links abaixo do cartão (ex.: "Não tem conta? Criar conta"). */
  rodape?: ReactNode
}

/** Moldura comum das telas de login, cadastro e senha. */
export function AuthLayout({ titulo, subtitulo, children, rodape }: Props) {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Marca className="mb-8 justify-center text-lg" />

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
          {subtitulo && <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>}

          {!supabaseConfigurado && (
            <Aviso tipo="atencao" className="mt-4">
              Supabase não configurado: preencha o <code>.env.local</code> e reinicie o{' '}
              <code>npm run dev</code>.
            </Aviso>
          )}

          <div className="mt-6">{children}</div>
        </div>

        {rodape && (
          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-slate-600">
            {rodape}
          </div>
        )}
      </div>
    </div>
  )
}
