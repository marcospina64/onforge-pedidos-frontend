import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { formatMoney } from '../utils/format'
import { encontrarItemForaDoLimite } from '../utils/pedidoCalc'
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

    try {
      setEnviando(true)
      const res = await api.put(`/pedidos/${id}`, {
        status,
        itens: carrinho.map((i) => ({
          produto_id: i.produto_id,
          qtd: Number(i.qtd),
          perc_desconto: Number(i.perc_desconto) || 0,
        })),
      })
      setSucesso(res.data)
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
          <p className="text-gray-600 mb-6">Valor total: {formatMoney(sucesso.valor_total)}</p>
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

      <CarrinhoItens
        carrinho={carrinho}
        setCarrinho={setCarrinho}
        descontoMaximo={descontoMaximo}
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
