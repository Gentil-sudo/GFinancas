import { Settings } from 'lucide-react'
import { EmBreve } from '@/components/EmBreve'

export function ConfiguracoesPage() {
  return (
    <EmBreve
      titulo="Configurações"
      icone={Settings}
      fase={6}
      descricao="Categorias, lixeira, histórico de alterações e backup dos seus dados."
    />
  )
}
