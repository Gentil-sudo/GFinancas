import type { LucideIcon } from 'lucide-react'
import { CabecalhoPagina } from './ui/CabecalhoPagina'
import { EstadoVazio } from './ui/EstadoVazio'

interface Props {
  titulo: string
  icone: LucideIcon
  fase: number
  descricao: string
}

/** Placeholder das telas que ainda serão construídas nas próximas fases. */
export function EmBreve({ titulo, icone, fase, descricao }: Props) {
  return (
    <>
      <CabecalhoPagina titulo={titulo} />
      <EstadoVazio icone={icone} titulo={`Em construção (Fase ${fase})`} texto={descricao} />
    </>
  )
}
