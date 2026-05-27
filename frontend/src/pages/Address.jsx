import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import "./address.css"

// Tabela de frete simulada por UF (sem Correios/CNPJ)
const FRETE_POR_UF = {
  // Sudeste
  SP: { valor: 15.90, prazo: 2 }, RJ: { valor: 15.90, prazo: 2 },
  MG: { valor: 17.90, prazo: 3 }, ES: { valor: 17.90, prazo: 3 },
  // Sul
  PR: { valor: 19.90, prazo: 3 }, SC: { valor: 19.90, prazo: 3 }, RS: { valor: 21.90, prazo: 4 },
  // Centro-Oeste
  GO: { valor: 22.90, prazo: 4 }, DF: { valor: 22.90, prazo: 4 },
  MT: { valor: 24.90, prazo: 5 }, MS: { valor: 24.90, prazo: 5 },
  // Nordeste
  BA: { valor: 24.90, prazo: 5 }, SE: { valor: 25.90, prazo: 5 },
  AL: { valor: 25.90, prazo: 5 }, PE: { valor: 25.90, prazo: 5 },
  PB: { valor: 26.90, prazo: 6 }, RN: { valor: 26.90, prazo: 6 },
  CE: { valor: 26.90, prazo: 6 }, PI: { valor: 27.90, prazo: 7 }, MA: { valor: 27.90, prazo: 7 },
  // Norte
  TO: { valor: 28.90, prazo: 7 }, PA: { valor: 30.90, prazo: 8 },
  AM: { valor: 33.90, prazo: 10 }, RO: { valor: 32.90, prazo: 9 },
  AC: { valor: 35.90, prazo: 12 }, RR: { valor: 34.90, prazo: 11 }, AP: { valor: 34.90, prazo: 11 },
}

