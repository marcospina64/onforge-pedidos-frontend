import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function ImportarClientes() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')

  const baixarTemplate = async () => {
    const res = await api.get('/clientes/template', { responseType: 'blob' })
    const url = window.URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_clientes.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (!file) {
      setErro('Selecione um arquivo')
      return
    }
    setErro('')
    setResultado(null)
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/clientes/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResultado(res.data)
      setFile(null)
      document.querySelector('input[type="file"]').value = ''
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao importar arquivo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/clientes')} className="text-blue-600 hover:text-blue-800 mb-4 flex items-center">
        ← Voltar para Clientes
      </button>
      <h1 className="text-3xl font-bold mb-6">Importar Clientes</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">1. Baixe o template</h2>
        <p className="text-sm text-gray-600 mb-4">
          Preencha os dados dos clientes seguindo exatamente os nomes das colunas do modelo (a ordem das colunas não importa).
          Também é possível enviar diretamente a planilha de contatos exportada do Olist, sem precisar migrar os dados para o template.
        </p>
        <button onClick={baixarTemplate} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          Baixar Template
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">2. Envie a planilha preenchida</h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files[0])}
            className="hidden" id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer block">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-gray-600 mb-2">Clique para selecionar o arquivo</p>
            <p className="text-sm text-gray-500">Formato: XLSX</p>
          </label>
        </div>

        {file && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
            Arquivo selecionado: {file.name}
          </div>
        )}

        {erro && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{erro}</div>
        )}

        {resultado && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
            <p>✓ {resultado.importados} cliente(s) importado(s) com sucesso!</p>
            {resultado.erros?.length > 0 && (
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {resultado.erros.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}

        <button
          onClick={handleImport} disabled={!file || loading}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Importando...' : 'Importar'}
        </button>
      </div>
    </div>
  )
}
