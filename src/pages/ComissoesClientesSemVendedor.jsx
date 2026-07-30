import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function ComissoesClientesSemVendedor() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [selecionados, setSelecionados] = useState({})
  const [vendedorId, setVendedorId] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    carregar()
    api.get('/usuarios').then((res) => setVendedores(res.data.filter((u) => u.tipo === 'vendedor')))
  }, [])

  const carregar = async () => {
    try {
      setLoading(true)
      const res = await api.get('/comissoes/clientes-sem-vendedor')
      setClientes(res.data)
      setSelecionados({})
    } finally {
      setLoading(false)
    }
  }

  const alternarSelecao = (id) => {
    setSelecionados((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const selecionarTodos = () => {
    const todosSelecionados = clientes.every((c) => selecionados[c.id])
    const novo = {}
    clientes.forEach((c) => { novo[c.id] = !todosSelecionados })
    setSelecionados(novo)
  }

  const atribuir = async () => {
    const clienteIds = Object.keys(selecionados).filter((id) => selecionados[id])
    if (clienteIds.length === 0) {
      setErro('Selecione ao menos um cliente')
      return
    }
    if (!vendedorId) {
      setErro('Selecione o vendedor')
      return
    }
    setErro('')
    setSucesso('')
    try {
      const res = await api.patch('/comissoes/clientes-sem-vendedor/atribuir', { cliente_ids: clienteIds, vendedor_id: vendedorId })
      setSucesso(`${res.data.clientes_atualizados} cliente(s) atualizado(s), ${res.data.comissoes_geradas} comissão(ões) gerada(s) retroativamente.`)
      carregar()
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao atribuir vendedor')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/comissoes')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar para Comissões
      </button>
      <h1 className="text-3xl font-bold mb-2 font-display">Clientes sem Vendedor</h1>
      <p className="text-sm text-onforge-black/60 mb-6">
        Clientes que têm linhas de comissão pendentes, mas ainda não têm um vendedor cadastrado (ou estão vinculados ao
        cliente compartilhado "TODOS"). Selecione os clientes e o vendedor responsável para liberar o cálculo das comissões.
      </p>

      {erro && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{erro}</div>}
      {sucesso && <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">{sucesso}</div>}

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-8 text-onforge-black/50">Nenhum cliente pendente de vendedor 🎉</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-onforge-cream">
                <tr>
                  <th className="px-4 py-2 text-left">
                    <input type="checkbox" onChange={selecionarTodos} checked={clientes.length > 0 && clientes.every((c) => selecionados[c.id])} />
                  </th>
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-left">Comissões pendentes</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-onforge-cream/60">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={!!selecionados[c.id]} onChange={() => alternarSelecao(c.id)} />
                    </td>
                    <td className="px-4 py-3">{c.razao_social}</td>
                    <td className="px-4 py-3">{c.pendencias}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-onforge-black/80 mb-1">Atribuir ao vendedor</label>
              <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className="px-3 py-2 border border-onforge-gray/50 rounded-md text-sm min-w-[220px]">
                <option value="">Selecione...</option>
                {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
              </select>
            </div>
            <button onClick={atribuir} className="bg-onforge-black text-white px-4 py-2 rounded hover:bg-black/80 text-sm">
              Atribuir vendedor aos selecionados
            </button>
          </div>
        </>
      )}
    </div>
  )
}
