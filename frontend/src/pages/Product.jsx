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

  // Avaliações
  const [avaliacoes, setAvaliacoes] = useState([])
  const [mediaNotas, setMediaNotas] = useState(0)
  const [totalAvaliacoes, setTotalAvaliacoes] = useState(0)
  const [minhaAvaliacao, setMinhaAvaliacao] = useState({ nota: 0, comentario: "" })
  const [hoverNota, setHoverNota] = useState(0)
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false)
  const [avaliacaoMsg, setAvaliacaoMsg] = useState("")
  const [podeAvaliar, setPodeAvaliar] = useState(false)

  // Verificar se o usuário logado é admin
  const isAdmin = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("usuarioLogado"))
      return user && user.tipo_perfil?.toUpperCase() === 'ADMIN'
    } catch { return false }
  })()

  const isLogado = !!localStorage.getItem("usuarioLogado")

  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState("success")

  function showToast(message, type = "success") {
    setToastMessage(message)
    setToastType(type)
    setTimeout(() => {
      setToastMessage("")
    }, 3000)
  }

  useEffect(() => {
    async function carregarProduto() {
      try {
        const response = await api.get(`/products/${id}`)
        setProduto(response.data)
        if (response.data.variacoes && response.data.variacoes.length > 0) {
          setVariacaoSelecionada(response.data.variacoes[0])
        }
      } catch (error) {
        setErro("Produto não encontrado")
      }
    }
    carregarProduto()
  }, [id])

  // Carregar avaliações
  useEffect(() => {
    async function carregarAvaliacoes() {
      try {
        const res = await api.get(`/reviews/${id}`)
        setAvaliacoes(res.data.avaliacoes || [])
        setMediaNotas(res.data.media || 0)
        setTotalAvaliacoes(res.data.total || 0)
      } catch (e) {
        console.error("Erro ao carregar avaliações:", e)
      }
    }
    if (id) carregarAvaliacoes()
  }, [id])

  // Verificar se pode avaliar (só para logados)
  useEffect(() => {
    async function verificarPermissao() {
      try {
        const res = await api.get(`/reviews/can-review/${id}`)
        setPodeAvaliar(res.data.podeAvaliar)
        if (res.data.avaliacaoExistente) {
          setMinhaAvaliacao({
            nota: res.data.avaliacaoExistente.nota,
            comentario: res.data.avaliacaoExistente.comentario || ""
          })
        }
      } catch {
        setPodeAvaliar(false)
      }
    }
    if (id && isLogado && !isAdmin) verificarPermissao()
  }, [id, isLogado, isAdmin])

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
    if (!variacaoSelecionada) return
    try {
      await api.post("/cart/add", { variacao_id: variacaoSelecionada.id, quantidade: 1 })
      atualizarBadge()
      showToast("Adicionado à sacola!", "success")
      setTimeout(() => navigate("/sacola"), 1000)
    } catch (error) {
      if (error.response?.status === 401) {
        showToast("Você precisa fazer login para adicionar à sacola.", "error")
      } else {
        showToast(error.response?.data?.error || "Erro ao adicionar à sacola.", "error")
      }
    }
  }

  async function toggleFavorito() {
    try {
      const response = await api.post("/favorites/toggle", { produto_id: produto.id })
      atualizarFavoritosBadge()
      if (response.data.action === "added") {
        showToast("Adicionado aos favoritos!", "success")
      } else {
        showToast("Removido dos favoritos!", "success")
      }
    } catch (error) {
      if (error.response?.status === 401) {
        showToast("Você precisa fazer login para favoritar.", "error")
      } else {
        showToast(error.response?.data?.error || "Erro ao favoritar.", "error")
      }
    }
  }

  function renderEstrelas(nota, tamanho = 18) {
    return [1,2,3,4,5].map(i => (
      <span key={i} style={{ color: i <= nota ? '#f59e0b' : '#ddd', fontSize: `${tamanho}px` }}>★</span>
    ))
  }

  async function enviarAvaliacao(e) {
    e.preventDefault()
    if (minhaAvaliacao.nota === 0) {
      setAvaliacaoMsg("Selecione uma nota de 1 a 5 estrelas.")
      return
    }
    setEnviandoAvaliacao(true)
    setAvaliacaoMsg("")
    try {
      await api.post("/reviews", {
        produto_id: Number(id),
        nota: minhaAvaliacao.nota,
        comentario: minhaAvaliacao.comentario || null
      })
      setAvaliacaoMsg("Avaliação enviada com sucesso!")
      setMinhaAvaliacao({ nota: 0, comentario: "" })
      // Recarregar avaliações
      const res = await api.get(`/reviews/${id}`)
      setAvaliacoes(res.data.avaliacoes || [])
      setMediaNotas(res.data.media || 0)
      setTotalAvaliacoes(res.data.total || 0)
    } catch (err) {
      setAvaliacaoMsg(err.response?.data?.error || "Erro ao enviar avaliação.")
    } finally {
      setEnviandoAvaliacao(false)
    }
  }

  return (
    <section className="product-page" style={{ padding: '50px 20px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      
      {/* Toast de Notificação Premium */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          backgroundColor: toastType === 'success' ? '#f4fbf7' : toastType === 'error' ? '#fdf3f3' : '#fff',
          border: toastType === 'success' ? '1.5px solid #c2ebd9' : toastType === 'error' ? '1.5px solid #f5c2c2' : '1.5px solid #eee',
          color: toastType === 'success' ? '#27ae60' : toastType === 'error' ? '#d9383a' : '#333',
          padding: '16px 24px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '14px',
          textTransform: 'uppercase',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
          animation: 'slideIn 0.3s ease forwards'
        }}>
          <span>{toastType === 'success' ? '✨' : toastType === 'error' ? '⚠️' : 'ℹ️'}</span>
          <span>{toastMessage}</span>
        </div>
      )}
      
      <style>{`
        @keyframes slideIn {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', justifyContent: 'center' }}>

        {/* Imagem do Produto */}
        <div style={{ flex: '1 1 350px', maxWidth: '450px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
          {produto.imagem && (
            <img src={produto.imagem} alt={produto.nome} style={{ width: '100%', maxHeight: '550px', objectFit: 'contain', borderRadius: '12px' }} />
          )}
          {!isAdmin && (
            <button onClick={toggleFavorito} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}>
              <img src={coracaoIcon} alt="Favoritar" style={{ width: '22px', height: '22px' }} />
            </button>
          )}
        </div>

        {/* Informações do Produto */}
        <div style={{ flex: '1 1 350px', maxWidth: '500px' }}>

          <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', textTransform: 'uppercase', color: '#999', margin: '0 0 5px 0' }}>{produto.marca}</p>
          <h1 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '28px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>{produto.nome}</h1>

          {/* Estrelas resumo */}
          {totalAvaliacoes > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
              {renderEstrelas(Math.round(mediaNotas))}
              <span style={{ fontSize: '13px', color: '#666' }}>({totalAvaliacoes} {totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})</span>
            </div>
          )}

          <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', textTransform: 'uppercase', color: '#888', margin: '0 0 5px 0' }}>
            {produto.categoria} · {produto.familia_olfativa}
          </p>

          {/* Variações de tamanho */}
          {produto.variacoes && produto.variacoes.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', margin: '15px 0' }}>
              {produto.variacoes.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVariacaoSelecionada(v)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                    fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', textTransform: 'uppercase',
                    border: variacaoSelecionada?.id === v.id ? '2px solid #8c2b53' : '1px solid #ccc',
                    backgroundColor: variacaoSelecionada?.id === v.id ? '#f9f0f4' : '#fff',
                    color: variacaoSelecionada?.id === v.id ? '#8c2b53' : '#555'
                  }}
                >
                  {v.volume_ml}ml
                </button>
              ))}
            </div>
          )}

          <p className="price" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '32px', margin: '15px 0 5px 0', fontWeight: 'bold', color: '#333' }}>
            R$ {variacaoSelecionada ? formatarPreco(variacaoSelecionada.preco) : formatarPreco(0)}
          </p>
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

          {!isAdmin && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '30px' }}>
              <button className="sacola-button" onClick={adicionarSacola} style={{ backgroundColor: '#d8b8c8', color: '#000', border: 'none', borderRadius: '8px', padding: '12px 25px', width: '220px', fontSize: '14px', fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                SACOLA
                <img src={sacolaIcon} alt="Sacola" style={{ width: '18px', height: '18px', filter: 'brightness(0)' }} />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ========== SEÇÃO DE AVALIAÇÕES (US11) ========== */}
      <div style={{ marginTop: '60px', borderTop: '1px solid #eee', paddingTop: '40px', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
        <h2 style={{ fontFamily: "'Times New Roman', Times, serif", textTransform: 'uppercase', fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>
          Avaliações {totalAvaliacoes > 0 && `(${totalAvaliacoes})`}
        </h2>

        {/* Média */}
        {totalAvaliacoes > 0 && (
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#333' }}>{mediaNotas}</div>
            <div>{renderEstrelas(Math.round(mediaNotas), 24)}</div>
            <p style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{totalAvaliacoes} {totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}</p>
          </div>
        )}

        {/* Formulário de avaliação (só para quem comprou) */}
        {isLogado && !isAdmin && podeAvaliar && (
          <form onSubmit={enviarAvaliacao} style={{ background: '#faf7f8', borderRadius: '12px', padding: '20px', marginBottom: '30px', border: '1px solid #eee' }}>
            <p style={{ fontFamily: "'Times New Roman', Times, serif", textTransform: 'uppercase', fontSize: '13px', marginBottom: '10px', fontWeight: 'bold' }}>Deixe sua avaliação</p>

            {/* Seletor de estrelas */}
            <div style={{ marginBottom: '12px' }}>
              {[1,2,3,4,5].map(i => (
                <span
                  key={i}
                  onClick={() => setMinhaAvaliacao(prev => ({ ...prev, nota: i }))}
                  onMouseEnter={() => setHoverNota(i)}
                  onMouseLeave={() => setHoverNota(0)}
                  style={{ cursor: 'pointer', fontSize: '28px', color: i <= (hoverNota || minhaAvaliacao.nota) ? '#f59e0b' : '#ddd', transition: 'color 0.15s' }}
                >
                  ★
                </span>
              ))}
              {minhaAvaliacao.nota > 0 && <span style={{ fontSize: '13px', color: '#666', marginLeft: '8px' }}>{minhaAvaliacao.nota}/5</span>}
            </div>

            <textarea
              value={minhaAvaliacao.comentario}
              onChange={(e) => setMinhaAvaliacao(prev => ({ ...prev, comentario: e.target.value }))}
              placeholder="Compartilhe sua experiência com este perfume... (opcional)"
              rows={3}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
            />

            {avaliacaoMsg && (
              <p style={{ fontSize: '12px', marginTop: '6px', color: avaliacaoMsg.includes('sucesso') ? '#059669' : '#c0392b' }}>
                {avaliacaoMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={enviandoAvaliacao}
              style={{ marginTop: '10px', padding: '10px 25px', backgroundColor: '#96305a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: "'Times New Roman', Times, serif", textTransform: 'uppercase', fontSize: '13px', fontWeight: 'bold' }}
            >
              {enviandoAvaliacao ? 'Enviando...' : 'Enviar Avaliação'}
            </button>
          </form>
        )}

        {/* Lista de avaliações */}
        {avaliacoes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', fontSize: '14px', fontFamily: "'Times New Roman', Times, serif" }}>
            Nenhuma avaliação ainda. {isLogado ? 'Seja o primeiro a avaliar!' : 'Faça login para avaliar.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {avaliacoes.map(av => (
              <div key={av.id} style={{ padding: '16px', borderRadius: '10px', border: '1px solid #eee', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div>
                    <strong style={{ fontSize: '14px' }}>{av.usuario_nome}</strong>
                    <span style={{ marginLeft: '10px' }}>{renderEstrelas(av.nota, 14)}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#999' }}>
                    {new Date(av.data_avaliacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {av.comentario && <p style={{ fontSize: '13px', color: '#555', margin: '4px 0 0' }}>{av.comentario}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Product