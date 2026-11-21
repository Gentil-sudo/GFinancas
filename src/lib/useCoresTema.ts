import { useMemo } from 'react'
import { useTema } from './temaContext'

/**
 * Cores do tema ativo já resolvidas (hex), para bibliotecas que precisam de valores
 * concretos (ex.: Recharts). Recalcula quando o tema muda.
 */
export function useCoresTema() {
  const { temaAplicado } = useTema()
  return useMemo(() => {
    const estilo = getComputedStyle(document.documentElement)
    const ler = (nome: string) => estilo.getPropertyValue(nome).trim()
    return {
      tema: temaAplicado,
      entrada: ler('--grafico-entrada'),
      saida: ler('--grafico-saida'),
      texto: ler('--text'),
      muted: ler('--muted'),
      border: ler('--border'),
      surface: ler('--surface'),
      fonte: ler('--fonte-texto'),
    }
  }, [temaAplicado])
}
