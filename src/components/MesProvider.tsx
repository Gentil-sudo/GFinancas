import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { competencia, somarMeses } from '@/lib/format'
import { MesContext, type MesContexto } from '@/lib/mesContext'

const CHAVE = 'mes-selecionado'

function lerInicial(): string {
  try {
    const salvo = sessionStorage.getItem(CHAVE)
    if (salvo && /^\d{4}-\d{2}-01$/.test(salvo)) return salvo
  } catch {
    // ignora
  }
  return competencia()
}

/** Guarda o mês selecionado (sobrevive a recarregar a aba; volta ao mês atual em nova aba). */
export function MesProvider({ children }: { children: ReactNode }) {
  const [mes, setMes] = useState(lerInicial)

  const definirMes = useCallback((novo: string) => {
    setMes(novo)
    try {
      sessionStorage.setItem(CHAVE, novo)
    } catch {
      // ignora
    }
  }, [])

  const mudarMes = useCallback(
    (delta: number) => definirMes(somarMeses(mes, delta)),
    [mes, definirMes],
  )

  const valor = useMemo<MesContexto>(
    () => ({ mes, definirMes, mudarMes }),
    [mes, definirMes, mudarMes],
  )
  return <MesContext.Provider value={valor}>{children}</MesContext.Provider>
}
