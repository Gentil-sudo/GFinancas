import {
  ArrowLeftRight,
  CalendarClock,
  House,
  PiggyBank,
  Settings,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export interface ItemNav {
  to: string
  label: string
  icone: LucideIcon
  /** Aparece na barra inferior do celular (máx. 5). Os demais ficam no topo. */
  noCelular: boolean
}

export const itensNav: ItemNav[] = [
  { to: '/', label: 'Início', icone: House, noCelular: true },
  { to: '/lancamentos', label: 'Lançamentos', icone: ArrowLeftRight, noCelular: true },
  { to: '/parcelas', label: 'Parcelas', icone: CalendarClock, noCelular: true },
  { to: '/metas', label: 'Metas', icone: PiggyBank, noCelular: true },
  { to: '/investimentos', label: 'Investimentos', icone: TrendingUp, noCelular: true },
  { to: '/configuracoes', label: 'Configurações', icone: Settings, noCelular: false },
]
