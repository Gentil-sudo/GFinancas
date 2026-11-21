import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

/** Quando há uma versão nova do app, avisa e só atualiza quando o usuário tocar. */
export function AvisoAtualizacao() {
  const {
    needRefresh: [precisaAtualizar],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(e) {
      console.error('[pwa] falha ao registrar o service worker', e)
    },
  })

  useEffect(() => {
    if (!precisaAtualizar) return
    toast('Nova versão do app disponível', {
      id: 'atualizacao',
      description: 'Salve o que estiver fazendo e toque em Atualizar.',
      duration: Infinity,
      action: { label: 'Atualizar', onClick: () => void updateServiceWorker(true) },
    })
  }, [precisaAtualizar, updateServiceWorker])

  return null
}
