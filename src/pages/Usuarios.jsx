import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Table from '../components/Table'
import Modal from '../components/Modal'

const VAZIO = {
  nome: '', email: '', senha: '', tipo: 'vendedor', ativo: true,
  celular: '', cidade: '', uf: '', observacoes: '', vendedor_master_id: '',
}

const TIPO_LABEL = { admin: 'Administrador', vendedor: 'Vendedor', produtor: 'Produtor' }

export default function Usuarios() {
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(VAZIO)
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    try {
      setLoading(true)
      const res = await api.get('/usuarios')
      setUsuarios(res.data)
    } finally {
      setLoading(false)
    }
  }

  const abrirNovo = () => {
    setEditando(null)
    setForm(VAZIO)
    setErro('')
    setModalOpen(true)
  }

  const abrirEdicao = (usuario) => {
    setEditando(usuario)
    setForm({
      nome: usuario.nome, email: usuario.email, senha: '', tipo: usuario.tipo, ativo: usuario.ativo,
      celular: usuario.celular || '', cidade: usuario.cidade || '', uf: usuario.uf || '',
      observacoes: usuario.observacoes || '', vendedor_master_id: usuario.vendedor_master_id || '',
    })
    setErro('')
    setModalOpen(true)
  }

  const salvar = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      if (editando) {
        await api.put(`/usuarios/${editando.id}`, {
          nome: form.nome, email: form.email, tipo: form.tipo, ativo: form.ativo,
          celular: form.celular, cidade: form.cidade, uf: form.uf, observacoes: form.observacoes,
          vendedor_master_id: form.vendedor_master_id || null,
          ...(form.senha ? { senha: form.senha } : {}),
        })
      } else {
        await api.post('/usuarios', { ...form, vendedor_master_id: form.vendedor_master_id || null })
      }
      setModalOpen(false)
      carregar()
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao salvar usuário')
    }
  }

  // Um vendedor que já é Subordinado de outro Master não pode virar Master de mais ninguém
  // (hierarquia de 1 nível só) — não aparece como opção. Ser Master de vários já é permitido.
  const candidatosMaster = usuarios.filter((u) => u.tipo === 'vendedor' && u.ativo && u.id !== editando?.id && !u.vendedor_master_id)

  const columns = [
    { key: 'nome', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'celular', label: 'Celular' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'uf', label: 'UF' },
    { key: 'tipo', label: 'Tipo', render: (v) => TIPO_LABEL[v] || v },
    {
      key: 'vendedor_master_id', label: 'Equipe',
      render: (v) => (v ? `Subordinado de ${usuarios.find((u) => u.id === v)?.nome || '?'}` : '-'),
    },
    { key: 'ativo', label: 'Ativo', render: (v) => (v ? 'Sim' : 'Não') },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/dashboard')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar ao Menu
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-display">Usuários</h1>
        <button onClick={abrirNovo} className="bg-onforge-black text-white px-4 py-2 rounded hover:bg-black/80">
          + Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <Table columns={columns} data={usuarios} loading={loading} onEdit={abrirEdicao} />
      </div>

      <Modal isOpen={modalOpen} title={editando ? 'Editar Usuário' : 'Novo Usuário'} onClose={() => setModalOpen(false)}>
        <form onSubmit={salvar} className="space-y-4">
          {erro && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{erro}</div>}

          <div>
            <label className="block text-sm font-medium text-onforge-black/80 mb-1">Nome</label>
            <input
              type="text" required value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-onforge-black/80 mb-1">Email</label>
            <input
              type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-onforge-black/80 mb-1">
              {editando ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
            </label>
            <input
              type="password" required={!editando} value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-onforge-black/80 mb-1">Tipo</label>
            <select
              value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md"
            >
              <option value="vendedor">Vendedor</option>
              <option value="admin">Administrador</option>
              <option value="produtor">Produtor</option>
            </select>
          </div>

          {form.tipo === 'vendedor' && (
            <div>
              <label className="block text-sm font-medium text-onforge-black/80 mb-1">Vendedor Master (Equipe de Venda)</label>
              <select
                value={form.vendedor_master_id} onChange={(e) => setForm({ ...form, vendedor_master_id: e.target.value })}
                className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md"
              >
                <option value="">Nenhum (não faz parte de uma equipe)</option>
                {candidatosMaster.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
              <p className="text-xs text-onforge-black/50 mt-1">
                Selecione o Master responsável por esse vendedor, caso ele faça parte de uma Equipe de Venda.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-onforge-black/80 mb-1">Celular</label>
            <input
              type="text" value={form.celular}
              onChange={(e) => setForm({ ...form, celular: e.target.value })}
              className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-onforge-black/80 mb-1">Cidade</label>
              <input
                type="text" value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-onforge-black/80 mb-1">UF</label>
              <input
                type="text" maxLength={2} value={form.uf}
                onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-onforge-black/80 mb-1">Observações</label>
            <textarea
              rows={3} value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md"
            />
          </div>

          {editando && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
              <span className="text-sm text-onforge-black/80">Ativo</span>
            </label>
          )}

          <button type="submit" className="w-full bg-onforge-black text-white py-2 rounded-md hover:bg-black/80">
            Salvar
          </button>
        </form>
      </Modal>
    </div>
  )
}
