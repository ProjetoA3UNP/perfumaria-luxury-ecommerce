import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import ProductCard from "../components/ProductCard"
import api from "../services/api"

function Favorites() {
  const [favoritos, setFavoritos] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function carregarFavoritos() {
    try {
      const response = await api.get("/favorites")
      setFavoritos(response.data)
    } catch (error) {
      if (error.response && error.response.status === 401) {
        navigate("/login")
      }
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarFavoritos()
    window.addEventListener("favoritosAtualizados", carregarFavoritos)

    return () => {
      window.removeEventListener("favoritosAtualizados", carregarFavoritos)
    }
  }, [])

  if (loading) return <section className="products-section"><h2>Carregando...</h2></section>

  return (
    <section className="products-section">
      <h2>Meus Favoritos</h2>

      {favoritos.length === 0 ? (
        <p>Nenhum produto favoritado ainda.</p>
      ) : (
        <div className="products-grid">
          {favoritos.map((produto) => (
            <ProductCard
              key={produto.id}
              {...produto}
              isFavoritos={true} // 🔥 ESSA LINHA É O SEGREDO
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default Favorites