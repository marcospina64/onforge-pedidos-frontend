import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatMoney, formatDate } from '../utils/format'

// Configurações > Desconto e Promoções
//  - Aba "Desconto máximo": limite de desconto por item do vendedor (movido da tela de Configurações).
//  - Aba "Campanhas Promocionais": cadastro de campanhas com tabela de produtos promocionais.
// As regras de integridade (datas, sobreposição, trava após início) são garantidas
// pelo backend/banco; aqui a tela antecipa os erros mais comuns.

const ABAS = [
  { id: 'desconto', label: 'Desconto máximo' },
  { id: 'campanhas', label: 'Campanhas Promocionais' },
]

const STATUS = {
  agendada: { label: 'Agendada', classe: 'bg-blue-50 text-blue-800 border-blue-200' },
  vigente: { label: 'Vigente', classe: 'bg-green-50 text-green-800 border-green-200' },
  encerrada: { label: 'Encerrada', classe: 'bg-onforge-cream text-onforge-black/60 border-onforge-gray/40' },
  cancelada: { label: 'Cancelada', classe: 'bg-red-50 text-red-700 border-red-200' },
}

function hojeISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

const LINHA_VAZIA = () => ({ chave: Math.random().toString(36).slice(2), codigo: '', nome_produto: '', preco_tabela: null, perc_desconto: '', qtd_minima: '1', erro: '' })

