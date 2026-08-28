import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const hojeISO = new Date().toISOString().slice(0, 10)

// Salva o blob no local escolhido pelo usuário. No Chrome/Edge de computador abre o diálogo
// nativo "Salvar como" (o usuário escolhe a pasta de verdade); em navegadores sem suporte à
// File System Access API (Firefox, Safari, celular) cai no download padrão do navegador.
async function baixarBlobComEscolhaPasta(blob, nomeArquivoSugerido) {
  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: nomeArquivoSugerido,
        types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (err) {
      if (err.name === 'AbortError') throw err // usuário cancelou o diálogo: não faz fallback
      // qualquer outro erro ao usar a API nativa: segue para o fallback abaixo
    }
  }
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivoSugerido
  a.click()
  window.URL.revokeObjectURL(url)
}

export default function ImportarPrecos() {
  const navigate = useNavigate()
  const [aba, setAba] = useState('importar')

  // --- Importar Preços (planilha) ---
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

  // --- Gerar Tabela Preços (PDF) ---
  const [nomeTabela, setNomeTabela] = useState('')
  const [percentualDesconto, setPercentualDesconto] = useState('')
  const [validade, setValidade] = useState('')
  const [gerando, setGerando] = useState(false)
  const [erroGerar, setErroGerar] = useState('')
  const [avisoGerar, setAvisoGerar] = useState('')

  const handleGerarTabela = async () => {
    setErroGerar('')
    setAvisoGerar('')

    if (!nomeTabela.trim()) {
      setErroGerar('Informe o nome da tabela')
      return
    }
    const percentual = Number(percentualDesconto)
    if (percentualDesconto === '' || Number.isNaN(percentual) || percentual < 0 || percentual > 20) {
      setErroGerar('O % de desconto deve estar entre 0 e 20')
      return
    }

    try {
      setGerando(true)
      const res = await api.post(
        '/produtos/gerar-tabela-precos',
        { nomeTabela: nomeTabela.trim(), percentualDesconto: percentual, validade: validade || null },
        { responseType: 'blob' }
      )
      const disposition = res.headers['content-disposition'] || ''
      const match = disposition.match(/filename="?([^";]+)"?/)
      const nomeArquivo = match ? match[1] : `Tab Pr OnForge ${nomeTabela.trim()}.pdf`
      await baixarBlobComEscolhaPasta(res.data, nomeArquivo)
      setAvisoGerar('Tabela de preços gerada com sucesso!')
    } catch (err) {
      if (err?.name === 'AbortError') return // usuário cancelou o diálogo de salvar: não é erro
      if (err.response?.data instanceof Blob) {
        const texto = await err.response.data.text()
        try {
          setErroGerar(JSON.parse(texto).error || 'Erro ao gerar tabela de preços')
        } catch {
          setErroGerar('Erro ao gerar tabela de preços')
        }
      } else {
        setErroGerar(err.response?.data?.error || 'Erro ao gerar tabela de preços')
      }
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/produtos')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar para Produtos
      </button>
      <h1 className="text-3xl font-bold mb-6 font-display">
        {aba === 'importar' ? 'Importar Tabela de Preços' : 'Gerar Tabela de Preços'}
      </h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setAba('importar')}
          className={`px-4 py-2 rounded-t font-medium ${aba === 'importar' ? 'bg-white text-onforge-black shadow' : 'bg-onforge-cream/40 text-onforge-black/60'}`}
        >
          Importar Preços
        </button>
        <button
          onClick={() => setAba('gerar')}
          className={`px-4 py-2 rounded-t font-medium ${aba === 'gerar' ? 'bg-white text-onforge-black shadow' : 'bg-onforge-cream/40 text-onforge-black/60'}`}
        >
          Gerar Tabela Preços
        </button>
      </div>

      {aba === 'importar' && (
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

          {resultado?.avisoDrive && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded">
              <p>⚠ {resultado.avisoDrive}</p>
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
      )}

      {aba === 'gerar' && (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-onforge-black/60 mb-4">
            Gera um PDF com a tabela de preços de todos os produtos ativos, ordenados por SKU, aplicando o
            desconto percentual informado sobre o preço de tabela.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-onforge-black mb-1">Nome da Tabela *</label>
              <input
                type="text" value={nomeTabela} onChange={(e) => setNomeTabela(e.target.value)}
                placeholder="Ex.: Tabela Verão 2026"
                className="w-full border border-onforge-gray/50 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-onforge-black mb-1">% Desconto (0 a 20) *</label>
              <input
                type="number" min="0" max="20" step="0.1" value={percentualDesconto}
                onChange={(e) => setPercentualDesconto(e.target.value)}
                placeholder="Ex.: 10"
                className="w-full border border-onforge-gray/50 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-onforge-black mb-1">Validade da Tabela (opcional)</label>
              <input
                type="date" value={validade} min={hojeISO} onChange={(e) => setValidade(e.target.value)}
                className="w-full border border-onforge-gray/50 rounded px-3 py-2"
              />
            </div>
          </div>

          {erroGerar && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">{erroGerar}</div>
          )}
          {avisoGerar && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">{avisoGerar}</div>
          )}

          <button
            onClick={handleGerarTabela} disabled={gerando}
            className="w-full mt-6 bg-onforge-black text-white py-3 rounded hover:bg-black/80 disabled:bg-onforge-gray"
          >
            {gerando ? 'Gerando... escolha onde salvar o arquivo' : 'Gerar Tabela de Preços'}
          </button>

          <p className="text-xs text-onforge-black/50 mt-2">
            No Chrome/Edge de computador você escolhe a pasta onde salvar o PDF. Em outros navegadores ou no
            celular, o arquivo é salvo na pasta de downloads padrão.
          </p>
        </div>
      )}
    </div>
  )
}
