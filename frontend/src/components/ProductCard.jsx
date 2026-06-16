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
  estoque_qtd, // <- Nova prop
  variacao_estoque, // <- Nova prop
  variacoes, // <- Nova prop (Lista de variações do backend)
  isFavoritos = false,
  isAdmin = false,
}) {
  const navigate = useNavigate()
  const { atualizarBadge, atualizarFavoritosBadge } = useContext(CartContext)
  const [mensagem, setMensagem] = useState("")

  // Estado local para a variação selecionada no card
  const [variacaoSel, setVariacaoSel] = useState(() => {
    // Inicializa com a variação padrão recebida nas props
    return {
      id: variacao_id,
      volume_ml: volume_ml,
      preco: preco,
      estoque_qtd: variacao_estoque ?? estoque_qtd
    }
  })

  // Parse das variações caso venham como string JSON do MySQL
  const variacoesList = typeof variacoes === 'string' ? JSON.parse(variacoes) : (variacoes || [])

  // Detectar admin automaticamente
  const adminCheck = isAdmin || (() => {
    try {
      const user = JSON.parse(localStorage.getItem("usuarioLogado"))
      return user && user.tipo_perfil?.toUpperCase() === 'ADMIN'
    } catch { return false }
  })()

  function formatarPreco(valor) {
    return Number(valor).toFixed(2).replace(".", ",")
  }

  const precoParcelado = (Number(variacaoSel.preco) / 8).toFixed(2).replace(".", ",")

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
        mostrarMensagem("Faça login para favoritar")
      } else {
        mostrarMensagem("Erro ao favoritar")
      }
    }
  }

  async function adicionarSacola(event) {
    event.stopPropagation()

    try {
      // Se tivermos a variação base, enviamos para a sacola. Caso contrário, alertamos.
      if (!variacaoSel.id) throw new Error("Variação indisponível");
      
      await api.post("/cart/add", { variacao_id: variacaoSel.id, quantidade: 1 })
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

      {!adminCheck && (
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
      )}

      <img src={imagem} alt={nome} className="product-image canvas-product-image" />

      <div className="canvas-card-info">
        <p className="brand canvas-brand">{marca}</p>
        <h3 className="canvas-nome">
          {nome} {descricao ? ` - ${descricao}` : ""}
        </h3>
        
        {/* Variações de tamanho no Card */}
        {variacoesList && variacoesList.length > 1 && (
          <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
            {variacoesList.map((v) => {
              const esgotado = Number(v.estoque_qtd) === 0;
              return (
                <button
                  key={v.id}
                  onClick={() => setVariacaoSel(v)}
                  style={{
                    padding: '4px 8px', borderRadius: '15px', cursor: 'pointer',
                    fontFamily: "'Times New Roman', Times, serif", fontSize: '11px', textTransform: 'uppercase',
                    border: variacaoSel.id === v.id ? (esgotado ? '1px solid #9ca3af' : '1px solid #8c2b53') : '1px solid #ccc',
                    backgroundColor: esgotado ? '#e5e7eb' : (variacaoSel.id === v.id ? '#f9f0f4' : '#fff'),
                    color: esgotado ? '#9ca3af' : (variacaoSel.id === v.id ? '#8c2b53' : '#555')
                  }}
                >
                  {v.volume_ml}ml
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="canvas-card-bottom">
        <div className="canvas-price-container">
          <p className="price canvas-price" style={{ fontSize: '14px' }}>
            A PARTIR DE R$ {formatarPreco(variacaoSel.preco)} {variacaoSel.volume_ml ? `(${variacaoSel.volume_ml} ML)` : ''}
          </p>
          <p className="installment canvas-installment">OU 8X DE R$ {precoParcelado}</p>
        </div>
        {!adminCheck && (
          <button 
            className="bag-button canvas-bag-button" 
            onClick={adicionarSacola}
            disabled={Number(variacaoSel.estoque_qtd) === 0}
            style={{ 
              backgroundColor: Number(variacaoSel.estoque_qtd) === 0 ? '#e5e7eb' : '', 
              cursor: Number(variacaoSel.estoque_qtd) === 0 ? 'not-allowed' : 'pointer',
              width: Number(variacaoSel.estoque_qtd) === 0 ? 'auto' : '',
              padding: Number(variacaoSel.estoque_qtd) === 0 ? '0 10px' : ''
            }}
            title={Number(variacaoSel.estoque_qtd) === 0 ? "Produto Esgotado" : "Adicionar à Sacola"}
          >
            {Number(variacaoSel.estoque_qtd) === 0 ? (
               <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#9ca3af' }}>ESGOTADO</span>
            ) : (
               <img src={sacolaIcon} alt="Adicionar" className="canvas-bag-icon" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductCard