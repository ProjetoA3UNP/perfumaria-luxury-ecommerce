import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"

const STATUS_LABEL = {
  AGUARDANDO_PAGAMENTO: { text: "Aguardando", color: "#e67e22" },
  PAGO: { text: "Pago", color: "#27ae60" },
  PROCESSANDO: { text: "Processando", color: "#2980b9" },
  ENVIADO: { text: "Enviado", color: "#8e44ad" },
  ENTREGUE: { text: "Entregue", color: "#27ae60" },
  CANCELADO: { text: "Cancelado", color: "#c0392b" },
}

const FRETE_POR_UF = {
  SP: 2, RJ: 2, MG: 3, ES: 3, PR: 3, SC: 3, RS: 4,
  GO: 4, DF: 4, MT: 5, MS: 5, BA: 5, SE: 5, AL: 5,
  PE: 5, PB: 6, RN: 6, CE: 6, PI: 7, MA: 7,
  TO: 7, PA: 8, AM: 10, RO: 9, AC: 12, RR: 11, AP: 11,
}

const FORM_VAZIO = { titulo: "", cep: "", rua: "", bairro: "", numero: "", complemento: "", principal: false }

// ── Modal genérico ──────────────────────────────────────────────
function Modal({ titulo, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "18px", padding: "32px", width: "100%", maxWidth: "520px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "20px", background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#999" }}>✕</button>
        <h3 style={{ fontFamily: "'Cinzel', serif", color: "#96305a", textTransform: "uppercase", margin: "0 0 24px" }}>{titulo}</h3>
        {children}
      </div>
    </div>
  )
}

