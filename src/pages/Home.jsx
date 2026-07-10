import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

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
    <div className="min-h-screen bg-onforge-cream">
      <nav className="bg-onforge-black shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Logo variant="cream" className="h-7" />
          <button
            onClick={handleLogout}
            className="bg-onforge-cream text-onforge-black px-4 py-2 rounded hover:bg-onforge-peach transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-display text-onforge-black mb-2">Bem-vindo, {user?.nome}!</h2>
          <p className="text-onforge-black/60">{user?.email} · {isAdmin ? 'Administrador' : 'Vendedor'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(module => (
            <div
              key={module.path}
              onClick={() => navigate(module.path)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer transition"
            >
              <div className="text-4xl mb-3">{module.icon}</div>
              <h3 className="text-lg font-semibold font-display text-onforge-black mb-2">{module.title}</h3>
              <p className="text-onforge-black/60">{module.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
