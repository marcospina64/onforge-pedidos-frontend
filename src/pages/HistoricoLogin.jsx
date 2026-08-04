import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatDateTime } from '../utils/format'

const TIPO_LABEL = { admin: 'Administrador', vendedor: 'Vendedor' }

export default function HistoricoLogin() {
  const navigate = useNavigate()
  const [resumo, setResumo] = useState([])
  const [eventos, setEventos] = useState([])
  const [loadingResumo, setLoadingResumo] = useState(true)
  const [loadingEventos, setLoadingEventos] = useState(true)
  const [usuarioFiltro, setUsuarioFiltro] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    carregarResumo()
    carregarEventos()
  }, [])

  const carregarResumo = async () => {
    try {
      setLoadingResumo(true)
      const res = await api.get('/historico-login/resumo')
      setResumo(res.data)
    } finally {
      setLoadingResumo(false)
    }
  }

  const carregarEventos = async (params = {}) => {
    try {
      setLoadingEventos(true)
      const res = await api.get('/historico-login', { params })
      setEventos(res.data)
    } finally {
      setLoadingEventos(false)
    }
  }

  const aplicarFiltro = (e) => {
    e.preventDefault()
    const params = {}
    if (usuarioFiltro) params.usuario_id = usuarioFiltro
    if (dataInicio) params.data_inicio = dataInicio
    if (dataFim) params.data_fim = dataFim
    carregarEventos(params)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button onClick={() => navigate('/dashboard')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar ao Menu
      </button>
      <h1 className="text-3xl font-bold mb-6 font-display">Histórico de Login</h1>

      <h2 className="text-lg font-semibold mb-3">Resumo por Usuário</h2>
      {loadingResumo ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead className="bg-onforge-cream">
              <tr>
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Último Acesso</th>
                <th className="px-4 py-2 text-left">Acessos (30 dias)</th>
                <th className="px-4 py-2 text-left">Total de Acessos</th>
              </tr>
            </thead>
            <tbody>
              {resumo.map((u) => (
                <tr key={u.id} className="border-b hover:bg-onforge-cream/60">
                  <td className="px-4 py-3">{u.nome}</td>
                  <td className="px-4 py-3">{TIPO_LABEL[u.tipo] || u.tipo}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-white text-xs ${u.ativo ? 'bg-green-600' : 'bg-onforge-gray'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{u.ultimo_acesso ? formatDateTime(u.ultimo_acesso) : 'Nunca acessou'}</td>
                  <td className="px-4 py-3">{u.acessos_30d}</td>
                  <td className="px-4 py-3">{u.total_acessos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Histórico Detalhado</h2>
      <form onSubmit={aplicarFiltro} className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-onforge-black/80 mb-1">Usuário</label>
          <select
            value={usuarioFiltro} onChange={(e) => setUsuarioFiltro(e.target.value)}
            className="px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
          >
            <option value="">Todos</option>
            {resumo.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-onforge-black/80 mb-1">De</label>
          <input
            type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
            className="px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-onforge-black/80 mb-1">Até</label>
          <input
            type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
            className="px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
          />
        </div>
        <button type="submit" className="bg-onforge-gray/30 px-4 py-2 rounded hover:bg-onforge-gray/40 text-sm">Filtrar</button>
      </form>

      {loadingEventos ? (
        <div className="text-center py-8">Carregando...</div>
      ) : eventos.length === 0 ? (
        <div className="text-center py-8 text-onforge-black/50">Nenhum login encontrado para o filtro selecionado</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-onforge-cream">
              <tr>
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-left">Hora</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((ev) => {
                const [data, hora] = formatDateTime(ev.criado_em).split(', ')
                return (
                  <tr key={ev.id} className="border-b hover:bg-onforge-cream/60">
                    <td className="px-4 py-3">{ev.nome}</td>
                    <td className="px-4 py-3">{TIPO_LABEL[ev.tipo] || ev.tipo}</td>
                    <td className="px-4 py-3">{data || '-'}</td>
                    <td className="px-4 py-3">{hora || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