// ── Formulário de endereço ──────────────────────────────────────
function FormEndereco({ initial, onSave, onCancel, salvando }) {
  const [form, setForm] = useState(initial || FORM_VAZIO)
  const [buscando, setBuscando] = useState(false)
  const [erroCep, setErroCep] = useState("")

  async function buscarCep(cep) {
    const limpo = cep.replace(/\D/g, "")
    if (limpo.length !== 8) return
    setBuscando(true); setErroCep("")
    try {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`)
      const data = await res.json()
      if (data.erro) { setErroCep("CEP não encontrado."); return }
      setForm(f => ({ ...f, rua: data.logradouro || f.rua, bairro: data.bairro || f.bairro, cep: limpo }))
    } catch { setErroCep("Erro ao consultar CEP.") }
    finally { setBuscando(false) }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    const val = type === "checkbox" ? checked : value
    setForm(f => ({ ...f, [name]: val }))
    if (name === "cep" && value.replace(/\D/g, "").length === 8) buscarCep(value)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (form.cep.replace(/\D/g, "").length !== 8) { setErroCep("CEP inválido."); return }
    onSave(form)
  }

  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "10px", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }
  const labelStyle = { fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "4px", display: "block", color: "#555" }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Título</label>
          <input required name="titulo" value={form.titulo} onChange={handleChange} style={inputStyle} placeholder="Ex: Casa, Trabalho..." />
        </div>
        <div>
          <label style={labelStyle}>CEP *</label>
          <input required name="cep" value={form.cep} onChange={handleChange} maxLength={9} style={{ ...inputStyle, borderColor: erroCep ? "#c0392b" : "#ddd" }} placeholder="00000-000" />
          {buscando && <small style={{ color: "#888" }}>Buscando...</small>}
          {erroCep && <small style={{ color: "#c0392b" }}>{erroCep}</small>}
        </div>
        <div>
          <label style={labelStyle}>Número</label>
          <input required name="numero" value={form.numero} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Rua</label>
          <input required name="rua" value={form.rua} onChange={handleChange} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Bairro</label>
          <input required name="bairro" value={form.bairro} onChange={handleChange} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Complemento</label>
          <input name="complemento" value={form.complemento} onChange={handleChange} style={inputStyle} placeholder="Apto, bloco..." />
        </div>
        <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => setForm(f => ({ ...f, principal: !f.principal }))}>
          <input type="checkbox" name="principal" checked={form.principal} readOnly style={{ width: "16px", height: "16px", accentColor: "#96305a" }} />
          <label style={{ fontSize: "13px", cursor: "pointer" }}>Definir como endereço principal</label>
        </div>
      </div>
      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <button type="submit" disabled={salvando} style={{ flex: 1, background: "#96305a", color: "#fff", border: "none", borderRadius: "10px", padding: "12px", fontFamily: "'Cinzel', serif", fontSize: "13px", cursor: "pointer", textTransform: "uppercase" }}>
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" onClick={onCancel} style={{ flex: 1, background: "#f0f0f0", color: "#555", border: "none", borderRadius: "10px", padding: "12px", fontFamily: "'Cinzel', serif", fontSize: "13px", cursor: "pointer", textTransform: "uppercase" }}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ── Componente Principal ────────────────────────────────────────
function Profile() {
  const navigate = useNavigate()
  const [abaAtiva, setAbaAtiva] = useState("dados")
  const [userData, setUserData] = useState(null)
  const [enderecos, setEnderecos] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loadingPedidos, setLoadingPedidos] = useState(false)

  // Edição dados pessoais
  const [editando, setEditando] = useState(false)
  const [formEdit, setFormEdit] = useState({ nome: "", data_nascimento: "" })
  const [salvando, setSalvando] = useState(false)

  // Modais de endereço
  const [modalEndereco, setModalEndereco] = useState(null) // null | "novo" | { enderecoParaEditar }
  const [salvandoEnd, setSalvandoEnd] = useState(false)

  useEffect(() => {
    async function carregar() {
      try {
        const [resUser, resEnd] = await Promise.all([api.get("/auth/me"), api.get("/addresses")])
        setUserData(resUser.data)
        setEnderecos(resEnd.data)
      } catch (e) { console.error(e) }
    }
    carregar()
  }, [])

  async function carregarPedidos() {
    if (pedidos.length > 0) return
    setLoadingPedidos(true)
    try { const res = await api.get("/orders"); setPedidos(res.data) }
    catch (e) { console.error(e) }
    finally { setLoadingPedidos(false) }
  }

  function handleAba(aba) { setAbaAtiva(aba); if (aba === "pedidos") carregarPedidos() }

  function iniciarEdicao() {
    setFormEdit({ nome: userData.nome || "", data_nascimento: userData.data_nascimento ? new Date(userData.data_nascimento).toISOString().split("T")[0] : "" })
    setEditando(true)
  }

  async function salvarEdicao(e) {
    e.preventDefault(); setSalvando(true)
    try { const res = await api.put("/auth/me", formEdit); setUserData(res.data); setEditando(false) }
    catch { alert("Erro ao salvar.") }
    finally { setSalvando(false) }
  }

  async function salvarEndereco(form) {
    setSalvandoEnd(true)
    try {
      if (modalEndereco === "novo") {
        const res = await api.post("/addresses", form)
        setEnderecos(prev => [...prev, res.data.address])
      } else {
        const res = await api.put(`/addresses/${modalEndereco.id}`, form)
        setEnderecos(prev => prev.map(e => e.id === modalEndereco.id ? res.data.address : e))
      }
      // Recarrega para sincronizar principal
      const res = await api.get("/addresses")
      setEnderecos(res.data)
      setModalEndereco(null)
    } catch (e) { alert(e.response?.data?.error || "Erro ao salvar endereço.") }
    finally { setSalvandoEnd(false) }
  }

  async function removerEndereco(id) {
    if (!window.confirm("Remover este endereço?")) return
    try { await api.delete(`/addresses/${id}`); setEnderecos(prev => prev.filter(e => e.id !== id)) }
    catch { alert("Erro ao remover endereço.") }
  }

  function formatarData(d) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }
  function formatarPreco(v) { return Number(v).toFixed(2).replace(".", ",") }

  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "10px", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }
  const labelStyle = { fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "4px", display: "block", color: "#555" }

  if (!userData) return (
    <section className="profile-page"><div className="profile-container">
      <p style={{ textAlign: "center", marginTop: "50px" }}>Carregando perfil...</p>
    </div></section>
  )

  const dataNascimento = userData.data_nascimento
    ? new Date(userData.data_nascimento).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "Não informada"

  return (
    <section className="profile-page">
      <div className="profile-container">
        <h1>Minha Conta</h1>

        {/* Modais de endereço */}
        {modalEndereco !== null && (
          <Modal
            titulo={modalEndereco === "novo" ? "Novo Endereço" : "Editar Endereço"}
            onClose={() => setModalEndereco(null)}
          >
            <FormEndereco
              initial={modalEndereco === "novo" ? FORM_VAZIO : modalEndereco}
              onSave={salvarEndereco}
              onCancel={() => setModalEndereco(null)}
              salvando={salvandoEnd}
            />
          </Modal>
        )}

        {/* Abas */}
        <div style={{ display: "flex", borderBottom: "2px solid #eee", marginBottom: "30px" }}>
          {[{ id: "dados", label: "Meus Dados" }, { id: "pedidos", label: "Meus Pedidos" }].map(aba => (
            <button key={aba.id} onClick={() => handleAba(aba.id)} style={{
              padding: "12px 28px", background: "none", border: "none", cursor: "pointer",
              fontFamily: "'Cinzel', serif", fontSize: "14px", textTransform: "uppercase",
              fontWeight: abaAtiva === aba.id ? "bold" : "normal",
              color: abaAtiva === aba.id ? "#96305a" : "#666",
              borderBottom: abaAtiva === aba.id ? "3px solid #96305a" : "3px solid transparent",
              marginBottom: "-2px", transition: "all 0.2s"
            }}>{aba.label}</button>
          ))}
        </div>

        {/* ── ABA MEUS DADOS ── */}
        {abaAtiva === "dados" && (<>
          {/* Dados Pessoais */}
          <div className="profile-box">
            <h3>Dados Pessoais</h3>
            {!editando ? (<>
              <div className="info-grid">
                <p><strong>E-mail:</strong> {userData.email}</p>
                <p><strong>Nome Completo:</strong> {userData.nome}</p>
                <p><strong>CPF:</strong> {userData.cpf ? userData.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "Não informado"}</p>
                <p><strong>Data de Nascimento:</strong> {dataNascimento}</p>
              </div>
              <button onClick={iniciarEdicao}>Alterar Dados</button>
            </>) : (
              <form onSubmit={salvarEdicao}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                  <div>
                    <label style={labelStyle}>Nome Completo</label>
                    <input value={formEdit.nome} onChange={e => setFormEdit({ ...formEdit, nome: e.target.value })} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Data de Nascimento</label>
                    <input type="date" value={formEdit.data_nascimento} onChange={e => setFormEdit({ ...formEdit, data_nascimento: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                <small style={{ color: "#888", display: "block", marginBottom: "16px" }}>* E-mail e CPF não podem ser alterados por segurança.</small>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar Alterações"}</button>
                  <button type="button" onClick={() => setEditando(false)} style={{ background: "#eee", color: "#333" }}>Cancelar</button>
                </div>
              </form>
            )}
          </div>

          {/* Endereços */}
          <div className="profile-box">
            <h3>Endereços</h3>
            {enderecos.length === 0 ? (
              <p className="address">Nenhum endereço cadastrado.</p>
            ) : enderecos.map(end => (
              <div key={end.id} style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #f0f0f0" }}>
                <p className="address">
                  <strong>{end.titulo?.toUpperCase()}:</strong> {end.rua}, {end.bairro}, {end.numero}
                  {end.complemento ? ` - ${end.complemento}` : ""} — CEP: {end.cep}
                </p>
                {Boolean(end.principal) && <p className="main-address">(Endereço principal)</p>}
                <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                  <button onClick={() => setModalEndereco(end)} style={{ fontSize: "12px", padding: "5px 14px" }}>Editar</button>
                  <button onClick={() => removerEndereco(end.id)} style={{ fontSize: "12px", padding: "5px 14px", background: "#fdecea", color: "#c0392b", border: "1px solid #e74c3c" }}>Remover</button>
                </div>
              </div>
            ))}
            <div className="profile-actions" style={{ marginTop: "10px" }}>
              <button onClick={() => setModalEndereco("novo")}>Adicionar Endereço</button>
            </div>
          </div>

          {/* Cartões — apenas visual */}
          <div className="profile-box">
            <h3>Cartões</h3>
            <p className="empty-card">Nenhum cartão cadastrado</p>
            <button style={{ opacity: 0.5, cursor: "not-allowed" }} title="Em breve">Adicionar Cartão</button>
          </div>
        </>)}

        {/* ── ABA MEUS PEDIDOS ── */}
        {abaAtiva === "pedidos" && (
          <div>
            {loadingPedidos && <p style={{ textAlign: "center", color: "#888", marginTop: "30px" }}>Carregando pedidos...</p>}
            {!loadingPedidos && pedidos.length === 0 && (
              <div className="profile-box" style={{ textAlign: "center" }}>
                <p style={{ color: "#888", margin: "20px 0" }}>Você ainda não realizou nenhuma compra.</p>
              </div>
            )}
            {pedidos.map(pedido => {
              const s = STATUS_LABEL[pedido.status] || { text: pedido.status, color: "#333" }
              return (
                <div key={pedido.id} className="profile-box"
                  onClick={() => navigate(`/pedidos/${pedido.id}`, { state: { pedido } })}
                  style={{ marginBottom: "16px", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(150,48,90,0.12)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = ""}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                    <div>
                      <p style={{ fontFamily: "'Cinzel', serif", fontWeight: "bold", fontSize: "15px", color: "#333", margin: 0 }}>{pedido.numero_pedido}</p>
                      <p style={{ fontSize: "12px", color: "#888", margin: "4px 0 0" }}>{formatarData(pedido.data)} · {pedido.forma_pagamento?.replace(/_/g, " ")}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{ background: s.color + "20", color: s.color, border: `1px solid ${s.color}`, borderRadius: "20px", padding: "4px 14px", fontSize: "12px", fontWeight: "bold", fontFamily: "'Cinzel', serif" }}>{s.text}</span>
                      <p style={{ fontWeight: "bold", fontSize: "16px", color: "#333", margin: 0 }}>R$ {formatarPreco(pedido.valor_total)}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {pedido.itens?.slice(0, 4).map((item, idx) => (
                      <img key={idx} src={item.imagem} alt={item.produto_nome} style={{ width: "42px", height: "54px", objectFit: "contain", border: "1px solid #f0f0f0", borderRadius: "6px", padding: "2px" }} />
                    ))}
                    {pedido.itens?.length > 4 && <span style={{ fontSize: "12px", color: "#888" }}>+{pedido.itens.length - 4} mais</span>}
                    <span style={{ marginLeft: "auto", fontSize: "12px", color: "#96305a", fontFamily: "'Cinzel', serif" }}>VER DETALHES →</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default Profile