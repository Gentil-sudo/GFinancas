import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** `false` enquanto o `.env.local` não estiver preenchido. O layout mostra um aviso nesse caso. */
export const supabaseConfigurado = Boolean(url && publishableKey)

if (!supabaseConfigurado) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY ausentes. Copie .env.example para .env.local e preencha.',
  )
}

/**
 * Cliente único do Supabase. Usa só a chave pública (publishable) — a segurança vem do RLS no banco.
 * A sessão fica salva no navegador e é renovada sozinha, então não é preciso logar toda hora.
 */
export const supabase = createClient<Database>(
  url ?? 'http://localhost:54321',
  publishableKey ?? 'chave-nao-configurada',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
