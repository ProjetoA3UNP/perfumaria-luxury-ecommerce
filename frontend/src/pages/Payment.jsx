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
function CheckoutForm({ endereco, atualizarBadge }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

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
      setErro(error.message || "Erro ao processar pagamento.")
      setLoading(false)
      return
    }

    // Pagamento aprovado → salva o pedido no nosso backend
    if (paymentIntent && paymentIntent.status === "succeeded") {
      try {
        const response = await api.post("/orders/checkout", {
          endereco_id: endereco?.id || null,
          forma_pagamento: "CARTAO_CREDITO",
          stripe_payment_id: paymentIntent.id
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
        setLoading(false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="address-form" style={{ marginTop: "25px" }}>
      <PaymentElement />

      {erro && (
        <p style={{ color: "#c0392b", fontSize: "14px", marginTop: "10px", textAlign: "center" }}>
          {erro}
        </p>
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

  const [clientSecret, setClientSecret] = useState("")
  const [valorTotal, setValorTotal] = useState(0)
  const [erroInicio, setErroInicio] = useState("")

  useEffect(() => {
    async function iniciarPagamento() {
      try {
        const response = await api.post("/orders/create-payment-intent")
        setClientSecret(response.data.clientSecret)
        setValorTotal(response.data.amount)
      } catch (error) {
        setErroInicio(error.response?.data?.error || "Erro ao iniciar pagamento.")
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
            <p style={{ textAlign: "center", color: "#555", fontFamily: "'Cinzel', serif", marginBottom: "10px" }}>
              Total: <strong>R$ {(valorTotal / 100).toFixed(2).replace(".", ",")}</strong>
            </p>
          )}

          {erroInicio && (
            <p style={{ color: "#c0392b", textAlign: "center", marginTop: "20px" }}>{erroInicio}</p>
          )}

          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
              <CheckoutForm endereco={endereco} atualizarBadge={atualizarBadge} />
            </Elements>
          ) : !erroInicio ? (
            <p style={{ textAlign: "center", color: "#888", marginTop: "30px" }}>
              Preparando formulário de pagamento...
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default Payment