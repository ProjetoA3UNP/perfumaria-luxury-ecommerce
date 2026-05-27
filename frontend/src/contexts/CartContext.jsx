import { createContext, useState, useEffect } from "react"
import api from "../services/api"

// Cria o duto de comunicação
export const CartContext = createContext()

// Provedor que abraçará a aplicação
export function CartProvider({ children }) {
  const [quantidadeItens, setQuantidadeItens] = useState(0)
  const [quantidadeFavoritos, setQuantidadeFavoritos] = useState(0)

  async function atualizarBadge() {
    try {
      // Faz o GET silencioso só para saber quantos itens existem na sacola
      const response = await api.get('/cart')
      const itens = response.data.itens || []
      
      // Conta apenas a variedade de produtos (tipos de perfumes) e não a quantidade bruta de frascos
      const total = itens.length;
      
      setQuantidadeItens(total)
    } catch (error) {
      console.error("Contexto não conseguiu atualizar a bolinha:", error)
    }
  }

  async function atualizarFavoritosBadge() {
    try {
      const response = await api.get('/favorites')
      setQuantidadeFavoritos(response.data.length)
    } catch (error) {
      console.error("Contexto não conseguiu atualizar a bolinha de favoritos:", error)
    }
  }

  // Quando o projeto abre, tenta pegar o número da sacola (se logado)
  useEffect(() => {
    if (localStorage.getItem("usuarioLogado")) {
      atualizarBadge()
      atualizarFavoritosBadge()
    }
  }, [])

  return (
    <CartContext.Provider value={{ quantidadeItens, atualizarBadge, quantidadeFavoritos, atualizarFavoritosBadge }}>
      {children}
    </CartContext.Provider>
  )
}
