import { createContext, useContext } from 'react'
import type { TemaAplicado, TemaEscolha } from './tema'

export interface TemaContexto {
  /** Escolha do usuário (pode ser "automatico"). */
  tema: TemaEscolha
  /** Tema efetivamente na tela. */
  temaAplicado: TemaAplicado
  /** Troca o tema na hora e salva no navegador (o perfil no Supabase é salvo por quem chama). */
  definirTema: (tema: TemaEscolha) => void
}

export const TemaContext = createContext<TemaContexto | null>(null)

export function useTema(): TemaContexto {
  const ctx = useContext(TemaContext)
  if (!ctx) throw new Error('useTema precisa estar dentro de <TemaProvider>')
  return ctx
}
