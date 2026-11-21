/** Data da versão atual da política/termos. Mude quando o texto mudar. */
export const VERSAO_TERMOS = '2026-11-21'

/** E-mail de contato do responsável (opcional; configurado no .env / Vercel). */
export const CONTATO_EMAIL = import.meta.env.VITE_CONTATO_EMAIL?.trim() || null
