import { CalendarClock } from 'lucide-react'
import { EmBreve } from '@/components/EmBreve'

export function ParcelasPage() {
  return (
    <EmBreve
      titulo="Parcelas"
      icone={CalendarClock}
      fase={5}
      descricao="Suas compras parceladas, quanto falta de cada uma e quando o peso das parcelas diminui."
    />
  )
}
