import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import Modal from '../components/Modal'

const CLIENTE_VAZIO = { razao_social: '', cnpj: '', cidade: '', estado: '', telefone: '' }

export default function NovoPedido() {
  const navigate = useNavigate()
  const [descontoMaximo, setDescontoMaximo] = useState(0)

  const [buscaCliente, setBuscaCliente] = useState('')
  const [clientesEncontrados, setClientesEncontrados] = useState([])
  const [clienteSelecionado, setClienteSelecionado] = useState(null)
  const [modalClienteOpen, setModalClienteOpen] = useState(false)
  const [novoCliente, setNovoCliente] = useState(CLIENTE_VAZIO)

  const [buscaProduto, setBuscaProduto] = useState('')
  const [produtosEncontrados, setProdutosEncontrados] = useState([])

  const [carrinho, setCarrinho] = useState([])
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

  const buscarProdutos = async (termo) => {
    setBuscaProduto(termo)
    if (termo.length < 1) {
      setProdutosEncontrados([])
      return
    }
    const res = await api.get('/produtos', { params: { busca: termo } })
    setProdutosEncontrados(res.data)
  }

  const adicionarAoCarrinho = (produto) => {
    setCarrinho((atual) => {
      const existente = atual.find((i) => i.produto_id === produto.id)
      if (existente) {
        return atual.map((i) => (i.produto_id === produto.id ? { ...i, qtd: i.qtd + 1 } : i))
      }
      return [
        ...atual,
        {
          produto_id: produto.id,
          codigo: produto.codigo,
          nome_produto: produto.nome_produto,
          foto_base64: produto.foto_base64,
          unidade: produto.unidade,
          preco_tabela: Number(produto.preco_tabela),
          qtd: 1,
          perc_desconto: 0,
        },
      ]
    })
  }

  const atualizarItem = (produtoId, campo, valor) => {
    setCarrinho((atual) =>
      atual.map((i) => (i.produto_id === produtoId ? { ...i, [campo]: valor } : i))
    )
  }

  const removerItem = (produtoId) => {
    setCarrinho((atual) => atual.filter((i) => i.produto_id !== produtoId))
  }

  const calcularItem = (item) => {
    const qtd = Number(item.qtd) || 0
    const percDesconto = Number(item.perc_desconto) || 0
    const bruto = qtd * item.preco_tabela
    const desconto = bruto * (percDesconto / 100)
    return { bruto, desconto, total: bruto - desconto }
  }

  const totalPedido = carrinho.reduce((soma, item) => soma + calcularItem(item).total, 0)

  const finalizarPedido = async () => {
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
    const itemForaLimite = carrinho.find((i) => Number(i.perc_desconto) > descontoMaximo)
    if (itemForaLimite) {
      setErro(`O desconto de ${itemForaLimite.perc_desconto}% em "${itemForaLimite.nome_produto}" excede o limite de ${descontoMaximo}%`)
      return
    }

    try {
      setEnviando(true)
      const res = await api.post('/pedidos', {
        cliente_id: clienteSelecionado.id,
        itens: carrinho.map((i) => ({
          produto_id: i.produto_id,
          qtd: Number(i.qtd),
          perc_desconto: Number(i.perc_desconto) || 0,
        })),
      })
      setSucesso(res.data)
      setCarrinho([])
      setClienteSelecionado(null)
      setBuscaCliente('')
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
          <h1 className="text-2xl font-bold mb-2">Pedido nº {sucesso.numero} criado com sucesso!</h1>
          <p className="text-gray-600 mb-6">Valor total: {formatMoney(sucesso.valor_total)}</p>
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
        <h2 className="text-lg font-semibold mb-3">1. Cliente</h2>
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

      {/* Produtos */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">2. Produtos</h2>
        <input
          type="text" value={buscaProduto} onChange={(e) => buscarProdutos(e.target.value)}
          placeholder="Buscar produto por código ou nome..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
        />
        {produtosEncontrados.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto">
            {produtosEncontrados.map((p) => (
              <div key={p.id} className="border border-gray-200 rounded-md p-2 flex flex-col items-center text-center">
                {p.foto_base64 ? (
                  <img src={p.foto_base64} alt={p.nome_produto} className="w-16 h-16 object-contain mb-1" />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 mb-1" />
                )}
                <p className="text-xs">{p.codigo}</p>
                <p className="text-xs font-medium leading-tight mb-1">{p.nome_produto}</p>
                <p className="text-xs font-bold text-blue-600 mb-1">{formatMoney(p.preco_tabela)}</p>
                <button
                  onClick={() => adicionarAoCarrinho(p)}
                  className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700 w-full"
                >
                  Adicionar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Carrinho */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">3. Itens do Pedido</h2>
        {carrinho.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum produto adicionado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-left">Produto</th>
                  <th className="px-2 py-2 text-left">Qtd</th>
                  <th className="px-2 py-2 text-left">Vr. Unit.</th>
                  <th className="px-2 py-2 text-left">% Desc.</th>
                  <th className="px-2 py-2 text-left">Vr. Total</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {carrinho.map((item) => {
                  const { total } = calcularItem(item)
                  const acimaDoLimite = Number(item.perc_desconto) > descontoMaximo
                  return (
                    <tr key={item.produto_id} className="border-b">
                      <td className="px-2 py-2">{item.codigo} - {item.nome_produto}</td>
                      <td className="px-2 py-2">
                        <input
                          type="number" min="0.001" step="0.001" value={item.qtd}
                          onChange={(e) => atualizarItem(item.produto_id, 'qtd', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-2 py-2">{formatMoney(item.preco_tabela)}</td>
                      <td className="px-2 py-2">
                        <input
                          type="number" min="0" max="100" step="0.01" value={item.perc_desconto}
                          onChange={(e) => atualizarItem(item.produto_id, 'perc_desconto', e.target.value)}
                          className={`w-20 px-2 py-1 border rounded ${acimaDoLimite ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        />
                        {acimaDoLimite && <p className="text-xs text-red-600">Máx: {descontoMaximo}%</p>}
                      </td>
                      <td className="px-2 py-2 font-medium">{formatMoney(total)}</td>
                      <td className="px-2 py-2">
                        <button onClick={() => removerItem(item.produto_id)} className="text-red-600 hover:text-red-800">✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex justify-between items-center border-t pt-4">
          <p className="text-xl font-bold">Total: {formatMoney(totalPedido)}</p>
          <button
            onClick={finalizarPedido} disabled={enviando}
            className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {enviando ? 'Salvando...' : 'Finalizar Pedido'}
          </button>
        </div>
      </div>

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
