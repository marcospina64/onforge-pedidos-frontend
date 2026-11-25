import { formatDate } from '../utils/format'

// Faixa informativa (somente leitura) com o prazo de entrega em dias úteis e a data prevista.
// `dataPrevista` vem do backend como 'YYYY-MM-DD'; os dias úteis consideram só feriados nacionais.
export default function FaixaPrazoEntrega({ prazo, dataPrevista }) {
  if (!prazo || !dataPrevista) return null

  return (
    <div className="mb-4 p-3 bg-onforge-peach/20 border border-onforge-peach rounded flex flex-wrap items-center gap-x-2 text-sm">
      <span className="font-medium">Prazo de Entrega:</span>
      <strong>{prazo} dias úteis</strong>
      <span className="text-onforge-black/60">· previsão em <strong>{formatDate(dataPrevista)}</strong></span>
    </div>
  )
}
