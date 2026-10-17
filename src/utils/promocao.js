// Regras de Campanha Promocional no carrinho (espelho da regra do backend,
// que recalcula tudo ao salvar — aqui é só para o vendedor ver na hora).
//
//  - Produto em campanha vigente e qtd >= qtd mínima: desconto promocional
//    automático, sem acúmulo com o desconto do vendedor. O usuário pode REDUZIR
//    o % (qualquer perfil), nunca passar do % da promoção.
//  - Abaixo da qtd mínima ou sem campanha: regra geral (desconto do vendedor,
//    limitado ao desconto máximo das Configurações).

// Lista de /campanhas/vigentes -> mapa por produto_id
export function indexarPromocoes(lista) {
  const mapa = {}
  ;(lista || []).forEach((p) => { mapa[p.produto_id] = p })
  return mapa
}

export function promocaoAtingida(promocao, qtd) {
  return Boolean(promocao) && Number(qtd) >= promocao.qtd_minima
}

// Recalcula o desconto do item após mudança de quantidade (ou ao carregar).
// descontoPadrao: desconto usado quando o item volta para a regra geral.
export function aplicarRegraPromocional(item, promocao, descontoPadrao = 0) {
  if (promocaoAtingida(promocao, item.qtd)) {
    // Item que já era promocional e teve o % reduzido pelo usuário: mantém o valor
    // reduzido (limitado ao da promoção). Item que acabou de entrar na promoção: % cheio.
    const manterReduzido =
      item.origem_desconto === 'promocional' &&
      item.perc_desconto !== '' && item.perc_desconto !== null && item.perc_desconto !== undefined &&
      Number.isFinite(Number(item.perc_desconto)) &&
      Number(item.perc_desconto) < promocao.perc_desconto
    return {
      ...item,
      perc_desconto: manterReduzido ? item.perc_desconto : promocao.perc_desconto,
      perc_promocao: promocao.perc_desconto,
      origem_desconto: 'promocional',
      campanha_id: promocao.campanha_id,
      campanha_nome: promocao.campanha_nome,
    }
  }
  if (item.origem_desconto === 'promocional') {
    // Perdeu a promoção (qtd caiu abaixo do mínimo): volta ao desconto padrão.
    return { ...item, perc_desconto: descontoPadrao, perc_promocao: null, origem_desconto: 'vendedor', campanha_id: null, campanha_nome: null }
  }
  return { ...item, perc_promocao: null, origem_desconto: 'vendedor', campanha_id: null, campanha_nome: null }
}

export function textoPromocao(promocao) {
  return `${promocao.perc_desconto}% a partir de ${promocao.qtd_minima} un.`
}
