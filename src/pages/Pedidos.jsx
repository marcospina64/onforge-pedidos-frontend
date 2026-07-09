import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Modal from '../components/Modal'
import { formatMoney, formatDate } from '../utils/format'
import { useAuth } from '../context/AuthContext'

const STATUS_LABEL = {
  pendente: 'Pendente',
  concluido: 'Concluído',
  exportado: 'Exportado',
  cancelado: 'Cancelado',
}

const STATUS_COR = {
  pendente: 'bg-yellow-500',
  concluido: 'bg-blue-500',
  exportado: 'bg-gray-500',
  cancelado: 'bg-red-500',
}

const STATUS_BLOQUEADOS_EDICAO = ['exportado', 'cancelado']

function baixarBlob(blob, nomeArquivo) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  a.click()
  window.URL.revokeObjectURL(url)
}

export default function Pedidos() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [vendedores, setVendedores] = useState([])
  const [filtros, setFiltros] = useState({ vendedor_id: '', status: '', data_inicio: '', data_fim: '' })
  const [detalhe, setDetalhe] = useState(null)

  useEffect(() => {
    carregar()
    if (isAdmin) {
      api.get('/usuarios').then((res) => setVendedores(res.data.filter((u) => u.tipo === 'vendedor')))
    }
  }, [])

  const carregar = async (filtrosAtuais = filtros) => {
    try {
      setLoading(true)
      const params = {}
      Object.entries(filtrosAtuais).forEach(([k, v]) => { if (v) params[k] = v })
      const res = await api.get('/pedidos', { params })
      setPedidos(res.data)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = (e) => {
    e.preventDefault()
    carregar(filtros)
  }

  const abrirDetalhe = async (pedido) => {
    const res = await api.get(`/pedidos/${pedido.id}`)
    setDetalhe(res.data)
  }

  const cancelar = async (id) => {
    if (!confirm('Cancelar este pedido?')) return
    await api.patch(`/pedidos/${id}/cancelar`)
    setDetalhe(null)
    carregar(filtros)
  }

  const exportar = async () => {
    const params = {}
    Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v })
    const res = await api.post('/pedidos/export', {}, { params, responseType: 'blob' })
    const disposition = res.headers['content-disposition'] || ''
    const match = disposition.match(/filename="?([^";]+)"?/)
    const nomeArquivo = match ? match[1] : 'pedidos.xlsx'
    baixarBlob(res.data, nomeArquivo)
    carregar(filtros)
  }

  const baixarPdf = async (pedido) => {
    const res = await api.get(`/pedidos/${pedido.id}/pdf`, { responseType: 'blob' })
    baixarBlob(res.data, `pedido-${pedido.numero}.pdf`)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:text-blue-800 mb-4 flex items-center">
        ← Voltar ao Menu
      </button>

      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">{isAdmin ? 'Pedidos' : 'Meus Pedidos'}</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/pedidos/novo')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Novo Pedido
          </button>
          {isAdmin && (
            <button onClick={exportar} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              Exportar
            </button>
          )}
        </div>
      </div>

      <form onSubmit={aplicarFiltros} className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-3 items-end">
        {isAdmin && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Vendedor</label>
            <select
              value={filtros.vendedor_id} onChange={(e) => setFiltros({ ...filtros, vendedor_id: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todos</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filtros.status} onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="concluido">Concluído</option>
            <option value="exportado">Exportado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">De</label>
          <input
            type="date" value={filtros.data_inicio} onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Até</label>
          <input
            type="date" value={filtros.data_fim} onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <button type="submit" className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 text-sm">Filtrar</button>
      </form>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhum pedido encontrado</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Nº</th>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-left">Cliente</th>
                {isAdmin && <th className="px-4 py-2 text-left">Vendedor</th>}
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Valor Total</th>
                <th className="px-4 py-2 text-left">Condição Pagamento</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => {
                const edicaoBloqueada = STATUS_BLOQUEADOS_EDICAO.includes(p.status)
                return (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{p.numero}</td>
                    <td className="px-4 py-3">{formatDate(p.data_pedido)}</td>
                    <td className="px-4 py-3">{p.cliente_nome}</td>
                    {isAdmin && <td className="px-4 py-3">{p.vendedor_nome}</td>}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-white text-xs ${STATUS_COR[p.status] || 'bg-gray-400'}`}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatMoney(p.valor_total)}</td>
                    <td className="px-4 py-3 text-sm">{p.condicao_pagamento || '-'}</td>
                    <td className="px-4 py-3 space-x-3 whitespace-nowrap">
                      <button onClick={() => abrirDetalhe(p)} className="text-blue-600 hover:text-blue-800 text-sm">Ver</button>
                      {edicaoBloqueada ? (
                        <span className="text-gray-300 text-sm cursor-not-allowed">Editar</span>
                      ) : (
                        <button onClick={() => navigate(`/pedidos/${p.id}/editar`)} className="text-blue-600 hover:text-blue-800 text-sm">
                          Editar
                        </button>
                      )}
                      <button onClick={() => baixarPdf(p)} className="text-blue-600 hover:text-blue-800 text-sm">PDF</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!detalhe} title={detalhe ? `Pedido nº ${detalhe.numero}` : ''} onClose={() => setDetalhe(null)}>
        {detalhe && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Cliente: <strong>{detalhe.cliente_nome}</strong></p>
            <p className="text-sm text-gray-600 mb-1">Vendedor: <strong>{detalhe.vendedor_nome}</strong></p>
            <p className="text-sm text-gray-600 mb-1">Data: <strong>{formatDate(detalhe.data_pedido)}</strong></p>
            <p className="text-sm text-gray-600 mb-1">
              Status: <span className={`px-2 py-1 rounded text-white text-xs ${STATUS_COR[detalhe.status] || 'bg-gray-400'}`}>
                {STATUS_LABEL[detalhe.status] || detalhe.status}
              </span>
            </p>
            {detalhe.desconto_geral > 0 && (
              <p className="text-sm text-gray-600 mb-1">Desconto Geral: <strong>{detalhe.desconto_geral}%</strong></p>
            )}
            {detalhe.condicao_pagamento && (
              <p className="text-sm text-gray-600 mb-1">Condição Pagamento: <strong>{detalhe.condicao_pagamento}</strong></p>
            )}
            {detalhe.observacao_pagamento && (
              <p className="text-sm text-gray-600 mb-3">Observação: <strong>{detalhe.observacao_pagamento}</strong></p>
            )}

            <div className="max-h-64 overflow-y-auto border-t border-b divide-y mb-3">
              {detalhe.itens.map((item) => (
                <div key={item.id} className="py-2 flex justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.codigo_produto} - {item.nome_produto}</p>
                    <p className="text-gray-500">
                      {item.qtd} {item.unidade} x {formatMoney(item.vr_unitario)}
                      {Number(item.perc_desconto) > 0 && ` (- ${item.perc_desconto}%)`}
                    </p>
                  </div>
                  <p className="font-medium">{formatMoney(item.vr_total)}</p>
                </div>
              ))}
            </div>

            <p className="text-right text-lg font-bold mb-4">Total: {formatMoney(detalhe.valor_total)}</p>

            {!STATUS_BLOQUEADOS_EDICAO.includes(detalhe.status) && (
              <button onClick={() => cancelar(detalhe.id)} className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">
                Cancelar Pedido
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
