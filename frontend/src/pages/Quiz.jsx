import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import ProductCard from "../components/ProductCard"
import api from "../services/api"

const PERGUNTAS = [
  {
    pergunta: "Para qual ocasião você procura um perfume?",
    campo: "ocasiao",
    peso: 3,
    opcoes: [
      { label: "🌅 Dia a dia / Trabalho", valor: "trabalho,dia" },
      { label: "🌙 Noite / Balada", valor: "noite,balada" },
      { label: "💕 Encontro / Romântico", valor: "encontro,casamento" },
      { label: "🎉 Eventos / Festas", valor: "evento,reunião,negócio" },
      { label: "🎁 Presente especial", valor: "presente,especial" },
    ],
  },
  {
    pergunta: "Qual família olfativa mais te atrai?",
    campo: "familia",
    peso: 5,
    opcoes: [
      { label: "🌲 Amadeirado / Intenso", valor: "Amadeirado Escuro" },
      { label: "🌸 Floral / Delicado", valor: "Floral Branco" },
      { label: "🍊 Cítrico / Fresco", valor: "Cítrico Aromático,Aquático" },
      { label: "🧁 Gourmand / Doce", valor: "Gourmand" },
      { label: "🔥 Oriental / Especiado", valor: "Oriental Especiado,Couro" },
      { label: "🌿 Herbal / Aromático", valor: "Fougère,Herbal/Verde,Chipre" },
    ],
  },
  {
    pergunta: "Qual tipo de fragrância combina com você?",
    campo: "categoria",
    peso: 2,
    opcoes: [
      { label: "👑 Alta Perfumaria", valor: "Alta Perfumaria" },
      { label: "💎 Nicho / Exclusivo", valor: "Nicho" },
      { label: "✨ Designer / Marca famosa", valor: "Designer,Celebrity" },
      { label: "🏃 Casual / Esportivo", valor: "Casual,Esportivo" },
      { label: "🌱 Natural / Indie", valor: "Natural/Orgânico,Indie" },
    ],
  },
  {
    pergunta: "Qual faixa de preço é ideal para você?",
    campo: "preco",
    peso: 2,
    opcoes: [
      { label: "💰 Até R$ 400", valor: "0-400" },
      { label: "💰💰 R$ 400 a R$ 800", valor: "400-800" },
      { label: "💰💰💰 R$ 800 a R$ 1.500", valor: "800-1500" },
      { label: "💎 Acima de R$ 1.500", valor: "1500-99999" },
    ],
  },
  {
    pergunta: "Qual sensação você quer transmitir?",
    campo: "sensacao",
    peso: 1,
    opcoes: [
      { label: "🕴️ Elegância e poder", valor: "amadeirado,intenso,couro,escuro" },
      { label: "💐 Romantismo e delicadeza", valor: "floral,branco,delicado,jasmin,rosa" },
      { label: "⚡ Energia e frescor", valor: "cítrico,fresco,aquático,bergamota,limão" },
      { label: "🔮 Mistério e sensualidade", valor: "oriental,especiado,oud,baunilha,âmbar" },
      { label: "🍃 Naturalidade e leveza", valor: "herbal,verde,lavanda,alecrim,menta" },
    ],
  },
]

