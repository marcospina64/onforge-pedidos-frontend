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
