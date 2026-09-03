import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// adminOnly: atalho para allow={['admin']}.
// allow: lista de tipos de usuário com acesso à rota (ex.: ['admin', 'produtor']).
export default function ProtectedRoute({ children, adminOnly = false, allow = null }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-onforge-black mx-auto mb-4"></div>
          <p className="text-onforge-black/60">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const tiposPermitidos = allow || (adminOnly ? ['admin'] : null)
  if (tiposPermitidos && !tiposPermitidos.includes(user.tipo)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
