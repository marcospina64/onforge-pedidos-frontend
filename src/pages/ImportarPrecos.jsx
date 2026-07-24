import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function ImportarPrecos() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')

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
      const res = await api.post('/produtos/import', formData, {
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
      <button onClick={() => navigate('/produtos')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar para Produtos
      </button>
      <h1 className="text-3xl font-bold mb-6 font-display">Importar Tabela de Preços</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-onforge-black/60 mb-4">
          Envie a planilha exportada do Olist (.xls) ou do Mercos (.xlsx). O sistema localiza automaticamente
          as colunas de <strong>Código/SKU</strong>, <strong>Produto/Descrição</strong>, <strong>Unidade</strong> e{' '}
          <strong>Preço</strong>, e atualiza os produtos existentes (por código) ou cadastra os novos. Fotos já
          cadastradas são mantidas; para produtos sem foto, o sistema busca automaticamente no Google Drive
          pelo código do SKU.
        </p>

        <div className="border-2 border-dashed border-onforge-gray/50 rounded-lg p-8 text-center">
          <input
            type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files[0])}
            className="hidden" id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer block">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-onforge-black/60 mb-2">Clique para selecionar o arquivo</p>
            <p className="text-sm text-onforge-black/50">Formato: XLSX</p>
          </label>
        </div>

        {file && (
          <div className="mt-4 p-4 bg-onforge-peach/20 border border-onforge-peach rounded text-sm text-onforge-black">
            Arquivo selecionado: {file.name}
          </div>
        )}

        {erro && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{erro}</div>
        )}

        {resultado && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
            <p>✓ {resultado.importados} produto(s) novo(s), {resultado.atualizados} atualizado(s)!</p>
            {resultado.erros?.length > 0 && (
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {resultado.erros.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}

        {resultado?.imagensNaoEncontradas?.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
            <p>
              {resultado.imagensNaoEncontradas.length} produto(s) importado(s) sem imagem
              (não encontrada no Google Drive):
            </p>
            <ul className="mt-2 text-sm list-disc list-inside">
              {resultado.imagensNaoEncontradas.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        <button
          onClick={handleImport} disabled={!file || loading}
          className="w-full mt-6 bg-onforge-black text-white py-3 rounded hover:bg-black/80 disabled:bg-onforge-gray"
        >
          {loading ? 'Importando... (pode demorar alguns segundos)' : 'Importar'}
        </button>
      </div>
    </div>
  )
}
