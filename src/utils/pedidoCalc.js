export function calcularItem(item) {
  const qtd = Number(item.qtd) || 0
  const percDesconto = Number(item.perc_desconto) || 0
  const bruto = qtd * item.preco_tabela
  const desconto = bruto * (percDesconto / 100)
  return { bruto, desconto, total: bruto - desconto }
}

export function calcularTotalPedido(carrinho) {
  return carrinho.reduce((soma, item) => soma + calcularItem(item).total, 0)
}

export function encontrarItemForaDoLimite(carrinho, descontoMaximo) {
  return carrinho.find((i) => Number(i.perc_desconto) > descontoMaximo)
}

export function calcularDescontoMedio(carrinho) {
  const totalBruto = carrinho.reduce((soma, item) => {
    const qtd = Number(item.qtd) || 0
    return soma + (qtd * item.preco_tabela)
  }, 0)

  const totalDesconto = carrinho.reduce((soma, item) => {
    const qtd = Number(item.qtd) || 0
    const bruto = qtd * item.preco_tabela
    const percDesconto = Number(item.perc_desconto) || 0
    return soma + (bruto * (percDesconto / 100))
  }, 0)

  if (totalBruto === 0) return 0
  return (totalDesconto / totalBruto) * 100
}
