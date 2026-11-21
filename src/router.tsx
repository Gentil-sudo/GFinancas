import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AreaLogada } from '@/components/layout/AreaLogada'
import { TelaCarregando } from '@/components/ui/Spinner'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { LoginPage } from '@/features/auth/LoginPage'
import { RotaDeslogado, RotaProtegida } from '@/features/auth/rotas'
import { DashboardPage } from '@/features/dashboard/DashboardPage'

/**
 * Carrega a tela só quando ela é aberta (o app abre mais rápido, principalmente no celular).
 * Login e Início ficam no pacote principal: são as primeiras telas.
 */
function tela<M>(carregar: () => Promise<M>, escolher: (m: M) => ComponentType) {
  return async () => ({ Component: escolher(await carregar()) })
}

export const router = createBrowserRouter([
  {
    // Raiz: disponibiliza a sessão para todas as rotas.
    element: <AuthProvider />,
    HydrateFallback: TelaCarregando,
    children: [
      // Só para quem NÃO está logado
      {
        element: <RotaDeslogado />,
        children: [
          { path: '/login', element: <LoginPage /> },
          {
            path: '/cadastro',
            lazy: tela(
              () => import('@/features/auth/CadastroPage'),
              (m) => m.CadastroPage,
            ),
          },
          {
            path: '/esqueci-senha',
            lazy: tela(
              () => import('@/features/auth/EsqueciSenhaPage'),
              (m) => m.EsqueciSenhaPage,
            ),
          },
        ],
      },
      // Pública: logado ou não
      {
        path: '/privacidade',
        lazy: tela(
          () => import('@/features/legal/PrivacidadePage'),
          (m) => m.PrivacidadePage,
        ),
      },
      // Destino do link de recuperação (chega com sessão temporária)
      {
        path: '/redefinir-senha',
        lazy: tela(
          () => import('@/features/auth/RedefinirSenhaPage'),
          (m) => m.RedefinirSenhaPage,
        ),
      },
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
                  {
                    path: 'lancamentos',
                    lazy: tela(
                      () => import('@/features/lancamentos/LancamentosPage'),
                      (m) => m.LancamentosPage,
                    ),
                  },
                  {
                    path: 'parcelas',
                    lazy: tela(
                      () => import('@/features/parcelas/ParcelasPage'),
                      (m) => m.ParcelasPage,
                    ),
                  },
                  {
                    path: 'metas',
                    lazy: tela(
                      () => import('@/features/metas/MetasPage'),
                      (m) => m.MetasPage,
                    ),
                  },
                  {
                    path: 'investimentos',
                    lazy: tela(
                      () => import('@/features/investimentos/InvestimentosPage'),
                      (m) => m.InvestimentosPage,
                    ),
                  },
                  {
                    path: 'configuracoes',
                    lazy: tela(
                      () => import('@/features/configuracoes/ConfiguracoesPage'),
                      (m) => m.ConfiguracoesPage,
                    ),
                  },
                  {
                    path: 'configuracoes/categorias',
                    lazy: tela(
                      () => import('@/features/configuracoes/CategoriasPage'),
                      (m) => m.CategoriasPage,
                    ),
                  },
                  {
                    path: 'configuracoes/lixeira',
                    lazy: tela(
                      () => import('@/features/configuracoes/LixeiraPage'),
                      (m) => m.LixeiraPage,
                    ),
                  },
                  {
                    path: 'configuracoes/historico',
                    lazy: tela(
                      () => import('@/features/configuracoes/HistoricoPage'),
                      (m) => m.HistoricoPage,
                    ),
                  },
                  {
                    path: 'configuracoes/backup',
                    lazy: tela(
                      () => import('@/features/configuracoes/BackupPage'),
                      (m) => m.BackupPage,
                    ),
                  },
                  {
                    path: 'configuracao-inicial',
                    lazy: tela(
                      () => import('@/features/configuracoes/ConfiguracaoInicialPage'),
                      (m) => m.ConfiguracaoInicialPage,
                    ),
                  },
                ],
              },
              // Formulários em tela cheia (sem a barra de navegação)
              {
                path: '/lancamentos/novo',
                lazy: tela(
                  () => import('@/features/lancamentos/FormLancamentoPage'),
                  (m) => () => <m.FormLancamentoPage modo="novo" />,
                ),
              },
              {
                path: '/lancamentos/:id/editar',
                lazy: tela(
                  () => import('@/features/lancamentos/FormLancamentoPage'),
                  (m) => () => <m.FormLancamentoPage modo="editar" />,
                ),
              },
              {
                path: '/lancamentos/:id/duplicar',
                lazy: tela(
                  () => import('@/features/lancamentos/FormLancamentoPage'),
                  (m) => () => <m.FormLancamentoPage modo="duplicar" />,
                ),
              },
              {
                path: '/parcelas/nova',
                lazy: tela(
                  () => import('@/features/parcelas/FormCompraPage'),
                  (m) => () => <m.FormCompraPage modo="nova" />,
                ),
              },
              {
                path: '/parcelas/:id/editar',
                lazy: tela(
                  () => import('@/features/parcelas/FormCompraPage'),
                  (m) => () => <m.FormCompraPage modo="editar" />,
                ),
              },
              {
                path: '/metas/nova',
                lazy: tela(
                  () => import('@/features/metas/FormMetaPage'),
                  (m) => () => <m.FormMetaPage modo="nova" />,
                ),
              },
              {
                path: '/metas/:id/editar',
                lazy: tela(
                  () => import('@/features/metas/FormMetaPage'),
                  (m) => () => <m.FormMetaPage modo="editar" />,
                ),
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
