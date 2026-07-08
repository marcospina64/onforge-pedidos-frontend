export const formatMoney = (value) => {
  if (!value) return 'R$ 0,00'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parseFloat(value))
}

export const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '0'

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(parseFloat(value))
}

export const formatDate = (dateString) => {
  if (!dateString) return '-'

  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}
