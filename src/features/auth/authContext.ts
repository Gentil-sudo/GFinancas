import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export interface AuthContexto {
  session: Session | null
  user: User | null
  /** `true` só no início, enquanto descobre se há uma sessão salva no navegador. */
  carregando: boolean
  /** Sai apenas deste aparelho. */
  sair: () => Promise<void>
}

export const AuthContext = createContext<AuthContexto | null>(null)

export function useAuth(): AuthContexto {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
