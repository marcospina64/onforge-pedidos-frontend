import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function ComissoesImportar() {
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
      const res = await api.post('/comissoes/import', formData, {
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
      <button onClick={() => navigate('/comissoes')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar para Comissões
      </button>
      <h1 className="text-3xl font-bold mb-6 font-display">Importar Contas a Receber (Olist)</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="text-sm text-onforge-black/60">
          Envie o arquivo <strong>contas_receber_AAAA-MM-DD-HH-MM-SS.xls</strong> exportado do Olist. A importação é
          idempotente pelo ID do Olist: registros já existentes só têm o status atualizado (Situação, data de recebimento,
          valor recebido), nunca são duplicados. Depois de importar com sucesso, mova o arquivo para a pasta "Processadas"
          manualmente — o sistema não acessa pastas locais do seu computador.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 font-display">Envie a planilha</h2>

        <div className="border-2 border-dashed border-onforge-gray/50 rounded-lg p-8 text-center">
          <input
            type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files[0])}
            className="hidden" id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer block">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-onforge-black/60 mb-2">Clique para selecionar o arquivo</p>
            <p className="text-sm text-onforge-black/50">Formato: XLS ou XLSX</p>
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
            <p>✓ {resultado.importados} registro(s) novo(s) e {resultado.atualizados} atualizado(s) com sucesso!</p>
            {resultado.sem_correspondencia > 0 && (
              <p className="mt-1">
                ⚠ {resultado.sem_correspondencia} sem correspondência de cliente —{' '}
                <button onClick={() => navigate('/comissoes/pendencias')} className="underline font-medium">revisar pendências</button>
              </p>
            )}
            {resultado.match_aproximado > 0 && (
              <p className="mt-1">
                ⚠ {resultado.match_aproximado} com match aproximado (precisa confirmação) —{' '}
                <button onClick={() => navigate('/comissoes/pendencias')} className="underline font-medium">revisar pendências</button>
              </p>
            )}
            {resultado.erros?.length > 0 && (
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {resultado.erros.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}

        <button
          onClick={handleImport} disabled={!file || loading}
          className="w-full mt-6 bg-onforge-black text-white py-3 rounded hover:bg-black/80 disabled:bg-onforge-gray"
        >
          {loading ? 'Importando...' : 'Importar'}
        </button>
      </div>
    </div>
  )
}
