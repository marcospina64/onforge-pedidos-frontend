import { API_URL } from '../services/api'

// URL da foto de um produto, servida como imagem binária pelo backend
// (GET /produtos/:id/foto). Usar direto em <img src>, sempre com loading="lazy":
// o navegador só baixa as que aparecem na tela e reaproveita o cache nas próximas
// vezes, sem trafegar base64 dentro do JSON das listagens.
export const fotoProdutoUrl = (id) => `${API_URL}/produtos/${id}/foto`
