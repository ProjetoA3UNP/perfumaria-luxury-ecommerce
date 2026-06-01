import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Bar, Doughnut } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const STATUS_LABELS = {
  AGUARDANDO_PAGAMENTO: "Aguardando",
  PAGO: "Pago",
  PROCESSANDO: "Processando",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
}

const STATUS_COLORS = {
  AGUARDANDO_PAGAMENTO: "#f59e0b",
  PAGO: "#10b981",
  PROCESSANDO: "#3b82f6",
  ENVIADO: "#8b5cf6",
  ENTREGUE: "#059669",
  CANCELADO: "#ef4444",
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function Admin() {
  const navigate = useNavigate()
  const [autorizado, setAutorizado] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState("dashboard")
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  // === Estado do formulário de cadastro (aba Cadastrar) ===
  const [produto, setProduto] = useState({
    nome: "", marca: "", descricao: "", tamanho: "", preco: "", nomeImagem: "",
    categorias: "", familia: "", genero: "", intensidade: "",
    ocasioes: "", personalidade: "", ingredientes: "", piramideOlfativa: "", ocasiaoIdeal: "",
  })
  const [preview, setPreview] = useState(null)
  const [codigoGerado, setCodigoGerado] = useState("")

  // Verificar permissão
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("usuarioLogado"))
      if (user && user.tipo_perfil?.toUpperCase() === 'ADMIN') {
        setAutorizado(true)
      } else {
        alert("Acesso negado. Apenas administradores podem acessar esta página.")
        navigate("/")
      }
    } catch {
      navigate("/login")
    }
  }, [navigate])

  // Carregar métricas do dashboard
  useEffect(() => {
    if (!autorizado) return
    async function fetchMetrics() {
      try {
        setLoading(true)
        const res = await api.get("/dashboard")
        setMetrics(res.data)
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [autorizado])

  // === Funções do formulário de cadastro ===
  function alterarCampo(event) {
    setProduto({ ...produto, [event.target.name]: event.target.value })
  }

  function selecionarImagem(event) {
    const arquivo = event.target.files[0]
    if (arquivo) {
      setPreview(URL.createObjectURL(arquivo))
      setProduto({ ...produto, nomeImagem: arquivo.name.replace(/\.[^/.]+$/, "") })
    }
  }

  function gerarCodigo(event) {
    event.preventDefault()
    const camposObrigatorios = Object.values(produto).every((campo) => campo.trim() !== "")
    if (!camposObrigatorios || !preview) {
      alert("Preencha todas as informações e selecione uma imagem.")
      return
    }
    const categoriasArray = produto.categorias.split(",").map((item) => item.trim().toLowerCase())
    const ocasioesArray = produto.ocasioes.split(",").map((item) => item.trim().toLowerCase())
    const personalidadeArray = produto.personalidade.split(",").map((item) => item.trim().toLowerCase())
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

  // === Helpers de formatação ===
  function formatarReal(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  function formatarData(data) {
    return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  if (!autorizado) return null

  // === Dados dos gráficos ===
  const vendasPorMesData = metrics ? {
    labels: metrics.vendasPorMes.map(v => {
      const [ano, mes] = v.mes.split("-")
      return `${MESES[parseInt(mes) - 1]}/${ano.slice(2)}`
    }),
    datasets: [{
      label: "Faturamento (R$)",
      data: metrics.vendasPorMes.map(v => Number(v.faturamento)),
      backgroundColor: "rgba(140, 43, 83, 0.7)",
      borderColor: "#8c2b53",
      borderWidth: 1,
      borderRadius: 6,
    }]
  } : null

  const statusData = metrics ? {
    labels: metrics.statusPedidos.map(s => STATUS_LABELS[s.status] || s.status),
    datasets: [{
      data: metrics.statusPedidos.map(s => s.quantidade),
      backgroundColor: metrics.statusPedidos.map(s => STATUS_COLORS[s.status] || "#999"),
      borderWidth: 2,
      borderColor: "#fff",
    }]
  } : null

  const topCategoriasData = metrics ? {
    labels: metrics.topCategorias.map(c => c.categoria),
    datasets: [{
      label: "Unidades vendidas",
      data: metrics.topCategorias.map(c => c.total_vendido),
      backgroundColor: ["#8c2b53", "#b0436e", "#d4628a", "#e8849f", "#f2a6b8"],
      borderRadius: 6,
    }]
  } : null

  return (
    <section className="admin-page">
      <div className="admin-container">
        <h1>Painel do Administrador</h1>

        {/* === Abas === */}
        <div className="dash-tabs">
          <button
            className={`dash-tab ${abaAtiva === "dashboard" ? "active" : ""}`}
            onClick={() => setAbaAtiva("dashboard")}
          >
            📊 Dashboard
          </button>
          <button
            className={`dash-tab ${abaAtiva === "cadastrar" ? "active" : ""}`}
            onClick={() => setAbaAtiva("cadastrar")}
          >
            ➕ Cadastrar Produto
          </button>
        </div>

        {/* ========== ABA DASHBOARD ========== */}
        {abaAtiva === "dashboard" && (
          <div className="dash-content">
            {loading ? (
              <div className="dash-loading">
                <div className="dash-spinner"></div>
                <p>Carregando métricas...</p>
              </div>
            ) : metrics ? (
              <>
                {/* KPIs */}
                <div className="dash-kpis">
                  <div className="dash-kpi-card">
                    <span className="dash-kpi-icon">💰</span>
                    <div>
                      <p className="dash-kpi-label">Faturamento Total</p>
                      <p className="dash-kpi-value">{formatarReal(metrics.kpis.faturamento)}</p>
                    </div>
                  </div>
                  <div className="dash-kpi-card">
                    <span className="dash-kpi-icon">📦</span>
                    <div>
                      <p className="dash-kpi-label">Total de Pedidos</p>
                      <p className="dash-kpi-value">{metrics.kpis.totalPedidos}</p>
                    </div>
                  </div>
                  <div className="dash-kpi-card">
                    <span className="dash-kpi-icon">🎯</span>
                    <div>
                      <p className="dash-kpi-label">Ticket Médio</p>
                      <p className="dash-kpi-value">{formatarReal(metrics.kpis.ticketMedio)}</p>
                    </div>
                  </div>
                  <div className="dash-kpi-card">
                    <span className="dash-kpi-icon">👥</span>
                    <div>
                      <p className="dash-kpi-label">Clientes Cadastrados</p>
                      <p className="dash-kpi-value">{metrics.kpis.totalClientes}</p>
                    </div>
                  </div>
                  <div className="dash-kpi-card">
                    <span className="dash-kpi-icon">🧴</span>
                    <div>
                      <p className="dash-kpi-label">Perfumes no Catálogo</p>
                      <p className="dash-kpi-value">{metrics.kpis.totalProdutos}</p>
                    </div>
                  </div>
                  <div className="dash-kpi-card">
                    <span className="dash-kpi-icon">📋</span>
                    <div>
                      <p className="dash-kpi-label">Itens em Estoque</p>
                      <p className="dash-kpi-value">{metrics.kpis.totalEstoque}</p>
                    </div>
                  </div>
                </div>

                {/* Gráficos */}
                <div className="dash-charts">
                  <div className="dash-chart-card dash-chart-wide">
                    <h3>Faturamento por Mês</h3>
                    {vendasPorMesData && vendasPorMesData.labels.length > 0 ? (
                      <Bar data={vendasPorMesData} options={{
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, ticks: { callback: v => `R$${v}` } } }
                      }} />
                    ) : <p className="dash-empty">Nenhuma venda registrada ainda.</p>}
                  </div>

                  <div className="dash-chart-card">
                    <h3>Status dos Pedidos</h3>
                    {statusData && statusData.labels.length > 0 ? (
                      <Doughnut data={statusData} options={{
                        responsive: true,
                        plugins: { legend: { position: "bottom", labels: { padding: 15, usePointStyle: true } } }
                      }} />
                    ) : <p className="dash-empty">Nenhum pedido encontrado.</p>}
                  </div>

                  <div className="dash-chart-card">
                    <h3>Top Categorias Vendidas</h3>
                    {topCategoriasData && topCategoriasData.labels.length > 0 ? (
                      <Bar data={topCategoriasData} options={{
                        indexAxis: "y", responsive: true,
                        plugins: { legend: { display: false } },
                        scales: { x: { beginAtZero: true } }
                      }} />
                    ) : <p className="dash-empty">Nenhuma venda por categoria.</p>}
                  </div>
                </div>

                {/* Tabelas */}
                <div className="dash-tables">
                  {/* Top Vendidos */}
                  <div className="dash-table-card">
                    <h3>🏆 Top 10 Perfumes Mais Vendidos</h3>
                    {metrics.topVendidos.length > 0 ? (
                      <table className="dash-table">
                        <thead>
                          <tr><th>#</th><th>Perfume</th><th>Marca</th><th>Vendidos</th><th>Receita</th></tr>
                        </thead>
                        <tbody>
                          {metrics.topVendidos.map((p, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td><td>{p.nome}</td><td>{p.marca}</td>
                              <td>{p.total_vendido}</td><td>{formatarReal(p.receita)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p className="dash-empty">Nenhuma venda registrada.</p>}
                  </div>

                  {/* Top Favoritados */}
                  <div className="dash-table-card">
                    <h3>❤️ Top 10 Perfumes Mais Favoritados</h3>
                    {metrics.topFavoritados.length > 0 ? (
                      <table className="dash-table">
                        <thead>
                          <tr><th>#</th><th>Perfume</th><th>Marca</th><th>Favoritos</th></tr>
                        </thead>
                        <tbody>
                          {metrics.topFavoritados.map((p, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td><td>{p.nome}</td><td>{p.marca}</td><td>{p.total_favoritos}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p className="dash-empty">Nenhum favorito registrado.</p>}
                  </div>

                  {/* Pedidos Recentes */}
                  <div className="dash-table-card dash-table-full">
                    <h3>🕐 Pedidos Recentes</h3>
                    {metrics.pedidosRecentes.length > 0 ? (
                      <table className="dash-table">
                        <thead>
                          <tr><th>Pedido</th><th>Cliente</th><th>Valor</th><th>Pagamento</th><th>Status</th><th>Data</th></tr>
                        </thead>
                        <tbody>
                          {metrics.pedidosRecentes.map((p, i) => (
                            <tr key={i}>
                              <td><strong>{p.numero_pedido}</strong></td>
                              <td>{p.cliente}</td>
                              <td>{formatarReal(p.valor_total)}</td>
                              <td>{p.forma_pagamento === "CARTAO_CREDITO" ? "Cartão" : "PIX"}</td>
                              <td>
                                <span className="dash-status-badge" style={{ backgroundColor: STATUS_COLORS[p.status] || "#999" }}>
                                  {STATUS_LABELS[p.status] || p.status}
                                </span>
                              </td>
                              <td>{formatarData(p.data)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p className="dash-empty">Nenhum pedido encontrado.</p>}
                  </div>

                  {/* Estoque Baixo */}
                  <div className="dash-table-card dash-table-full">
                    <h3>⚠️ Produtos com Estoque Baixo (≤ 5 unidades)</h3>
                    {metrics.estoqueBaixo.length > 0 ? (
                      <table className="dash-table">
                        <thead>
                          <tr><th>Perfume</th><th>Marca</th><th>Volume</th><th>Preço</th><th>Estoque</th></tr>
                        </thead>
                        <tbody>
                          {metrics.estoqueBaixo.map((p, i) => (
                            <tr key={i} className={p.estoque_qtd === 0 ? "dash-row-danger" : "dash-row-warn"}>
                              <td>{p.nome}</td><td>{p.marca}</td><td>{p.volume_ml}ml</td>
                              <td>{formatarReal(p.preco)}</td>
                              <td><strong>{p.estoque_qtd}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p className="dash-empty" style={{ color: "#059669" }}>✅ Todo estoque acima de 5 unidades!</p>}
                  </div>
                </div>
              </>
            ) : (
              <p className="dash-empty">Erro ao carregar métricas.</p>
            )}
          </div>
        )}

        {/* ========== ABA CADASTRAR ========== */}
        {abaAtiva === "cadastrar" && (
          <>
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
                <p>1. Coloque a imagem em <code>src/assets/products</code></p>
                <p>2. Importe no topo do <code>products.js</code>:</p>
                <pre>{`import ${produto.nomeImagem} from "../assets/products/${produto.nomeImagem}.png"`}</pre>
                <p>3. Cole este objeto dentro do array:</p>
                <pre>{codigoGerado}</pre>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default Admin