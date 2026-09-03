import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { formatNumber } from '../utils/format'

export default function KitDetalhe() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [kit, setKit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.get(`/kits/${id}`)
      .then((res) => setKit(res.data))
      .catch((err) => setErro(err.response?.data?.error || 'Erro ao carregar o kit'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/kits')} className="text-onforge-black hover:opacity-70 mb-4 flex items-center">
        ← Voltar ao Catálogo de Kits
      </button>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : erro ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{erro}</div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-sm text-onforge-black/50">Kit {kit.codigo}</p>
            <h1 className="text-3xl font-bold font-display">{kit.nome}</h1>
            {kit.atributo && (
              <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-onforge-peach/40 text-onforge-black">
                {kit.atributo}
              </span>
            )}
          </div>

          <h2 className="text-lg font-semibold font-display mb-2">Produtos que compõem o kit</h2>
          {kit.componentes.length === 0 ? (
            <div className="text-center py-8 text-onforge-black/50 bg-white rounded-md border border-onforge-gray/20">
              Este kit não tem produtos cadastrados.
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-md border border-onforge-gray/20">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-onforge-cream border-b">
                    <th className="px-4 py-2 text-left font-semibold text-onforge-black/80">SKU</th>
                    <th className="px-4 py-2 text-left font-semibold text-onforge-black/80">Nome Produto</th>
                    <th className="px-4 py-2 text-right font-semibold text-onforge-black/80">Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  {kit.componentes.map((c, i) => (
                    <tr key={i} className="border-b hover:bg-onforge-cream/60">
                      <td className="px-4 py-3 text-onforge-black/70">{c.sku}</td>
                      <td className="px-4 py-3">{c.nome_produto}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(c.qtd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
