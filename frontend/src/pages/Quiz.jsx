import { useState, useEffect } from "react"
import ProductCard from "../components/ProductCard"
import api from "../services/api"

function Quiz() {
  const [catalogo, setCatalogo] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const response = await api.get('/products')
        setCatalogo(response.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])
  const perguntas = [
    {
      pergunta: "Qual sensação você quer transmitir?",
      campo: "personalidade",
      opcoes: ["elegante", "romântica", "sofisticada", "confiante", "delicada"],
    },
    {
      pergunta: "Qual ocasião você quer usar?",
      campo: "ocasioes",
      opcoes: ["dia-a-dia", "encontro", "noite", "eventos", "presente"],
    },
    {
      pergunta: "Qual família olfativa combina com você?",
      campo: "familia",
      opcoes: ["amadeirado", "floral", "adocicado", "gourmand"],
    },
    {
      pergunta: "Você prefere um perfume...",
      campo: "intensidade",
      opcoes: ["moderada", "marcante", "intensa"],
    },
  ]

  const [passo, setPasso] = useState(0)
  const [respostas, setRespostas] = useState([])
  const [finalizado, setFinalizado] = useState(false)

  function responder(resposta) {
    setRespostas([...respostas, resposta])

    if (passo < perguntas.length - 1) {
      setPasso(passo + 1)
    } else {
      setFinalizado(true)
    }
  }

  function calcularResultado() {
    const pontuados = catalogo.map((produto) => {
      let pontos = 0

      respostas.forEach((resposta) => {
        const textoProduto = `
          ${produto.familia_olfativa || ""}
          ${produto.categoria || ""}
          ${produto.descricao || ""}
          ${produto.ocasiao_ideal || ""}
        `.toLowerCase()

        if (textoProduto.includes(resposta.toLowerCase())) {
          pontos++
        }
      })

      return { ...produto, pontos }
    })

    return pontuados
      .sort((a, b) => b.pontos - a.pontos)
      .filter((produto) => produto.pontos > 0)
      .slice(0, 3)
  }

  function reiniciarQuiz() {
    setPasso(0)
    setRespostas([])
    setFinalizado(false)
  }

  const resultados = calcularResultado()
  const perguntaAtual = perguntas[passo]

  return (
    <section className="quiz-page">
      <div className="quiz-container">
        {!finalizado ? (
          <div className="quiz-card">
            <p className="quiz-step">
              Pergunta {passo + 1} de {perguntas.length}
            </p>

            <h1>Descubra seu perfume ideal</h1>
            <h2>{perguntaAtual.pergunta}</h2>

            <div className="quiz-options">
              {perguntaAtual.opcoes.map((opcao) => (
                <button key={opcao} onClick={() => responder(opcao)}>
                  {opcao}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="quiz-result">
            <h1>Seu perfume ideal combina com...</h1>
            <p>
              Selecionamos fragrâncias que mais combinam com suas respostas.
            </p>

            {resultados.length === 0 ? (
              <div className="quiz-card">
                <h2>Nenhum perfume encontrado</h2>
                <p>Cadastre mais perfumes no site para melhorar o resultado.</p>
              </div>
            ) : (
              <div className="products-grid">
                {resultados.map((produto) => (
                  <ProductCard key={produto.id} {...produto} />
                ))}
              </div>
            )}

            <button className="quiz-restart" onClick={reiniciarQuiz}>
              Refazer quiz
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default Quiz