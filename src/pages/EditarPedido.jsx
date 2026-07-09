import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import { encontrarItemForaDoLimite, calcularDescontoMedio } from '../utils/pedidoCalc'
import CarrinhoItens from '../components/CarrinhoItens'

const STATUS_BLOQUEADOS = ['exportado', 'cancelado']
const STATUS_LABEL = { pendente: 'Pendente', concluido: 'Concluído', exportado: 'Exportado', cancelado: 'Cancelado' }

export default function EditarPedido() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [descontoMaximo, setDescontoMaximo] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [pedido, setPedido] = useState(null)
  const [bloqueado, setBloqueado] = useState(false)
  const [carrinho, setCarrinho] = useState([])
  const [descontoGeral, setDescontoGeral] = useState(0)
  const [condicaoPagamento, setCondicaoPagamento] = useState('')
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(null)

  useEffect(() => {
    api.get('/configuracoes').then((res) => {
      setDescontoMaximo(Number(res.data.desconto_maximo_percentual) || 0)
    })
    carregarPedido()
  }, [id])

  const carregarPedido = async () => {
    try {
      setCarregando(true)
      const res = await api.get(`/pedidos/${id}`)
      const dados = res.data
      setPedido(dados)
      setDescontoGeral(Number(dados.desconto_geral) || 0)
      setCondicaoPagamento(dados.condicao_pagamento || '')
      setObservacao(dados.observacao_pagamento || '')
      if (STATUS_BLOQUEADOS.includes(dados.status)) {
        setBloqueado(true)
        return
      }
      setCarrinho(dados.itens.map((item) => ({
        produto_id: item.produto_id,
        codigo: item.codigo_produto,
        nome_produto: item.nome_produto,
        foto_base64: item.foto_base64,
        unidade: item.unidade,
        preco_tabela: Number(item.vr_unitario),
        qtd: Number(item.qtd),
        perc_desconto: Number(item.perc_desconto),
      })))
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao carregar pedido')
    } finally {
      setCarregando(false)
    }
  }

  const salvarEdicao = async (status) => {
    setErro('')
    setSucesso(null)

    if (carrinho.length === 0) {
      setErro('Adicione ao menos um produto')
      return
    }
    const itemForaLimite = encontrarItemForaDoLimite(carrinho, descontoMaximo)
    if (itemForaLimite) {
      setErro(`O desconto de ${itemForaLimite.perc_desconto}% em "${itemForaLimite.nome_produto}" excede o limite de ${descontoMaximo}%`)
      return
    }
    if (descontoGeral < 0 || descontoGeral > descontoMaximo) {
      setErro(`Desconto geral inválido. Deve ser entre 0 e ${descontoMaximo}%`)
      return
    }

    try {
      setEnviando(true)
      const res = await api.put(`/pedidos/${id}`, {
        status,
        desconto_geral: descontoGeral || 0,
        condicao_pagamento: condicaoPagamento || null,
        observacao_pagamento: observacao || null,
        itens: carrinho.map((i) => ({
          produto_id: i.produto_id,
          qtd: Number(i.qtd),
          perc_desconto: Number(i.perc_desconto) || 0,
        })),
      })
      setSucesso({ ...res.data, desconto_medio: calcularDescontoMedio(res.data.itens || []) })
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao salvar alterações')
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return <div className="p-6 text-center">Carregando...</div>
  }

  if (bloqueado) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-xl font-bold mb-2">Pedido não pode ser editado</h1>
          <p className="text-gray-600 mb-6">
            O pedido nº {pedido?.numero} está com status "{STATUS_LABEL[pedido?.status] || pedido?.status}" e não pode mais ser alterado.
          </p>
          <button onClick={() => navigate('/pedidos')} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
            Voltar para Pedidos
          </button>
        </div>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-2">
            Pedido nº {sucesso.numero} atualizado para "{STATUS_LABEL[sucesso.status] || sucesso.status}"!
          </h1>
          <p className="text-2xl font-bold text-gray-900 mb-2">Valor total: {formatMoney(sucesso.valor_total)}</p>
          <p className="text-gray-600 mb-6">Desconto Médio: {sucesso.desconto_medio?.toFixed(2) || '0.00'}%</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/pedidos')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Ver Pedidos
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/pedidos')} className="text-blue-600 hover:text-blue-800 mb-4 flex items-center">
        ← Voltar para Pedidos
      </button>
      <h1 className="text-3xl font-bold mb-6">Editar Pedido nº {pedido?.numero}</h1>

      {erro && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{erro}</div>}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Cliente</h2>
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="font-medium">{pedido?.cliente_nome}</p>
          <p className="text-sm text-gray-600">Status atual: {STATUS_LABEL[pedido?.status] || pedido?.status}</p>
        </div>
      </div>

      {/* Desconto Geral e Condições de Pagamento */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Configurações do Pedido</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Desconto Geral (%)</label>
            <input
              type="number" min="0" max={descontoMaximo} step="1"
              value={descontoGeral}
              onChange={(e) => setDescontoGeral(Number(e.target.value))}
              placeholder="0"
              className={`w-full px-3 py-2 border rounded-md ${descontoGeral > descontoMaximo ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            />
            {descontoGeral > descontoMaximo && <p className="text-xs text-red-600 mt-1">Máx: {descontoMaximo}%</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Condição de Pagamento</label>
            <select
              value={condicaoPagamento}
              onChange={(e) => setCondicaoPagamento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Selecione...</option>
              <option value="1/30/45/60/75">1/30/45/60/75</option>
              <option value="15">15</option>
              <option value="15/30/45">15/30/45</option>
              <option value="15/30/45/60">15/30/45/60</option>
              <option value="30">30</option>
              <option value="30/45">30/45</option>
              <option value="30/45/60">30/45/60</option>
              <option value="30/45/60/75/90">30/45/60/75/90</option>
              <option value="30/60">30/60</option>
              <option value="30/60/90">30/60/90</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Pix">Pix</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Observação</label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Digite uma observação sobre o pagamento (opcional)"
            maxLength="500"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            rows="2"
          />
          <p className="text-xs text-gray-500 mt-1">{observacao.length}/500</p>
        </div>
      </div>

      <CarrinhoItens
        carrinho={carrinho}
        setCarrinho={setCarrinho}
        descontoMaximo={descontoMaximo}
        descontoGeral={descontoGeral}
        acoes={
          <>
            <button
              onClick={() => salvarEdicao('pendente')} disabled={enviando}
              className="bg-gray-600 text-white px-5 py-3 rounded hover:bg-gray-700 disabled:bg-gray-400"
            >
              {enviando ? 'Salvando...' : 'Salvar como Pendente'}
            </button>
            <button
              onClick={() => salvarEdicao('concluido')} disabled={enviando}
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {enviando ? 'Salvando...' : 'Finalizar Pedido'}
            </button>
          </>
        }
      />
    </div>
  )
}
