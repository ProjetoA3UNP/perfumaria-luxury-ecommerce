import { useState } from "react"

function Admin() {
  const [produto, setProduto] = useState({
    nome: "",
    marca: "",
    descricao: "",
    tamanho: "",
    preco: "",
    nomeImagem: "",
    categorias: "",
    familia: "",
    genero: "",
    intensidade: "",
    ocasioes: "",
    personalidade: "",
    ingredientes: "",
    piramideOlfativa: "",
    ocasiaoIdeal: "",
  })

  const [preview, setPreview] = useState(null)
  const [codigoGerado, setCodigoGerado] = useState("")

  function alterarCampo(event) {
    setProduto({
      ...produto,
      [event.target.name]: event.target.value,
    })
  }

  function selecionarImagem(event) {
    const arquivo = event.target.files[0]

    if (arquivo) {
      setPreview(URL.createObjectURL(arquivo))
      setProduto({
        ...produto,
        nomeImagem: arquivo.name.replace(/\.[^/.]+$/, ""),
      })
    }
  }

  function gerarCodigo(event) {
    event.preventDefault()

    const camposObrigatorios = Object.values(produto).every(
      (campo) => campo.trim() !== ""
    )

    if (!camposObrigatorios || !preview) {
      alert("Preencha todas as informações e selecione uma imagem.")
      return
    }

    const categoriasArray = produto.categorias
      .split(",")
      .map((item) => item.trim().toLowerCase())

    const ocasioesArray = produto.ocasioes
      .split(",")
      .map((item) => item.trim().toLowerCase())

    const personalidadeArray = produto.personalidade
      .split(",")
      .map((item) => item.trim().toLowerCase())

    const codigo = `
{
  id: PROXIMO_ID,
  nome: "${produto.nome.toUpperCase()}",
  marca: "${produto.marca.toUpperCase()}",
  descricao: "${produto.descricao}",
  tamanho: "${produto.tamanho}",
  preco: ${Number(produto.preco)},
  imagem: ${produto.nomeImagem},

  categorias: ${JSON.stringify(categoriasArray)},
  familia: "${produto.familia}",
  genero: "${produto.genero}",
  intensidade: "${produto.intensidade}",

  ocasioes: ${JSON.stringify(ocasioesArray)},
  personalidade: ${JSON.stringify(personalidadeArray)},

  ingredientes: "${produto.ingredientes}",
  piramideOlfativa: "${produto.piramideOlfativa}",
  ocasiaoIdeal: "${produto.ocasiaoIdeal}",
},`

    setCodigoGerado(codigo)
  }

  return (
    <section className="admin-page">
      <div className="admin-container">
        <h1>Painel do Administrador</h1>
        <p>Cadastre produtos seguindo o padrão do arquivo products.js.</p>

        <div className="admin-alert">
          <strong>Atenção:</strong> coloque a imagem em{" "}
          <code>src/assets/products</code> e depois importe no{" "}
          <code>products.js</code>.
        </div>

        <form className="admin-form" onSubmit={gerarCodigo}>
          <div className="admin-box">
            <h2>Imagem do Produto</h2>

            <input type="file" accept="image/*" onChange={selecionarImagem} />

            {preview && (
              <div className="admin-preview">
                <img src={preview} alt="Preview do produto" />
              </div>
            )}
          </div>

          <div className="admin-box">
            <h2>Informações Básicas</h2>

            <input name="nome" placeholder="Nome do produto" onChange={alterarCampo} />
            <input name="marca" placeholder="Marca" onChange={alterarCampo} />
            <input name="descricao" placeholder="Descrição" onChange={alterarCampo} />
            <input name="tamanho" placeholder="Tamanho ex: 100ml" onChange={alterarCampo} />
            <input name="preco" type="number" step="0.01" placeholder="Preço" onChange={alterarCampo} />
          </div>

          <div className="admin-box">
            <h2>Categorias e Quiz</h2>

            <input name="categorias" placeholder="Categorias separadas por vírgula" onChange={alterarCampo} />
            <input name="familia" placeholder="Família olfativa" onChange={alterarCampo} />
            <input name="genero" placeholder="Gênero" onChange={alterarCampo} />
            <input name="intensidade" placeholder="Intensidade" onChange={alterarCampo} />
            <input name="ocasioes" placeholder="Ocasiões separadas por vírgula" onChange={alterarCampo} />
            <input name="personalidade" placeholder="Personalidade separada por vírgula" onChange={alterarCampo} />
          </div>

          <div className="admin-box">
            <h2>Detalhes do Produto</h2>

            <textarea name="ingredientes" placeholder="Ingredientes" onChange={alterarCampo} />
            <textarea name="piramideOlfativa" placeholder="Pirâmide Olfativa" onChange={alterarCampo} />
            <textarea name="ocasiaoIdeal" placeholder="Ocasião Ideal" onChange={alterarCampo} />
          </div>

          <button className="admin-button" type="submit">
            Gerar código do produto
          </button>
        </form>

        {codigoGerado && (
          <div className="admin-code-box">
            <h2>Código gerado</h2>

            <p>
              1. Coloque a imagem em <code>src/assets/products</code>
            </p>
            <p>
              2. Importe no topo do <code>products.js</code>:
            </p>

            <pre>{`import ${produto.nomeImagem} from "../assets/products/${produto.nomeImagem}.png"`}</pre>

            <p>3. Cole este objeto dentro do array:</p>

            <pre>{codigoGerado}</pre>
          </div>
        )}
      </div>
    </section>
  )
}

export default Admin