import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import ProductCard from "../components/ProductCard"
import api from "../services/api"

const PRODUTOS_POR_PAGINA = 12

function Category() {
  const { categoria } = useParams()
  const [produtosFiltrados, setProdutosFiltrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [visiveis, setVisiveis] = useState(PRODUTOS_POR_PAGINA)

  // Reseta a quantidade visível ao trocar de categoria
  useEffect(() => {
    setVisiveis(PRODUTOS_POR_PAGINA)
  }, [categoria])

  useEffect(() => {
    async function buscar() {
      try {
        const response = await api.get('/products')
        
        function gerarSlug(texto) {
          if (!texto) return ""
          return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
        }

        const targetSlug = gerarSlug(categoria)

        // Slugs de grupo do menu horizontal — mostrar todos os produtos
        const gruposGerais = ["perfumes", "perfumaria", "marcas", "familia-olfativa", "promocao"]
        
        let filtrado

        if (gruposGerais.includes(targetSlug)) {
          filtrado = response.data
        } else {
          filtrado = response.data.filter((p) => {
            const cat = gerarSlug(p.categoria)
            const mar = gerarSlug(p.marca)
            const fam = gerarSlug(p.familia_olfativa)
            
            return cat === targetSlug || mar === targetSlug || fam === targetSlug ||
                   cat.includes(targetSlug) || mar.includes(targetSlug) || fam.includes(targetSlug)
          })
        }

        setProdutosFiltrados(filtrado)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    buscar()
  }, [categoria])

  const produtosNaTela = produtosFiltrados.slice(0, visiveis)
  const temMais = visiveis < produtosFiltrados.length

  return (
    <section className="products-section">
      <h2>{categoria.replaceAll("-", " ").replace(/\b\w/g, l => l.toUpperCase())}</h2>

      {loading ? (
        <p>Buscando...</p>
      ) : produtosFiltrados.length === 0 ? (
        <p>Nenhum produto encontrado nessa categoria.</p>
      ) : (
        <>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
            {produtosFiltrados.length} {produtosFiltrados.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </p>
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
                Carregar Mais ({produtosFiltrados.length - visiveis} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default Category