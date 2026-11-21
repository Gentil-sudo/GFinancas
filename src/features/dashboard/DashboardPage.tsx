import { House } from 'lucide-react'
import { EmBreve } from '@/components/EmBreve'

export function DashboardPage() {
  return (
    <EmBreve
      titulo="Início"
      icone={House}
      fase={4}
      descricao="Aqui vai aparecer quanto sobra no mês, o que falta pagar e para onde foi o dinheiro."
    />
  )
}
