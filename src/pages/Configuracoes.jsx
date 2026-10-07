import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Configuracoes() {
  const navigate = useNavigate()
  const [diaPagamento, setDiaPagamento] = useState('')
  const [diasUteisCorte, setDiasUteisCorte] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [olist, setOlist] = useState(null)

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    try {
      const res = await api.get('/configuracoes')
      setDiaPagamento(res.data.comissao_dia_pagamento ?? '10')
      setDiasUteisCorte(res.data.comissao_dias_uteis_corte ?? '2')
      const status = await api.get('/integracoes/olist/status')
      setOlist(status.data)
    } finally {
      setLoading(false)
    }
  }

  // A Olist devolve o retorno da autorização direto no backend, então a conexão
  // acontece em outra aba e o status é relido quando o admin volta para cá.
  const conectarOlist = async () => {
    setErro('')
    try {
      const res = await api.post('/integracoes/olist/autorizar')
      window.open(res.data.url, '_blank', 'noopener')
      setMensagem('Autorize o acesso na aba que abriu e depois recarregue esta página.')
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao iniciar a conexão com a Olist')
    }
  }

  const salvar = async (e) => {
    e.preventDefault()
    setErro('')
    setMensagem('')
    setSalvando(true)
    try {
      await api.patch('/configuracoes', {
        comissao_dia_pagamento: diaPagamento,
        comissao_dias_uteis_corte: diasUteisCorte,
      })
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

      <button
        type="button"
        onClick={() => navigate('/configuracoes/descontos-promocoes')}
        className="w-full bg-white rounded-lg shadow p-6 mb-6 text-left hover:bg-onforge-cream/40 flex justify-between items-center"
      >
        <span>
          <span className="block text-lg font-bold font-display">Desconto e Promoções</span>
          <span className="block text-xs text-onforge-black/50">Desconto máximo do vendedor e Campanhas Promocionais</span>
        </span>
        <span className="text-xl">→</span>
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={salvar} className="space-y-4">
          {erro && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{erro}</div>}
          {mensagem && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{mensagem}</div>}

          <h2 className="text-lg font-bold font-display">Comissões</h2>

          <div>
            <label className="block text-sm font-medium text-onforge-black/80 mb-1">
              Dia de pagamento da comissão (dia fixo do mês)
            </label>
            <input
              type="number" step="1" min="1" max="28" required
              value={diaPagamento}
              onChange={(e) => setDiaPagamento(e.target.value)}
              className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-onforge-black/80 mb-1">
              Dias úteis de corte antes do pagamento
            </label>
            <input
              type="number" step="1" min="0" max="15" required
              value={diasUteisCorte}
              onChange={(e) => setDiasUteisCorte(e.target.value)}
              className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md"
            />
            <p className="text-xs text-onforge-black/50 mt-1">
              Parcela confirmada até esse número de dias úteis antes do pagamento (contando feriados nacionais) entra no ciclo do mês corrente; depois disso, cai para o mês seguinte.
            </p>
          </div>

          <button type="submit" disabled={salvando} className="w-full bg-onforge-black text-white py-2 rounded-md hover:bg-black/80 disabled:bg-onforge-gray">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-bold font-display mb-1">Integração com a Olist</h2>
        <p className="text-xs text-onforge-black/50 mb-4">
          Permite enviar pedidos direto para o ERP, sem planilha. A autorização vale por pouco tempo:
          se ficar dias sem enviar nenhum pedido, é preciso reconectar aqui.
        </p>

        {olist?.conectado ? (
          <p className="text-sm text-green-700 mb-3">
            ✓ Conectada — última renovação em {new Date(olist.atualizado_em).toLocaleString('pt-BR')}
          </p>
        ) : (
          <p className="text-sm text-onforge-black/60 mb-3">Ainda não conectada.</p>
        )}

        <button
          type="button"
          onClick={conectarOlist}
          className="bg-onforge-black text-white px-4 py-2 rounded-md hover:bg-black/80 text-sm"
        >
          {olist?.conectado ? 'Reconectar' : 'Conectar à Olist'}
        </button>
      </div>
    </div>
  )
}
