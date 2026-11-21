import { House, Layers, List, Settings, Target, TrendingUp, type LucideIcon } from 'lucide-react'

export interface ItemNav {
  to: string
  label: string
  icone: LucideIcon
  /** Aparece na barra inferior do celular (2 de cada lado do botão "+"). */
  noCelular: boolean
}

export const itensNav: ItemNav[] = [
  { to: '/', label: 'Início', icone: House, noCelular: true },
  { to: '/lancamentos', label: 'Lançamentos', icone: List, noCelular: true },
  { to: '/parcelas', label: 'Parcelas', icone: Layers, noCelular: true },
  { to: '/metas', label: 'Metas', icone: Target, noCelular: true },
  { to: '/investimentos', label: 'Investimentos', icone: TrendingUp, noCelular: false },
  { to: '/configuracoes', label: 'Configurações', icone: Settings, noCelular: false },
]
