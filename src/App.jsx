import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import Home from './pages/Home'
import Usuarios from './pages/Usuarios'
import Configuracoes from './pages/Configuracoes'
import Clientes from './pages/Clientes'
import ImportarClientes from './pages/ImportarClientes'
import Produtos from './pages/Produtos'
import ImportarPrecos from './pages/ImportarPrecos'
import NovoPedido from './pages/NovoPedido'
import EditarPedido from './pages/EditarPedido'
import Pedidos from './pages/Pedidos'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute adminOnly>
                <Usuarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute adminOnly>
                <Configuracoes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <Clientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes/importar"
            element={
              <ProtectedRoute adminOnly>
                <ImportarClientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/produtos"
            element={
              <ProtectedRoute>
                <Produtos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/produtos/importar"
            element={
              <ProtectedRoute adminOnly>
                <ImportarPrecos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pedidos/novo"
            element={
              <ProtectedRoute>
                <NovoPedido />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pedidos"
            element={
              <ProtectedRoute>
                <Pedidos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pedidos/:id/editar"
            element={
              <ProtectedRoute>
                <EditarPedido />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
