import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth.ts'

function ProtectedRoute() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export default ProtectedRoute
