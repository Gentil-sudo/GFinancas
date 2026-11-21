import { createContext, useContext } from 'react'

export interface MesContexto {
  /** Competência selecionada ("2026-11-01"). */
  mes: string
  definirMes: (mes: string) => void
  /** Avança/volta N meses. */
  mudarMes: (delta: number) => void
}

export const MesContext = createContext<MesContexto | null>(null)

/** Mês selecionado no app (compartilhado entre Início e Lançamentos). */
export function useMes(): MesContexto {
  const ctx = useContext(MesContext)
  if (!ctx) throw new Error('useMes precisa estar dentro de <MesProvider>')
  return ctx
}
