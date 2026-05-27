import { Link, useLocation } from "react-router-dom"
import "./address.css"

// Componente do stepper reutilizável
function StepBar({ activeStep }) {
  const steps = [
    {
      label: "Sacola",
      icon: (
        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      )
    },
    {
      label: "Endereço",
      icon: (
        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      )
    },
    {
      label: "Pagamento",
      icon: (
        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      )
    },
    {
      label: "Recebido",
      icon: (
        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )
    }
  ]

  return (
    <div className="checkout-steps">
      {steps.map((step, i) => {
        const isCompleted = i < activeStep
        const isActive = i === activeStep
        return (
          <div key={step.label} className={`step ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}>
            <div className="step-icon">{step.icon}</div>
            <span>{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function OrderSuccess() {
  const location = useLocation()
  const { numero_pedido, endereco, forma_pagamento, itens, valor_total } = location.state || {}

  function formatarPreco(valor) {
    return Number(valor).toFixed(2).replace(".", ",")
  }

  function formatarEndereco(end) {
    if (!end) return "—"
    const partes = [end.rua, end.bairro, end.numero, end.complemento, end.cep]
      .filter(Boolean)
      .join(", ")
    return partes.toUpperCase()
  }

  return (
    <section className="checkout-page">
      <div className="checkout-container">

        {/* Barra de Progresso — passo 3 = Recebido (índice 3) */}
        <StepBar activeStep={3} />

        {/* Box de Conclusão */}
        <div className="address-box" style={{ maxWidth: "600px" }}>

          <h2 style={{ color: "#96305a", fontFamily: "'Cinzel', serif", textAlign: "center", marginBottom: "8px" }}>
            Pedido Concluído!
          </h2>

          <p style={{ textAlign: "center", fontFamily: "'Cinzel', serif", fontSize: "13px", color: "#555", marginBottom: "25px", textTransform: "uppercase" }}>
            Número do pedido: {numero_pedido || "—"}
          </p>

          {/* Resumo */}
          <div style={{ borderTop: "1px solid #eee", paddingTop: "20px" }}>
            <p style={{ fontFamily: "'Cinzel', serif", fontWeight: "bold", color: "#96305a", textTransform: "uppercase", fontSize: "13px", marginBottom: "12px" }}>
              Resumo do pedido:
            </p>

            <p style={{ fontSize: "14px", marginBottom: "6px" }}>
              <strong style={{ fontFamily: "'Cinzel', serif", textTransform: "uppercase" }}>Forma de pagamento:</strong>{" "}
              {forma_pagamento || "—"}
            </p>

            {endereco && (
              <p style={{ fontSize: "14px", marginBottom: "6px" }}>
                <strong style={{ fontFamily: "'Cinzel', serif", textTransform: "uppercase" }}>Endereço de entrega:</strong>{" "}
                {formatarEndereco(endereco)}
              </p>
            )}
          </div>

          {/* Produtos */}
          {itens && itens.length > 0 && (
            <div style={{ marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
              <p style={{ fontFamily: "'Cinzel', serif", fontWeight: "bold", color: "#96305a", textTransform: "uppercase", fontSize: "13px", marginBottom: "14px" }}>
                Produto:
              </p>

              {itens.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    border: "1px solid #eee",
                    borderRadius: "12px",
                    padding: "12px",
                    marginBottom: "10px"
                  }}
                >
                  <img
                    src={item.imagem}
                    alt={item.nome}
                    style={{ width: "55px", height: "70px", objectFit: "contain", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "bold", fontSize: "14px", margin: 0 }}>{(item.marca || item.produto_nome)?.toUpperCase()}</p>
                    <p style={{ fontSize: "12px", color: "#555", margin: "4px 0" }}>
                      {item.quantidade}x {item.produto_nome || item.nome}
                      {item.volume_ml ? ` ${item.volume_ml}ml` : ""}
                    </p>
                  </div>
                  <p style={{ fontWeight: "bold", color: "#333", fontSize: "14px", whiteSpace: "nowrap" }}>
                    R$ {formatarPreco(Number(item.preco_unitario || item.preco || item.subtotal / item.quantidade || 0) * item.quantidade)}
                  </p>
                </div>
              ))}

              {valor_total && (
                <p style={{ textAlign: "right", fontWeight: "bold", fontSize: "15px", marginTop: "10px", fontFamily: "'Cinzel', serif" }}>
                  Total: R$ {formatarPreco(valor_total)}
                </p>
              )}
            </div>
          )}

          {/* Botão */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: "30px" }}>
            <Link to="/" className="continue-btn-pink" style={{ textDecoration: "none", display: "inline-block", textAlign: "center" }}>
              CONTINUAR NAVEGANDO
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}

export default OrderSuccess