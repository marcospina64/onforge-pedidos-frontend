import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Modal from '../components/Modal'
import { formatMoney, formatDate } from '../utils/format'
import { useAuth } from '../context/AuthContext'

const SITUACAO_COR = {
  'Paga': 'bg-green-600',
  'Em aberto': 'bg-yellow-500',
  'Cancelado': 'bg-red-500',
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

const RECEBIMENTO_VAZIO = { recebimento: '', recebido: '', forma_recebimento: '', meio_recebimento: '' }

const hojeISO = () => new Date().toISOString().slice(0, 10)

// Dias corridos entre a data de vencimento (coluna D da planilha Olist) e hoje, em UTC
// (mesma convenção de fuso já usada em formatDate/hojeISO, para não dar diferença de 1 dia).
function diasAtraso(dataVencimento) {
  if (!dataVencimento) return 0
  const vencimento = new Date(dataVencimento)
  const vencUTC = Date.UTC(vencimento.getUTCFullYear(), vencimento.getUTCMonth(), vencimento.getUTCDate())
  const hoje = new Date()
  const hojeUTC = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate())
  return Math.floor((hojeUTC - vencUTC) / 86400000)
}

// Data prevista 'YYYY-MM-DD' -> "Agosto/2026"
function formatarMesAno(dataISO) {
  const [ano, mes] = dataISO.split('-').map(Number)
  const label = new Date(Date.UTC(ano, mes - 1, 1)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function calcularProximoCiclo(linhas) {
  const hoje = hojeISO()
  const datas = linhas.map((l) => l.dt_prevista_pagamento_comissao).filter((d) => d && d >= hoje)
  if (datas.length === 0) return null
  return datas.reduce((min, d) => (d < min ? d : min), datas[0])
}

function subtotalComissao(linhas) {
  return linhas.reduce((soma, l) => soma + Number(l.valor_comissao || l.valor_comissao_estimado || 0), 0)
}

function subtotalAReceber(linhas) {
  return linhas.reduce((soma, l) => soma + Number(l.valor_documento || 0), 0)
}

function agruparPorMes(linhas) {
  const grupos = {}
  const semPrevisao = []
  linhas.forEach((l) => {
    if (!l.dt_prevista_pagamento_comissao) { semPrevisao.push(l); return }
    const chave = l.dt_prevista_pagamento_comissao.slice(0, 7)
    if (!grupos[chave]) grupos[chave] = []
    grupos[chave].push(l)
  })
  const ordenado = Object.keys(grupos).sort().map((chave) => ({ chave, label: formatarMesAno(`${chave}-01`), linhas: grupos[chave] }))
  if (semPrevisao.length > 0) ordenado.push({ chave: 'sem-previsao', label: 'Sem previsão', linhas: semPrevisao })
  return ordenado
}

function TabelaComissoes({ linhas, isAdmin, mostrarVendedor = isAdmin, podeRegistrarPagamento = isAdmin, podeRegistrarRecebimento = isAdmin, abrirPagamento, abrirRecebimento }) {
  const mostrarColunaAcoes = podeRegistrarPagamento || podeRegistrarRecebimento
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-onforge-cream">
          <tr>
            <th className="px-3 py-2 text-left">Cliente</th>
            {mostrarVendedor && <th className="px-3 py-2 text-left">Vendedor</th>}
            <th className="px-3 py-2 text-left">Status Recebimento</th>
            <th className="px-3 py-2 text-left">Dt Venda</th>
            <th className="px-3 py-2 text-left">Nr NF</th>
            <th className="px-3 py-2 text-left">Parcela</th>
            <th className="px-3 py-2 text-left">À Receber</th>
            <th className="px-3 py-2 text-left">Venc. Boleto</th>
            <th className="px-3 py-2 text-left">Recebido</th>
            <th className="px-3 py-2 text-left">Comissão</th>
            <th className="px-3 py-2 text-left">Status Comissão</th>
            <th className="px-3 py-2 text-left">Prev. Comissão</th>
            {mostrarColunaAcoes && <th className="px-3 py-2"></th>}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const atraso = l.situacao === 'Em aberto' ? diasAtraso(l.data_vencimento) : 0
            return (
            <tr key={l.id} className="border-b hover:bg-onforge-cream/60">
              <td className="px-3 py-2">{l.cliente_nome || l.cliente_nome_olist}</td>
              {mostrarVendedor && <td className="px-3 py-2">{l.vendedor_nome || '-'}</td>}
              <td className="px-3 py-2">
                {atraso >= 3 ? (
                  <span className="px-2 py-1 rounded bg-red-600 text-yellow-300 text-xs">{`Atraso = ${atraso} dias`}</span>
                ) : (
                  <span className={`px-2 py-1 rounded text-white text-xs ${SITUACAO_COR[l.situacao] || 'bg-onforge-gray'}`}>
                    {l.situacao}
                  </span>
                )}
              </td>
              <td className="px-3 py-2">{formatDate(l.data_emissao)}</td>
              <td className="px-3 py-2">{l.numero_nf || '-'}</td>
              <td className="px-3 py-2">{l.parcela || '-'}</td>
              <td className="px-3 py-2">{formatMoney(l.valor_documento)}</td>
              <td className="px-3 py-2">{formatDate(l.data_vencimento)}</td>
              <td className="px-3 py-2">{formatMoney(l.recebido)}</td>
              <td className="px-3 py-2 font-medium">
                {l.valor_comissao ? (
                  formatMoney(l.valor_comissao)
                ) : l.valor_comissao_estimado ? (
                  <span className="italic text-onforge-black/60">{formatMoney(l.valor_comissao_estimado)}</span>
                ) : '-'}
              </td>
              <td className="px-3 py-2">
                {l.status_pagamento_comissao ? (
                  <span className={`px-2 py-1 rounded text-white text-xs ${STATUS_PAGAMENTO_COR[l.status_pagamento_comissao]}`}>
                    {STATUS_PAGAMENTO_LABEL[l.status_pagamento_comissao]}
                  </span>
                ) : l.valor_comissao_estimado ? (
                  <span className="px-2 py-1 rounded bg-onforge-gray text-white text-xs">A receber</span>
                ) : '-'}
              </td>
              <td className="px-3 py-2">
                {l.dt_prevista_pagamento_comissao ? formatDate(l.dt_prevista_pagamento_comissao) : '-'}
                {l.situacao !== 'Paga' && l.dt_prevista_pagamento_comissao && (
                  <span className="text-xs text-onforge-black/40 block">estimativa</span>
                )}
              </td>
              {mostrarColunaAcoes && (
                <td className="px-3 py-2 whitespace-nowrap">
                  {podeRegistrarRecebimento && l.situacao === 'Em aberto' && (
                    <button onClick={() => abrirRecebimento(l)} className="text-onforge-black hover:opacity-70 text-sm">
                      Registrar Recebimento
                    </button>
                  )}
                  {podeRegistrarPagamento && l.comissao_id && (
                    <button onClick={() => abrirPagamento(l)} className="text-onforge-black hover:opacity-70 text-sm">
                      {l.status_pagamento_comissao === 'paga' ? 'Ver/Editar Pagamento' : 'Registrar Pagamento'}
                    </button>
                  )}
                </td>
              )}
            </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-onforge-black/20 bg-onforge-cream/60 font-semibold">
            <td className="px-3 py-2">Total</td>
            {mostrarVendedor && <td className="px-3 py-2"></td>}
            <td className="px-3 py-2"></td>
            <td className="px-3 py-2"></td>
            <td className="px-3 py-2"></td>
            <td className="px-3 py-2"></td>
            <td className="px-3 py-2">{formatMoney(subtotalAReceber(linhas))}</td>
            <td className="px-3 py-2"></td>
            <td className="px-3 py-2"></td>
            <td className="px-3 py-2">{formatMoney(subtotalComissao(linhas))}</td>
            <td className="px-3 py-2"></td>
            <td className="px-3 py-2"></td>
            {mostrarColunaAcoes && <td className="px-3 py-2"></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default function Comissoes() {
  const navigate = useNavigate()
  const { isAdmin, souMaster } = useAuth()
  const [aba, setAba] = useState('minhas')
  const [linhas, setLinhas] = useState([])
  const [linhasEquipe, setLinhasEquipe] = useState([])
  const [loadingEquipe, setLoadingEquipe] = useState(true)
  const [masterFiltro, setMasterFiltro] = useState('')
  const [indicadores, setIndicadores] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vendedores, setVendedores] = useState([])
  const [vendedorFiltro, setVendedorFiltro] = useState('')
  const [cicloFiltro, setCicloFiltro] = useState('todos')
  const [pendenciasCount, setPendenciasCount] = useState(0)
  const [semVendedorCount, setSemVendedorCount] = useState(0)
  const [pagamentoModal, setPagamentoModal] = useState(null)
  const [pagamentoForm, setPagamentoForm] = useState(PAGAMENTO_VAZIO)
  const [recebimentoModal, setRecebimentoModal] = useState(null)
  const [recebimentoForm, setRecebimentoForm] = useState(RECEBIMENTO_VAZIO)
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregar()
    if (isAdmin) {
      api.get('/usuarios').then((res) => setVendedores(res.data.filter((u) => u.tipo === 'vendedor')))
      api.get('/comissoes/pendencias').then((res) => setPendenciasCount(res.data.length))
      api.get('/comissoes/clientes-sem-vendedor').then((res) => setSemVendedorCount(res.data.length))
    }
    if (souMaster) carregarEquipe()
  }, [])

  // Masters existentes (vendedores com ao menos 1 Subordinado) — só usado pelo seletor do admin.
  const masters = vendedores.filter((m) => vendedores.some((v) => v.vendedor_master_id === m.id))
  const mostrarAbaEquipe = souMaster || (isAdmin && masters.length > 0)

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

  const carregarEquipe = async (masterId = masterFiltro) => {
    try {
      setLoadingEquipe(true)
      const params = {}
      if (isAdmin && masterId) params.master_id = masterId
      const res = await api.get('/comissoes/equipe', { params })
      setLinhasEquipe(res.data)
    } finally {
      setLoadingEquipe(false)
    }
  }

  const aplicarFiltroEquipe = (e) => {
    e.preventDefault()
    carregarEquipe(masterFiltro)
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

  const abrirRecebimento = (linha) => {
    setErro('')
    setRecebimentoModal(linha)
    setRecebimentoForm({
      recebimento: hojeISO(),
      recebido: linha.valor_documento ?? '',
      forma_recebimento: '',
      meio_recebimento: '',
    })
  }

  const recarregarAbaAtual = () => (aba === 'equipe' ? carregarEquipe(masterFiltro) : carregar(vendedorFiltro))

  const salvarRecebimento = async () => {
    setErro('')
    try {
      await api.patch(`/comissoes/${recebimentoModal.id}/recebimento`, recebimentoForm)
      setRecebimentoModal(null)
      recarregarAbaAtual()
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao registrar recebimento')
    }
  }

  const salvarPagamento = async () => {
    setErro('')
    try {
      await api.patch(`/comissoes/${pagamentoModal.comissao_id}/pagamento`, pagamentoForm)
      setPagamentoModal(null)
      recarregarAbaAtual()
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao registrar pagamento')
    }
  }

  const excluirPagamento = async () => {
    if (!confirm('Excluir o registro de pagamento desta comissão? Ela volta para "Pendente".')) return
    try {
      await api.delete(`/comissoes/${pagamentoModal.comissao_id}/pagamento`)
      setPagamentoModal(null)
      recarregarAbaAtual()
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
            <button onClick={() => navigate('/comissoes/percentuais-master')} className="bg-onforge-gray text-white px-4 py-2 rounded hover:bg-black/70 text-sm">
              Percentual do Master
            </button>
          </div>
        )}
      </div>

      {mostrarAbaEquipe && (
        <div className="flex gap-1 bg-onforge-cream rounded-md p-1 mb-6 w-fit">
          <button
            onClick={() => setAba('minhas')}
            className={`px-3 py-1.5 rounded text-sm ${aba === 'minhas' ? 'bg-onforge-black text-white' : 'text-onforge-black/70'}`}
          >
            {isAdmin ? 'Comissões' : 'Minhas Comissões'}
          </button>
          <button
            onClick={() => setAba('equipe')}
            className={`px-3 py-1.5 rounded text-sm ${aba === 'equipe' ? 'bg-onforge-black text-white' : 'text-onforge-black/70'}`}
          >
            Minha Equipe
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-3 items-end justify-between">
        {aba === 'minhas' && isAdmin && (
          <form onSubmit={aplicarFiltro} className="flex flex-wrap gap-3 items-end">
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
        {aba === 'equipe' && isAdmin && (
          <form onSubmit={aplicarFiltroEquipe} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-onforge-black/80 mb-1">Master</label>
              <select
                value={masterFiltro} onChange={(e) => setMasterFiltro(e.target.value)}
                className="px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
              >
                <option value="">Selecione...</option>
                {masters.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
              </select>
            </div>
            <button type="submit" className="bg-onforge-gray/30 px-4 py-2 rounded hover:bg-onforge-gray/40 text-sm">Filtrar</button>
          </form>
        )}
        {!isAdmin && <div />}

        <div className="flex gap-1 bg-onforge-cream rounded-md p-1">
          <button
            onClick={() => setCicloFiltro('proximo')}
            className={`px-3 py-1.5 rounded text-sm ${cicloFiltro === 'proximo' ? 'bg-onforge-black text-white' : 'text-onforge-black/70'}`}
          >
            Próximo Ciclo
          </button>
          <button
            onClick={() => setCicloFiltro('todos')}
            className={`px-3 py-1.5 rounded text-sm ${cicloFiltro === 'todos' ? 'bg-onforge-black text-white' : 'text-onforge-black/70'}`}
          >
            Todos os Ciclos
          </button>
        </div>
      </div>

      {aba === 'minhas' && indicadores && (
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

      {(() => {
        const linhasAtivas = aba === 'equipe' ? linhasEquipe : linhas
        const carregandoAtivo = aba === 'equipe' ? loadingEquipe : loading
        const mostrarVendedorColuna = aba === 'equipe' ? true : isAdmin

        if (carregandoAtivo) return <div className="text-center py-8">Carregando...</div>
        if (aba === 'equipe' && isAdmin && !masterFiltro) {
          return <div className="text-center py-8 text-onforge-black/50">Selecione um Master para ver as comissões da equipe</div>
        }
        if (linhasAtivas.length === 0) {
          return (
            <div className="text-center py-8 text-onforge-black/50">
              {aba === 'equipe' ? 'Nenhum registro de comissão da equipe encontrado' : 'Nenhum registro de comissão encontrado'}
            </div>
          )
        }
        if (cicloFiltro === 'proximo') {
          const proximoCiclo = calcularProximoCiclo(linhasAtivas)
          const linhasCiclo = proximoCiclo ? linhasAtivas.filter((l) => l.dt_prevista_pagamento_comissao === proximoCiclo) : []
          return linhasCiclo.length === 0 ? (
            <div className="text-center py-8 text-onforge-black/50">Nenhum ciclo futuro com comissão pendente</div>
          ) : (
            <div>
              <p className="text-sm text-onforge-black/60 mb-2">Próximo ciclo de pagamento: <strong>{formatDate(proximoCiclo)}</strong></p>
              <TabelaComissoes linhas={linhasCiclo} isAdmin={isAdmin} mostrarVendedor={mostrarVendedorColuna} abrirPagamento={abrirPagamento} abrirRecebimento={abrirRecebimento} />
            </div>
          )
        }
        return agruparPorMes(linhasAtivas).map((grupo) => (
          <div key={grupo.chave} className="mb-6">
            <h3 className="text-lg font-semibold font-display mb-2">{grupo.label}</h3>
            <TabelaComissoes linhas={grupo.linhas} isAdmin={isAdmin} mostrarVendedor={mostrarVendedorColuna} abrirPagamento={abrirPagamento} abrirRecebimento={abrirRecebimento} />
          </div>
        ))
      })()}

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

      <Modal isOpen={!!recebimentoModal} title="Registrar Recebimento" onClose={() => setRecebimentoModal(null)}>
        {recebimentoModal && (
          <div className="space-y-3">
            <p className="text-sm text-onforge-black/60">
              Cliente: <strong>{recebimentoModal.cliente_nome || recebimentoModal.cliente_nome_olist}</strong><br />
              Valor do Documento: <strong>{formatMoney(recebimentoModal.valor_documento)}</strong>
            </p>
            <div>
              <label className="block text-xs font-medium text-onforge-black/80 mb-1">Data do Recebimento</label>
              <input
                type="date" value={recebimentoForm.recebimento}
                onChange={(e) => setRecebimentoForm({ ...recebimentoForm, recebimento: e.target.value })}
                className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-onforge-black/80 mb-1">Valor Recebido</label>
              <input
                type="number" step="0.01" value={recebimentoForm.recebido}
                onChange={(e) => setRecebimentoForm({ ...recebimentoForm, recebido: e.target.value })}
                className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-onforge-black/80 mb-1">Forma de Recebimento (opcional)</label>
              <input
                type="text" value={recebimentoForm.forma_recebimento}
                onChange={(e) => setRecebimentoForm({ ...recebimentoForm, forma_recebimento: e.target.value })}
                placeholder="Ex: Pix"
                className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-onforge-black/80 mb-1">Meio de Recebimento (opcional)</label>
              <input
                type="text" value={recebimentoForm.meio_recebimento}
                onChange={(e) => setRecebimentoForm({ ...recebimentoForm, meio_recebimento: e.target.value })}
                className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
              />
            </div>

            {erro && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{erro}</div>}

            <div className="flex gap-2 pt-2">
              <button onClick={salvarRecebimento} className="flex-1 bg-onforge-black text-white py-2 rounded hover:bg-black/80">
                Salvar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
