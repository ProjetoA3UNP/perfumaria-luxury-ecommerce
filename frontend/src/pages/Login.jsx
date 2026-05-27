import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../services/api"
import logo from "../assets/logo1.png"

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [mensagem, setMensagem] = useState("")

  async function fazerLogin(event) {
    event.preventDefault()

    try {
      const response = await api.post("/auth/login", { email, senha })
      const dadosUsuario = response.data.user;
      dadosUsuario.token = response.data.token;

      localStorage.setItem("usuarioLogado", JSON.stringify(dadosUsuario))
      navigate("/")
    } catch (error) {
      if (error.response && error.response.data) {
        setMensagem(error.response.data.error || "E-mail ou senha inválidos.")
      } else {
        setMensagem("Falha de conexão com o servidor.")
      }
    }
  }

  return (
    <section className="auth-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="canvas-logo-container" style={{ marginBottom: '15px', textAlign: 'center', width: '100%' }}>
        <Link to="/">
          <img src={logo} alt="Essence Logo" style={{ width: '150px', objectFit: 'contain', margin: '0 auto' }} />
        </Link>
      </div>

      <div className="auth-card canvas-card" style={{ width: '100%', maxWidth: '550px', padding: '40px 50px', border: '1px solid #555', borderRadius: '25px', backgroundColor: '#fff', boxSizing: 'border-box' }}>
        <h1 style={{ fontFamily: "'Times New Roman', Times, serif", color: '#8c2b53', fontSize: '28px', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'left' }}>BEM VINDO!</h1>
        <p className="subtitle" style={{ fontFamily: "'Times New Roman', Times, serif", color: '#555', fontSize: '15px', textTransform: 'uppercase', textAlign: 'left', marginBottom: '35px', letterSpacing: '0.5px' }}>PARA CONTINUAR, DIGITE SEU E-MAIL E SENHA</p>

        <form className="auth-form canvas-form" onSubmit={fazerLogin}>
          <label style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', color: '#000', display: 'block', marginBottom: '15px' }}>
            E-MAIL:
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={{ border: '1px solid #555', borderRadius: '20px', padding: '12px 15px', fontFamily: 'Arial, sans-serif', marginTop: '6px', width: '100%', boxSizing: 'border-box' }}
            />
          </label>

          <label style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', color: '#000', display: 'block', marginBottom: '5px' }}>
            SENHA:
            <input
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
              style={{ border: '1px solid #555', borderRadius: '20px', padding: '12px 15px', fontFamily: 'Arial, sans-serif', marginTop: '6px', width: '100%', boxSizing: 'border-box' }}
            />
          </label>
          <div style={{ textAlign: 'right', marginTop: '2px', marginBottom: '35px' }}>
            <a href="#" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '11px', color: '#555', textDecoration: 'none', textTransform: 'uppercase' }}>ESQUECI MINHA SENHA</a>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button type="submit" style={{ backgroundColor: '#8c2b53', borderRadius: '12px', width: '220px', fontFamily: "'Times New Roman', Times, serif", fontSize: '16px', textTransform: 'uppercase', padding: '14px', color: 'white', border: 'none', cursor: 'pointer' }}>
              ENTRAR
            </button>
          </div>
        </form>

        {mensagem && <p className="auth-message">{mensagem}</p>}

        <p style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', textTransform: 'uppercase', color: '#555', marginTop: '30px', textAlign: 'center' }}>
          NÃO TEM UMA CONTA? <Link to="/cadastro" style={{ color: '#8c2b53', fontWeight: 'bold', textDecoration: 'none' }}>CADASTRE-SE</Link>
        </p>
      </div>
    </section>
  )
}

export default Login