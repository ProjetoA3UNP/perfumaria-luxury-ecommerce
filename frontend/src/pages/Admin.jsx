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

  // === Estado da aba Produtos ===
  const [produtosList, setProdutosList] = useState([])
  const [produtosLoading, setProdutosLoading] = useState(false)
  const [produtosEditados, setProdutosEditados] = useState({})
  const [salvandoProduto, setSalvandoProduto] = useState(null)

  // === Estado da aba Pedidos ===
  const [pedidosList, setPedidosList] = useState([])
  const [pedidosLoading, setPedidosLoading] = useState(false)
  const [salvandoStatus, setSalvandoStatus] = useState(null)
  const [statusLogs, setStatusLogs] = useState([])

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

  // Carregar lista de produtos (aba Produtos)
  useEffect(() => {
    if (!autorizado || abaAtiva !== "produtos") return
    async function fetchProdutos() {
      setProdutosLoading(true)
      try {
        const res = await api.get("/products?all=true")
        // Para cada produto, buscar detalhes com variações
        const detalhados = await Promise.all(
          res.data.map(async (p) => {
            try {
              const det = await api.get(`/products/${p.id}?all=true`)
              return det.data
            } catch {
              return { ...p, variacoes: [{ id: p.variacao_id, volume_ml: p.volume_ml, preco: p.preco, estoque_qtd: p.estoque_qtd }] }
            }
          })
        )
        setProdutosList(detalhados)
      } catch (err) {
        console.error("Erro ao carregar produtos:", err)
      } finally {
        setProdutosLoading(false)
      }
    }
    fetchProdutos()
  }, [autorizado, abaAtiva])

  // === Exportação de Relatórios ===
  function exportarCSV() {
    if (!metrics) return;
    
    let csv = "RELATORIO DE FATURAMENTO E VENDAS - ESSENCE\n\n";
    
    csv += "--- INDICADORES GERAIS ---\n";
    csv += `Faturamento Total,R$ ${(metrics.kpis.faturamento / 100).toFixed(2)}\n`;
    csv += `Total de Pedidos,${metrics.kpis.totalPedidos}\n`;
    csv += `Ticket Medio,R$ ${(metrics.kpis.ticketMedio / 100).toFixed(2)}\n`;
    csv += `Total de Clientes,${metrics.kpis.totalClientes}\n\n`;

    csv += "--- TOP 10 PERFUMES MAIS VENDIDOS ---\n";
    csv += "Posicao,Perfume,Marca,Unidades Vendidas,Receita Bruta\n";
    metrics.topVendidos.forEach((p, i) => {
      csv += `${i+1},"${p.nome}","${p.marca}",${p.total_vendido},R$ ${(p.receita / 100).toFixed(2)}\n`;
    });

    csv += "\n--- ULTIMOS PEDIDOS ---\n";
    csv += "Pedido,Cliente,Valor,Status,Data\n";
    metrics.pedidosRecentes.forEach(p => {
      const dataStr = new Date(p.data).toLocaleDateString("pt-BR");
      csv += `${p.numero_pedido},"${p.cliente}",R$ ${(p.valor_total / 100).toFixed(2)},${p.status},${dataStr}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "relatorio_faturamento_essence.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportarPDF() {
    window.print();
  }

  // Funções da aba Produtos
  function handleProdutoEdit(produtoId, campo, valor) {
    setProdutosEditados(prev => ({
      ...prev,
      [produtoId]: { ...(prev[produtoId] || {}), [campo]: valor }
    }))
  }

  function handleVariacaoEdit(produtoId, variacaoId, campo, valor) {
    setProdutosEditados(prev => {
      const atual = prev[produtoId] || {}
      const vars = atual.variacoes || {}
      return {
        ...prev,
        [produtoId]: {
          ...atual,
          variacoes: {
            ...vars,
            [variacaoId]: { ...(vars[variacaoId] || {}), [campo]: valor }
          }
        }
      }
    })
  }

  async function salvarProduto(produtoId) {
    const edits = produtosEditados[produtoId]
    if (!edits) return

    setSalvandoProduto(produtoId)
    try {
      const body = {}
      if (edits.nome !== undefined) body.nome = edits.nome
      if (edits.ativo !== undefined) body.ativo = edits.ativo

      if (edits.variacoes) {
        body.variacoes = Object.entries(edits.variacoes).map(([id, data]) => ({
          id: Number(id), ...data
        }))
      }

      await api.put(`/products/${produtoId}`, body)

      // Atualizar lista local
      const det = await api.get(`/products/${produtoId}?all=true`)
      setProdutosList(prev => prev.map(p => p.id === produtoId ? det.data : p))
      setProdutosEditados(prev => { const n = {...prev}; delete n[produtoId]; return n })
      alert("Produto atualizado!")
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao salvar produto.")
    } finally {
      setSalvandoProduto(null)
    }
  }

  async function toggleAtivo(produto) {
    setSalvandoProduto(produto.id)
    try {
      await api.put(`/products/${produto.id}`, { ativo: !produto.ativo })
      setProdutosList(prev => prev.map(p => p.id === produto.id ? { ...p, ativo: !p.ativo } : p))
    } catch (err) {
      alert("Erro ao alterar status do produto.")
    } finally {
      setSalvandoProduto(null)
    }
  }

  // Carregar pedidos (aba Pedidos)
  useEffect(() => {
    if (!autorizado || abaAtiva !== "pedidos") return
    async function fetchPedidos() {
      setPedidosLoading(true)
      try {
        const [resPedidos, resLogs] = await Promise.all([
          api.get("/orders/admin/all"),
          api.get("/orders/admin/logs")
        ])
        setPedidosList(resPedidos.data)
        setStatusLogs(resLogs.data)
      } catch (err) {
        console.error("Erro ao carregar pedidos:", err)
      } finally {
        setPedidosLoading(false)
      }
    }
    fetchPedidos()
  }, [autorizado, abaAtiva])

  async function atualizarStatusPedido(pedidoId, novoStatus) {
    setSalvandoStatus(pedidoId)
    try {
      await api.patch(`/orders/admin/${pedidoId}/status`, { status: novoStatus })
      setPedidosList(prev => prev.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p))
      // Recarregar logs
      const resLogs = await api.get("/orders/admin/logs")
      setStatusLogs(resLogs.data)
      alert(`Status do pedido atualizado para "${STATUS_LABELS[novoStatus] || novoStatus}"! E-mail de notificação enviado ao cliente com sucesso.`)
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao atualizar status.")
    } finally {
      setSalvandoStatus(null)
    }
  }

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
            className={`dash-tab ${abaAtiva === "produtos" ? "active" : ""}`}
            onClick={() => setAbaAtiva("produtos")}
          >
            🧴 Produtos
          </button>
          <button
            className={`dash-tab ${abaAtiva === "pedidos" ? "active" : ""}`}
            onClick={() => setAbaAtiva("pedidos")}
          >
            📋 Pedidos
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
                {/* Botões de Exportação */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }} className="no-print">
                  <button 
                    onClick={exportarCSV}
                    style={{ padding: '10px 15px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    📥 Exportar CSV
                  </button>
                  <button 
                    onClick={exportarPDF}
                    style={{ padding: '10px 15px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    🖨️ Exportar PDF
                  </button>
                </div>

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

                {/* Log de alterações de status */}
                {metrics.ultimosLogs && metrics.ultimosLogs.length > 0 && (
                  <div className="dash-card" style={{ gridColumn: '1 / -1' }}>
                    <h3 className="dash-card-title">📜 Últimas Alterações de Status</h3>
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Pedido</th>
                          <th>De</th>
                          <th></th>
                          <th>Para</th>
                          <th>Admin</th>
                          <th>Data/Hora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.ultimosLogs.map((log, i) => (
                          <tr key={i}>
                            <td><strong>{log.numero_pedido}</strong></td>
                            <td>
                              <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', backgroundColor: (STATUS_COLORS[log.status_anterior] || '#999') + '22', color: STATUS_COLORS[log.status_anterior] || '#999' }}>
                                {STATUS_LABELS[log.status_anterior] || log.status_anterior}
                              </span>
                            </td>
                            <td style={{ color: '#999' }}>→</td>
                            <td>
                              <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', backgroundColor: (STATUS_COLORS[log.status_novo] || '#999') + '22', color: STATUS_COLORS[log.status_novo] || '#999' }}>
                                {STATUS_LABELS[log.status_novo] || log.status_novo}
                              </span>
                            </td>
                            <td>{log.admin_nome}</td>
                            <td style={{ fontSize: '12px', color: '#666' }}>{formatarData(log.data_alteracao)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <p className="dash-empty">Erro ao carregar métricas.</p>
            )}
          </div>
        )}

        {/* ========== ABA PRODUTOS (US18) ========== */}
        {abaAtiva === "produtos" && (
          <div className="dash-content">
            <h2 className="dash-section-title">Gerenciar Produtos</h2>
            {produtosLoading ? (
              <p className="dash-empty">Carregando produtos...</p>
            ) : produtosList.length === 0 ? (
              <p className="dash-empty">Nenhum produto encontrado.</p>
            ) : (
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>Marca</th>
                      <th>Variação</th>
                      <th>Preço (R$)</th>
                      <th>Estoque</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosList.map(p => {
                      const edits = produtosEditados[p.id] || {}
                      const variacoes = p.variacoes || []
                      const temEdicao = !!produtosEditados[p.id]

                      return variacoes.length > 0 ? variacoes.map((v, idx) => (
                        <tr key={`${p.id}-${v.id}`} style={{ opacity: p.ativo === false || p.ativo === 0 ? 0.5 : 1 }}>
                          {idx === 0 && (
                            <>
                              <td rowSpan={variacoes.length}>{p.id}</td>
                              <td rowSpan={variacoes.length}>{p.nome}</td>
                              <td rowSpan={variacoes.length}>{p.marca}</td>
                            </>
                          )}
                          <td>{v.volume_ml}ml</td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              defaultValue={Number(v.preco).toFixed(2)}
                              onChange={(e) => handleVariacaoEdit(p.id, v.id, 'preco', Number(e.target.value))}
                              style={{ width: '90px', padding: '4px 6px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'right' }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              defaultValue={v.estoque_qtd}
                              onChange={(e) => handleVariacaoEdit(p.id, v.id, 'estoque_qtd', Number(e.target.value))}
                              style={{ width: '65px', padding: '4px 6px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }}
                            />
                          </td>
                          {idx === 0 && (
                            <>
                              <td rowSpan={variacoes.length}>
                                <button
                                  onClick={() => toggleAtivo(p)}
                                  disabled={salvandoProduto === p.id}
                                  style={{
                                    padding: '4px 10px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                                    backgroundColor: p.ativo ? '#d1fae5' : '#fee2e2',
                                    color: p.ativo ? '#059669' : '#dc2626'
                                  }}
                                >
                                  {p.ativo ? 'Ativo' : 'Inativo'}
                                </button>
                              </td>
                              <td rowSpan={variacoes.length}>
                                <button
                                  onClick={() => salvarProduto(p.id)}
                                  disabled={!temEdicao || salvandoProduto === p.id}
                                  style={{
                                    padding: '5px 12px', border: 'none', borderRadius: '6px', cursor: temEdicao ? 'pointer' : 'not-allowed',
                                    backgroundColor: temEdicao ? '#96305a' : '#e0e0e0',
                                    color: temEdicao ? '#fff' : '#999', fontSize: '12px', fontWeight: 'bold'
                                  }}
                                >
                                  {salvandoProduto === p.id ? '...' : 'Salvar'}
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      )) : (
                        <tr key={p.id} style={{ opacity: p.ativo === false || p.ativo === 0 ? 0.5 : 1 }}>
                          <td>{p.id}</td>
                          <td>{p.nome}</td>
                          <td>{p.marca}</td>
                          <td>—</td>
                          <td>{formatarReal(p.preco)}</td>
                          <td>{p.estoque_qtd}</td>
                          <td>
                            <button
                              onClick={() => toggleAtivo(p)}
                              disabled={salvandoProduto === p.id}
                              style={{
                                padding: '4px 10px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                                backgroundColor: p.ativo ? '#d1fae5' : '#fee2e2',
                                color: p.ativo ? '#059669' : '#dc2626'
                              }}
                            >
                              {p.ativo ? 'Ativo' : 'Inativo'}
                            </button>
                          </td>
                          <td>—</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========== ABA PEDIDOS (US19) ========== */}
        {abaAtiva === "pedidos" && (
          <div className="dash-content">
            <h2 className="dash-section-title">Gerenciar Pedidos</h2>
            {pedidosLoading ? (
              <p className="dash-empty">Carregando pedidos...</p>
            ) : pedidosList.length === 0 ? (
              <p className="dash-empty">Nenhum pedido encontrado.</p>
            ) : (
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Cliente</th>
                      <th>Valor</th>
                      <th>Pagamento</th>
                      <th>Data</th>
                      <th>Status Atual</th>
                      <th>Alterar Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosList.map(pedido => (
                      <tr key={pedido.id}>
                        <td><strong>{pedido.numero_pedido}</strong></td>
                        <td>
                          <div>{pedido.cliente_nome}</div>
                          <small style={{ color: '#888' }}>{pedido.cliente_email}</small>
                        </td>
                        <td>{formatarReal(pedido.valor_total)}</td>
                        <td>{pedido.forma_pagamento === 'CARTAO_CREDITO' ? 'Cartão' : 'PIX'}</td>
                        <td>{formatarData(pedido.data)}</td>
                        <td>
                          <span style={{
                            display: 'inline-block', padding: '4px 10px', borderRadius: '12px',
                            fontSize: '11px', fontWeight: 'bold',
                            backgroundColor: STATUS_COLORS[pedido.status] + '22',
                            color: STATUS_COLORS[pedido.status],
                            border: `1px solid ${STATUS_COLORS[pedido.status]}`
                          }}>
                            {STATUS_LABELS[pedido.status] || pedido.status}
                          </span>
                        </td>
                        <td>
                          {pedido.status === 'ENTREGUE' || pedido.status === 'CANCELADO' ? (
                            <span style={{ fontSize: '12px', color: '#999' }}>Finalizado</span>
                          ) : (
                            <select
                              value={pedido.status}
                              disabled={salvandoStatus === pedido.id}
                              onChange={(e) => atualizarStatusPedido(pedido.id, e.target.value)}
                              style={{
                                padding: '5px 8px', borderRadius: '6px', border: '1px solid #ddd',
                                fontSize: '12px', cursor: 'pointer',
                                backgroundColor: salvandoStatus === pedido.id ? '#f0f0f0' : '#fff'
                              }}
                            >
                              <option value="AGUARDANDO_PAGAMENTO">Aguardando</option>
                              <option value="PAGO">Pago</option>
                              <option value="PROCESSANDO">Processando</option>
                              <option value="ENVIADO">Enviado</option>
                              <option value="ENTREGUE">Entregue</option>
                              <option value="CANCELADO">Cancelado</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Log de Auditoria */}
            {statusLogs.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h3 className="dash-section-title" style={{ fontSize: '16px' }}>📜 Histórico de Alterações</h3>
                <div className="dash-table-wrap" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Pedido</th>
                        <th>De</th>
                        <th></th>
                        <th>Para</th>
                        <th>Admin</th>
                        <th>Data/Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusLogs.map(log => (
                        <tr key={log.id}>
                          <td><strong>{log.numero_pedido}</strong></td>
                          <td>
                            <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', backgroundColor: (STATUS_COLORS[log.status_anterior] || '#999') + '22', color: STATUS_COLORS[log.status_anterior] || '#999' }}>
                              {STATUS_LABELS[log.status_anterior] || log.status_anterior}
                            </span>
                          </td>
                          <td style={{ fontSize: '14px', color: '#999' }}>→</td>
                          <td>
                            <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', backgroundColor: (STATUS_COLORS[log.status_novo] || '#999') + '22', color: STATUS_COLORS[log.status_novo] || '#999' }}>
                              {STATUS_LABELS[log.status_novo] || log.status_novo}
                            </span>
                          </td>
                          <td>{log.admin_nome}</td>
                          <td style={{ fontSize: '12px', color: '#666' }}>{formatarData(log.data_alteracao)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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