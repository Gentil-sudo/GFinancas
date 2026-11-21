import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { AvisoAtualizacao } from '@/components/AvisoAtualizacao'
import { TemaProvider } from '@/components/TemaProvider'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TemaProvider>
        <RouterProvider router={router} />
        <AvisoAtualizacao />
      </TemaProvider>
    </QueryClientProvider>
  </StrictMode>,
)
