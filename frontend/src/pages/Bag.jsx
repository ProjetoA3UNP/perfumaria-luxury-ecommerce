import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect, useContext, useCallback } from "react"
import { CartContext } from "../contexts/CartContext"
import api from "../services/api"
import "./bag.css"

const FRETE_POR_UF = {
  SP: { valor: 15.90, prazo: 2 }, RJ: { valor: 15.90, prazo: 2 },
  MG: { valor: 17.90, prazo: 3 }, ES: { valor: 17.90, prazo: 3 },
  PR: { valor: 19.90, prazo: 3 }, SC: { valor: 19.90, prazo: 3 }, RS: { valor: 21.90, prazo: 4 },
  GO: { valor: 22.90, prazo: 4 }, DF: { valor: 22.90, prazo: 4 },
  MT: { valor: 24.90, prazo: 5 }, MS: { valor: 24.90, prazo: 5 },
  BA: { valor: 24.90, prazo: 5 }, SE: { valor: 25.90, prazo: 5 },
  AL: { valor: 25.90, prazo: 5 }, PE: { valor: 25.90, prazo: 5 },
  PB: { valor: 26.90, prazo: 6 }, RN: { valor: 26.90, prazo: 6 },
  CE: { valor: 26.90, prazo: 6 }, PI: { valor: 27.90, prazo: 7 }, MA: { valor: 27.90, prazo: 7 },
  TO: { valor: 28.90, prazo: 7 }, PA: { valor: 30.90, prazo: 8 },
  AM: { valor: 33.90, prazo: 10 }, RO: { valor: 32.90, prazo: 9 },
  AC: { valor: 35.90, prazo: 12 }, RR: { valor: 34.90, prazo: 11 }, AP: { valor: 34.90, prazo: 11 },
}

