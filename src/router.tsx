import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { ConfiguracoesPage } from '@/features/configuracoes/ConfiguracoesPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { InvestimentosPage } from '@/features/investimentos/InvestimentosPage'
import { LancamentosPage } from '@/features/lancamentos/LancamentosPage'
import { MetasPage } from '@/features/metas/MetasPage'
import { ParcelasPage } from '@/features/parcelas/ParcelasPage'

// A proteção das rotas internas (redirecionar para /login) entra na Fase 3.
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'lancamentos', element: <LancamentosPage /> },
      { path: 'parcelas', element: <ParcelasPage /> },
      { path: 'metas', element: <MetasPage /> },
      { path: 'investimentos', element: <InvestimentosPage /> },
      { path: 'configuracoes', element: <ConfiguracoesPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
