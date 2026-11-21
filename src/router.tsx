import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AreaLogada } from '@/components/layout/AreaLogada'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { CadastroPage } from '@/features/auth/CadastroPage'
import { EsqueciSenhaPage } from '@/features/auth/EsqueciSenhaPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RedefinirSenhaPage } from '@/features/auth/RedefinirSenhaPage'
import { RotaDeslogado, RotaProtegida } from '@/features/auth/rotas'
import { ConfiguracoesPage } from '@/features/configuracoes/ConfiguracoesPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { InvestimentosPage } from '@/features/investimentos/InvestimentosPage'
import { FormLancamentoPage } from '@/features/lancamentos/FormLancamentoPage'
import { LancamentosPage } from '@/features/lancamentos/LancamentosPage'
import { MetasPage } from '@/features/metas/MetasPage'
import { ParcelasPage } from '@/features/parcelas/ParcelasPage'

export const router = createBrowserRouter([
  {
    // Raiz: disponibiliza a sessão para todas as rotas.
    element: <AuthProvider />,
    children: [
      // Só para quem NÃO está logado
      {
        element: <RotaDeslogado />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/cadastro', element: <CadastroPage /> },
          { path: '/esqueci-senha', element: <EsqueciSenhaPage /> },
        ],
      },
      // Destino do link de recuperação (chega com sessão temporária)
      { path: '/redefinir-senha', element: <RedefinirSenhaPage /> },
      // App: exige login
      {
        element: <RotaProtegida />,
        children: [
          {
            element: <AreaLogada />,
            children: [
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
                ],
              },
              // Formulário em tela cheia (sem a barra de navegação)
              { path: '/lancamentos/novo', element: <FormLancamentoPage modo="novo" /> },
              { path: '/lancamentos/:id/editar', element: <FormLancamentoPage modo="editar" /> },
              {
                path: '/lancamentos/:id/duplicar',
                element: <FormLancamentoPage modo="duplicar" />,
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
