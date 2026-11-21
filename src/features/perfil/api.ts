import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/authContext'
import { supabase } from '@/lib/supabase'
import type { Perfil, TablesUpdate } from '@/types/db'

const chavePerfil = (userId: string | undefined) => ['perfil', userId] as const

/** Perfil do usuário logado (nome e tema). `null` se ainda não foi criado. */
export function usePerfil() {
  const { user } = useAuth()
  return useQuery({
    queryKey: chavePerfil(user?.id),
    enabled: Boolean(user),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Perfil | null> => {
      const { data, error } = await supabase.from('perfis').select('*').maybeSingle()
      if (error) throw error
      return data
    },
  })
}

/** Cria ou atualiza o perfil. */
export function useSalvarPerfil() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (mudancas: Pick<TablesUpdate<'perfis'>, 'nome' | 'tema'>) => {
      if (!user) throw new Error('Não autenticado')
      const { data, error } = await supabase
        .from('perfis')
        .upsert({ user_id: user.id, ...mudancas }, { onConflict: 'user_id' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (perfil) => qc.setQueryData(chavePerfil(user?.id), perfil),
  })
}

/** Nome para a saudação: o do perfil ou a parte do e-mail antes do @. */
export function nomeExibicao(perfil: Perfil | null | undefined, email: string | undefined): string {
  if (perfil?.nome) return perfil.nome
  const base = (email ?? '').split('@')[0].split(/[._-]/)[0]
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : 'você'
}
