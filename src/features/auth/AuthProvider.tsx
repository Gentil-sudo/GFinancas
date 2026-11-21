import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { AuthContext, type AuthContexto } from './authContext'

/**
 * Rota-raiz: acompanha a sessão do Supabase e a disponibiliza via `useAuth()`.
 * A sessão fica salva no navegador e é renovada sozinha (não pede login toda hora).
 */
export function AuthProvider() {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Dispara INITIAL_SESSION logo ao assinar (com a sessão salva, se houver), e depois
    // a cada login, logout, renovação de token ou link de recuperação de senha.
    const { data } = supabase.auth.onAuthStateChange((evento, novaSessao) => {
      setSession(novaSessao)
      setCarregando(false)

      if (evento === 'PASSWORD_RECOVERY') {
        navigate('/redefinir-senha', { replace: true })
      }
      if (evento === 'SIGNED_OUT') {
        // Não deixa dados de um usuário no cache para o próximo.
        queryClient.clear()
      }
    })
    return () => data.subscription.unsubscribe()
  }, [navigate])

  // Garante as categorias padrão (a função no banco não faz nada se já existirem).
  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    supabase.rpc('seed_categorias_padrao').then(({ error }) => {
      if (error) console.error('[auth] falha ao criar categorias padrão:', error)
    })
  }, [userId])

  const sair = useCallback(async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) toast.error('Não foi possível sair. Tente de novo.')
  }, [])

  const valor = useMemo<AuthContexto>(
    () => ({ session, user: session?.user ?? null, carregando, sair }),
    [session, carregando, sair],
  )

  return (
    <AuthContext.Provider value={valor}>
      <Outlet />
    </AuthContext.Provider>
  )
}
