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

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"))
    setUsuarioLogado(usuario)
  }, [])

  const [mensagemErro, setMensagemErro] = useState("")

  function handleCpfChange(event) {
    let val = event.target.value.replace(/\D/g, "")
    if (val.length > 3) val = val.substring(0, 3) + '.' + val.substring(3)
    if (val.length > 7) val = val.substring(0, 7) + '.' + val.substring(7)
    if (val.length > 11) val = val.substring(0, 11) + '-' + val.substring(11, 13)
    setCpf(val)
  }

  function handleDateChange(event) {
    let val = event.target.value.replace(/\D/g, "")
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2)
    if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9)
    setDataNascimento(val)
  }

  async function criarConta(event) {
    event.preventDefault()
    setMensagemErro("")

    // Limpa pontos e traços do CPF para a validação da AV3 que pede exatamente 11 dígitos numéricos
    const cpfLimpo = cpf.replace(/\D/g, '')

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
      alert("Conta cadastrada com sucesso! Faça seu login.")
      navigate("/login")
    } catch (error) {
      if (error.response && error.response.data) {
        setMensagemErro(error.response.data.error || "Erro ao cadastrar.")
      } else {
        setMensagemErro("Servidor indisponível.")
      }
    }
  }

  function sairDaConta() {
    localStorage.removeItem("usuarioLogado")
    setUsuarioLogado(null)
  }

  if (usuarioLogado) {
    return (
      <section className="profile-page">
        <div className="profile-container">
          <h1>Minha Conta</h1>
          <h2>Suas informações cadastradas</h2>

          <div className="profile-box">
            <h3>Dados Pessoais</h3>

            <div className="info-grid">
              <p><strong>e-mail:</strong> {usuarioLogado.email}</p>
              <p><strong>nome completo:</strong> {usuarioLogado.nome}</p>
              <p><strong>CPF:</strong> {usuarioLogado.cpf}</p>
              <p><strong>Data de nascimento:</strong> {usuarioLogado.dataNascimento}</p>
            </div>

            <button onClick={sairDaConta}>Sair da conta</button>
          </div>

          <div className="profile-box">
            <h3>Endereços</h3>
            <p>Nenhum endereço cadastrado.</p>
          </div>

          <div className="profile-box">
            <h3>Cartões</h3>
            <p>Nenhum cartão cadastrado.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="auth-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="canvas-logo-container" style={{ marginBottom: '15px', textAlign: 'center', width: '100%' }}>
        <Link to="/">
          <img src={logo} alt="Essence Logo" style={{ width: '150px', objectFit: 'contain', margin: '0 auto' }} />
        </Link>
      </div>

      <div className="auth-card canvas-card" style={{ width: '100%', maxWidth: '550px', padding: '40px 50px', border: '1px solid #555', borderRadius: '25px', backgroundColor: '#fff', boxSizing: 'border-box' }}>
        <h1 style={{ fontFamily: "'Times New Roman', Times, serif", color: '#8c2b53', fontSize: '28px', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'left' }}>FAÇA SEU CADASTRO!</h1>
        <p className="subtitle" style={{ fontFamily: "'Times New Roman', Times, serif", color: '#555', fontSize: '15px', textTransform: 'uppercase', textAlign: 'left', marginBottom: '35px', letterSpacing: '0.5px' }}>PREENCHA COM SEUS DADOS.</p>
        
        {mensagemErro && <p style={{color: 'red', fontWeight: 'bold', marginBottom: '15px'}}>{mensagemErro}</p>}

        <form className="auth-form canvas-form" onSubmit={criarConta}>
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

          <label style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', color: '#000', display: 'block', marginBottom: '15px' }}>
            NOME COMPLETO:
            <input
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              required
              style={{ border: '1px solid #555', borderRadius: '20px', padding: '12px 15px', fontFamily: 'Arial, sans-serif', marginTop: '6px', width: '100%', boxSizing: 'border-box' }}
            />
          </label>

          <label style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', color: '#000', display: 'block', marginBottom: '15px' }}>
            CPF:
            <input
              type="text"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleCpfChange}
              maxLength="14"
              required
              style={{ border: '1px solid #555', borderRadius: '20px', padding: '12px 15px', fontFamily: 'Arial, sans-serif', marginTop: '6px', width: '100%', boxSizing: 'border-box' }}
            />
          </label>

          <label style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', color: '#000', display: 'block', marginBottom: '15px' }}>
            DATA DE NASCIMENTO:
            <input
              type="text"
              placeholder="DD/MM/AAAA"
              value={dataNascimento}
              onChange={handleDateChange}
              maxLength="10"
              required
              style={{ border: '1px solid #555', borderRadius: '20px', padding: '12px 15px', fontFamily: 'Arial, sans-serif', marginTop: '6px', width: '100%', boxSizing: 'border-box' }}
            />
          </label>

          <label style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14px', color: '#000', display: 'block', marginBottom: '35px' }}>
            SENHA:
            <input
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
              style={{ border: '1px solid #555', borderRadius: '20px', padding: '12px 15px', fontFamily: 'Arial, sans-serif', marginTop: '6px', width: '100%', boxSizing: 'border-box' }}
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button type="submit" style={{ backgroundColor: '#8c2b53', borderRadius: '12px', width: '220px', fontFamily: "'Times New Roman', Times, serif", fontSize: '16px', textTransform: 'uppercase', padding: '14px', color: 'white', border: 'none', cursor: 'pointer' }}>
              CRIAR CONTA
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