import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** `false` enquanto o `.env.local` não estiver preenchido. O layout mostra um aviso nesse caso. */
export const supabaseConfigurado = Boolean(url && anonKey)

if (!supabaseConfigurado) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes. Copie .env.example para .env.local e preencha.',
  )
}

/**
 * Cliente único do Supabase. Usa só a chave pública (anon) — a segurança vem do RLS no banco.
 * A sessão fica salva no navegador e é renovada sozinha, então não é preciso logar toda hora.
 */
export const supabase = createClient<Database>(
  url ?? 'http://localhost:54321',
  anonKey ?? 'chave-nao-configurada',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
