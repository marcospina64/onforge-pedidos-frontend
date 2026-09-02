import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import { fotoProdutoUrl } from '../utils/produtoFoto'

export default function ProdutosInativar() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [selecionado, setSelecionado] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState(null)
  const ultimaBuscaId = useRef(0)

  const buscarProdutos = async (termo) => {
    setBusca(termo)
    setMensagem(null)
    if (termo.length < 1) {
      setResultados([])
      return
    }
    const buscaId = ++ultimaBuscaId.current
    const res = await api.get('/produtos/gerenciar', { params: { busca: termo } })
    if (buscaId !== ultimaBuscaId.current) return
    setResultados(res.data)
  }

  const selecionarProduto = (produto) => {
    setSelecionado(produto)
    setMensagem(null)
  }

  const alterarStatus = async (ativo) => {
    if (!selecionado) return
    try {
      setSalvando(true)
      const res = await api.patch(`/produtos/${selecionado.id}/status`, { ativo })
      setSelecionado(res.data)
      setResultados((atual) => atual.map((p) => (p.id === res.data.id ? res.data : p)))
      setMensagem(ativo ? 'Produto ativado com sucesso.' : 'Produto inativado com sucesso.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/produtos')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar ao Catálogo
      </button>
      <h1 className="text-3xl font-bold mb-6 font-display">Inativar Produto</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <label className="block text-sm font-medium text-onforge-black/80 mb-1">Buscar produto por código ou nome</label>
        <input
          type="text" value={busca} onChange={(e) => buscarProdutos(e.target.value)}
          placeholder="Digite o código ou nome do produto..."
          className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md"
        />

        {resultados.length > 0 && (
          <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-onforge-gray/20 border border-onforge-gray/20 rounded-md">
            {resultados.map((p) => (
              <div
                key={p.id}
                onClick={() => selecionarProduto(p)}
                className={`px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-onforge-cream/60 ${selecionado?.id === p.id ? 'bg-onforge-cream' : ''}`}
              >
                <span className="text-xs text-onforge-black/50 w-16 shrink-0">{p.codigo}</span>
                <span className="text-sm flex-1 truncate">{p.nome_produto}</span>
                <span className={`text-xs px-2 py-0.5 rounded text-white shrink-0 ${p.ativo ? 'bg-green-600' : 'bg-onforge-gray'}`}>
                  {p.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selecionado && (
        <div className="bg-white rounded-lg shadow p-6 flex flex-wrap items-center gap-6">
          {selecionado.tem_foto ? (
            <img src={fotoProdutoUrl(selecionado.id)} alt={selecionado.nome_produto} loading="lazy" className="w-24 h-24 object-contain" />
          ) : (
            <div className="w-24 h-24 bg-onforge-cream flex items-center justify-center text-onforge-black/40 text-xs">Sem foto</div>
          )}

          <div className="flex-1 min-w-[200px]">
            <p className="text-xs text-onforge-black/50">{selecionado.codigo}</p>
            <p className="text-lg font-semibold leading-tight mb-1">{selecionado.nome_produto}</p>
            <p className="text-sm text-onforge-black/60">{selecionado.unidade} · {formatMoney(selecionado.preco_tabela)}</p>
            <span className={`inline-block mt-2 text-xs px-2 py-1 rounded text-white ${selecionado.ativo ? 'bg-green-600' : 'bg-onforge-gray'}`}>
              {selecionado.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => alterarStatus(false)}
              disabled={!selecionado.ativo || salvando}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Inativar
            </button>
            <button
              onClick={() => alterarStatus(true)}
              disabled={selecionado.ativo || salvando}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Ativar
            </button>
          </div>
        </div>
      )}

      {mensagem && <p className="mt-4 text-sm text-green-700">{mensagem}</p>}
    </div>
  )
}
