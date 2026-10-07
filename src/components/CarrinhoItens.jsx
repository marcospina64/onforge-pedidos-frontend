import { useState, useRef } from 'react'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import { fotoProdutoUrl } from '../utils/produtoFoto'
import { calcularItem, calcularTotalPedido } from '../utils/pedidoCalc'
import { aplicarRegraPromocional, promocaoAtingida, textoPromocao } from '../utils/promocao'

// promocoes: mapa produto_id -> promoção vigente (ver utils/promocao.js)
export default function CarrinhoItens({ carrinho, setCarrinho, descontoMaximo, descontoGeral = 0, promocoes = {}, acoes }) {
  const [buscaProduto, setBuscaProduto] = useState('')
  const [produtosEncontrados, setProdutosEncontrados] = useState([])
  const [qtdPorProduto, setQtdPorProduto] = useState({})
  const [erroPorProduto, setErroPorProduto] = useState({})
  const [aviso, setAviso] = useState(null)
  const ultimaBuscaId = useRef(0)

  // Desconto usado quando o item fica na regra geral (sem promoção)
  const descontoPadrao = Math.min(Number(descontoGeral) || 0, descontoMaximo)

  const buscarProdutos = async (termo) => {
    setBuscaProduto(termo)
    if (termo.length < 1) {
      setProdutosEncontrados([])
      return
    }
    const buscaId = ++ultimaBuscaId.current
    const res = await api.get('/produtos', { params: { busca: termo } })
    // Ignora respostas de buscas anteriores que chegaram fora de ordem (evita
    // que uma resposta antiga e mais abrangente sobrescreva a busca mais recente).
    if (buscaId !== ultimaBuscaId.current) return
    setProdutosEncontrados(res.data)
  }

  const adicionarAoCarrinho = (produto) => {
    const valor = qtdPorProduto[produto.id]
    const qtd = Number(valor)
    if (valor === undefined || valor === '' || !Number.isInteger(qtd) || qtd < 1) {
      setErroPorProduto((e) => ({ ...e, [produto.id]: 'Informe a quantidade (inteiro, mínimo 1)' }))
      return
    }
    setErroPorProduto((e) => ({ ...e, [produto.id]: null }))

    const promocao = promocoes[produto.id]
    const existente = carrinho.find((i) => i.produto_id === produto.id)
    const qtdFinal = (existente ? Number(existente.qtd) || 0 : 0) + qtd

    setCarrinho((atual) => {
      const jaNoCarrinho = atual.find((i) => i.produto_id === produto.id)
      if (jaNoCarrinho) {
        return atual.map((i) => (
          i.produto_id === produto.id
            ? aplicarRegraPromocional({ ...i, qtd: (Number(i.qtd) || 0) + qtd }, promocao, descontoPadrao)
            : i
        ))
      }
      return [
        ...atual,
        aplicarRegraPromocional({
          produto_id: produto.id,
          codigo: produto.codigo,
          nome_produto: produto.nome_produto,
          unidade: produto.unidade,
          gtin: produto.gtin,
          preco_tabela: Number(produto.preco_tabela),
          qtd,
          perc_desconto: descontoPadrao,
          origem_desconto: 'vendedor',
        }, promocao, descontoPadrao),
      ]
    })
    setQtdPorProduto((q) => ({ ...q, [produto.id]: '' }))

    if (promocao && !promocaoAtingida(promocao, qtdFinal)) {
      setAviso({
        tipo: 'alerta',
        texto: `${produto.codigo} - ${produto.nome_produto}: a campanha "${promocao.campanha_nome}" dá ${promocao.perc_desconto}% de desconto a partir de ${promocao.qtd_minima} unidades. Com ${qtdFinal} un., o item entrou na regra geral (desconto máximo de ${descontoMaximo}%).`,
      })
    } else if (promocao) {
      setAviso({
        tipo: 'sucesso',
        texto: `${produto.codigo} - ${produto.nome_produto}: desconto promocional de ${promocao.perc_desconto}% aplicado (campanha "${promocao.campanha_nome}").`,
      })
    } else {
      setAviso(null)
    }
  }

  const atualizarQtd = (produtoId, valor) => {
    setCarrinho((atual) =>
      atual.map((i) => (
        i.produto_id === produtoId
          ? aplicarRegraPromocional({ ...i, qtd: valor, aviso: null }, promocoes[produtoId], descontoPadrao)
          : i
      ))
    )
  }

  const atualizarDesconto = (produtoId, valor) => {
    setCarrinho((atual) =>
      atual.map((i) => (i.produto_id === produtoId && i.origem_desconto !== 'promocional' ? { ...i, perc_desconto: valor } : i))
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
        {aviso && (
          <div className={`mb-3 p-3 rounded text-sm border flex justify-between gap-3 ${aviso.tipo === 'alerta' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-green-50 border-green-200 text-green-800'}`}>
            <span>{aviso.texto}</span>
            <button type="button" onClick={() => setAviso(null)} className="opacity-60 hover:opacity-100">✕</button>
          </div>
        )}
        {produtosEncontrados.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
            {produtosEncontrados.map((p) => {
              const promocao = promocoes[p.id]
              return (
                <div
                  key={p.id}
                  className={`relative border rounded-md p-2 flex flex-col items-center text-center ${promocao ? 'border-onforge-peach bg-onforge-peach/10' : 'border-onforge-gray/30'}`}
                >
                  {promocao && (
                    <span className="absolute top-1 right-1 bg-onforge-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      PROMO -{promocao.perc_desconto}%
                    </span>
                  )}
                  {p.tem_foto ? (
                    <img src={fotoProdutoUrl(p.id)} alt={p.nome_produto} loading="lazy" className="w-16 h-16 object-contain mb-1" />
                  ) : (
                    <div className="w-16 h-16 bg-onforge-cream mb-1" />
                  )}
                  <p className="text-xs">{p.codigo}</p>
                  <p className="text-xs font-medium leading-tight mb-1">{p.nome_produto}</p>
                  <p className="text-xs font-bold text-onforge-black mb-1">{formatMoney(p.preco_tabela)}</p>
                  {p.gtin && <p className="text-[10px] text-onforge-black/40 mb-1">{p.gtin}</p>}
                  {promocao && (
                    <p className="text-[10px] text-onforge-black/70 mb-1 leading-tight">
                      {promocao.campanha_nome}: {textoPromocao(promocao)}
                    </p>
                  )}
                  <div className="flex gap-1 w-full mt-auto">
                    <input
                      type="number" min="1" step="1" inputMode="numeric"
                      aria-label={`Quantidade de ${p.nome_produto}`}
                      placeholder={promocao ? `Mín. ${promocao.qtd_minima}` : 'Qtd'}
                      value={qtdPorProduto[p.id] ?? ''}
                      onChange={(e) => setQtdPorProduto((q) => ({ ...q, [p.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') adicionarAoCarrinho(p) }}
                      className={`w-16 px-1 py-1 text-xs border rounded ${erroPorProduto[p.id] ? 'border-red-500 bg-red-50' : 'border-onforge-gray/50'}`}
                    />
                    <button
                      onClick={() => adicionarAoCarrinho(p)}
                      className="flex-1 bg-onforge-black text-white text-xs px-2 py-1 rounded hover:bg-black/80"
                    >
                      Adicionar
                    </button>
                  </div>
                  {erroPorProduto[p.id] && <p className="text-[10px] text-red-600 mt-1">{erroPorProduto[p.id]}</p>}
                </div>
              )
            })}
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
                  const promocional = item.origem_desconto === 'promocional'
                  const promocao = promocoes[item.produto_id]
                  const faltaParaPromo = promocao && !promocional
                  const acimaDoLimite = !promocional && Number(item.perc_desconto) > descontoMaximo
                  return (
                    <tr key={item.produto_id} className="border-b align-top">
                      <td className="px-2 py-2">
                        {item.codigo} - {item.nome_produto}
                        {item.gtin && <span className="block text-[10px] text-onforge-black/40">GTIN: {item.gtin}</span>}
                        {promocional && (
                          <span className="ml-2 inline-block bg-onforge-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded align-middle">
                            PROMO · {item.campanha_nome}
                          </span>
                        )}
                        {faltaParaPromo && (
                          <span className="block mt-1 text-xs text-amber-700">
                            Quantidade mínima para o desconto promocional: {promocao.qtd_minima} un. ({promocao.perc_desconto}% na campanha "{promocao.campanha_nome}")
                          </span>
                        )}
                        {item.aviso && <span className="block mt-1 text-xs text-amber-700">{item.aviso}</span>}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number" min="0.001" step="0.001" value={item.qtd}
                          onChange={(e) => atualizarQtd(item.produto_id, e.target.value)}
                          className={`w-20 px-2 py-1 border rounded ${faltaParaPromo ? 'border-amber-400' : 'border-onforge-gray/50'}`}
                        />
                      </td>
                      <td className="px-2 py-2">{formatMoney(item.preco_tabela)}</td>
                      <td className="px-2 py-2">
                        <input
                          type="number" min="0" max="100" step="0.01" value={item.perc_desconto}
                          disabled={promocional}
                          title={promocional ? 'Desconto promocional fixo da campanha' : undefined}
                          onChange={(e) => atualizarDesconto(item.produto_id, e.target.value)}
                          className={`w-20 px-2 py-1 border rounded ${promocional ? 'bg-onforge-cream border-onforge-peach font-semibold' : acimaDoLimite ? 'border-red-500 bg-red-50' : 'border-onforge-gray/50'}`}
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
