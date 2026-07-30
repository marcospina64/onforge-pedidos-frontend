import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatMoney } from '../utils/format'

const STATUS_LABEL = {
  sem_correspondencia: 'Sem correspondência',
  match_aproximado_pendente: 'Match aproximado',
}

const STATUS_COR = {
  sem_correspondencia: 'bg-red-500',
  match_aproximado_pendente: 'bg-orange-500',
}

export default function ComissoesPendencias() {
  const navigate = useNavigate()
  const [pendencias, setPendencias] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selecao, setSelecao] = useState({})
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregar()
    api.get('/clientes').then((res) => setClientes(res.data))
  }, [])

  const carregar = async () => {
    try {
      setLoading(true)
      const res = await api.get('/comissoes/pendencias')
      setPendencias(res.data)
    } finally {
      setLoading(false)
    }
  }

  const confirmar = async (linha) => {
    const clienteId = selecao[linha.id]
    if (!clienteId) {
      setErro('Selecione o cliente correto antes de confirmar')
      return
    }
    setErro('')
    try {
      await api.patch(`/comissoes/${linha.id}/reconciliar`, { cliente_id: clienteId })
      setPendencias((prev) => prev.filter((p) => p.id !== linha.id))
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao confirmar conciliação')
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button onClick={() => navigate('/comissoes')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar para Comissões
      </button>
      <h1 className="text-3xl font-bold mb-2 font-display">Pendências de Conciliação</h1>
      <p className="text-sm text-onforge-black/60 mb-6">
        Linhas que não bateram automaticamente com nenhum cliente cadastrado, ou que só encontraram um candidato
        aproximado (nunca aplicado sozinho, para evitar atribuir uma comissão ao cliente errado). Escolha o cliente
        correto e confirme, ou deixe em aberto se for um registro de teste/sem cliente real.
      </p>

      {erro && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{erro}</div>}

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : pendencias.length === 0 ? (
        <div className="text-center py-8 text-onforge-black/50">Nenhuma pendência de conciliação 🎉</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-onforge-cream">
              <tr>
                <th className="px-4 py-2 text-left">Cliente (planilha)</th>
                <th className="px-4 py-2 text-left">Situação</th>
                <th className="px-4 py-2 text-left">Valor</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Cliente correto</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {pendencias.map((p) => (
                <tr key={p.id} className="border-b hover:bg-onforge-cream/60">
                  <td className="px-4 py-3">
                    {p.cliente_nome_olist}
                    {p.sugestao_cliente && (
                      <p className="text-xs text-onforge-black/50">Sugestão: {p.sugestao_cliente.razao_social} (score {p.score_match_aproximado})</p>
                    )}
                  </td>
                  <td className="px-4 py-3">{p.situacao}</td>
                  <td className="px-4 py-3">{formatMoney(p.valor_documento)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-white text-xs ${STATUS_COR[p.status_conciliacao]}`}>
                      {STATUS_LABEL[p.status_conciliacao]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={selecao[p.id] || (p.sugestao_cliente?.id ?? '')}
                      onChange={(e) => setSelecao({ ...selecao, [p.id]: e.target.value })}
                      className="px-2 py-1 border border-onforge-gray/50 rounded-md text-sm min-w-[200px]"
                    >
                      <option value="">Selecione...</option>
                      {clientes.map((c) => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => confirmar(p)} className="bg-onforge-black text-white px-3 py-1 rounded hover:bg-black/80 text-sm">
                      Confirmar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
