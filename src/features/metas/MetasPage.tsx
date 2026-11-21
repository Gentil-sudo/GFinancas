import { PiggyBank } from 'lucide-react'
import { EmBreve } from '@/components/EmBreve'

export function MetasPage() {
  return (
    <EmBreve
      titulo="Metas"
      icone={PiggyBank}
      fase={5}
      descricao="Caixinhas como Casamento e Móveis, com progresso e previsão de quando você chega lá."
    />
  )
}
