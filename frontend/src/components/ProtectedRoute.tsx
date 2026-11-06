import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'

function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p>Загрузка...</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export default ProtectedRoute
