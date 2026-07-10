import { useState } from 'react'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import { calcularItem, calcularTotalPedido } from '../utils/pedidoCalc'

export default function CarrinhoItens({ carrinho, setCarrinho, descontoMaximo, descontoGeral = 0, acoes }) {
  const [buscaProduto, setBuscaProduto] = useState('')
  const [produtosEncontrados, setProdutosEncontrados] = useState([])

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
          perc_desconto: descontoGeral > 0 ? descontoGeral : 0,
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

  const totalPedido = calcularTotalPedido(carrinho)

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Produtos</h2>
        <input
          type="text" value={buscaProduto} onChange={(e) => buscarProdutos(e.target.value)}
          placeholder="Buscar produto por código ou nome..."
          className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md mb-3"
        />
        {produtosEncontrados.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto">
            {produtosEncontrados.map((p) => (
              <div key={p.id} className="border border-onforge-gray/30 rounded-md p-2 flex flex-col items-center text-center">
                {p.foto_base64 ? (
                  <img src={p.foto_base64} alt={p.nome_produto} className="w-16 h-16 object-contain mb-1" />
                ) : (
                  <div className="w-16 h-16 bg-onforge-cream mb-1" />
                )}
                <p className="text-xs">{p.codigo}</p>
                <p className="text-xs font-medium leading-tight mb-1">{p.nome_produto}</p>
                <p className="text-xs font-bold text-onforge-black mb-1">{formatMoney(p.preco_tabela)}</p>
                <button
                  onClick={() => adicionarAoCarrinho(p)}
                  className="bg-onforge-black text-white text-xs px-2 py-1 rounded hover:bg-black/80 w-full"
                >
                  Adicionar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Itens do Pedido</h2>
        {carrinho.length === 0 ? (
          <p className="text-onforge-black/50 text-sm">Nenhum produto adicionado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-onforge-cream">
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
                          className="w-20 px-2 py-1 border border-onforge-gray/50 rounded"
                        />
                      </td>
                      <td className="px-2 py-2">{formatMoney(item.preco_tabela)}</td>
                      <td className="px-2 py-2">
                        <input
                          type="number" min="0" max="100" step="0.01" value={item.perc_desconto}
                          onChange={(e) => atualizarItem(item.produto_id, 'perc_desconto', e.target.value)}
                          className={`w-20 px-2 py-1 border rounded ${acimaDoLimite ? 'border-red-500 bg-red-50' : 'border-onforge-gray/50'}`}
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

        <div className="mt-4 flex flex-wrap justify-between items-center gap-3 border-t pt-4">
          <p className="text-xl font-bold">Total: {formatMoney(totalPedido)}</p>
          <div className="flex gap-3">{acoes}</div>
        </div>
      </div>
    </>
  )
}
