import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Nunca repetir uma gravação sozinho: o usuário decide "tentar de novo" (ver PLANO §5).
      retry: 0,
    },
  },
})
