import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Categoria } from '@/types/db'

/** Todas as categorias do usuário (inclusive arquivadas, para exibir lançamentos antigos). */
export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Categoria[]> => {
      const { data, error } = await supabase.from('categorias').select('*').order('nome')
      if (error) throw error
      return data
    },
  })
}

/** Mapa id → categoria, para montar listas rapidamente. */
export function useMapaCategorias(): Map<string, Categoria> {
  const { data } = useCategorias()
  return useMemo(() => new Map((data ?? []).map((c) => [c.id, c])), [data])
}
