import {
  Briefcase,
  Car,
  CircleEllipsis,
  CirclePlus,
  CreditCard,
  Gem,
  GraduationCap,
  HeartPulse,
  House,
  PartyPopper,
  Repeat,
  ShoppingCart,
  Sofa,
  Tag,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

/** Nomes guardados em categorias.icone → componente do lucide. */
const ICONES: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  'trending-up': TrendingUp,
  'circle-plus': CirclePlus,
  house: House,
  'shopping-cart': ShoppingCart,
  car: Car,
  'graduation-cap': GraduationCap,
  'heart-pulse': HeartPulse,
  'party-popper': PartyPopper,
  repeat: Repeat,
  'credit-card': CreditCard,
  sofa: Sofa,
  gem: Gem,
  'circle-ellipsis': CircleEllipsis,
}

export function iconeDaCategoria(nome: string | null | undefined): LucideIcon {
  return (nome && ICONES[nome]) || Tag
}
