import { useEffect, useRef, useState } from 'react'
import { Aviso } from '@/components/ui/Aviso'
import { useTema } from '@/lib/temaContext'
import { CAPTCHA_SITE_KEY, carregarTurnstile } from './useCaptcha'

/** Caixinha "Confirme que você é humano" (some sozinha na maioria das vezes). */
export function Captcha({
  versao,
  onToken,
}: {
  versao: number
  onToken: (token: string | null) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [falhou, setFalhou] = useState(false)
  const { temaAplicado } = useTema()
  const escuro = temaAplicado === 'noite'

  useEffect(() => {
    if (!CAPTCHA_SITE_KEY) return
    let id: string | undefined
    let cancelado = false
    carregarTurnstile()
      .then((turnstile) => {
        if (cancelado || !ref.current) return
        setFalhou(false)
        id = turnstile.render(ref.current, {
          sitekey: CAPTCHA_SITE_KEY,
          language: 'pt-br',
          theme: escuro ? 'dark' : 'light',
          size: 'flexible',
          callback: (t: string) => onToken(t),
          'expired-callback': () => onToken(null),
          'error-callback': () => {
            onToken(null)
            setFalhou(true)
          },
        })
      })
      .catch(() => setFalhou(true))
    return () => {
      cancelado = true
      if (id) window.turnstile?.remove(id)
    }
  }, [versao, escuro, onToken])

  if (!CAPTCHA_SITE_KEY) return null
  return (
    <div className="flex flex-col gap-2">
      <div ref={ref} className="min-h-[65px]" />
      {falhou && (
        <Aviso tipo="atencao">
          Não foi possível fazer a verificação anti-robô. Confira a internet e recarregue a página.
        </Aviso>
      )}
    </div>
  )
}
