import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'

const VAZIO = {
  cnpj: '', razao_social: '', nome_fantasia: '', telefone: '', email: '', inscricao_estadual: '',
  cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  nome_contato: '', cargo_contato: '', telefone_contato: '', email_contato: '', vendedor_id: '',
}

function baixarBlob(blob, nomeArquivo) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  a.click()
  window.URL.revokeObjectURL(url)
}

export default function Clientes() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(VAZIO)
  const [erro, setErro] = useState('')
  const [vendedores, setVendedores] = useState([])

  useEffect(() => {
    carregar()
    if (isAdmin) {
      api.get('/usuarios/vendedores').then((res) => setVendedores(res.data))
    }
  }, [isAdmin])

  const carregar = async (termo = '') => {
    try {
      setLoading(true)
      const res = await api.get('/clientes', { params: termo ? { busca: termo } : {} })
      setClientes(res.data)
    } finally {
      setLoading(false)
    }
  }

  const buscar = (e) => {
    e.preventDefault()
    carregar(busca)
  }

  const abrirNovo = () => {
    setEditando(null)
    setForm(VAZIO)
    setErro('')
    setModalOpen(true)
  }

  const abrirEdicao = (cliente) => {
    setEditando(cliente)
    setForm({ ...VAZIO, ...cliente })
    setErro('')
    setModalOpen(true)
  }

  const salvar = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      if (editando) {
        await api.put(`/clientes/${editando.id}`, form)
      } else {
        await api.post('/clientes', form)
      }
      setModalOpen(false)
      carregar(busca)
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao salvar cliente')
    }
  }

  const excluir = async (id) => {
    await api.delete(`/clientes/${id}`)
    carregar(busca)
  }

  const exportar = async () => {
    const res = await api.get('/clientes/export', { responseType: 'blob' })
    baixarBlob(res.data, 'clientes.xlsx')
  }

  const columns = [
    { key: 'razao_social', label: 'Razão Social' },
    { key: 'cnpj', label: 'CNPJ' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'estado', label: 'UF' },
    { key: 'telefone', label: 'Telefone' },
    ...(isAdmin ? [{ key: 'vendedor_nome', label: 'Vendedor' }] : []),
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button onClick={() => navigate('/dashboard')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar ao Menu
      </button>

      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold font-display">Clientes</h1>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <button onClick={() => navigate('/clientes/importar')} className="bg-onforge-gray text-white px-4 py-2 rounded hover:bg-black/70">
                Importar
              </button>
              <button onClick={exportar} className="bg-onforge-gray text-white px-4 py-2 rounded hover:bg-black/70">
                Exportar
              </button>
            </>
          )}
          <button onClick={abrirNovo} className="bg-onforge-black text-white px-4 py-2 rounded hover:bg-black/80">
            + Novo Cliente
          </button>
        </div>
      </div>

      <form onSubmit={buscar} className="mb-4 flex gap-2">
        <input
          type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por razão social, fantasia ou CNPJ"
          className="flex-1 px-3 py-2 border border-onforge-gray/50 rounded-md"
        />
        <button type="submit" className="bg-onforge-gray/30 px-4 py-2 rounded hover:bg-onforge-gray/40">Buscar</button>
      </form>

      <div className="bg-white rounded-lg shadow p-4">
        <Table
          columns={columns} data={clientes} loading={loading}
          onEdit={abrirEdicao}
          onDelete={isAdmin ? excluir : undefined}
        />
      </div>

      <Modal isOpen={modalOpen} title={editando ? 'Editar Cliente' : 'Novo Cliente'} onClose={() => setModalOpen(false)}>
        <form onSubmit={salvar} className="space-y-3">
          {erro && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{erro}</div>}

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Razão Social" full value={form.razao_social} onChange={(v) => setForm({ ...form, razao_social: v })} required />
            <Campo label="Nome Fantasia" value={form.nome_fantasia} onChange={(v) => setForm({ ...form, nome_fantasia: v })} />
            <Campo label="CNPJ" value={form.cnpj} onChange={(v) => setForm({ ...form, cnpj: v })} />
            <Campo label="Inscrição Estadual" value={form.inscricao_estadual} onChange={(v) => setForm({ ...form, inscricao_estadual: v })} />
            <Campo label="Telefone" value={form.telefone} onChange={(v) => setForm({ ...form, telefone: v })} />
            <Campo label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Campo label="CEP" value={form.cep} onChange={(v) => setForm({ ...form, cep: v })} />
            <Campo label="Endereço" value={form.endereco} onChange={(v) => setForm({ ...form, endereco: v })} />
            <Campo label="Número" value={form.numero} onChange={(v) => setForm({ ...form, numero: v })} />
            <Campo label="Complemento" value={form.complemento} onChange={(v) => setForm({ ...form, complemento: v })} />
            <Campo label="Bairro" value={form.bairro} onChange={(v) => setForm({ ...form, bairro: v })} />
            <Campo label="Cidade" value={form.cidade} onChange={(v) => setForm({ ...form, cidade: v })} />
            <Campo label="Estado (UF)" value={form.estado} onChange={(v) => setForm({ ...form, estado: v })} />
            <Campo label="Nome do Contato" value={form.nome_contato} onChange={(v) => setForm({ ...form, nome_contato: v })} />
            <Campo label="Cargo do Contato" value={form.cargo_contato} onChange={(v) => setForm({ ...form, cargo_contato: v })} />
            <Campo label="Telefone do Contato" value={form.telefone_contato} onChange={(v) => setForm({ ...form, telefone_contato: v })} />
            <Campo label="Email do Contato" value={form.email_contato} onChange={(v) => setForm({ ...form, email_contato: v })} />
            {isAdmin && (
              <div>
                <label className="block text-xs font-medium text-onforge-black/80 mb-1">Vendedor</label>
                <select
                  value={form.vendedor_id || ''}
                  onChange={(e) => setForm({ ...form, vendedor_id: e.target.value })}
                  className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
                >
                  <option value="">Sem vendedor</option>
                  {vendedores.map((v) => (
                    <option key={v.id} value={v.id}>{v.nome}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button type="submit" className="w-full bg-onforge-black text-white py-2 rounded-md hover:bg-black/80 mt-2">
            Salvar
          </button>
        </form>
      </Modal>
    </div>
  )
}

function Campo({ label, value, onChange, required, full }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-onforge-black/80 mb-1">{label}</label>
      <input
        type="text" required={required} value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md text-sm"
      />
    </div>
  )
}
