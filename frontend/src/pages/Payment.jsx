import { useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect, useContext } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import api from "../services/api"
import { CartContext } from "../contexts/CartContext"
import "./address.css"

// Inicializa Stripe (chave pública do .env do Vite)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

// --- Componente interno que tem acesso ao contexto do Stripe ---
function CheckoutForm({ endereco, atualizarBadge, cupom_codigo }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [showModal, setShowModal] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setErro("")

    // Busca itens do carrinho ANTES de confirmar (para o resumo)
    let itensCarrinho = []
    try {
      const cartRes = await api.get("/cart")
      itensCarrinho = cartRes.data.itens || []
    } catch (_) {}

    // Confirma o pagamento com a Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required"
    })

    if (error) {
      setErro(error.message || "Erro ao processar pagamento. Verifique os dados do cartão.")
      setShowModal(true)
      setLoading(false)
      return
    }

    // Pagamento aprovado → salva o pedido no nosso backend
    if (paymentIntent && paymentIntent.status === "succeeded") {
      try {
        const response = await api.post("/orders/checkout", {
          endereco_id: endereco?.id || null,
          forma_pagamento: "CARTAO_CREDITO",
          stripe_payment_id: paymentIntent.id,
          cupom_codigo: cupom_codigo || null
        })
        atualizarBadge()
        navigate("/pedido-concluido", {
          state: {
            numero_pedido: response.data.numero_pedido,
            valor_total: response.data.valor_total,
            forma_pagamento: "Cartão de Crédito",
            endereco,
            itens: itensCarrinho
          }
        })
      } catch (err) {
        setErro(err.response?.data?.error || "Pagamento aprovado, mas erro ao registrar pedido. Contate o suporte.")
        setShowModal(true)
        setLoading(false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="address-form" style={{ marginTop: "25px" }}>
      <PaymentElement />

      {/* POPUP MODAL PREMIUM DE ERRO DE PAGAMENTO */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '24px',
            padding: '40px 30px',
            maxWidth: '420px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            border: '1px solid #f1f1f1',
            boxSizing: 'border-box'
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              backgroundColor: '#fdf3f3', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px auto',
              border: '2px solid #f5c2c2'
            }}>
              <span style={{ fontSize: '30px' }}>💳</span>
            </div>
            <h2 style={{ fontFamily: "'Times New Roman', Times, serif", color: '#8c2b53', fontSize: '22px', textTransform: 'uppercase', marginBottom: '12px', marginTop: 0 }}>
              Falha no Pagamento
            </h2>
            <p style={{ fontFamily: "Arial, sans-serif", color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px', padding: '0 10px' }}>
              {erro}
            </p>
            <button 
              onClick={() => setShowModal(false)}
              style={{
                backgroundColor: '#8c2b53',
                color: 'white',
                border: 'none',
                padding: '14px 40px',
                borderRadius: '12px',
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '15px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: '0 4px 12px rgba(140, 43, 83, 0.2)'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#721e41'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#8c2b53'}
            >
              Corrigir Dados
            </button>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="continue-btn-pink"
        style={{ marginTop: "30px" }}
      >
        {loading ? "Processando..." : "FINALIZAR COMPRA"}
      </button>
    </form>
  )
}

// --- Componente principal da página ---
function Payment() {
  const location = useLocation()
  const { atualizarBadge } = useContext(CartContext)
  const endereco = location.state?.endereco || {}
  const cupom_codigo = location.state?.cupom_codigo || null

  const [clientSecret, setClientSecret] = useState("")
  const [valorTotal, setValorTotal] = useState(0)
  const [erroInicio, setErroInicio] = useState("")
  const [showModalInicio, setShowModalInicio] = useState(false)

  // --- Estados do PIX Simulado ---
  const [metodoPagamento, setMetodoPagamento] = useState("cartao")
  const [loadingPix, setLoadingPix] = useState(false)
  const navigate = useNavigate()

  async function handlePixSubmit() {
    setLoadingPix(true)
    
    // Busca itens para o resumo da próxima tela
    let itensCarrinho = []
    try {
      const cartRes = await api.get("/cart")
      itensCarrinho = cartRes.data.itens || []
    } catch (_) {}

    try {
      const response = await api.post("/orders/checkout", {
        endereco_id: endereco?.id || null,
        forma_pagamento: "PIX",
        stripe_payment_id: "pix_simulado_faculdade",
        cupom_codigo: cupom_codigo || null
      })
      atualizarBadge()
      navigate("/pedido-concluido", {
        state: {
          numero_pedido: response.data.numero_pedido,
          valor_total: response.data.valor_total,
          forma_pagamento: "PIX",
          endereco,
          itens: itensCarrinho
        }
      })
    } catch (err) {
      setErroInicio(err.response?.data?.error || "Erro ao processar pagamento via PIX.")
      setShowModalInicio(true)
      setLoadingPix(false)
    }
  }

  useEffect(() => {
    async function iniciarPagamento() {
      try {
        const response = await api.post("/orders/create-payment-intent")
        setClientSecret(response.data.clientSecret)
        setValorTotal(response.data.amount)
      } catch (error) {
        setErroInicio(error.response?.data?.error || "Erro ao iniciar o gateway de pagamento. Verifique as configurações de sua conta ou tente novamente mais tarde.")
        setShowModalInicio(true)
      }
    }
    iniciarPagamento()
  }, [])

  const appearance = {
    theme: "stripe",
    variables: {
      colorPrimary: "#96305a",
      colorBackground: "#ffffff",
      colorText: "#333333",
      borderRadius: "12px",
      fontFamily: "Cinzel, serif"
    }
  }

  return (
    <section className="checkout-page">
      <div className="checkout-container">

        {/* POPUP MODAL PREMIUM DE ERRO DE INICIALIZAÇÃO */}
        {showModalInicio && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '24px',
              padding: '40px 30px',
              maxWidth: '420px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
              border: '1px solid #f1f1f1',
              boxSizing: 'border-box'
            }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                backgroundColor: '#fdf3f3', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 20px auto',
                border: '2px solid #f5c2c2'
              }}>
                <span style={{ fontSize: '30px' }}>⚠️</span>
              </div>
              <h2 style={{ fontFamily: "'Times New Roman', Times, serif", color: '#8c2b53', fontSize: '22px', textTransform: 'uppercase', marginBottom: '12px', marginTop: 0 }}>
                Erro de Inicialização
              </h2>
              <p style={{ fontFamily: "Arial, sans-serif", color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px', padding: '0 10px' }}>
                {erroInicio}
              </p>
              <button 
                onClick={() => {
                  setShowModalInicio(false)
                  window.location.reload()
                }}
                style={{
                  backgroundColor: '#8c2b53',
                  color: 'white',
                  border: 'none',
                  padding: '14px 40px',
                  borderRadius: '12px',
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '15px',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 4px 12px rgba(140, 43, 83, 0.2)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#721e41'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#8c2b53'}
              >
                Recarregar Página
              </button>
            </div>
          </div>
        )}

        {/* Barra de Progresso */}
        <div className="checkout-steps">
          <div className="step completed">
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
            <span>Sacola</span>
          </div>

          <div className="step completed">
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <span>Endereço</span>
          </div>

          <div className="step active">
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <span>Pagamento</span>
          </div>

          <div className="step">
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <span>Recebido</span>
          </div>
        </div>

        {/* Box de Pagamento */}
        <div className="address-box">
          <h2>Pagamento</h2>

          {valorTotal > 0 && (
            <p style={{ textAlign: "center", color: "#555", fontFamily: "'Cinzel', serif", marginBottom: "20px" }}>
              Total: <strong>R$ {(valorTotal / 100).toFixed(2).replace(".", ",")}</strong>
            </p>
          )}

          {/* Toggle de Método de Pagamento */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '30px' }}>
            <button 
              type="button"
              onClick={() => setMetodoPagamento("cartao")}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: metodoPagamento === "cartao" ? '2px solid #96305a' : '1px solid #ccc',
                backgroundColor: metodoPagamento === "cartao" ? '#fdf3f3' : '#fff',
                color: metodoPagamento === "cartao" ? '#96305a' : '#555',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              💳 Cartão de Crédito
            </button>
            <button 
              type="button"
              onClick={() => setMetodoPagamento("pix")}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: metodoPagamento === "pix" ? '2px solid #27ae60' : '1px solid #ccc',
                backgroundColor: metodoPagamento === "pix" ? '#eafaf1' : '#fff',
                color: metodoPagamento === "pix" ? '#27ae60' : '#555',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              💠 PIX
            </button>
          </div>

          {metodoPagamento === "cartao" ? (
            clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                <CheckoutForm endereco={endereco} atualizarBadge={atualizarBadge} cupom_codigo={cupom_codigo} />
              </Elements>
            ) : !erroInicio ? (
              <p style={{ textAlign: "center", color: "#888", marginTop: "30px" }}>
                Preparando formulário de pagamento...
              </p>
            ) : null
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #ddd', borderRadius: '12px' }}>
              <h3 style={{ color: '#27ae60', fontFamily: "'Times New Roman', Times, serif", marginBottom: '15px' }}>Pagamento via PIX</h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                Escaneie o QR Code abaixo com o aplicativo do seu banco para pagar. (Simulação)
              </p>
              
              <div style={{ width: '150px', height: '150px', backgroundColor: '#f5f5f5', border: '2px dashed #ccc', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', marginBottom: '20px' }}>
                <span style={{ color: '#aaa', fontSize: '12px' }}>[ QR CODE FALSO ]</span>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>Ou use o recurso Copia e Cola:</p>
                <div style={{ padding: '10px', backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '4px', fontSize: '11px', wordBreak: 'break-all', color: '#444' }}>
                  00020101021126580014br.gov.bcb.pix0136SIMULACAO-FACULDADE-1234567890
                </div>
              </div>

              <button
                type="button"
                onClick={handlePixSubmit}
                disabled={loadingPix}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 'bold',
                  fontSize: '15px',
                  cursor: loadingPix ? 'not-allowed' : 'pointer',
                  opacity: loadingPix ? 0.7 : 1
                }}
              >
                {loadingPix ? "Processando..." : "SIMULAR PAGAMENTO PIX"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Payment