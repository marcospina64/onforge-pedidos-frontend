import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Modal from '../components/Modal'
import { formatMoney, formatDate } from '../utils/format'
import { useAuth } from '../context/AuthContext'

const SITUACAO_COR = {
  'Paga': 'bg-green-600',
  'Em aberto': 'bg-yellow-500',
}

const STATUS_PAGAMENTO_LABEL = {
  pendente: 'Pendente',
  paga: 'Paga',
  cancelada: 'Cancelada',
}

const STATUS_PAGAMENTO_COR = {
  pendente: 'bg-yellow-500',
  paga: 'bg-green-600',
  cancelada: 'bg-red-500',
}

const FORMA_PAGAMENTO_LABEL = { pix: 'Pix', cash: 'Cash', outra: 'Outra' }

const PAGAMENTO_VAZIO = { data_pagamento_comissao: '', valor_pago: '', forma_pagamento_comissao: 'pix', forma_pagamento_outra_obs: '' }

export default function Comissoes() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [linhas, setLinhas] = useState([])
  const [indicadores, setIndicadores] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vendedores, setVendedores] = useState([])
  const [vendedorFiltro, setVendedorFiltro] = useState('')
  const [pendenciasCount, setPendenciasCount] = useState(0)
  const [semVendedorCount, setSemVendedorCount] = useState(0)
  const [pagamentoModal, setPagamentoModal] = useState(null)
  const [pagamentoForm, setPagamentoForm] = useState(PAGAMENTO_VAZIO)
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregar()
    if (isAdmin) {
      api.get('/usuarios').then((res) => setVendedores(res.data.filter((u) => u.tipo === 'vendedor')))
      api.get('/comissoes/pendencias').then((res) => setPendenciasCount(res.data.length))
      api.get('/comissoes/clientes-sem-vendedor').then((res) => setSemVendedorCount(res.data.length))
    }
  }, [])

  const carregar = async (vendedorId = vendedorFiltro) => {
    try {
      setLoading(true)
      const params = {}
      if (vendedorId) params.vendedor_id = vendedorId
      const [linhasRes, indicadoresRes] = await Promise.all([
        api.get('/comissoes', { params }),
        api.get('/comissoes/indicadores', { params }),
      ])
      setLinhas(linhasRes.data)
      setIndicadores(indicadoresRes.data[0] || null)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltro = (e) => {
    e.preventDefault()
    carregar(vendedorFiltro)
  }

  const abrirPagamento = (linha) => {
    setErro('')
    setPagamentoModal(linha)
    setPagamentoForm({
      data_pagamento_comissao: linha.data_pagamento_comissao ? linha.data_pagamento_comissao.slice(0, 10) : new Date().toISOString().slice(0, 10),
      valor_pago: linha.valor_pago ?? linha.valor_comissao ?? '',
      forma_pagamento_comissao: linha.forma_pagamento_comissao || 'pix',
      forma_pagamento_outra_obs: linha.forma_pagamento_outra_obs || '',
    })
  }

  const salvarPagamento = async () => {
    setErro('')
    try {
      await api.patch(`/comissoes/${pagamentoModal.comissao_id}/pagamento`, pagamentoForm)
      setPagamentoModal(null)
      carregar(vendedorFiltro)
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao registrar pagamento')
    }
  }

  const excluirPagamento = async () => {
    if (!confirm('Excluir o registro de pagamento desta comissão? Ela volta para "Pendente".')) return
    try {
      await api.delete(`/comissoes/${pagamentoModal.comissao_id}/pagamento`)
      setPagamentoModal(null)
      carregar(vendedorFiltro)
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao excluir pagamento')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button onClick={() => navigate('/dashboard')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar ao Menu
      </button>

      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold font-display">{isAdmin ? 'Comissões' : 'Minhas Comissões'}</h1>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/comissoes/importar')} className="bg-onforge-black text-white px-4 py-2 rounded hover:bg-black/80 text-sm">
              Importar Planilha
            </button>
            <button onClick={() => navigate('/comissoes/pendencias')} className="bg-onforge-gray text-white px-4 py-2 rounded hover:bg-black/70 text-sm">
              Pendências de Conciliação {pendenciasCount > 0 && `(${pendenciasCount})`}
            </button>
            <button onClick={() => navigate('/comissoes/clientes-sem-vendedor')} className="bg-onforge-gray text-white px-4 py-2 rounded hover:bg-black/70 text-sm">
              Clientes sem Vendedor {semVendedorCount > 0 && `(${semVendedorCount})`}
            </button>
            <button onClick={() => navigate('/comissoes/percentuais')} className="bg-onforge-gray text-white px-4 py-2 rounded hover:bg-black/70 text-sm">
              Percentuais de Comissão
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <form onSubmit={aplicarFiltro} className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-onforge-black/80 mb-1">Vendedor</label>
            <select
              value={vendedorFiltro} onChange={(e) => setVendedorFiltro(e.target.value)}
              className="px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
            >
              <option value="">Todos</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select>
          </div>
          <button type="submit" className="bg-onforge-gray/30 px-4 py-2 rounded hover:bg-onforge-gray/40 text-sm">Filtrar</button>
        </form>
      )}

      {indicadores && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-onforge-black/50 mb-1">Faturamento Recebido</p>
            <p className="text-xl font-bold">{formatMoney(indicadores.total_faturamento_recebido)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-onforge-black/50 mb-1">Comissão Paga</p>
            <p className="text-xl font-bold text-green-700">{formatMoney(indicadores.total_pago)}</p>
            <p className="text-xs text-onforge-black/40">{indicadores.comissoes_pagas} comissão(ões)</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-onforge-black/50 mb-1">Comissão Pendente</p>
            <p className="text-xl font-bold text-yellow-700">{formatMoney(indicadores.total_pendente)}</p>
            <p className="text-xs text-onforge-black/40">{indicadores.comissoes_pendentes} comissão(ões)</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-onforge-black/50 mb-1">Total Comissão</p>
            <p className="text-xl font-bold">{formatMoney(Number(indicadores.total_pago) + Number(indicadores.total_pendente))}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : linhas.length === 0 ? (
        <div className="text-center py-8 text-onforge-black/50">Nenhum registro de comissão encontrado</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-onforge-cream">
              <tr>
                <th className="px-4 py-2 text-left">Cliente</th>
                {isAdmin && <th className="px-4 py-2 text-left">Vendedor</th>}
                <th className="px-4 py-2 text-left">Situação</th>
                <th className="px-4 py-2 text-left">Recebido</th>
                <th className="px-4 py-2 text-left">Comissão</th>
                <th className="px-4 py-2 text-left">Status Comissão</th>
                {isAdmin && <th className="px-4 py-2"></th>}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id} className="border-b hover:bg-onforge-cream/60">
                  <td className="px-4 py-3">{l.cliente_nome || l.cliente_nome_olist}</td>
                  {isAdmin && <td className="px-4 py-3">{l.vendedor_nome || '-'}</td>}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-white text-xs ${SITUACAO_COR[l.situacao] || 'bg-onforge-gray'}`}>
                      {l.situacao}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatMoney(l.recebido)}</td>
                  <td className="px-4 py-3 font-medium">{l.valor_comissao ? formatMoney(l.valor_comissao) : '-'}</td>
                  <td className="px-4 py-3">
                    {l.status_pagamento_comissao ? (
                      <span className={`px-2 py-1 rounded text-white text-xs ${STATUS_PAGAMENTO_COR[l.status_pagamento_comissao]}`}>
                        {STATUS_PAGAMENTO_LABEL[l.status_pagamento_comissao]}
                      </span>
                    ) : '-'}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      {l.comissao_id && (
                        <button onClick={() => abrirPagamento(l)} className="text-onforge-black hover:opacity-70 text-sm">
                          {l.status_pagamento_comissao === 'paga' ? 'Ver/Editar Pagamento' : 'Registrar Pagamento'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!pagamentoModal} title="Pagamento da Comissão" onClose={() => setPagamentoModal(null)}>
        {pagamentoModal && (
          <div className="space-y-3">
            <p className="text-sm text-onforge-black/60">
              Cliente: <strong>{pagamentoModal.cliente_nome || pagamentoModal.cliente_nome_olist}</strong><br />
              Valor da Comissão: <strong>{formatMoney(pagamentoModal.valor_comissao)}</strong>
            </p>
            <div>
              <label className="block text-xs font-medium text-onforge-black/80 mb-1">Data do Pagamento</label>
              <input
                type="date" value={pagamentoForm.data_pagamento_comissao}
                onChange={(e) => setPagamentoForm({ ...pagamentoForm, data_pagamento_comissao: e.target.value })}
                className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-onforge-black/80 mb-1">Valor Pago</label>
              <input
                type="number" step="0.01" value={pagamentoForm.valor_pago}
                onChange={(e) => setPagamentoForm({ ...pagamentoForm, valor_pago: e.target.value })}
                className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-onforge-black/80 mb-1">Forma de Pagamento</label>
              <select
                value={pagamentoForm.forma_pagamento_comissao}
                onChange={(e) => setPagamentoForm({ ...pagamentoForm, forma_pagamento_comissao: e.target.value })}
                className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
              >
                {Object.entries(FORMA_PAGAMENTO_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
            {pagamentoForm.forma_pagamento_comissao === 'outra' && (
              <div>
                <label className="block text-xs font-medium text-onforge-black/80 mb-1">Observação (qual forma)</label>
                <input
                  type="text" value={pagamentoForm.forma_pagamento_outra_obs}
                  onChange={(e) => setPagamentoForm({ ...pagamentoForm, forma_pagamento_outra_obs: e.target.value })}
                  className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
                />
              </div>
            )}

            {erro && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{erro}</div>}

            <div className="flex gap-2 pt-2">
              <button onClick={salvarPagamento} className="flex-1 bg-onforge-black text-white py-2 rounded hover:bg-black/80">
                Salvar
              </button>
              {pagamentoModal.status_pagamento_comissao === 'paga' && (
                <button onClick={excluirPagamento} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                  Excluir
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
