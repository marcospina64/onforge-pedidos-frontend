import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import { encontrarItemForaDoLimite, calcularDescontoMedio } from '../utils/pedidoCalc'
import Modal from '../components/Modal'
import CarrinhoItens from '../components/CarrinhoItens'

const CLIENTE_VAZIO = { razao_social: '', cnpj: '', cidade: '', estado: '', telefone: '' }

const STATUS_LABEL = { pendente: 'Pendente', concluido: 'Concluído' }

export default function NovoPedido() {
  const navigate = useNavigate()
  const [descontoMaximo, setDescontoMaximo] = useState(0)

  const [buscaCliente, setBuscaCliente] = useState('')
  const [clientesEncontrados, setClientesEncontrados] = useState([])
  const [clienteSelecionado, setClienteSelecionado] = useState(null)
  const [modalClienteOpen, setModalClienteOpen] = useState(false)
  const [novoCliente, setNovoCliente] = useState(CLIENTE_VAZIO)

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
  }, [])

  const buscarClientes = async (termo) => {
    setBuscaCliente(termo)
    if (termo.length < 2) {
      setClientesEncontrados([])
      return
    }
    const res = await api.get('/clientes', { params: { busca: termo } })
    setClientesEncontrados(res.data)
  }

  const criarCliente = async (e) => {
    e.preventDefault()
    const res = await api.post('/clientes', novoCliente)
    setClienteSelecionado(res.data)
    setModalClienteOpen(false)
    setNovoCliente(CLIENTE_VAZIO)
    setBuscaCliente('')
    setClientesEncontrados([])
  }

  const salvarPedido = async (status) => {
    setErro('')
    setSucesso(null)

    if (!clienteSelecionado) {
      setErro('Selecione um cliente')
      return
    }
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
      const res = await api.post('/pedidos', {
        cliente_id: clienteSelecionado.id,
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
      setCarrinho([])
      setClienteSelecionado(null)
      setBuscaCliente('')
      setDescontoGeral(0)
      setCondicaoPagamento('')
      setObservacao('')
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao criar pedido')
    } finally {
      setEnviando(false)
    }
  }

  if (sucesso) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-2">
            Pedido nº {sucesso.numero} salvo como "{STATUS_LABEL[sucesso.status] || sucesso.status}"!
          </h1>
          <p className="text-gray-600 mb-2">Valor total: {formatMoney(sucesso.valor_total)}</p>
          <p className="text-gray-600 mb-6">Desconto Médio: {sucesso.desconto_medio?.toFixed(2) || '0.00'}%</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setSucesso(null)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Novo Pedido
            </button>
            <button onClick={() => navigate('/pedidos')} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
              Ver Pedidos
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:text-blue-800 mb-4 flex items-center">
        ← Voltar ao Menu
      </button>
      <h1 className="text-3xl font-bold mb-6">Novo Pedido de Venda</h1>

      {erro && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{erro}</div>}

      {/* Cliente */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Cliente</h2>
        {clienteSelecionado ? (
          <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded p-3">
            <div>
              <p className="font-medium">{clienteSelecionado.razao_social}</p>
              <p className="text-sm text-gray-600">{clienteSelecionado.cnpj} · {clienteSelecionado.cidade}/{clienteSelecionado.estado}</p>
            </div>
            <button onClick={() => setClienteSelecionado(null)} className="text-sm text-red-600 hover:text-red-800">Trocar</button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2 mb-2">
              <input
                type="text" value={buscaCliente} onChange={(e) => buscarClientes(e.target.value)}
                placeholder="Digite para buscar cliente..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                type="button" onClick={() => setModalClienteOpen(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 whitespace-nowrap"
              >
                + Novo Cliente
              </button>
            </div>
            {clientesEncontrados.length > 0 && (
              <div className="border border-gray-200 rounded-md divide-y max-h-48 overflow-y-auto">
                {clientesEncontrados.map((c) => (
                  <div
                    key={c.id} onClick={() => { setClienteSelecionado(c); setClientesEncontrados([]) }}
                    className="p-2 hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <p className="font-medium">{c.razao_social}</p>
                    <p className="text-gray-500">{c.cnpj} · {c.cidade}/{c.estado}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desconto Geral e Condições de Pagamento */}
      {clienteSelecionado && (
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
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
      )}

      <CarrinhoItens
        carrinho={carrinho}
        setCarrinho={setCarrinho}
        descontoMaximo={descontoMaximo}
        descontoGeral={descontoGeral}
        acoes={
          <>
            <button
              onClick={() => salvarPedido('pendente')} disabled={enviando}
              className="bg-gray-600 text-white px-5 py-3 rounded hover:bg-gray-700 disabled:bg-gray-400"
            >
              {enviando ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => salvarPedido('concluido')} disabled={enviando}
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {enviando ? 'Salvando...' : 'Finalizar Pedido'}
            </button>
          </>
        }
      />

      <Modal isOpen={modalClienteOpen} title="Novo Cliente" onClose={() => setModalClienteOpen(false)}>
        <form onSubmit={criarCliente} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Razão Social</label>
            <input
              type="text" required value={novoCliente.razao_social}
              onChange={(e) => setNovoCliente({ ...novoCliente, razao_social: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">CNPJ</label>
            <input
              type="text" value={novoCliente.cnpj}
              onChange={(e) => setNovoCliente({ ...novoCliente, cnpj: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cidade</label>
              <input
                type="text" value={novoCliente.cidade}
                onChange={(e) => setNovoCliente({ ...novoCliente, cidade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estado (UF)</label>
              <input
                type="text" value={novoCliente.estado}
                onChange={(e) => setNovoCliente({ ...novoCliente, estado: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="text" value={novoCliente.telefone}
              onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <p className="text-xs text-gray-500">
            Você pode completar o cadastro (endereço, contato, etc.) depois em Clientes.
          </p>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
            Criar e Selecionar
          </button>
        </form>
      </Modal>
    </div>
  )
}
