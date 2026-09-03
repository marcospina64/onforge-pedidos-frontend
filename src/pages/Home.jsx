import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import api from '../services/api'
import { formatDate } from '../utils/format'

export default function Home() {
  const navigate = useNavigate()
  const { user, logout, isAdmin, isProdutor, podeProducao } = useAuth()
  const [indicadores, setIndicadores] = useState(null)

  useEffect(() => {
    if (isAdmin) {
      api.get('/pedidos/indicadores-admin').then((res) => setIndicadores(res.data))
    }
  }, [isAdmin])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const modulesVendedor = [
    { title: 'Novo Pedido', description: 'Registrar um novo pedido de venda', path: '/pedidos/novo', icon: '🛒' },
    { title: 'Meus Pedidos', description: 'Ver e gerenciar seus pedidos', path: '/pedidos', icon: '📋' },
    { title: 'Clientes', description: 'Consultar e cadastrar clientes', path: '/clientes', icon: '🏢' },
    { title: 'Catálogo de Produtos', description: 'Ver tabela de preços', path: '/produtos', icon: '📦' },
    { title: 'Minhas Comissões', description: 'Ver suas vendas e comissões', path: '/comissoes', icon: '💰' },
  ]

  const modulesAdmin = [
    ...modulesVendedor,
    { title: 'Usuários', description: 'Gerenciar vendedores e administradores', path: '/usuarios', icon: '👤' },
    { title: 'Importar Preços', description: 'Atualizar tabela de preços via Excel', path: '/produtos/importar', icon: '📥' },
    { title: 'Importar Clientes', description: 'Importar clientes via Excel', path: '/clientes/importar', icon: '📥' },
    { title: 'Configurações', description: 'Definir limite de desconto', path: '/configuracoes', icon: '⚙️' },
    { title: 'Histórico de Login', description: 'Acompanhar acessos dos usuários ao sistema', path: '/historico-login', icon: '🔑' },
  ]

  const modules = isAdmin ? modulesAdmin : isProdutor ? [] : modulesVendedor

  const modulesProducao = [
    { title: 'Catálogo de Kits', description: 'Consultar kits e atualizar sua composição', path: '/kits', icon: '🧰' },
  ]

  const tipoLabel = isAdmin ? 'Administrador' : isProdutor ? 'Produtor' : 'Vendedor'

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
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold font-display text-onforge-black mb-2">Bem-vindo, {user?.nome}!</h2>
            <p className="text-onforge-black/60">{user?.email} · {tipoLabel}</p>
          </div>
          {isAdmin && indicadores && (
            <div className="flex flex-wrap gap-3">
              <div className="bg-white rounded-lg shadow p-4 min-w-[180px]">
                <p className="text-xs text-onforge-black/50 mb-1">Novos Pedidos ({formatDate(indicadores.data_hoje)})</p>
                <p className="text-2xl font-bold">{indicadores.novos_hoje}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 min-w-[180px]">
                <p className="text-xs text-onforge-black/50 mb-1">Pedidos não Exportados</p>
                <p className="text-2xl font-bold">{indicadores.nao_exportados}</p>
              </div>
            </div>
          )}
        </div>

        {modules.length > 0 && (
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
        )}

        {podeProducao && (
          <section className={modules.length > 0 ? 'mt-10' : ''}>
            <h3 className="text-xl font-bold font-display text-onforge-black mb-4">Produção</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modulesProducao.map(module => (
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
          </section>
        )}
      </main>
    </div>
  )
}
