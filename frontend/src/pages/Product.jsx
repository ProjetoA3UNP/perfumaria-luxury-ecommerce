import { useParams, useNavigate, Link } from "react-router-dom"
import { useState, useEffect, useContext } from "react"
import { CartContext } from "../contexts/CartContext"
import api from "../services/api"
import coracaoIcon from "../assets/coracao.png"
import sacolaIcon from "../assets/sacola.png"

function Product() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { atualizarBadge, atualizarFavoritosBadge } = useContext(CartContext)
  const [produto, setProduto] = useState(null)
  const [variacaoSelecionada, setVariacaoSelecionada] = useState(null)
  const [erro, setErro] = useState("")

  useEffect(() => {
    async function carregarProduto() {
      try {
        const response = await api.get(`/products/${id}`)
        setProduto(response.data)
        if (response.data.variacoes && response.data.variacoes.length > 0) {
          // Seleciona automaticamente o menor volume
          setVariacaoSelecionada(response.data.variacoes[0])
        }
      } catch (error) {
        setErro("Produto não encontrado")
      }
    }
    carregarProduto()
  }, [id])

  if (erro || !produto) {
    return (
      <section className="product-page">
        <h1>{erro || "Carregando..."}</h1>
      </section>
    )
  }

  function formatarPreco(valor) {
    return Number(valor).toFixed(2).replace(".", ",")
  }

  async function adicionarSacola() {
    if (!variacaoSelecionada) {
      alert("Por favor, selecione um tamanho.")
      return;
    }
    try {
      await api.post("/cart/add", { variacao_id: variacaoSelecionada.id, quantidade: 1 })
      atualizarBadge()
      navigate("/sacola")
    } catch (error) {
      if (error.response && error.response.status === 401) {
        alert("Você precisa fazer login para adicionar à sacola.")
        navigate("/login")
      } else {
        alert(error.response?.data?.error || "Erro ao adicionar à sacola.")
      }
    }
  }

  async function favoritar() {
    try {
      const response = await api.post("/favorites", { produto_id: produto.id })
      alert(response.data.message)
      atualizarFavoritosBadge()
    } catch (error) {
      if (error.response && error.response.status === 401) {
        alert("Faça login para favoritar")
      } else {
        alert("Erro ao favoritar")
      }
    }
  }

  return (
    <section className="product-page" style={{ padding: '40px 10%' }}>

      {/* 🔥 BREADCRUMB */}
      <div className="breadcrumb" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', textTransform: 'uppercase', marginBottom: '30px', color: '#333' }}>
        <Link to="/" style={{ color: '#333', textDecoration: 'none' }}>HOME</Link>
        <span style={{ margin: '0 8px' }}>|</span>
        <span>FAMÍLIA OLFATIVA</span>
        <span style={{ margin: '0 8px' }}>|</span>
        <strong>{produto.familia_olfativa}</strong>
      </div>

      {/* 🔥 CONTAINER */}
      <div className="product-zoom-container" style={{ display: 'flex', gap: '60px', alignItems: 'flex-start' }}>

        {/* ✅ APENAS UMA IMAGEM */}
        <div className="product-main-image" style={{ flex: '1', display: 'flex', justifyContent: 'center' }}>
          <img src={produto.imagem} alt={produto.nome} style={{ width: '100%', maxWidth: '400px', objectFit: 'contain' }} />
        </div>

        {/* INFO */}
        <div className="product-detail-info" style={{ flex: '1', position: 'relative' }}>

          <button className="product-favorite" onClick={favoritar} style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', cursor: 'pointer' }}>
            <img src={coracaoIcon} alt="Favoritar" style={{ width: '28px', height: '28px' }} />
          </button>

          <h1 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '24px', textTransform: 'uppercase', margin: '0 0 5px 0', color: '#000' }}>
            {produto.marca}
          </h1>

          <p className="product-subtitle" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '20px', textTransform: 'uppercase', margin: '0 0 20px 0', color: '#555' }}>
            {produto.nome}
          </p>

          {/* 🔥 BOTÕES DE VOLUME (SKUs) */}
          {produto.variacoes && produto.variacoes.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {produto.variacoes.map(v => (
                <button 
                  key={v.id} 
                  onClick={() => setVariacaoSelecionada(v)}
                  style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: '14px',
                    padding: '8px 15px',
                    border: '1px solid #000',
                    backgroundColor: variacaoSelecionada?.id === v.id ? '#000' : 'transparent',
                    color: variacaoSelecionada?.id === v.id ? '#fff' : '#000',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {v.volume_ml} ML
                </button>
              ))}
            </div>
          )}

          <h2 className="product-detail-price" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '28px', color: '#8c2b53', margin: '0 0 5px 0' }}>
            R$ {variacaoSelecionada ? formatarPreco(variacaoSelecionada.preco) : formatarPreco(0)}
          </h2>

          <p className="installment" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '18px', textTransform: 'uppercase', color: '#333', margin: '0 0 40px 0' }}>
            10X R$ {variacaoSelecionada ? formatarPreco(variacaoSelecionada.preco / 10) : formatarPreco(0)} NO CARTÃO
          </p>

          <div className="product-sections" style={{ fontFamily: "'Times New Roman', Times, serif", textTransform: 'uppercase', fontSize: '14px', color: '#555', marginBottom: '40px' }}>
            <details style={{ marginBottom: '10px' }}>
              <summary style={{ cursor: 'pointer', listStyle: 'none', position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>DESCRIÇÃO <span style={{ fontSize: '12px' }}>∨</span></summary>
              <p style={{ marginTop: '10px', fontSize: '12px', textTransform: 'none', color: '#333' }}>{produto.descricao || "Nenhuma informação disponível."}</p>
            </details>

            <details style={{ marginBottom: '10px' }}>
              <summary style={{ cursor: 'pointer', listStyle: 'none', position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>INGREDIENTES <span style={{ fontSize: '12px' }}>∨</span></summary>
              <p style={{ marginTop: '10px', fontSize: '12px', textTransform: 'none', color: '#333' }}>{produto.ingredientes || "Nenhuma informação disponível."}</p>
            </details>

            <details style={{ marginBottom: '10px' }}>
              <summary style={{ cursor: 'pointer', listStyle: 'none', position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>PIRÂMIDE OLFATIVA <span style={{ fontSize: '12px' }}>∨</span></summary>
              <div style={{ marginTop: '10px', fontSize: '12px', textTransform: 'none', color: '#333' }}>
                <p>Topo: {produto.topo || "N/A"}</p>
                <p>Coração: {produto.coracao || "N/A"}</p>
                <p>Fundo: {produto.base || "N/A"}</p>
              </div>
            </details>

            <details style={{ marginBottom: '10px' }}>
              <summary style={{ cursor: 'pointer', listStyle: 'none', position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>OCASIÃO IDEAL <span style={{ fontSize: '12px' }}>∨</span></summary>
              <p style={{ marginTop: '10px', fontSize: '12px', textTransform: 'none', color: '#333' }}>{produto.ocasiaoIdeal || "Nenhuma informação disponível."}</p>
            </details>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '30px' }}>
            <button className="sacola-button" onClick={adicionarSacola} style={{ backgroundColor: '#d8b8c8', color: '#000', border: 'none', borderRadius: '8px', padding: '12px 25px', width: '220px', fontSize: '14px', fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
              SACOLA
              <img src={sacolaIcon} alt="Sacola" style={{ width: '18px', height: '18px', filter: 'brightness(0)' }} />
            </button>
          </div>

        </div>
      </div>
    </section>
  )
}

export default Product