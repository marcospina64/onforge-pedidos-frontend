import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatDate } from '../utils/format'

const FORM_VAZIO = { master_id: '', subordinado_id: '', percentual: '', vigencia_inicio: new Date().toISOString().slice(0, 10) }

export default function ComissoesPercentuaisMaster() {
  const navigate = useNavigate()
  const [percentuais, setPercentuais] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(FORM_VAZIO)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    carregar()
    api.get('/usuarios').then((res) => setVendedores(res.data.filter((u) => u.tipo === 'vendedor')))
  }, [])

  const carregar = async () => {
    try {
      setLoading(true)
      const res = await api.get('/comissoes/percentuais-master')
      setPercentuais(res.data)
    } finally {
      setLoading(false)
    }
  }

  // Só aparecem como Master vendedores que têm ao menos 1 Subordinado cadastrado.
  const masters = vendedores.filter((m) => vendedores.some((v) => v.vendedor_master_id === m.id))
  const subordinados = vendedores.filter((v) => v.vendedor_master_id === form.master_id)

  const salvar = async (e) => {
    e.preventDefault()
    setErro('')
    setSucesso('')
    if (!form.master_id || !form.subordinado_id || !form.percentual || !form.vigencia_inicio) {
      setErro('Preencha Master, Subordinado, percentual e data de início de vigência')
      return
    }
    try {
      const res = await api.post('/comissoes/percentuais-master', form)
      const geradas = res.data.comissoes_geradas || 0
      setSucesso(`Percentual cadastrado com sucesso${geradas > 0 ? ` — ${geradas} repasse(s) retroativo(s) gerado(s) para parcelas já pagas` : ''}`)
      setForm(FORM_VAZIO)
      carregar()
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao cadastrar percentual')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/comissoes')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar para Comissões
      </button>
      <h1 className="text-3xl font-bold mb-2 font-display">Percentual do Vendedor Master</h1>
      <p className="text-sm text-onforge-black/60 mb-6">
        Percentual que o Vendedor Master recebe sobre as vendas de cada Subordinado, calculado sobre o mesmo valor
        recebido da venda (aditivo à comissão do Subordinado — ex.: Subordinado 7% + Master 3% = 10% pago no total).
        Cada percentual novo fecha a vigência anterior desse par no dia anterior e passa a valer a partir da data escolhida.
      </p>

      <form onSubmit={salvar} className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-onforge-black/80 mb-1">Vendedor Master</label>
          <select
            value={form.master_id}
            onChange={(e) => setForm({ ...form, master_id: e.target.value, subordinado_id: '' })}
            className="px-3 py-2 border border-onforge-gray/50 rounded-md text-sm min-w-[180px]"
          >
            <option value="">Selecione...</option>
            {masters.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-onforge-black/80 mb-1">Subordinado</label>
          <select
            value={form.subordinado_id} onChange={(e) => setForm({ ...form, subordinado_id: e.target.value })}
            disabled={!form.master_id}
            className="px-3 py-2 border border-onforge-gray/50 rounded-md text-sm min-w-[180px] disabled:bg-onforge-cream"
          >
            <option value="">Selecione...</option>
            {subordinados.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-onforge-black/80 mb-1">Percentual (%)</label>
          <input
            type="number" step="0.01" value={form.percentual}
            onChange={(e) => setForm({ ...form, percentual: e.target.value })}
            className="px-3 py-2 border border-onforge-gray/50 rounded-md text-sm w-28"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-onforge-black/80 mb-1">Vigente a partir de</label>
          <input
            type="date" value={form.vigencia_inicio}
            onChange={(e) => setForm({ ...form, vigencia_inicio: e.target.value })}
            className="px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
          />
        </div>
        <button type="submit" className="bg-onforge-black text-white px-4 py-2 rounded hover:bg-black/80 text-sm">
          Cadastrar
        </button>
      </form>

      {masters.length === 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded text-sm">
          Nenhum vendedor tem Subordinados cadastrados ainda. Para formar uma Equipe de Venda, defina o "Vendedor Master"
          de cada Subordinado na tela de Usuários.
        </div>
      )}

      {erro && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{erro}</div>}
      {sucesso && <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">{sucesso}</div>}

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : percentuais.length === 0 ? (
        <div className="text-center py-8 text-onforge-black/50">Nenhum percentual de repasse cadastrado ainda</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-onforge-cream">
              <tr>
                <th className="px-4 py-2 text-left">Master</th>
                <th className="px-4 py-2 text-left">Subordinado</th>
                <th className="px-4 py-2 text-left">Percentual</th>
                <th className="px-4 py-2 text-left">Vigência Início</th>
                <th className="px-4 py-2 text-left">Vigência Fim</th>
              </tr>
            </thead>
            <tbody>
              {percentuais.map((p) => (
                <tr key={p.id} className="border-b hover:bg-onforge-cream/60">
                  <td className="px-4 py-3">{p.master_nome}</td>
                  <td className="px-4 py-3">{p.subordinado_nome}</td>
                  <td className="px-4 py-3">{p.percentual}%</td>
                  <td className="px-4 py-3">{formatDate(p.vigencia_inicio)}</td>
                  <td className="px-4 py-3">{p.vigencia_fim ? formatDate(p.vigencia_fim) : <span className="text-green-700 font-medium">Vigente</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
