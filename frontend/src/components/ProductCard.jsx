import "./productCard.css"
import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import lixeiraIcon from "../assets/lixeira.png"
import coracaoIcon from "../assets/coracao.png"
import sacolaIcon from "../assets/sacola.png"
import api from "../services/api"
import { CartContext } from "../contexts/CartContext"

function ProductCard({
  id,
  variacao_id,
  volume_ml,
  imagem,
  marca,
  nome,
  preco,
  descricao,
  isFavoritos = false,
}) {
  const navigate = useNavigate()
  const { atualizarBadge, atualizarFavoritosBadge } = useContext(CartContext)
  const [mensagem, setMensagem] = useState("")

  function formatarPreco(valor) {
    return Number(valor).toFixed(2).replace(".", ",")
  }

  const precoParcelado = (Number(preco) / 8).toFixed(2).replace(".", ",")

  function mostrarMensagem(texto) {
    setMensagem(texto)
    setTimeout(() => setMensagem(""), 2000)
  }

  async function removerFavorito(event) {
    event.stopPropagation()

    try {
      await api.delete(`/favorites/${id}`)
      mostrarMensagem("Removido dos favoritos")
      atualizarFavoritosBadge()
      window.dispatchEvent(new Event("favoritosAtualizados"))
    } catch (error) {
      console.error(error)
    }
  }

  async function favoritar(event) {
    event.stopPropagation()

    try {
      const response = await api.post("/favorites", { produto_id: id })
      mostrarMensagem(response.data.message)
      atualizarFavoritosBadge()
    } catch (error) {
      if (error.response && error.response.status === 401) {
        mostrarMensagem("Faça login")
      } else {
        mostrarMensagem("Erro ao favoritar")
      }
    }
  }

  async function adicionarSacola(event) {
    event.stopPropagation()

    try {
      // Se tivermos a variação base, enviamos para a sacola. Caso contrário, alertamos.
      if (!variacao_id) throw new Error("Variação indisponível");
      
      await api.post("/cart/add", { variacao_id: variacao_id, quantidade: 1 })
      atualizarBadge()
      mostrarMensagem("Adicionado à sacola")
    } catch (error) {
      if (error.response && error.response.status === 401) {
        mostrarMensagem("Faça login para adicionar")
      } else {
        mostrarMensagem("Erro ou sem estoque")
      }
    }
  }

  return (
    <div className="product-card canvas-product-card" onClick={() => navigate(`/produto/${id}`)}>
      {mensagem && <div className="card-message">{mensagem}</div>}

      <button
        className="favorite canvas-favorite"
        onClick={isFavoritos ? removerFavorito : favoritar}
      >
        {isFavoritos ? (
          <img src={lixeiraIcon} alt="Remover" className="icon-favorite icon-coracao" />
        ) : (
          <img src={coracaoIcon} alt="Favoritar" className="icon-favorite icon-coracao" />
        )}
      </button>

      <img src={imagem} alt={nome} className="product-image canvas-product-image" />

      <div className="canvas-card-info">
        <p className="brand canvas-brand">{marca}</p>
        <h3 className="canvas-nome">
          {nome} {descricao ? ` - ${descricao}` : ""}
        </h3>
      </div>

      <div className="canvas-card-bottom">
        <div className="canvas-price-container">
          <p className="price canvas-price" style={{ fontSize: '14px' }}>
            A PARTIR DE R$ {formatarPreco(preco)} {volume_ml ? `(${volume_ml} ML)` : ''}
          </p>
          <p className="installment canvas-installment">OU 8X DE R$ {precoParcelado}</p>
        </div>
        <button className="bag-button canvas-bag-button" onClick={adicionarSacola}>
          <img src={sacolaIcon} alt="Adicionar" className="canvas-bag-icon" />
        </button>
      </div>
    </div>
  )
}

export default ProductCard