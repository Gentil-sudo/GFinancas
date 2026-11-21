import { ArrowLeftRight } from 'lucide-react'
import { EmBreve } from '@/components/EmBreve'

export function LancamentosPage() {
  return (
    <EmBreve
      titulo="Lançamentos"
      icone={ArrowLeftRight}
      fase={4}
      descricao="Extrato do mês agrupado por dia, com entradas, saídas e o que ainda está pendente."
    />
  )
}
