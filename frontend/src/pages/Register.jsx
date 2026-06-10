import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../services/api"
import logo from "../assets/logo1.png"

function Register() {
  const navigate = useNavigate()

  const [usuarioLogado, setUsuarioLogado] = useState(null)

  const [email, setEmail] = useState("")
  const [nome, setNome] = useState("")
  const [cpf, setCpf] = useState("")
  const [dataNascimento, setDataNascimento] = useState("")
  const [senha, setSenha] = useState("")

  // Estados de Erros
  const [erroEmail, setErroEmail] = useState("")
  const [erroNome, setErroNome] = useState("")
  const [erroCpf, setErroCpf] = useState("")
  const [erroData, setErroData] = useState("")
  const [erroSenha, setErroSenha] = useState("")

  // Popups e Loading
  const [mensagemErro, setMensagemErro] = useState("")
  const [showPopupError, setShowPopupError] = useState(false)
  const [showPopupSuccess, setShowPopupSuccess] = useState(false)
  const [isCarregando, setIsCarregando] = useState(false)

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"))
    setUsuarioLogado(usuario)
  }, [])

  // 1. Debounce Email
  useEffect(() => {
    if (!email) {
      setErroEmail("")
      return
    }
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (emailValido) {
      setErroEmail("")
      return
    }
    const timer = setTimeout(() => {
      setErroEmail("Por favor, insira um e-mail em formato válido.")
    }, 2000)
    return () => clearTimeout(timer)
  }, [email])

  // 2. Debounce Nome
  useEffect(() => {
    if (!nome) {
      setErroNome("")
      return
    }
    const nomeValido = nome.trim().length >= 3
    if (nomeValido) {
      setErroNome("")
      return
    }
    const timer = setTimeout(() => {
      setErroNome("O nome completo deve conter no mínimo 3 caracteres.")
    }, 2000)
    return () => clearTimeout(timer)
  }, [nome])

  // 3. Debounce CPF
  useEffect(() => {
    if (!cpf) {
      setErroCpf("")
      return
    }
    const cpfLimpo = cpf.replace(/\D/g, "")
    const cpfValido = cpfLimpo.length === 11
    if (cpfValido) {
      setErroCpf("")
      return
    }
    const timer = setTimeout(() => {
      setErroCpf("O CPF deve conter exatamente 11 dígitos.")
    }, 2000)
    return () => clearTimeout(timer)
  }, [cpf])

  // 4. Debounce Data de Nascimento
  useEffect(() => {
    if (!dataNascimento) {
      setErroData("")
      return
    }
    const dataValida = /^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)
    if (dataValida) {
      setErroData("")
      return
    }
    const timer = setTimeout(() => {
      setErroData("Insira a data no formato DD/MM/AAAA.")
    }, 2000)
    return () => clearTimeout(timer)
  }, [dataNascimento])

  // 5. Debounce Senha
  useEffect(() => {
    if (!senha) {
      setErroSenha("")
      return
    }
    const senhaValida = senha.length >= 8
    if (senhaValida) {
      setErroSenha("")
      return
    }
    const timer = setTimeout(() => {
      setErroSenha("A senha deve conter no mínimo 8 caracteres.")
    }, 2000)
    return () => clearTimeout(timer)
  }, [senha])

  // Validadores instantâneos no desfoque (Blur)
  function validarEmailBlur() {
    if (!email) return
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    setErroEmail(emailValido ? "" : "Por favor, insira um e-mail em formato válido.")
  }

  function validarNomeBlur() {
    if (!nome) return
    setErroNome(nome.trim().length >= 3 ? "" : "O nome completo deve conter no mínimo 3 caracteres.")
  }

  function validarCpfBlur() {
    if (!cpf) return
    const cpfLimpo = cpf.replace(/\D/g, "")
    setErroCpf(cpfLimpo.length === 11 ? "" : "O CPF deve conter exatamente 11 dígitos.")
  }

  function validarDataBlur() {
    if (!dataNascimento) return
    setErroData(/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento) ? "" : "Insira a data no formato DD/MM/AAAA.")
  }

  function validarSenhaBlur() {
    if (!senha) return
    setErroSenha(senha.length >= 8 ? "" : "A senha deve conter no mínimo 8 caracteres.")
  }

  function handleCpfChange(event) {
    let val = event.target.value.replace(/\D/g, "")
    if (val.length > 3) val = val.substring(0, 3) + '.' + val.substring(3)
    if (val.length > 7) val = val.substring(0, 7) + '.' + val.substring(7)
    if (val.length > 11) val = val.substring(0, 11) + '-' + val.substring(11, 13)
    setCpf(val)
  }

  // Função para formatar data automaticamente (DD/MM/AAAA)
  function handleDateChange(event) {
    let val = event.target.value.replace(/\D/g, "")
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2)
    if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9)
    setDataNascimento(val)
  }

  async function criarConta(event) {
    event.preventDefault()

    // Validação de segurança final antes de bater na API
    const cpfLimpo = cpf.replace(/\D/g, '')
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const nomeValido = nome.trim().length >= 3
    const cpfValido = cpfLimpo.length === 11
    const dataValida = /^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)
    const senhaValida = senha.length >= 8

    if (!emailValido || !nomeValido || !cpfValido || !dataValida || !senhaValida) {
      validarEmailBlur()
      validarNomeBlur()
      validarCpfBlur()
      validarDataBlur()
      validarSenhaBlur()
      return
    }

    setIsCarregando(true)
    setMensagemErro("")

    // Converte de DD/MM/YYYY para YYYY-MM-DD
    let dataFormatada = dataNascimento
    const partes = dataNascimento.split('/')
    if (partes.length === 3) {
      dataFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`
    }

    const novoUsuario = {
      email,
      nome,
      cpf: cpfLimpo,
      data_nascimento: dataFormatada,
      senha,
    }

    try {
      await api.post("/auth/register", novoUsuario)
      setShowPopupSuccess(true)
    } catch (error) {
      let msgErro = "Servidor indisponível no momento."
      if (error.response && error.response.data) {
        msgErro = error.response.data.error || "Erro ao cadastrar conta."
      }
      setMensagemErro(msgErro)
      setShowPopupError(true)
    } finally {
      setIsCarregando(false)
    }
  }

  function sairDaConta() {
    localStorage.removeItem("usuarioLogado")
    setUsuarioLogado(null)
  }

  if (usuarioLogado) {
    return (
      <section className="profile-page" style={{ padding: '40px 20px', minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
        <div className="profile-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'Times New Roman', Times, serif", color: '#8c2b53', fontSize: '32px' }}>Minha Conta</h1>
          <h2 style={{ fontFamily: "'Times New Roman', Times, serif", color: '#555', fontSize: '16px', textTransform: 'uppercase', marginBottom: '30px' }}>Suas informações cadastradas</h2>
 
          <div className="profile-box" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', marginBottom: '25px', border: '1px solid #eee' }}>
            <h3 style={{ fontFamily: "'Times New Roman', Times, serif", color: '#8c2b53', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '20px' }}>Dados Pessoais</h3>
 
            <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
              <p style={{ margin: 0 }}><strong>e-mail:</strong> {usuarioLogado.email}</p>
              <p style={{ margin: 0 }}><strong>nome completo:</strong> {usuarioLogado.nome}</p>
              <p style={{ margin: 0 }}><strong>CPF:</strong> {usuarioLogado.cpf}</p>
              <p style={{ margin: 0 }}><strong>Data de nascimento:</strong> {usuarioLogado.dataNascimento || usuarioLogado.data_nascimento}</p>
            </div>
 
            <button 
              onClick={sairDaConta}
              style={{
                backgroundColor: 'transparent',
                border: '1.5px solid #8c2b53',
                color: '#8c2b53',
                padding: '10px 25px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontFamily: "'Times New Roman', Times, serif",
                textTransform: 'uppercase',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = '#8c2b53'; e.target.style.color = '#fff' }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#8c2b53' }}
            >
              Sair da conta
            </button>
          </div>
        </div>
      </section>
    )
  }

  // Validação geral do form para desabilitar o botão
  const formInvalido = 
    !!erroEmail || !!erroNome || !!erroCpf || !!erroData || !!erroSenha ||
    !email || !nome || !cpf || !dataNascimento || !senha || isCarregando

  return (
    <section className="auth-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: '100vh', backgroundColor: '#f8f8f8', position: 'relative' }}>
      
      {/* POPUP MODAL PREMIUM DE ERRO */}
      {showPopupError && (
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
              <span style={{ fontSize: '30px' }}>❌</span>
            </div>
            <h2 style={{ fontFamily: "'Times New Roman', Times, serif", color: '#8c2b53', fontSize: '22px', textTransform: 'uppercase', marginBottom: '12px', marginTop: 0 }}>
              Falha no Cadastro
            </h2>
            <p style={{ fontFamily: "Arial, sans-serif", color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px', padding: '0 10px' }}>
              {mensagemErro}
            </p>
            <button 
              onClick={() => setShowPopupError(false)}
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

      {/* POPUP MODAL PREMIUM DE SUCESSO */}
      {showPopupSuccess && (
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
              backgroundColor: '#f4fbf7', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px auto',
              border: '2px solid #c2ebd9'
            }}>
              <span style={{ fontSize: '30px' }}>✨</span>
            </div>
            <h2 style={{ fontFamily: "'Times New Roman', Times, serif", color: '#27ae60', fontSize: '22px', textTransform: 'uppercase', marginBottom: '12px', marginTop: 0 }}>
              Conta Criada!
            </h2>
            <p style={{ fontFamily: "Arial, sans-serif", color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px', padding: '0 10px' }}>
              Parabéns! Sua conta na Essence foi criada com sucesso. Clique abaixo para fazer o login.
            </p>
            <button 
              onClick={() => {
                setShowPopupSuccess(false)
                navigate("/login")
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
              Ir para o Login
            </button>
          </div>
        </div>
      )}

      <div className="canvas-logo-container" style={{ marginBottom: '15px', textAlign: 'center', width: '100%' }}>
        <Link to="/">
          <img src={logo} alt="Essence Logo" style={{ width: '150px', objectFit: 'contain', margin: '0 auto' }} />
        </Link>
      </div>

      <div className="auth-card canvas-card" style={{ width: '100%', maxWidth: '550px', padding: '40px 50px', border: '1px solid #ddd', borderRadius: '25px', backgroundColor: '#fff', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontFamily: "'Times New Roman', Times, serif", color: '#8c2b53', fontSize: '28px', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'left' }}>FAÇA SEU CADASTRO!</h1>
        <p className="subtitle" style={{ fontFamily: "'Times New Roman', Times, serif", color: '#555', fontSize: '15px', textTransform: 'uppercase', textAlign: 'left', marginBottom: '35px', letterSpacing: '0.5px' }}>PREENCHA COM SEUS DADOS.</p>
        
        <form className="auth-form canvas-form" onSubmit={criarConta}>
          <label style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', color: '#000', display: 'block', marginBottom: '20px' }}>
            E-MAIL:
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={validarEmailBlur}
              required
              style={{ 
                border: erroEmail ? '2px solid #d9383a' : '1px solid #555', 
                borderRadius: '20px', 
                padding: '12px 15px', 
                fontFamily: 'Arial, sans-serif', 
                marginTop: '6px', 
                width: '100%', 
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
                outline: 'none'
              }}
            />
            {erroEmail && (
              <span style={{ display: 'block', color: '#d9383a', fontSize: '12px', marginTop: '6px', textTransform: 'none', fontWeight: 'normal' }}>
                ⚠️ {erroEmail}
              </span>
            )}
          </label>

          <label style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', color: '#000', display: 'block', marginBottom: '20px' }}>
            NOME COMPLETO:
            <input
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              onBlur={validarNomeBlur}
              required
              style={{ 
                border: erroNome ? '2px solid #d9383a' : '1px solid #555', 
                borderRadius: '20px', 
                padding: '12px 15px', 
                fontFamily: 'Arial, sans-serif', 
                marginTop: '6px', 
                width: '100%', 
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
                outline: 'none'
              }}
            />
            {erroNome && (
              <span style={{ display: 'block', color: '#d9383a', fontSize: '12px', marginTop: '6px', textTransform: 'none', fontWeight: 'normal' }}>
                ⚠️ {erroNome}
              </span>
            )}
          </label>

          <label style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', color: '#000', display: 'block', marginBottom: '20px' }}>
            CPF:
            <input
              type="text"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleCpfChange}
              onBlur={validarCpfBlur}
              maxLength="14"
              required
              style={{ 
                border: erroCpf ? '2px solid #d9383a' : '1px solid #555', 
                borderRadius: '20px', 
                padding: '12px 15px', 
                fontFamily: 'Arial, sans-serif', 
                marginTop: '6px', 
                width: '100%', 
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
                outline: 'none'
              }}
            />
            {erroCpf && (
              <span style={{ display: 'block', color: '#d9383a', fontSize: '12px', marginTop: '6px', textTransform: 'none', fontWeight: 'normal' }}>
                ⚠️ {erroCpf}
              </span>
            )}
          </label>

          <label style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', color: '#000', display: 'block', marginBottom: '20px' }}>
            DATA DE NASCIMENTO:
            <input
              type="text"
              placeholder="DD/MM/AAAA"
              value={dataNascimento}
              onChange={handleDateChange}
              onBlur={validarDataBlur}
              maxLength="10"
              required
              style={{ 
                border: erroData ? '2px solid #d9383a' : '1px solid #555', 
                borderRadius: '20px', 
                padding: '12px 15px', 
                fontFamily: 'Arial, sans-serif', 
                marginTop: '6px', 
                width: '100%', 
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
                outline: 'none'
              }}
            />
            {erroData && (
              <span style={{ display: 'block', color: '#d9383a', fontSize: '12px', marginTop: '6px', textTransform: 'none', fontWeight: 'normal' }}>
                ⚠️ {erroData}
              </span>
            )}
          </label>

          <label style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', color: '#000', display: 'block', marginBottom: '35px' }}>
            SENHA:
            <input
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              onBlur={validarSenhaBlur}
              required
              style={{ 
                border: erroSenha ? '2px solid #d9383a' : '1px solid #555', 
                borderRadius: '20px', 
                padding: '12px 15px', 
                fontFamily: 'Arial, sans-serif', 
                marginTop: '6px', 
                width: '100%', 
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
                outline: 'none'
              }}
            />
            {erroSenha && (
              <span style={{ display: 'block', color: '#d9383a', fontSize: '12px', marginTop: '6px', textTransform: 'none', fontWeight: 'normal' }}>
                ⚠️ {erroSenha}
              </span>
            )}
          </label>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button 
              type="submit" 
              disabled={formInvalido}
              style={{ 
                backgroundColor: formInvalido ? '#ccc' : '#8c2b53', 
                borderRadius: '12px', 
                width: '220px', 
                fontFamily: "'Times New Roman', Times, serif", 
                fontSize: '16px', 
                textTransform: 'uppercase', 
                padding: '14px', 
                color: 'white', 
                border: 'none', 
                cursor: formInvalido ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: formInvalido ? 0.7 : 1
              }}
            >
              {isCarregando ? "CRIANDO CONTA..." : "CRIAR CONTA"}
            </button>
          </div>
        </form>

        <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', textTransform: 'uppercase', color: '#555', marginTop: '30px', textAlign: 'center' }}>
          JÁ TEM UMA CONTA? <Link to="/login" style={{ color: '#8c2b53', fontWeight: 'bold', textDecoration: 'none' }}>ENTRAR</Link>
        </p>
      </div>
    </section>
  )
}

export default Register