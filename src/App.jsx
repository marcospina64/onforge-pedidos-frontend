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
import Comissoes from './pages/Comissoes'
import ComissoesImportar from './pages/ComissoesImportar'
import ComissoesPendencias from './pages/ComissoesPendencias'
import ComissoesClientesSemVendedor from './pages/ComissoesClientesSemVendedor'
import ComissoesPercentuais from './pages/ComissoesPercentuais'
import ComissoesPercentuaisMaster from './pages/ComissoesPercentuaisMaster'
import HistoricoLogin from './pages/HistoricoLogin'
import ProdutosInativar from './pages/ProdutosInativar'
import Kits from './pages/Kits'
import KitDetalhe from './pages/KitDetalhe'
import KitsImportar from './pages/KitsImportar'
import KitsInativar from './pages/KitsInativar'

// Vendas: Administrador + Vendedor (o Produtor só acessa o grupo Produção).
const VENDAS = ['admin', 'vendedor']
// Produção: Administrador + Produtor.
const PRODUCAO = ['admin', 'produtor']

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
              <ProtectedRoute allow={VENDAS}>
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
              <ProtectedRoute allow={VENDAS}>
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
              <ProtectedRoute allow={VENDAS}>
                <NovoPedido />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pedidos"
            element={
              <ProtectedRoute allow={VENDAS}>
                <Pedidos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pedidos/:id/editar"
            element={
              <ProtectedRoute allow={VENDAS}>
                <EditarPedido />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comissoes"
            element={
              <ProtectedRoute allow={VENDAS}>
                <Comissoes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comissoes/importar"
            element={
              <ProtectedRoute adminOnly>
                <ComissoesImportar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comissoes/pendencias"
            element={
              <ProtectedRoute adminOnly>
                <ComissoesPendencias />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comissoes/clientes-sem-vendedor"
            element={
              <ProtectedRoute adminOnly>
                <ComissoesClientesSemVendedor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comissoes/percentuais"
            element={
              <ProtectedRoute adminOnly>
                <ComissoesPercentuais />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comissoes/percentuais-master"
            element={
              <ProtectedRoute adminOnly>
                <ComissoesPercentuaisMaster />
              </ProtectedRoute>
            }
          />
          <Route
            path="/produtos/inativar"
            element={
              <ProtectedRoute adminOnly>
                <ProdutosInativar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historico-login"
            element={
              <ProtectedRoute adminOnly>
                <HistoricoLogin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kits"
            element={
              <ProtectedRoute allow={PRODUCAO}>
                <Kits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kits/importar"
            element={
              <ProtectedRoute allow={PRODUCAO}>
                <KitsImportar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kits/inativar"
            element={
              <ProtectedRoute allow={PRODUCAO}>
                <KitsInativar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kits/:id"
            element={
              <ProtectedRoute allow={PRODUCAO}>
                <KitDetalhe />
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
