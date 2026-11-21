import { TrendingUp } from 'lucide-react'
import { EmBreve } from '@/components/EmBreve'

export function InvestimentosPage() {
  return (
    <EmBreve
      titulo="Investimentos"
      icone={TrendingUp}
      fase={6}
      descricao="Saldo por tipo de investimento, distribuição e evolução mês a mês."
    />
  )
}
