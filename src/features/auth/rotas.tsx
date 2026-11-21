import { Navigate, Outlet, useLocation, type Location } from 'react-router'
import { TelaCarregando } from '@/components/ui/Spinner'
import { useAuth } from './authContext'

/** Telas internas: quem não está logado vai para /login (e volta para onde estava depois). */
export function RotaProtegida() {
  const { session, carregando } = useAuth()
  const location = useLocation()

  if (carregando) return <TelaCarregando />
  if (!session) return <Navigate to="/login" replace state={{ de: location }} />
  return <Outlet />
}

/** Login, cadastro e "esqueci a senha": quem já está logado vai direto para o app. */
export function RotaDeslogado() {
  const { session, carregando } = useAuth()
  const location = useLocation()

  if (carregando) return <TelaCarregando />
  if (session) {
    const de = (location.state as { de?: Location } | null)?.de
    return <Navigate to={de ? `${de.pathname}${de.search}` : '/'} replace />
  }
  return <Outlet />
}
