import { useCallback, useEffect, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router'

type Destino = { para: string; substituir: boolean } | { voltar: true }

/**
 * Navegação de formulários (PLANO §5.6):
 *  - com alterações não salvas, pergunta antes de sair (link, botão voltar ou fechar a aba);
 *  - `concluir()` sai sem perguntar (depois de salvar, ou indo para outro formulário).
 */
export function useSaidaFormulario(sujo: boolean, rotaPadrao: string) {
  const navigate = useNavigate()
  const [destino, setDestino] = useState<Destino | null>(null)
  const proteger = sujo && destino === null

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      proteger && currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm('Você tem alterações não salvas. Sair e descartar?')) blocker.proceed()
    else blocker.reset()
  }, [blocker])

  useEffect(() => {
    if (!proteger) return
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', aviso)
    return () => window.removeEventListener('beforeunload', aviso)
  }, [proteger])

  // Só navega depois que o bloqueio foi desligado (o estado já mudou).
  useEffect(() => {
    if (!destino) return
    if ('voltar' in destino) navigate(-1)
    else navigate(destino.para, { replace: destino.substituir })
  }, [destino, navigate])

  /** Volta para a tela anterior (ou para a rota padrão, se abriu direto pelo link). */
  const alvoVoltar = useCallback((): Destino => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    return idx > 0 ? { voltar: true } : { para: rotaPadrao, substituir: true }
  }, [rotaPadrao])

  /** Sai sem perguntar: para `para` ou, sem argumento, de volta. */
  const concluir = useCallback(
    (para?: string) => setDestino(para ? { para, substituir: true } : alvoVoltar()),
    [alvoVoltar],
  )

  /** Fechar/cancelar: pergunta se houver alterações. */
  const fechar = useCallback(() => {
    const alvo = alvoVoltar()
    if ('voltar' in alvo) navigate(-1)
    else navigate(alvo.para, { replace: true })
  }, [alvoVoltar, navigate])

  return { concluir, fechar }
}