function Address() {
  const navigate = useNavigate()

  const [enderecosSalvos, setEnderecosSalvos] = useState([])
  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState(null)
  const [isNovoEndereco, setIsNovoEndereco] = useState(false)

  const [enderecoForm, setEnderecoForm] = useState({
    titulo: "", cep: "", rua: "", numero: "", bairro: "", complemento: "", uf: ""
  })

  const [salvarEndereco, setSalvarEndereco] = useState(true)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [erroCep, setErroCep] = useState("")
  const [frete, setFrete] = useState(null)

  useEffect(() => {
    async function carregarEnderecos() {
      try {
        const response = await api.get("/addresses")
        setEnderecosSalvos(response.data)
        if (response.data.length > 0) {
          selecionarEndereco(response.data[0])
        } else {
          setIsNovoEndereco(true)
        }
      } catch (error) {
        console.error("Erro ao carregar endereços", error)
        setIsNovoEndereco(true)
      }
    }
    carregarEnderecos()
  }, [])

  // Busca endereço na ViaCEP quando CEP estiver completo (8 dígitos)
  const buscarCep = useCallback(async (cep) => {
    const cepLimpo = cep.replace(/\D/g, "")
    if (cepLimpo.length !== 8) {
      setFrete(null)
      return
    }

    setBuscandoCep(true)
    setErroCep("")
    setFrete(null)

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await res.json()

      if (data.erro) {
        setErroCep("CEP não encontrado. Verifique e tente novamente.")
        setBuscandoCep(false)
        return
      }

      // Auto-preenche os campos
      setEnderecoForm(prev => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        uf: data.uf || "",
        cep: cepLimpo
      }))

      // Calcula frete pela UF
      const freteInfo = FRETE_POR_UF[data.uf]
      if (freteInfo) {
        setFrete({ ...freteInfo, uf: data.uf, cidade: data.localidade })
      } else {
        setFrete({ valor: 39.90, prazo: 15, uf: data.uf, cidade: data.localidade })
      }

    } catch (e) {
      setErroCep("Erro ao consultar CEP. Verifique sua conexão.")
    } finally {
      setBuscandoCep(false)
    }
  }, [])

  function selecionarEndereco(end) {
    setEnderecoSelecionadoId(end.id)
    setIsNovoEndereco(false)
    const form = {
      titulo: end.titulo,
      cep: end.cep,
      bairro: end.bairro,
      rua: end.rua,
      numero: end.numero,
      complemento: end.complemento || "",
      uf: end.uf || ""
    }
    setEnderecoForm(form)
    // Calcula frete para o endereço selecionado
    if (end.uf) {
      const freteInfo = FRETE_POR_UF[end.uf]
      setFrete(freteInfo ? { ...freteInfo, uf: end.uf } : { valor: 39.90, prazo: 15, uf: end.uf })
    } else if (end.cep) {
      buscarCep(end.cep)
    }
  }

  function prepararNovoEndereco() {
    setIsNovoEndereco(true)
    setEnderecoSelecionadoId(null)
    setEnderecoForm({ titulo: "", cep: "", rua: "", numero: "", bairro: "", complemento: "", uf: "" })
    setSalvarEndereco(true)
    setFrete(null)
    setErroCep("")
  }

  function handleChange(e) {
    const { name, value } = e.target
    setEnderecoForm(prev => ({ ...prev, [name]: value }))

    if (name === "cep") {
      const cepLimpo = value.replace(/\D/g, "")
      if (cepLimpo.length === 8) {
        buscarCep(cepLimpo)
      } else {
        setFrete(null)
        setErroCep("")
      }
    }
  }

  async function continuar(e) {
    e.preventDefault()

    // Validação do CEP
    const cepLimpo = enderecoForm.cep.replace(/\D/g, "")
    if (cepLimpo.length !== 8) {
      setErroCep("Por favor, informe um CEP válido com 8 dígitos.")
      return
    }
    if (erroCep) return

    let enderecoParaPagamento = { ...enderecoForm, frete }

    if (isNovoEndereco && salvarEndereco) {
      try {
        const response = await api.post("/addresses", enderecoForm)
        enderecoParaPagamento = { ...response.data.address, frete }
      } catch (error) {
        console.error("Erro ao salvar endereço", error)
        alert("Erro ao salvar endereço. Prosseguindo sem salvar.")
      }
    }

    navigate("/pagamento", { state: { endereco: enderecoParaPagamento, frete } })
  }

  return (
    <section className="checkout-page">
      <div className="checkout-container">
        {/* Barra de Progresso Circular */}
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

          <div className="step active">
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <span>Endereço</span>
          </div>

          <div className="step">
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

        {/* Formulário de Endereço */}
        <div className="address-box">
          <h2>Endereços</h2>

          <div className="address-selector">
            {enderecosSalvos.length > 0 && !isNovoEndereco && (
              <select
                className="address-dropdown"
                value={enderecoSelecionadoId || ""}
                onChange={(e) => {
                  const end = enderecosSalvos.find(en => en.id == e.target.value)
                  if (end) selecionarEndereco(end)
                }}
              >
                {enderecosSalvos.map((end) => (
                  <option key={end.id} value={end.id}>
                    ● {end.titulo.toUpperCase()} {end.principal ? "( ENDEREÇO PRINCIPAL )" : ""}
                  </option>
                ))}
              </select>
            )}

            {isNovoEndereco && (
              <button type="button" className="address-dropdown" onClick={() => {
                if (enderecosSalvos.length > 0) selecionarEndereco(enderecosSalvos[0])
              }}>
                ● NOVO ENDEREÇO ^
              </button>
            )}
          </div>

          <form className="address-form" onSubmit={continuar}>
            <div className="form-grid">
              <div className="input-group">
                <label>TÍTULO DO ENDEREÇO:</label>
                <input required name="titulo" value={enderecoForm.titulo} onChange={handleChange} disabled={!isNovoEndereco} />
              </div>

              <div className="input-group">
                <label>CEP: <span style={{ color: "#c0392b" }}>*</span></label>
                <input
                  required
                  name="cep"
                  value={enderecoForm.cep}
                  onChange={handleChange}
                  disabled={!isNovoEndereco}
                  placeholder="00000-000"
                  maxLength={9}
                  style={{ borderColor: erroCep ? "#c0392b" : undefined }}
                />
                {buscandoCep && (
                  <small style={{ color: "#888", marginTop: "4px" }}>Buscando endereço...</small>
                )}
                {erroCep && (
                  <small style={{ color: "#c0392b", marginTop: "4px" }}>{erroCep}</small>
                )}
              </div>

              <div className="input-group">
                <label>BAIRRO:</label>
                <input required name="bairro" value={enderecoForm.bairro} onChange={handleChange} disabled={!isNovoEndereco} />
              </div>
              <div className="input-group">
                <label>RUA:</label>
                <input required name="rua" value={enderecoForm.rua} onChange={handleChange} disabled={!isNovoEndereco} />
              </div>
              <div className="input-group">
                <label>NÚMERO:</label>
                <input required name="numero" value={enderecoForm.numero} onChange={handleChange} disabled={!isNovoEndereco} />
              </div>
              <div className="input-group">
                <label>COMPLEMENTO:</label>
                <input name="complemento" value={enderecoForm.complemento} onChange={handleChange} disabled={!isNovoEndereco} />
              </div>
            </div>

            {/* Card de Frete */}
            {frete && (
              <div style={{
                marginTop: "20px",
                padding: "16px 20px",
                background: "#f9f4f7",
                border: "1px solid #d8b4be",
                borderRadius: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px"
              }}>
                <div>
                  <p style={{ fontFamily: "'Cinzel', serif", fontWeight: "bold", fontSize: "13px", color: "#96305a", margin: 0, textTransform: "uppercase" }}>
                    📦 Frete para {frete.cidade || frete.uf} ({frete.uf})
                  </p>
                  <p style={{ fontSize: "12px", color: "#666", margin: "4px 0 0" }}>
                    Entrega estimada em até <strong>{frete.prazo} {frete.prazo === 1 ? "dia útil" : "dias úteis"}</strong>
                  </p>
                </div>
                <p style={{ fontWeight: "bold", fontSize: "16px", color: "#333", margin: 0 }}>
                  R$ {Number(frete.valor).toFixed(2).replace(".", ",")}
                </p>
              </div>
            )}

            {isNovoEndereco && (
              <div className="checkbox-group" onClick={() => setSalvarEndereco(!salvarEndereco)}>
                <input type="checkbox" checked={salvarEndereco} readOnly />
                <label>SALVAR ENDEREÇO PARA PRÓXIMA COMPRA</label>
              </div>
            )}

            {!isNovoEndereco && (
              <button type="button" className="add-address-btn" onClick={prepararNovoEndereco}>
                + ADICIONAR ENDEREÇOS
              </button>
            )}

            <button
              type="submit"
              className="continue-btn-pink"
              disabled={!!erroCep || buscandoCep}
              style={{ opacity: (erroCep || buscandoCep) ? 0.6 : 1 }}
            >
              CONTINUAR
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Address