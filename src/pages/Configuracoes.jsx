import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Configuracoes() {
  const navigate = useNavigate()
  const [descontoMaximo, setDescontoMaximo] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    try {
      const res = await api.get('/configuracoes')
      setDescontoMaximo(res.data.desconto_maximo_percentual ?? '0')
    } finally {
      setLoading(false)
    }
  }

  const salvar = async (e) => {
    e.preventDefault()
    setErro('')
    setMensagem('')
    setSalvando(true)
    try {
      await api.patch('/configuracoes', { desconto_maximo_percentual: descontoMaximo })
      setMensagem('Configuração salva com sucesso!')
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>

  return (
    <div className="p-6 max-w-lg mx-auto">
      <button onClick={() => navigate('/dashboard')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar ao Menu
      </button>
      <h1 className="text-3xl font-bold mb-6 font-display">Configurações</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={salvar} className="space-y-4">
          {erro && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{erro}</div>}
          {mensagem && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{mensagem}</div>}

          <div>
            <label className="block text-sm font-medium text-onforge-black/80 mb-1">
              Desconto máximo que o vendedor pode aplicar por item (%)
            </label>
            <input
              type="number" step="0.01" min="0" max="100" required
              value={descontoMaximo}
              onChange={(e) => setDescontoMaximo(e.target.value)}
              className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md"
            />
          </div>

          <button type="submit" disabled={salvando} className="w-full bg-onforge-black text-white py-2 rounded-md hover:bg-black/80 disabled:bg-onforge-gray">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  )
}
