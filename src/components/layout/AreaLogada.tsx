import { WifiOff } from 'lucide-react'
import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { MesProvider } from '@/components/MesProvider'
import { usePerfil } from '@/features/perfil/api'
import { useOnline } from '@/lib/online'
import { useTema } from '@/lib/temaContext'

/** Tudo que só existe com login: mês selecionado, tema do perfil e aviso de offline. */
export function AreaLogada() {
  return (
    <MesProvider>
      <SincronizarTemaDoPerfil />
      <AvisoOffline />
      <Outlet />
    </MesProvider>
  )
}

/** Ao entrar (ou em outro aparelho), aplica o tema salvo no perfil. */
function SincronizarTemaDoPerfil() {
  const { data: perfil } = usePerfil()
  const { tema, definirTema } = useTema()
  const temaPerfil = perfil?.tema

  useEffect(() => {
    if (temaPerfil && temaPerfil !== tema) definirTema(temaPerfil)
    // Só reage quando o perfil muda; trocar o tema localmente não deve ser desfeito aqui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temaPerfil])

  return null
}

/** Sem internet, avisar claramente que nada será salvo. */
function AvisoOffline() {
  const online = useOnline()
  if (online) return null
  return (
    <div
      role="alert"
      className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-danger px-4 py-2.5 text-sm font-semibold text-on-primary"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden />
      Sem internet: alterações não serão salvas.
    </div>
  )
}