export default function DescontosPromocoes() {
  const navigate = useNavigate()
  const [aba, setAba] = useState('desconto')
  const [descontoMaximo, setDescontoMaximo] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.get('/configuracoes')
      .then((res) => setDescontoMaximo(res.data.desconto_maximo_percentual ?? '0'))
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) return <div className="p-6">Carregando...</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/configuracoes')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar para Configurações
      </button>
      <h1 className="text-3xl font-bold mb-6 font-display">Desconto e Promoções</h1>

      <div className="flex gap-1 border-b border-onforge-gray/40 mb-6" role="tablist">
        {ABAS.map((a) => (
          <button
            key={a.id} role="tab" aria-selected={aba === a.id}
            onClick={() => setAba(a.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md -mb-px border ${aba === a.id ? 'bg-white border-onforge-gray/40 border-b-white' : 'border-transparent text-onforge-black/60 hover:text-onforge-black'}`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'desconto'
        ? <AbaDescontoMaximo valorInicial={descontoMaximo} onSalvo={setDescontoMaximo} />
        : <AbaCampanhas descontoMaximo={Number(descontoMaximo) || 0} />}
    </div>
  )
}

function AbaDescontoMaximo({ valorInicial, onSalvo }) {
  const [valor, setValor] = useState(valorInicial)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  const salvar = async (e) => {
    e.preventDefault()
    setErro('')
    setMensagem('')
    setSalvando(true)
    try {
      const res = await api.patch('/configuracoes', { desconto_maximo_percentual: valor })
      onSalvo(res.data.desconto_maximo_percentual)
      setMensagem('Desconto máximo salvo com sucesso!')
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-lg">
      <form onSubmit={salvar} className="space-y-4">
        {erro && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{erro}</div>}
        {mensagem && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{mensagem}</div>}
        <div>
          <label className="block text-sm font-medium text-onforge-black/80 mb-1">
            Desconto máximo que o vendedor pode aplicar por item (%)
          </label>
          <input
            type="number" step="0.01" min="0" max="100" required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md"
          />
          <p className="text-xs text-onforge-black/50 mt-1">
            Vale para produtos fora de campanha e para itens abaixo da quantidade mínima da campanha.
            Itens em promoção usam o desconto da campanha, sem acumular com este.
          </p>
        </div>
        <button type="submit" disabled={salvando} className="w-full bg-onforge-black text-white py-2 rounded-md hover:bg-black/80 disabled:bg-onforge-gray">
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}

function AbaCampanhas({ descontoMaximo }) {
  const [campanhas, setCampanhas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [editando, setEditando] = useState(null) // null = lista; {} = nova; {id,...} = edição

  const carregar = async () => {
    setCarregando(true)
    try {
      const res = await api.get('/campanhas')
      setCampanhas(res.data)
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao carregar campanhas')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const abrir = async (id) => {
    setErro('')
    setMensagem('')
    if (!id) {
      setEditando({})
      return
    }
    try {
      const res = await api.get(`/campanhas/${id}`)
      setEditando(res.data)
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao abrir campanha')
    }
  }

  const cancelarCampanha = async (c) => {
    if (!confirm(`Cancelar a campanha "${c.nome}"? Os produtos deixam de ter desconto promocional imediatamente. Esta ação não pode ser desfeita.`)) return
    try {
      await api.patch(`/campanhas/${c.id}/cancelar`)
      setMensagem(`Campanha "${c.nome}" cancelada.`)
      carregar()
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao cancelar')
    }
  }

  const excluirCampanha = async (c) => {
    if (!confirm(`Excluir a campanha "${c.nome}"?`)) return
    try {
      await api.delete(`/campanhas/${c.id}`)
      setMensagem(`Campanha "${c.nome}" excluída.`)
      carregar()
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao excluir')
    }
  }

  if (editando) {
    return (
      <FormCampanha
        campanha={editando}
        descontoMaximo={descontoMaximo}
        onVoltar={() => setEditando(null)}
        onSalvo={(c, nova) => {
          setEditando(null)
          setMensagem(nova ? `Campanha "${c.nome}" criada.` : `Campanha "${c.nome}" atualizada.`)
          carregar()
        }}
      />
    )
  }

  return (
    <div>
      {erro && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{erro}</div>}
      {mensagem && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{mensagem}</div>}

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-onforge-black/60">
          Desconto da campanha é aplicado automaticamente no pedido, a partir da quantidade mínima.
        </p>
        <button onClick={() => abrir(null)} className="bg-onforge-black text-white px-4 py-2 rounded hover:bg-black/80 text-sm whitespace-nowrap">
          + Nova Campanha
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {carregando ? (
          <p className="p-6 text-sm">Carregando...</p>
        ) : campanhas.length === 0 ? (
          <p className="p-6 text-sm text-onforge-black/50">Nenhuma campanha cadastrada.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-onforge-cream">
              <tr>
                <th className="px-3 py-2 text-left">Campanha</th>
                <th className="px-3 py-2 text-left">Vigência</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Produtos</th>
                <th className="px-3 py-2 text-right">Pedidos</th>
                <th className="px-3 py-2 text-right">Desconto concedido</th>
                <th className="px-3 py-2 text-right">Valor líquido</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {campanhas.map((c) => {
                const st = STATUS[c.status_exibicao] || STATUS.encerrada
                const podeCancelar = c.status === 'ativa' && c.status_exibicao !== 'encerrada'
                const podeExcluir = c.status === 'ativa' && !c.travada
                return (
                  <tr key={c.id} className="border-b">
                    <td className="px-3 py-2 font-medium">{c.nome}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(c.data_inicio)} a {formatDate(c.data_fim)}</td>
                    <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded border ${st.classe}`}>{st.label}</span></td>
                    <td className="px-3 py-2 text-right">{c.qtd_produtos}</td>
                    <td className="px-3 py-2 text-right">{c.pedidos}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(c.desconto_concedido)}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(c.valor_liquido)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right space-x-3">
                      <button onClick={() => abrir(c.id)} className="text-onforge-black underline hover:opacity-70">
                        {c.status === 'cancelada' || c.status_exibicao === 'encerrada' ? 'Ver' : 'Editar'}
                      </button>
                      {podeCancelar && <button onClick={() => cancelarCampanha(c)} className="text-red-600 hover:text-red-800">Cancelar</button>}
                      {podeExcluir && <button onClick={() => excluirCampanha(c)} className="text-red-600 hover:text-red-800">Excluir</button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-onforge-black/50 mt-2">Pedidos e valores consideram itens vendidos com desconto promocional, exceto pedidos cancelados.</p>
    </div>
  )
}

function FormCampanha({ campanha, descontoMaximo, onVoltar, onSalvo }) {
  const nova = !campanha.id
  const somenteLeitura = campanha.status === 'cancelada' || campanha.status_exibicao === 'encerrada'
  const travada = !nova && campanha.travada // já começou: só a data final pode mudar
  const hoje = hojeISO()

  const [nome, setNome] = useState(campanha.nome || '')
  const [dataInicio, setDataInicio] = useState(campanha.data_inicio || '')
  const [dataFim, setDataFim] = useState(campanha.data_fim || '')
  const [linhas, setLinhas] = useState(
    campanha.produtos?.length
      ? campanha.produtos.map((p) => ({ ...LINHA_VAZIA(), codigo: p.codigo, nome_produto: p.nome_produto, preco_tabela: p.preco_tabela, perc_desconto: String(p.perc_desconto), qtd_minima: String(p.qtd_minima) }))
      : [LINHA_VAZIA()]
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const bloqueioGeral = somenteLeitura || travada

  const atualizarLinha = (chave, campos) => setLinhas((ls) => ls.map((l) => (l.chave === chave ? { ...l, ...campos } : l)))

  const validarCodigo = async (linha) => {
    const codigo = linha.codigo.trim()
    if (!codigo) {
      atualizarLinha(linha.chave, { nome_produto: '', preco_tabela: null, erro: '' })
      return
    }
    if (linhas.some((l) => l.chave !== linha.chave && l.codigo.trim() === codigo)) {
      atualizarLinha(linha.chave, { nome_produto: '', preco_tabela: null, erro: 'Produto já incluído nesta campanha' })
      return
    }
    try {
      const res = await api.get(`/campanhas/produto/${encodeURIComponent(codigo)}`)
      atualizarLinha(linha.chave, { codigo: res.data.codigo, nome_produto: res.data.nome_produto, preco_tabela: Number(res.data.preco_tabela), erro: '' })
    } catch (err) {
      atualizarLinha(linha.chave, { nome_produto: '', preco_tabela: null, erro: err.response?.data?.error || 'Código não encontrado' })
    }
  }

  const salvar = async (e) => {
    e.preventDefault()
    setErro('')

    const preenchidas = linhas.filter((l) => l.codigo.trim())
    if (!travada) {
      if (!nome.trim()) return setErro('Informe o nome da campanha')
      if (!dataInicio || !dataFim) return setErro('Informe as datas inicial e final')
      if (dataInicio < hoje) return setErro('A data inicial deve ser hoje ou uma data futura')
      if (preenchidas.length === 0) return setErro('Inclua ao menos um produto na campanha')
      const comErro = preenchidas.find((l) => l.erro || !l.nome_produto)
      if (comErro) return setErro(`Corrija o produto ${comErro.codigo}: ${comErro.erro || 'código não validado'}`)
      const percInvalido = preenchidas.find((l) => !(Number(l.perc_desconto) > 0 && Number(l.perc_desconto) <= 100))
      if (percInvalido) return setErro(`Produto ${percInvalido.codigo}: desconto promocional deve ser maior que 0 e no máximo 100%`)
      const qtdInvalida = preenchidas.find((l) => !Number.isInteger(Number(l.qtd_minima)) || Number(l.qtd_minima) < 1)
      if (qtdInvalida) return setErro(`Produto ${qtdInvalida.codigo}: quantidade mínima deve ser um número inteiro ≥ 1`)
    }
    if (dataFim < dataInicio) return setErro('A data final deve ser igual ou posterior à data inicial')
    if (travada && dataFim < hoje) return setErro('A data final não pode ser anterior a hoje')

    const payload = {
      nome: nome.trim(),
      data_inicio: dataInicio,
      data_fim: dataFim,
      produtos: preenchidas.map((l) => ({ codigo: l.codigo.trim(), perc_desconto: Number(l.perc_desconto), qtd_minima: Number(l.qtd_minima) })),
    }

    setSalvando(true)
    try {
      const res = nova ? await api.post('/campanhas', payload) : await api.put(`/campanhas/${campanha.id}`, payload)
      onSalvo(res.data, nova)
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao salvar campanha')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={salvar} className="bg-white rounded-lg shadow p-6 space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-display">{nova ? 'Nova Campanha Promocional' : campanha.nome}</h2>
        <button type="button" onClick={onVoltar} className="text-sm text-onforge-black/70 hover:text-onforge-black">← Voltar à lista</button>
      </div>

      {erro && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{erro}</div>}
      {somenteLeitura && (
        <div className="p-3 bg-onforge-cream border border-onforge-gray/40 rounded text-sm">
          Campanha {campanha.status === 'cancelada' ? 'cancelada' : 'encerrada'}: somente consulta.
        </div>
      )}
      {travada && !somenteLeitura && (
        <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded text-sm">
          Campanha já iniciada: produtos, descontos e quantidades estão travados. Você pode prorrogar ou encerrar antes alterando a
          data final (encerrar hoje = data final {formatDate(hoje)}), ou cancelar a campanha na lista.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-onforge-black/80 mb-1">Nome da campanha *</label>
          <input
            type="text" required maxLength={120} disabled={bloqueioGeral}
            value={nome} onChange={(e) => setNome(e.target.value)}
            className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md disabled:bg-onforge-cream/50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-onforge-black/80 mb-1">Data inicial *</label>
          <input
            type="date" required min={bloqueioGeral ? undefined : hoje} disabled={bloqueioGeral}
            value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
            className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md disabled:bg-onforge-cream/50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-onforge-black/80 mb-1">Data final *</label>
          <input
            type="date" required disabled={somenteLeitura}
            min={travada ? hoje : (dataInicio || hoje)}
            value={dataFim} onChange={(e) => setDataFim(e.target.value)}
            className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md disabled:bg-onforge-cream/50"
          />
          <p className="text-[11px] text-onforge-black/50 mt-1">Vigência inclusiva: vale até o fim do dia final. Pode ser igual à inicial (campanha de 1 dia).</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Tabela de Produtos Promocionais</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-onforge-cream">
              <tr>
                <th className="px-2 py-2 text-left w-32">Cód. Produto *</th>
                <th className="px-2 py-2 text-left">Nome do Produto</th>
                <th className="px-2 py-2 text-left w-36">Desconto Promocional (%) *</th>
                <th className="px-2 py-2 text-left w-28">Qtd Mínima *</th>
                <th className="px-2 py-2 text-right w-32">Preço promo</th>
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => {
                const perc = Number(l.perc_desconto)
                const naoMelhora = perc > 0 && perc <= descontoMaximo
                return (
                  <tr key={l.chave} className="border-b align-top">
                    <td className="px-2 py-2">
                      <input
                        type="text" value={l.codigo} disabled={bloqueioGeral}
                        onChange={(e) => atualizarLinha(l.chave, { codigo: e.target.value, nome_produto: '', preco_tabela: null, erro: '' })}
                        onBlur={() => validarCodigo(l)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); validarCodigo(l) } }}
                        className={`w-full px-2 py-1 border rounded disabled:bg-onforge-cream/50 ${l.erro ? 'border-red-500 bg-red-50' : 'border-onforge-gray/50'}`}
                      />
                      {l.erro && <p className="text-[11px] text-red-600 mt-1">{l.erro}</p>}
                    </td>
                    <td className="px-2 py-2 text-onforge-black/80">{l.nome_produto || <span className="text-onforge-black/30">preenchido ao validar o código</span>}</td>
                    <td className="px-2 py-2">
                      <input
                        type="number" min="0.01" max="100" step="0.01" value={l.perc_desconto} disabled={bloqueioGeral}
                        onChange={(e) => atualizarLinha(l.chave, { perc_desconto: e.target.value })}
                        className="w-full px-2 py-1 border border-onforge-gray/50 rounded disabled:bg-onforge-cream/50"
                      />
                      {naoMelhora && !bloqueioGeral && (
                        <p className="text-[11px] text-amber-700 mt-1">Igual ou menor que o desconto máximo do vendedor ({descontoMaximo}%). A promoção não melhora o preço.</p>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number" min="1" step="1" value={l.qtd_minima} disabled={bloqueioGeral}
                        onChange={(e) => atualizarLinha(l.chave, { qtd_minima: e.target.value })}
                        className="w-full px-2 py-1 border border-onforge-gray/50 rounded disabled:bg-onforge-cream/50"
                      />
                    </td>
                    <td className="px-2 py-2 text-right whitespace-nowrap">
                      {l.preco_tabela != null && perc > 0 ? (
                        <>
                          <span className="block font-medium">{formatMoney(l.preco_tabela * (1 - perc / 100))}</span>
                          <span className="block text-[11px] text-onforge-black/40 line-through">{formatMoney(l.preco_tabela)}</span>
                        </>
                      ) : '–'}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {!bloqueioGeral && linhas.length > 1 && (
                        <button type="button" onClick={() => setLinhas((ls) => ls.filter((x) => x.chave !== l.chave))} className="text-red-600 hover:text-red-800">✕</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!bloqueioGeral && (
          <button type="button" onClick={() => setLinhas((ls) => [...ls, LINHA_VAZIA()])} className="mt-3 text-sm bg-onforge-gray/30 px-3 py-1.5 rounded hover:bg-onforge-gray/40">
            + Adicionar produto
          </button>
        )}
        <p className="text-xs text-onforge-black/50 mt-2">
          Um produto não pode estar em duas campanhas com vigências sobrepostas. Abaixo da quantidade mínima, o item segue a regra geral
          (desconto máximo de {descontoMaximo}%).
        </p>
      </div>

      {!somenteLeitura && (
        <div className="flex gap-3 justify-end border-t pt-4">
          <button type="button" onClick={onVoltar} className="bg-onforge-gray/30 px-4 py-2 rounded hover:bg-onforge-gray/40">Voltar</button>
          <button type="submit" disabled={salvando} className="bg-onforge-black text-white px-5 py-2 rounded hover:bg-black/80 disabled:bg-onforge-gray">
            {salvando ? 'Salvando...' : travada ? 'Salvar data final' : 'Salvar campanha'}
          </button>
        </div>
      )}
    </form>
  )
}
