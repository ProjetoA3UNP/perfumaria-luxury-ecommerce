import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../services/api"
import logo from "../assets/logo1.png"

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erroEmail, setErroEmail] = useState("")
  const [erroSenha, setErroSenha] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [showPopup, setShowPopup] = useState(false)
  const [isCarregando, setIsCarregando] = useState(false)

  // Estados para recuperação simulada de senha
  const [showRecuperarModal, setShowRecuperarModal] = useState(false)
  const [emailRecuperar, setEmailRecuperar] = useState("")
  const [sucessoRecuperar, setSucessoRecuperar] = useState(false)

  async function handleRecuperarSenha(e) {
    e.preventDefault()
    if (!emailRecuperar) return
    
    setIsCarregando(true)
    setShowRecuperarModal(false)

    try {
      await api.post("/auth/forgot-password", { email: emailRecuperar })
      setSucessoRecuperar(true)
    } catch (error) {
      let msgErro = "Falha de conexão com o servidor."
      if (error.response && error.response.data) {
        msgErro = error.response.data.error || msgErro
      }
      setMensagem(msgErro)
      setShowPopup(true)
    } finally {
      setIsCarregando(false)
    }
  }

  // Verifica se a sessão expirou através da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("session_expired") === "true") {
      setMensagem("Sua sessão expirou por inatividade de segurança. Por favor, faça login novamente para continuar.")
      setShowPopup(true)
      navigate("/login", { replace: true })
    }
  }, [navigate])

  // Validação em tempo real do E-mail com Debounce de 2 segundos (ou instantâneo se correto)
  useEffect(() => {
    if (!email) {
      setErroEmail("")
      return
    }

    const emailValido = email.includes('@')
    
    // Se o usuário corrigiu o erro e o e-mail está válido, limpa imediatamente (feedback positivo instantâneo)
    if (emailValido) {
      setErroEmail("")
      return
    }

    // Se estiver incorreto, espera 2 segundos após ele parar de digitar para mostrar a mensagem
    const timer = setTimeout(() => {
      setErroEmail("Por favor, insira um e-mail em formato válido.")
    }, 2000)

    return () => clearTimeout(timer)
  }, [email])

  // Validação em tempo real da Senha com Debounce de 2 segundos (ou instantâneo se correto)
  useEffect(() => {
    if (!senha) {
      setErroSenha("")
      return
    }

    const senhaValida = senha.length >= 8

    // Se corrigiu a senha, limpa na hora
    if (senhaValida) {
      setErroSenha("")
      return
    }

    // Se estiver incorreto, espera 2 segundos após parar de digitar para mostrar o aviso
    const timer = setTimeout(() => {
      setErroSenha("A senha deve conter no mínimo 8 caracteres.")
    }, 2000)

    return () => clearTimeout(timer)
  }, [senha])

  // Validação instantânea no Blur (quando o usuário sai do campo)
  function validarEmailBlur() {
    if (!email) return
    const emailValido = email.includes('@')
    if (!emailValido) {
      setErroEmail("Por favor, insira um e-mail em formato válido.")
    } else {
      setErroEmail("")
    }
  }

  function validarSenhaBlur() {
    if (!senha) return
    if (senha.length < 8) {
      setErroSenha("A senha deve conter no mínimo 8 caracteres.")
    } else {
      setErroSenha("")
    }
  }

  async function fazerLogin(event) {
    event.preventDefault()

    // Validação de segurança final antes de enviar à API
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const senhaValida = senha.length >= 8

    if (!emailValido) {
      setErroEmail("Por favor, insira um e-mail em formato válido.")
      return
    }
    if (!senhaValida) {
      setErroSenha("A senha deve conter no mínimo 8 caracteres.")
      return
    }

    setIsCarregando(true)
    setMensagem("")

    try {
      const response = await api.post("/auth/login", { email, senha })
      const dadosUsuario = response.data.user
      dadosUsuario.token = response.data.token

      localStorage.setItem("usuarioLogado", JSON.stringify(dadosUsuario))
      navigate("/")
    } catch (error) {
      let msgErro = "Falha de conexão com o servidor."
      if (error.response && error.response.data) {
        msgErro = error.response.data.error || "E-mail ou senha inválidos."
      }
      setMensagem(msgErro)
      setShowPopup(true) // Exibe o popup modal
    } finally {
      setIsCarregando(false)
    }
  }

  // Desabilita o botão se houver algum erro ativo ou se algum campo estiver vazio
  const formInvalido = !!erroEmail || !!erroSenha || !email || !senha || isCarregando

  return (
    <section className="auth-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f8f8f8', position: 'relative' }}>
      
      {/* POPUP MODAL PREMIUM DE RECUPERAÇÃO DE SENHA */}
      {showRecuperarModal && (
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
          <form onSubmit={handleRecuperarSenha} style={{
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
              backgroundColor: '#f5f0f3', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px auto',
              border: '2px solid #e2ccd8'
            }}>
              <span style={{ fontSize: '30px' }}>🔑</span>
            </div>
            <h2 style={{ fontFamily: "'Times New Roman', Times, serif", color: '#8c2b53', fontSize: '22px', textTransform: 'uppercase', marginBottom: '12px', marginTop: 0 }}>
              Recuperar Senha
            </h2>
            <p style={{ fontFamily: "Arial, sans-serif", color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              Digite seu e-mail cadastrado. Enviaremos as instruções de redefinição de senha para você.
            </p>
            <input
              type="email"
              required
              placeholder="seu-email@exemplo.com"
              value={emailRecuperar}
              onChange={(e) => setEmailRecuperar(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 15px',
                borderRadius: '20px',
                border: '1px solid #555',
                outline: 'none',
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                boxSizing: 'border-box',
                marginBottom: '25px',
                textAlign: 'center'
              }}
            />
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                type="button"
                onClick={() => setShowRecuperarModal(false)}
                style={{
                  backgroundColor: '#ccc',
                  color: '#333',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '120px'
                }}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                style={{
                  backgroundColor: '#8c2b53',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '120px',
                  boxShadow: '0 4px 12px rgba(140, 43, 83, 0.2)'
                }}
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP MODAL PREMIUM DE SUCESSO DE RECUPERAÇÃO */}
      {sucessoRecuperar && (
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
              backgroundColor: '#eafaf1', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px auto',
              border: '2px solid #a3e4cd'
            }}>
              <span style={{ fontSize: '30px' }}>✉️</span>
            </div>
            <h2 style={{ fontFamily: "'Times New Roman', Times, serif", color: '#27ae60', fontSize: '22px', textTransform: 'uppercase', marginBottom: '12px', marginTop: 0 }}>
              E-mail Enviado!
            </h2>
            <p style={{ fontFamily: "Arial, sans-serif", color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px', padding: '0 10px' }}>
              Enviamos as instruções para a redefinição de senha para <strong>{emailRecuperar}</strong>. Verifique sua caixa de entrada.
            </p>
            <button 
              onClick={() => setSucessoRecuperar(false)}
              style={{
                backgroundColor: '#27ae60',
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
                boxShadow: '0 4px 12px rgba(39, 174, 96, 0.2)'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#219653'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#27ae60'}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* POPUP MODAL PREMIUM DE ERRO */}
      {showPopup && (
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
            transform: 'scale(1)',
            transition: 'transform 0.3s ease',
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
              <span style={{ fontSize: '30px' }}>🔒</span>
            </div>
            <h2 style={{ fontFamily: "'Times New Roman', Times, serif", color: '#8c2b53', fontSize: '22px', textTransform: 'uppercase', marginBottom: '12px', marginTop: 0, letterSpacing: '0.5px' }}>
              Acesso Recusado
            </h2>
            <p style={{ fontFamily: "Arial, sans-serif", color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px', padding: '0 10px' }}>
              {mensagem}
            </p>
            <button 
              onClick={() => setShowPopup(false)}
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
              Tentar Novamente
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
        <h1 style={{ fontFamily: "'Times New Roman', Times, serif", color: '#8c2b53', fontSize: '28px', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'left' }}>BEM VINDO!</h1>
        <p className="subtitle" style={{ fontFamily: "'Times New Roman', Times, serif", color: '#555', fontSize: '15px', textTransform: 'uppercase', textAlign: 'left', marginBottom: '35px', letterSpacing: '0.5px' }}>PARA CONTINUAR, DIGITE SEU E-MAIL E SENHA</p>

        <form className="auth-form canvas-form" onSubmit={fazerLogin}>
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

          <label style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', color: '#000', display: 'block', marginBottom: '5px' }}>
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
          
          <div style={{ textAlign: 'right', marginTop: '8px', marginBottom: '35px' }}>
            <button 
              type="button" 
              onClick={() => {
                setSucessoRecuperar(false)
                setEmailRecuperar("")
                setShowRecuperarModal(true)
              }} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Times New Roman', Times, serif", fontSize: '11px', color: '#555', textDecoration: 'none', textTransform: 'uppercase', padding: 0 }}
            >
              ESQUECI MINHA SENHA
            </button>
          </div>

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
              {isCarregando ? "ENTRANDO..." : "ENTRAR"}
            </button>
          </div>
        </form>

        <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', textTransform: 'uppercase', color: '#555', marginTop: '30px', textAlign: 'center' }}>
          NÃO TEM UMA CONTA? <Link to="/cadastro" style={{ color: '#8c2b53', fontWeight: 'bold', textDecoration: 'none' }}>CADASTRE-SE</Link>
        </p>
      </div>
    </section>
  )
}

export default Login