import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const modulesVendedor = [
    { title: 'Novo Pedido', description: 'Registrar um novo pedido de venda', path: '/pedidos/novo', icon: '🛒' },
    { title: 'Meus Pedidos', description: 'Ver e gerenciar seus pedidos', path: '/pedidos', icon: '📋' },
    { title: 'Clientes', description: 'Consultar e cadastrar clientes', path: '/clientes', icon: '🏢' },
    { title: 'Catálogo de Produtos', description: 'Ver tabela de preços', path: '/produtos', icon: '📦' },
  ]

  const modulesAdmin = [
    ...modulesVendedor,
    { title: 'Usuários', description: 'Gerenciar vendedores e administradores', path: '/usuarios', icon: '👤' },
    { title: 'Importar Preços', description: 'Atualizar tabela de preços via Excel', path: '/produtos/importar', icon: '📥' },
    { title: 'Importar Clientes', description: 'Importar clientes via Excel', path: '/clientes/importar', icon: '📥' },
    { title: 'Configurações', description: 'Definir limite de desconto', path: '/configuracoes', icon: '⚙️' },
  ]

  const modules = isAdmin ? modulesAdmin : modulesVendedor

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">OnForge Pedidos</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo, {user?.nome}!</h2>
          <p className="text-gray-600">{user?.email} · {isAdmin ? 'Administrador' : 'Vendedor'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(module => (
            <div
              key={module.path}
              onClick={() => navigate(module.path)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg cursor-pointer transition"
            >
              <div className="text-4xl mb-3">{module.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.title}</h3>
              <p className="text-gray-600">{module.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