function Bag() {
  const [sacola, setSacola] = useState([])
  const [loading, setLoading] = useState(true)
  const [cep, setCep] = useState("")
  const [cupom, setCupom] = useState("")
  const [cupomData, setCupomData] = useState(null)
  const [cupomErro, setCupomErro] = useState("")
  const [freteInfo, setFreteInfo] = useState(null)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [erroCep, setErroCep] = useState("")
  const navigate = useNavigate()
  const { atualizarBadge } = useContext(CartContext)

  async function carregarSacola() {
    try {
      const response = await api.get('/cart')
      setSacola(response.data.itens || [])
      atualizarBadge()
    } catch (error) {
      if (error.response && error.response.status === 401) {
        alert("Sua sessão expirou. Faça login novamente.")
        navigate("/login")
      }
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarSacola()
  }, [])

  async function removerProduto(variacao_id) {
    try {
      await api.delete(`/cart/remove/${variacao_id}`)
      carregarSacola()
      atualizarBadge()
    } catch (error) {
      console.error("Erro ao remover produto", error)
    }
  }

  async function atualizarQuantidade(variacao_id, quantidadeAtual, incremento) {
    const novaQuantidade = quantidadeAtual + incremento
    if (novaQuantidade < 1) return

    try {
      await api.put(`/cart/update/${variacao_id}`, { quantidade: novaQuantidade })
      carregarSacola()
      atualizarBadge()
    } catch (error) {
      console.error("Erro ao atualizar quantidade", error)
    }
  }

  function formatarPreco(valor) {
    return Number(valor).toFixed(2).replace(".", ",")
  }

  const buscarCep = useCallback(async (cepLimpo) => {
    setBuscandoCep(true)
    setErroCep("")
    setFreteInfo(null)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await res.json()
      if (data.erro) {
        setErroCep("CEP não encontrado.")
        return
      }
      const info = FRETE_POR_UF[data.uf] || { valor: 39.90, prazo: 15 }
      setFreteInfo({ ...info, uf: data.uf, cidade: data.localidade })
    } catch {
      setErroCep("Erro ao consultar CEP.")
    } finally {
      setBuscandoCep(false)
    }
  }, [])

  function handleCepChange(e) {
    const val = e.target.value
    setCep(val)
    const limpo = val.replace(/\D/g, "")
    if (limpo.length === 8) {
      buscarCep(limpo)
    } else {
      setFreteInfo(null)
      setErroCep("")
    }
  }

  async function aplicarCupom() {
    if (!cupom.trim()) return
    setCupomErro("")
    setCupomData(null)
    try {
      const res = await api.post('/coupons/validate', { codigo: cupom.trim() })
      setCupomData(res.data)
    } catch (error) {
      setCupomErro(error.response?.data?.error || "Cupom inválido.")
    }
  }

  function removerCupom() {
    setCupomData(null)
    setCupomErro("")
    setCupom("")
  }

  if (loading) {
    return (
      <section style={{ padding: '40px 10%', fontFamily: "'Times New Roman', Times, serif" }}>
        <h1>SACOLA</h1>
        <p>Carregando...</p>
      </section>
    )
  }

  const subtotal = sacola.reduce((total, produto) => {
    return total + Number(produto.preco_unitario) * produto.quantidade
  }, 0)

  const valorFrete = freteInfo ? freteInfo.valor : 0
  const valorDesconto = cupomData
    ? (cupomData.desconto_percentual
        ? subtotal * (Number(cupomData.desconto_percentual) / 100)
        : Math.min(Number(cupomData.desconto_valor), subtotal))
    : 0
  const total = Math.max(subtotal - valorDesconto + valorFrete, 0)

  if (sacola.length === 0) {
    return (
      <section style={{ padding: '40px 10%', fontFamily: "'Times New Roman', Times, serif" }}>
        <h1 style={{ textTransform: 'uppercase' }}>Sacola</h1>
        <p>Sua sacola está vazia.</p>
        <Link to="/" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 30px', backgroundColor: '#d8b8c8', color: '#000', textDecoration: 'none', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '8px' }}>
          Continuar comprando
        </Link>
      </section>
    )
  }

  return (
    <section className="bag-page">
      
      {/* LADO ESQUERDO: LISTA DE PRODUTOS */}
      <div className="bag-left">
        <h1 style={{ textTransform: 'uppercase', margin: '0', fontSize: '24px' }}>SACOLA</h1>
        <p style={{ textTransform: 'uppercase', margin: '5px 0 30px 0', fontSize: '14px', color: '#555' }}>
          ({sacola.length} PRODUTO{sacola.length > 1 ? 'S' : ''})
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {sacola.map((produto) => (
            <div key={produto.item_carrinho_id} className="bag-product-card">
              
              <div className="bag-product-left">
                <div className="bag-product-img">
                    <img src={produto.imagem || "https://via.placeholder.com/80?text=📦"} alt={produto.produto_nome} />
                </div>
                  
                <div style={{ flex: '1', minWidth: 0 }}>
                  <Link to={`/produto/${produto.produto_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '18px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>
                      {produto.produto_nome}
                    </h3>
                  </Link>
                  <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', textTransform: 'uppercase', margin: '0 0 15px 0', color: '#555' }}>
                    {produto.volume_ml} ML
                  </p>
                  <button 
                    onClick={() => removerProduto(produto.variacao_id)}
                    style={{ background: 'none', border: 'none', color: '#555', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                  >
                    Remover
                  </button>
                </div>
              </div>

              <div className="bag-product-actions">
                <div className="bag-quantity">
                  <button onClick={() => atualizarQuantidade(produto.variacao_id, produto.quantidade, -1)}>-</button>
                  <span style={{ fontSize: '16px', fontFamily: "'Times New Roman', Times, serif" }}>{produto.quantidade.toString().padStart(2, '0')}</span>
                  <button onClick={() => atualizarQuantidade(produto.variacao_id, produto.quantidade, 1)}>+</button>
                </div>

                <strong style={{ fontSize: '18px', color: '#8c2b53' }}>
                  R$ {formatarPreco(Number(produto.preco_unitario) * produto.quantidade)}
                </strong>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* LADO DIREITO: RESUMO E FRETE */}
      <div className="bag-right">
        
        {/* FRETE */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>Consulte o frete e o prazo de entrega</label>
          <div style={{ display: 'flex', border: `1px solid ${erroCep ? '#c0392b' : '#333'}`, borderRadius: '8px', padding: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '18px', marginRight: '10px' }}>🚚 |</span>
            <input
              type="text"
              placeholder="00000-000"
              value={cep}
              onChange={handleCepChange}
              maxLength={9}
              style={{ border: 'none', outline: 'none', flex: '1', fontFamily: "'Times New Roman', Times, serif" }}
            />
            {buscandoCep && <span style={{ fontSize: '12px', color: '#888' }}>🔍</span>}
          </div>
          {erroCep && <p style={{ fontSize: '11px', color: '#c0392b', margin: '4px 0 0' }}>{erroCep}</p>}
          {freteInfo && (
            <p style={{ fontSize: '11px', color: '#27ae60', margin: '6px 0 0' }}>
              📦 {freteInfo.cidade} ({freteInfo.uf}) — Entrega em até {freteInfo.prazo} dias úteis
            </p>
          )}
          <div style={{ textAlign: 'right', marginTop: '5px' }}>
            <a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: '#777', textTransform: 'uppercase', textDecoration: 'none' }}>Não sei meu CEP</a>
          </div>
        </div>

        {/* CUPOM */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>Possui Cupom?</label>
          {cupomData ? (
            <div style={{ border: '1px solid #27ae60', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4' }}>
              <div>
                <strong style={{ color: '#27ae60' }}>✓ {cupomData.codigo}</strong>
                <span style={{ fontSize: '12px', color: '#555', marginLeft: '8px' }}>
                  {cupomData.desconto_percentual ? `${cupomData.desconto_percentual}% off` : `R$ ${formatarPreco(cupomData.desconto_valor)} off`}
                </span>
              </div>
              <button onClick={removerCupom} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: '14px' }}>✕</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', border: `1px solid ${cupomErro ? '#c0392b' : '#333'}`, borderRadius: '8px', overflow: 'hidden' }}>
                <input 
                  type="text" 
                  value={cupom} 
                  onChange={(e) => { setCupom(e.target.value); setCupomErro("") }} 
                  placeholder="Digite o código"
                  style={{ border: 'none', outline: 'none', padding: '10px', flex: '1', fontFamily: "'Times New Roman', Times, serif", textTransform: 'uppercase' }} 
                />
                <button onClick={aplicarCupom} style={{ background: '#eee', border: 'none', padding: '0 15px', cursor: 'pointer', fontFamily: "'Times New Roman', Times, serif", textTransform: 'uppercase', fontSize: '12px' }}>Aplicar</button>
              </div>
              {cupomErro && <p style={{ fontSize: '11px', color: '#c0392b', margin: '4px 0 0' }}>{cupomErro}</p>}
            </>
          )}
        </div>

        {/* CAIXA DE RESUMO (A caixa "vazia" do Canvas agora tem utilidade!) */}
        <div style={{ border: '1px solid #333', borderRadius: '12px', padding: '20px', marginTop: '10px' }}>
          <h3 style={{ margin: '0 0 15px 0', textTransform: 'uppercase', fontSize: '16px' }}>Resumo do Pedido</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
            <span>Subtotal</span>
            <span>R$ {formatarPreco(subtotal)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
            <span>Frete</span>
            <span style={{ color: freteInfo ? '#333' : '#aaa' }}>
              {freteInfo ? `R$ ${formatarPreco(freteInfo.valor)}` : (buscandoCep ? 'Calculando...' : 'Insira o CEP')}
            </span>
          </div>

          {cupomData && valorDesconto > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: 'green' }}>
              <span>Desconto ({cupomData.codigo})</span>
              <span>- R$ {formatarPreco(valorDesconto)}</span>
            </div>
          )}

          <div style={{ borderTop: '1px solid #ccc', margin: '15px 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#8c2b53' }}>
            <span>Total</span>
            <span>R$ {formatarPreco(total)}</span>
          </div>
        </div>

        <button
          onClick={() => navigate("/endereco", { state: { cep: cep.replace(/\D/g, ""), frete: freteInfo, cupom_codigo: cupomData?.codigo || null } })}
          disabled={!freteInfo || buscandoCep}
          style={{
            backgroundColor: freteInfo ? '#d8b8c8' : '#e0e0e0',
            color: freteInfo ? '#000' : '#999',
            border: 'none',
            borderRadius: '8px',
            padding: '15px',
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            display: 'block',
            width: '100%',
            marginTop: '10px',
            cursor: freteInfo ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s'
          }}
        >
          {buscandoCep ? 'Verificando CEP...' : freteInfo ? 'CONTINUAR' : 'INFORME O CEP PARA CONTINUAR'}
        </button>

      </div>

    </section>
  )
}

export default Bag