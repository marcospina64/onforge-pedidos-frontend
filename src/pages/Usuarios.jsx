import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Table from '../components/Table'
import Modal from '../components/Modal'

const VAZIO = { nome: '', email: '', senha: '', tipo: 'vendedor', ativo: true }

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
    setForm({ nome: usuario.nome, email: usuario.email, senha: '', tipo: usuario.tipo, ativo: usuario.ativo })
    setErro('')
    setModalOpen(true)
  }

  const salvar = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      if (editando) {
        await api.put(`/usuarios/${editando.id}`, {
          nome: form.nome, tipo: form.tipo, ativo: form.ativo,
          ...(form.senha ? { senha: form.senha } : {}),
        })
      } else {
        await api.post('/usuarios', form)
      }
      setModalOpen(false)
      carregar()
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao salvar usuário')
    }
  }

  const columns = [
    { key: 'nome', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'tipo', label: 'Tipo', render: (v) => (v === 'admin' ? 'Administrador' : 'Vendedor') },
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
              type="email" required disabled={!!editando} value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-onforge-gray/50 rounded-md disabled:bg-onforge-cream"
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
            </select>
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
