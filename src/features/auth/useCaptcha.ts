import { useCallback, useState } from 'react'

/**
 * Verificação anti-robô (Cloudflare Turnstile) nas telas de login, cadastro e senha.
 * Só liga quando `VITE_TURNSTILE_SITE_KEY` está configurada; sem ela, tudo funciona
 * como antes. Atenção: se ligar o captcha no Supabase, configure a chave aqui também.
 */
export const CAPTCHA_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || null

interface Turnstile {
  render: (el: HTMLElement, opcoes: Record<string, unknown>) => string
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

let carregamento: Promise<Turnstile> | null = null

/** Baixa o script do Turnstile uma vez só (só nas telas que usam). */
export function carregarTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  carregamento ??= new Promise<Turnstile>((resolver, rejeitar) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () =>
      window.turnstile ? resolver(window.turnstile) : rejeitar(new Error('turnstile ausente'))
    s.onerror = () => {
      carregamento = null
      s.remove()
      rejeitar(new Error('falha ao carregar o turnstile'))
    }
    document.head.appendChild(s)
  })
  return carregamento
}

/**
 * Estado do captcha de um formulário. O token só vale uma vez: chame `resetar()`
 * depois de cada tentativa (deu certo ou não) para gerar outro.
 */
export function useCaptcha() {
  const [token, setToken] = useState<string | null>(null)
  const [versao, setVersao] = useState(0)
  const resetar = useCallback(() => {
    setToken(null)
    setVersao((v) => v + 1)
  }, [])
  return {
    /** Para mandar ao Supabase em `options.captchaToken`. */
    token: token ?? undefined,
    /** Pode enviar o formulário (captcha desligado, ou já verificado). */
    pronto: !CAPTCHA_SITE_KEY || token !== null,
    resetar,
    props: { versao, onToken: setToken },
  }
}
