import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import {
  aplicarTema,
  lerTemaLocal,
  observarModoDoSistema,
  salvarTemaLocal,
  type TemaEscolha,
} from '@/lib/tema'
import { TemaContext, type TemaContexto } from '@/lib/temaContext'

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<TemaEscolha>(lerTemaLocal)
  // Aplica no DOM *antes* de atualizar o estado: quem lê as cores calculadas
  // (ex.: gráficos) já encontra o tema novo ao renderizar.
  const [temaAplicado, setTemaAplicado] = useState(() => aplicarTema(tema))

  useEffect(() => {
    if (tema !== 'automatico') return
    return observarModoDoSistema(() => setTemaAplicado(aplicarTema('automatico')))
  }, [tema])

  const definirTema = useCallback((novo: TemaEscolha) => {
    salvarTemaLocal(novo)
    setTemaAplicado(aplicarTema(novo))
    setTema(novo)
  }, [])

  const valor = useMemo<TemaContexto>(
    () => ({ tema, temaAplicado, definirTema }),
    [tema, temaAplicado, definirTema],
  )

  return (
    <TemaContext.Provider value={valor}>
      {children}
      <Toaster
        position="top-center"
        theme={temaAplicado === 'noite' ? 'dark' : 'light'}
        richColors
        closeButton
        duration={6000}
      />
    </TemaContext.Provider>
  )
}
