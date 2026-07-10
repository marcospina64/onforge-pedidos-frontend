import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import { useAuth } from '../context/AuthContext'

export default function Produtos() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [produtos, setProdutos] = useState([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async (termo = '') => {
    try {
      setLoading(true)
      const res = await api.get('/produtos', { params: termo ? { busca: termo } : {} })
      setProdutos(res.data)
    } finally {
      setLoading(false)
    }
  }

  const buscar = (e) => {
    e.preventDefault()
    carregar(busca)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button onClick={() => navigate('/dashboard')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar ao Menu
      </button>

      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold font-display">Catálogo de Produtos</h1>
        {isAdmin && (
          <button onClick={() => navigate('/produtos/importar')} className="bg-onforge-gray text-white px-4 py-2 rounded hover:bg-black/70">
            Importar Tabela de Preços
          </button>
        )}
      </div>

      <form onSubmit={buscar} className="mb-6 flex gap-2">
        <input
          type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por código ou nome do produto"
          className="flex-1 px-3 py-2 border border-onforge-gray/50 rounded-md"
        />
        <button type="submit" className="bg-onforge-gray/30 px-4 py-2 rounded hover:bg-onforge-gray/40">Buscar</button>
      </form>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : produtos.length === 0 ? (
        <div className="text-center py-8 text-onforge-black/50">Nenhum produto encontrado</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {produtos.map((p) => (
            <div key={p.id} className="bg-white rounded-lg shadow p-3 flex flex-col items-center text-center">
              {p.foto_base64 ? (
                <img src={p.foto_base64} alt={p.nome_produto} className="w-20 h-20 object-contain mb-2" />
              ) : (
                <div className="w-20 h-20 bg-onforge-cream flex items-center justify-center mb-2 text-onforge-black/40 text-xs">Sem foto</div>
              )}
              <p className="text-xs text-onforge-black/50">{p.codigo}</p>
              <p className="text-sm font-medium leading-tight mb-1">{p.nome_produto}</p>
              <p className="text-xs text-onforge-black/50">{p.unidade}</p>
              <p className="text-sm font-bold text-onforge-black">{formatMoney(p.preco_tabela)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
