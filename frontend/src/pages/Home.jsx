import { useState, useEffect } from "react"
import ProductCard from "../components/ProductCard"
import api from "../services/api"
import banner from "../assets/banner.png"

const PRODUTOS_POR_PAGINA = 12

function Home() {
  const [products, setProducts] = useState([])
  const [visiveis, setVisiveis] = useState(PRODUTOS_POR_PAGINA)

  useEffect(() => {
    async function carregarVitrine() {
      try {
        const response = await api.get("/products")
        setProducts(response.data)
      } catch (error) {
        console.error("Erro ao puxar perfumes do banco:", error)
      }
    }
    carregarVitrine()
  }, [])

  const produtosNaTela = products.slice(0, visiveis)
  const temMais = visiveis < products.length

  return (
    <div>

      {/* BANNER */}
      <div className="banner">
        <img src={banner} alt="Banner" />
      </div>

      {/* PRODUTOS */}
      <section className="products-section">
        <h2>Aproveite</h2>

        {products.length === 0 ? (
          <p>Nenhum perfume cadastrado no momento.</p>
        ) : (
          <>
            <div className="products-grid">
              {produtosNaTela.map((produto) => (
                <ProductCard key={produto.id} {...produto} />
              ))}
            </div>

            {temMais && (
              <div style={{ textAlign: 'center', marginTop: '35px' }}>
                <button
                  onClick={() => setVisiveis(prev => prev + PRODUTOS_POR_PAGINA)}
                  style={{
                    padding: '14px 40px',
                    backgroundColor: 'transparent',
                    color: '#333',
                    border: '2px solid #333',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#96305a'
                    e.target.style.color = 'white'
                    e.target.style.borderColor = '#96305a'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'transparent'
                    e.target.style.color = '#333'
                    e.target.style.borderColor = '#333'
                  }}
                >
                  Carregar Mais ({products.length - visiveis} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </section>

    </div>
  )
}

export default Home