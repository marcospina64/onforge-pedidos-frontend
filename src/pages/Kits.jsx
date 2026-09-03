import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Kits() {
  const navigate = useNavigate()
  const [kits, setKits] = useState([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async (termo = '') => {
    try {
      setLoading(true)
      const res = await api.get('/kits', { params: termo ? { busca: termo } : {} })
      setKits(res.data)
    } finally {
      setLoading(false)
    }
  }

  const buscar = (e) => {
    e.preventDefault()
    carregar(busca)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/dashboard')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar ao Menu
      </button>

      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold font-display">Catálogo de Kits</h1>
        <div className="flex gap-3">
          <button onClick={() => navigate('/kits/importar')} className="bg-onforge-gray text-white px-4 py-2 rounded hover:bg-black/70">
            Importar Planilha Kits
          </button>
          <button onClick={() => navigate('/kits/inativar')} className="bg-onforge-gray text-white px-4 py-2 rounded hover:bg-black/70">
            Inativar Kits
          </button>
        </div>
      </div>

      <form onSubmit={buscar} className="mb-6 flex gap-2">
        <input
          type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por código ou nome do kit"
          className="flex-1 px-3 py-2 border border-onforge-gray/50 rounded-md"
        />
        <button type="submit" className="bg-onforge-gray/30 px-4 py-2 rounded hover:bg-onforge-gray/40">Buscar</button>
      </form>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : kits.length === 0 ? (
        <div className="text-center py-8 text-onforge-black/50">Nenhum kit encontrado</div>
      ) : (
        <div className="divide-y divide-onforge-gray/20 border border-onforge-gray/20 rounded-md bg-white">
          {kits.map((k) => (
            <div
              key={k.id}
              onClick={() => navigate(`/kits/${k.id}`)}
              className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-onforge-cream/60"
            >
              <span className="text-xs text-onforge-black/50 w-16 shrink-0">{k.codigo}</span>
              <span className="text-sm flex-1">{k.nome}</span>
              {k.atributo && (
                <span className="text-xs px-2 py-0.5 rounded bg-onforge-peach/40 text-onforge-black shrink-0">{k.atributo}</span>
              )}
              <span className="text-onforge-black/30">›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
