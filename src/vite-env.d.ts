/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  /** Chave pública (site key) do Cloudflare Turnstile. Sem ela, o captcha fica desligado. */
  readonly VITE_TURNSTILE_SITE_KEY?: string
  /** E-mail de contato mostrado na página de privacidade (opcional). */
  readonly VITE_CONTATO_EMAIL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
