import { useLocation, useNavigate, Link } from "react-router-dom"
import "./address.css"

const STATUS_LABEL = {
  AGUARDANDO_PAGAMENTO: { text: "Aguardando Pagamento", color: "#e67e22" },
  PAGO: { text: "Pago", color: "#27ae60" },
  PROCESSANDO: { text: "Processando", color: "#2980b9" },
  ENVIADO: { text: "Enviado", color: "#8e44ad" },
  ENTREGUE: { text: "Entregue", color: "#27ae60" },
  CANCELADO: { text: "Cancelado", color: "#c0392b" },
}

function OrderDetail() {
  const location = useLocation()
  const navigate = useNavigate()
  const pedido = location.state?.pedido

  if (!pedido) {
    return (
      <section className="checkout-page">
        <div className="checkout-container">
          <div className="address-box" style={{ textAlign: "center" }}>
            <p style={{ color: "#888", margin: "20px 0" }}>Pedido não encontrado.</p>
            <Link to="/perfil" className="continue-btn-pink" style={{ textDecoration: "none", display: "inline-block" }}>
              VOLTAR AO PERFIL
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const statusInfo = STATUS_LABEL[pedido.status] || { text: pedido.status, color: "#333" }

  function formatarPreco(valor) {
    return Number(valor).toFixed(2).replace(".", ",")
  }

  function formatarData(dataStr) {
    if (!dataStr) return "—"
    return new Date(dataStr).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    })
  }

  const subtotal = pedido.itens?.reduce((acc, item) => acc + Number(item.preco_unitario) * item.quantidade, 0) || 0
  const totalComFrete = Number(pedido.valor_total)
  const frete = totalComFrete - subtotal

  return (
    <section className="checkout-page">
      <div className="checkout-container" style={{ maxWidth: "700px" }}>

        {/* Botão Voltar */}
        <button
          onClick={() => navigate("/perfil")}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontFamily: "'Cinzel', serif", fontSize: "13px", color: "#96305a", marginBottom: "20px", padding: 0, textTransform: "uppercase" }}
        >
          ← Voltar para Minha Conta
        </button>

        <div className="address-box">
          {/* Cabeçalho do Pedido */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
            <div>
              <h2 style={{ margin: 0, color: "#96305a", fontFamily: "'Cinzel', serif", textTransform: "uppercase", fontSize: "20px" }}>
                {pedido.numero_pedido}
              </h2>
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#888" }}>
                {formatarData(pedido.data)}
              </p>
            </div>
            <span style={{
              background: statusInfo.color + "18",
              color: statusInfo.color,
              border: `1px solid ${statusInfo.color}`,
              borderRadius: "20px",
              padding: "6px 16px",
              fontSize: "13px",
              fontWeight: "bold",
              fontFamily: "'Cinzel', serif"
            }}>
              {statusInfo.text}
            </span>
          </div>

          {/* Produtos */}
          <div style={{ borderTop: "1px solid #eee", paddingTop: "20px", marginBottom: "20px" }}>
            <p style={{ fontFamily: "'Cinzel', serif", fontWeight: "bold", color: "#96305a", textTransform: "uppercase", fontSize: "12px", marginBottom: "14px" }}>
              Produtos
            </p>
            {pedido.itens?.map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                <img
                  src={item.imagem}
                  alt={item.produto_nome}
                  style={{ width: "55px", height: "70px", objectFit: "contain", flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: "bold", fontSize: "14px", margin: 0 }}>{item.produto_nome}</p>
                  <p style={{ fontSize: "12px", color: "#666", margin: "4px 0" }}>
                    {item.quantidade}× {item.volume_ml ? `${item.volume_ml}ml` : ""}
                  </p>
                  <p style={{ fontSize: "12px", color: "#999", margin: 0 }}>
                    Unitário: R$ {formatarPreco(item.preco_unitario)}
                  </p>
                </div>
                <p style={{ fontWeight: "bold", fontSize: "14px", color: "#333", whiteSpace: "nowrap" }}>
                  R$ {formatarPreco(item.preco_unitario * item.quantidade)}
                </p>
              </div>
            ))}
          </div>

          {/* Resumo financeiro */}
          <div style={{ background: "#faf7f9", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" }}>
            <p style={{ fontFamily: "'Cinzel', serif", fontWeight: "bold", color: "#96305a", textTransform: "uppercase", fontSize: "12px", marginBottom: "12px" }}>
              Resumo do Pedido
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
              <span>Subtotal</span>
              <span>R$ {formatarPreco(subtotal)}</span>
            </div>
            {frete > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
                <span>Frete</span>
                <span>R$ {formatarPreco(frete)}</span>
              </div>
            )}
            <div style={{ borderTop: "1px solid #eee", marginTop: "10px", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "bold" }}>
              <span>Total</span>
              <span style={{ color: "#96305a" }}>R$ {formatarPreco(totalComFrete)}</span>
            </div>
          </div>

          {/* Pagamento */}
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontFamily: "'Cinzel', serif", fontWeight: "bold", color: "#96305a", textTransform: "uppercase", fontSize: "12px", marginBottom: "10px" }}>
              Pagamento
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>💳</span>
              <p style={{ margin: 0, fontSize: "14px", color: "#444" }}>
                {pedido.forma_pagamento?.replace(/_/g, " ") || "—"}
              </p>
            </div>
          </div>

          {/* Endereço de Entrega */}
          {(pedido.rua || pedido.endereco_titulo) && (
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontFamily: "'Cinzel', serif", fontWeight: "bold", color: "#96305a", textTransform: "uppercase", fontSize: "12px", marginBottom: "10px" }}>
                Endereço de Entrega
              </p>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ fontSize: "20px", marginTop: "2px" }}>📍</span>
                <div>
                  {pedido.endereco_titulo && (
                    <p style={{ margin: "0 0 4px", fontWeight: "bold", fontSize: "13px", textTransform: "uppercase" }}>
                      {pedido.endereco_titulo}
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: "14px", color: "#444", lineHeight: "1.6" }}>
                    {[pedido.rua, pedido.numero, pedido.bairro].filter(Boolean).join(", ")}
                    {pedido.cep ? ` — CEP: ${pedido.cep}` : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
            <Link to="/perfil" className="continue-btn-pink" style={{ textDecoration: "none", display: "inline-block", textAlign: "center" }}>
              VOLTAR PARA MINHA CONTA
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default OrderDetail
