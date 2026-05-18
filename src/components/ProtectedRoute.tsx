import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  if (session === undefined) return null // loading
  if (!session) return <Navigate to="/" replace />
  return <>{children}</>
}
