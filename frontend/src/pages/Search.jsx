import { useSearchParams } from "react-router-dom"
import { useState, useEffect } from "react"
import ProductCard from "../components/ProductCard"
import api from "../services/api"

function Search() {
  const [searchParams] = useSearchParams()
  const termo = searchParams.get("q") || ""
  const [resultado, setResultado] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function buscar() {
      try {
        const response = await api.get('/products')
        const filtrado = response.data.filter((produto) => {
          const texto = `
            ${produto.nome}
            ${produto.marca || ""}
            ${produto.descricao || ""}
            ${produto.familia_olfativa || ""}
            ${produto.categoria || ""}
          `.toLowerCase()
      
          return texto.includes(termo.toLowerCase())
        })
        setResultado(filtrado)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    buscar()
  }, [termo])

  return (
    <section className="products-section">
      <h2>Resultado para: {termo}</h2>

      {loading ? (
        <p>Buscando...</p>
      ) : resultado.length === 0 ? (
        <p>Nenhum perfume encontrado.</p>
      ) : (
        <div className="products-grid">
          {resultado.map((produto) => (
            <ProductCard key={produto.id} {...produto} />
          ))}
        </div>
      )}
    </section>
  )
}

export default Search