function Quiz() {
  const [catalogo, setCatalogo] = useState([])
  const [loading, setLoading] = useState(true)
  const [passo, setPasso] = useState(-1) // -1 = tela inicial
  const [respostas, setRespostas] = useState({})
  const [finalizado, setFinalizado] = useState(false)
  const [animando, setAnimando] = useState(false)

  useEffect(() => {
    async function carregar() {
      try {
        const response = await api.get("/products")
        setCatalogo(response.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  function responder(campo, peso, opcao) {
    setAnimando(true)
    setRespostas(prev => ({ ...prev, [campo]: { valor: opcao.valor, peso } }))

    setTimeout(() => {
      if (passo < PERGUNTAS.length - 1) {
        setPasso(passo + 1)
      } else {
        setFinalizado(true)
      }
      setAnimando(false)
    }, 300)
  }

  function calcularResultado() {
    if (Object.keys(respostas).length === 0) return []

    const pontuados = catalogo.map(produto => {
      let pontos = 0

      // 1. Match por família olfativa (peso 5)
      if (respostas.familia) {
        const familias = respostas.familia.valor.split(",").map(f => f.trim().toLowerCase())
        const familiaProduto = (produto.familia_olfativa || "").toLowerCase()
        if (familias.some(f => familiaProduto.includes(f) || f.includes(familiaProduto))) {
          pontos += respostas.familia.peso
        }
      }

      // 2. Match por ocasião (peso 3)
      if (respostas.ocasiao) {
        const termos = respostas.ocasiao.valor.split(",").map(t => t.trim().toLowerCase())
        const ocasiaoProduto = (produto.ocasiao_ideal || produto.descricao || "").toLowerCase()
        if (termos.some(t => ocasiaoProduto.includes(t))) {
          pontos += respostas.ocasiao.peso
        }
      }

      // 3. Match por categoria (peso 2)
      if (respostas.categoria) {
        const cats = respostas.categoria.valor.split(",").map(c => c.trim().toLowerCase())
        const catProduto = (produto.categoria || "").toLowerCase()
        if (cats.some(c => catProduto.includes(c) || c.includes(catProduto))) {
          pontos += respostas.categoria.peso
        }
      }

      // 4. Match por faixa de preço (peso 2)
      if (respostas.preco) {
        const [min, max] = respostas.preco.valor.split("-").map(Number)
        const precoProduto = Number(produto.preco)
        if (precoProduto >= min && precoProduto <= max) {
          pontos += respostas.preco.peso
        }
      }

      // 5. Match por sensação — busca em topo/coração/base/descrição (peso 1)
      if (respostas.sensacao) {
        const termos = respostas.sensacao.valor.split(",").map(t => t.trim().toLowerCase())
        const textoCompleto = `
          ${produto.descricao || ""}
          ${produto.familia_olfativa || ""}
          ${produto.topo || ""} ${produto.coracao || ""} ${produto.base || ""}
        `.toLowerCase()
        const matches = termos.filter(t => textoCompleto.includes(t)).length
        pontos += Math.min(matches, 3) * respostas.sensacao.peso
      }

      return { ...produto, pontos }
    })

    const resultado = pontuados
      .sort((a, b) => b.pontos - a.pontos)
      .filter(p => p.pontos > 0)
      .slice(0, 6)

    // Fallback: se poucos resultados, pegar os top por família
    if (resultado.length < 3) {
      const extras = pontuados
        .filter(p => p.pontos === 0)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 - resultado.length)
      return [...resultado, ...extras]
    }

    return resultado
  }

  function reiniciarQuiz() {
    setPasso(-1)
    setRespostas({})
    setFinalizado(false)
  }

  function iniciarQuiz() {
    setPasso(0)
  }

  const resultados = finalizado ? calcularResultado() : []
  const perguntaAtual = passo >= 0 ? PERGUNTAS[passo] : null
  const progresso = passo >= 0 ? ((passo + 1) / PERGUNTAS.length) * 100 : 0

  const estilos = {
    page: { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: "'Times New Roman', Times, serif" },
    container: { maxWidth: '700px', width: '100%', textAlign: 'center' },
    card: { background: '#fff', borderRadius: '16px', padding: '40px 30px', boxShadow: '0 4px 20px rgba(150,48,90,0.08)', border: '1px solid #f0e6ec', transition: 'opacity 0.3s', opacity: animando ? 0.3 : 1 },
    titulo: { fontSize: '28px', textTransform: 'uppercase', letterSpacing: '2px', color: '#333', margin: '0 0 8px 0' },
    subtitulo: { fontSize: '14px', color: '#888', margin: '0 0 30px 0', textTransform: 'uppercase', letterSpacing: '1px' },
    pergunta: { fontSize: '20px', color: '#333', margin: '0 0 25px 0', textTransform: 'uppercase', letterSpacing: '1px' },
    passo: { fontSize: '12px', color: '#96305a', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px', fontWeight: 'bold' },
    progressoBar: { width: '100%', height: '4px', background: '#f0e6ec', borderRadius: '2px', marginBottom: '25px', overflow: 'hidden' },
    progressoFill: { height: '100%', background: 'linear-gradient(90deg, #96305a, #d4849b)', borderRadius: '2px', transition: 'width 0.4s ease' },
    opcoes: { display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '450px', margin: '0 auto' },
    opcao: { padding: '14px 20px', border: '1px solid #e8d6df', borderRadius: '10px', background: '#fdfbfc', cursor: 'pointer', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#444', transition: 'all 0.2s', textAlign: 'left' },
    resultadoHeader: { marginBottom: '30px' },
    restart: { marginTop: '30px', padding: '12px 30px', background: 'none', border: '2px solid #96305a', color: '#96305a', borderRadius: '8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold' },
    iniciar: { padding: '16px 40px', background: '#96305a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer', fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', transition: 'background 0.2s' },
    emoji: { fontSize: '48px', marginBottom: '20px', display: 'block' },
    matchBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', background: '#f0e6ec', color: '#96305a', marginBottom: '8px' },
  }

  if (loading) {
    return (
      <section style={estilos.page}>
        <p style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '2px' }}>Carregando quiz...</p>
      </section>
    )
  }

  return (
    <section style={estilos.page}>
      <div style={estilos.container}>

        {/* === TELA INICIAL === */}
        {passo === -1 && !finalizado && (
          <div style={estilos.card}>
            <span style={estilos.emoji}>✨</span>
            <h1 style={estilos.titulo}>Descubra seu Perfume Ideal</h1>
            <p style={{ ...estilos.subtitulo, marginBottom: '15px' }}>
              Responda {PERGUNTAS.length} perguntas rápidas
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
              Nosso algoritmo analisa suas preferências olfativas, estilo de vida e orçamento
              para encontrar as fragrâncias perfeitas para você.
            </p>
            <button
              style={estilos.iniciar}
              onClick={iniciarQuiz}
              onMouseEnter={e => e.target.style.background = '#7a2648'}
              onMouseLeave={e => e.target.style.background = '#96305a'}
            >
              Começar Quiz
            </button>
          </div>
        )}

        {/* === PERGUNTAS === */}
        {passo >= 0 && !finalizado && perguntaAtual && (
          <div style={estilos.card}>
            <p style={estilos.passo}>
              Pergunta {passo + 1} de {PERGUNTAS.length}
            </p>

            <div style={estilos.progressoBar}>
              <div style={{ ...estilos.progressoFill, width: `${progresso}%` }} />
            </div>

            <h2 style={estilos.pergunta}>{perguntaAtual.pergunta}</h2>

            <div style={estilos.opcoes}>
              {perguntaAtual.opcoes.map((opcao, i) => (
                <button
                  key={i}
                  style={estilos.opcao}
                  onClick={() => responder(perguntaAtual.campo, perguntaAtual.peso, opcao)}
                  onMouseEnter={e => {
                    e.target.style.borderColor = '#96305a'
                    e.target.style.background = '#faf5f7'
                    e.target.style.color = '#96305a'
                  }}
                  onMouseLeave={e => {
                    e.target.style.borderColor = '#e8d6df'
                    e.target.style.background = '#fdfbfc'
                    e.target.style.color = '#444'
                  }}
                >
                  {opcao.label}
                </button>
              ))}
            </div>

            {passo > 0 && (
              <button
                onClick={() => { setPasso(passo - 1); setRespostas(prev => { const n = {...prev}; delete n[PERGUNTAS[passo].campo]; return n }) }}
                style={{ marginTop: '20px', background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}
              >
                ← Voltar
              </button>
            )}
          </div>
        )}

        {/* === RESULTADO === */}
        {finalizado && (
          <div>
            <div style={estilos.resultadoHeader}>
              <span style={{ ...estilos.emoji, fontSize: '40px' }}>🎉</span>
              <h1 style={{ ...estilos.titulo, fontSize: '24px' }}>Perfumes Recomendados para Você</h1>
              <p style={estilos.subtitulo}>
                Baseado nas suas preferências, selecionamos as melhores opções
              </p>
            </div>

            {resultados.length === 0 ? (
              <div style={estilos.card}>
                <h2 style={{ fontSize: '18px', color: '#666' }}>Nenhum perfume encontrado</h2>
                <p style={{ color: '#999', fontSize: '14px' }}>Tente refazer o quiz com respostas diferentes.</p>
              </div>
            ) : (
              <>
                <div className="products-grid" style={{ marginBottom: '10px' }}>
                  {resultados.map(produto => (
                    <div key={produto.id} style={{ position: 'relative' }}>
                      {produto.pontos > 0 && (
                        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                          <span style={estilos.matchBadge}>
                            {produto.pontos >= 8 ? '⭐ Match Perfeito' : produto.pontos >= 5 ? '✨ Ótimo Match' : '👍 Boa Opção'}
                          </span>
                        </div>
                      )}
                      <ProductCard {...produto} />
                    </div>
                  ))}
                </div>
              </>
            )}

            <button
              style={estilos.restart}
              onClick={reiniciarQuiz}
              onMouseEnter={e => { e.target.style.background = '#96305a'; e.target.style.color = '#fff' }}
              onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#96305a' }}
            >
              Refazer Quiz
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default Quiz