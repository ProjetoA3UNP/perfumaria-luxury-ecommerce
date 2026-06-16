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

// Helper Component para o botão de Info (i) nos cards do dashboard
function InfoIcon({ titulo, descricao, setInfoModalCard }) {
  return (
    <button 
      onClick={() => setInfoModalCard({ titulo, descricao })}
      title="Informações sobre esta métrica"
      className="admin-info-btn no-print"
      style={{
        position: 'absolute', top: '15px', right: '15px', background: 'none',
        border: '1px solid #8c2b53', borderRadius: '50%', color: '#8c2b53',
        width: '22px', height: '22px', fontSize: '14px', fontFamily: 'serif',
        cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center',
        fontWeight: 'bold', zIndex: 5, paddingBottom: '1px'
      }}
    >
      i
    </button>
  );
}

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

  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState("success")

  function showToast(message, type = "success") {
    setToastMessage(message)
    setToastType(type)
    setTimeout(() => {
      setToastMessage("")
    }, 3000)
  }

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
  const [infoModalCard, setInfoModalCard] = useState(null) // Modal de info dos cards

  // === Estados do Modal de Exportação ===
  const [modalExportAberto, setModalExportAberto] = useState(false)
  const [exportFormat, setExportFormat] = useState("pdf") // "pdf" ou "csv"
  const [exportOptions, setExportOptions] = useState({
    indicadores: true,
    vendasMes: true,
    statusPedidos: true,
    topCategorias: true,
    topVendidos: true,
    topFavoritados: true,
    pedidosRecentes: true,
    estoqueBaixo: true,
    produtosList: false,
    pedidosList: false,
    statusLogs: false
  })

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

  // Carregar lista de produtos (aba Produtos ou ao abrir modal de exportação)
  useEffect(() => {
    if (!autorizado) return
    if (abaAtiva !== "produtos" && !modalExportAberto) return
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
  }, [autorizado, abaAtiva, modalExportAberto])

  // === Exportação de Relatórios Customizada ===
  function abrirModalExportar(formato) {
    setExportFormat(formato)
    if (abaAtiva === "dashboard") {
      setExportOptions({
        indicadores: true,
        vendasMes: true,
        statusPedidos: true,
        topCategorias: true,
        topVendidos: true,
        topFavoritados: true,
        pedidosRecentes: true,
        estoqueBaixo: true,
        produtosList: false,
        pedidosList: false,
        statusLogs: false
      })
    } else if (abaAtiva === "produtos") {
      setExportOptions({
        indicadores: false,
        vendasMes: false,
        statusPedidos: false,
        topCategorias: false,
        topVendidos: false,
        topFavoritados: false,
        pedidosRecentes: false,
        estoqueBaixo: false,
        produtosList: true,
        pedidosList: false,
        statusLogs: false
      })
    } else if (abaAtiva === "pedidos") {
      setExportOptions({
        indicadores: false,
        vendasMes: false,
        statusPedidos: false,
        topCategorias: false,
        topVendidos: false,
        topFavoritados: false,
        pedidosRecentes: false,
        estoqueBaixo: false,
        produtosList: false,
        pedidosList: true,
        statusLogs: true
      })
    } else {
      setExportOptions({
        indicadores: true,
        vendasMes: false,
        statusPedidos: false,
        topCategorias: false,
        topVendidos: false,
        topFavoritados: false,
        pedidosRecentes: false,
        estoqueBaixo: false,
        produtosList: false,
        pedidosList: false,
        statusLogs: false
      })
    }
    setModalExportAberto(true)
  }

  function toggleExportOption(key) {
    setExportOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function setBulkOptions(grupo, valor) {
    if (grupo === "dashboard") {
      setExportOptions(prev => ({
        ...prev,
        indicadores: valor,
        vendasMes: valor,
        statusPedidos: valor,
        topCategorias: valor,
        topVendidos: valor,
        topFavoritados: valor,
        pedidosRecentes: valor,
        estoqueBaixo: valor
      }))
    } else if (grupo === "produtos") {
      setExportOptions(prev => ({
        ...prev,
        produtosList: valor
      }))
    } else if (grupo === "pedidos") {
      setExportOptions(prev => ({
        ...prev,
        pedidosList: valor,
        statusLogs: valor
      }))
    }
  }

  function processarExportacao() {
    setModalExportAberto(false)
    if (exportFormat === "csv") {
      gerarCSV()
    } else {
      gerarPDF()
    }
  }

  function gerarCSV() {
    if (!metrics) return;
    
    let csv = "\uFEFFRELATORIO ESSENCE - EXPORTACAO CUSTOMIZADA\n";
    csv += `Gerado em: ${new Date().toLocaleDateString("pt-BR")} as ${new Date().toLocaleTimeString("pt-BR")}\n\n`;
    
    if (exportOptions.indicadores) {
      csv += "--- INDICADORES GERAIS ---\n";
      csv += `Faturamento Total;R$ ${Number(metrics.kpis.faturamento).toFixed(2).replace('.', ',')}\n`;
      csv += `Total de Pedidos;${metrics.kpis.totalPedidos}\n`;
      csv += `Ticket Medio;R$ ${Number(metrics.kpis.ticketMedio).toFixed(2).replace('.', ',')}\n`;
      csv += `Total de Clientes;${metrics.kpis.totalClientes}\n`;
      csv += `Perfumes no Catalogo;${metrics.kpis.totalProdutos}\n`;
      csv += `Itens em Estoque;${metrics.kpis.totalEstoque}\n\n`;
    }

    if (exportOptions.topVendidos) {
      csv += "--- TOP 10 PERFUMES MAIS VENDIDOS ---\n";
      csv += "Posicao;Perfume;Marca;Unidades Vendidas;Receita Bruta\n";
      metrics.topVendidos.forEach((p, i) => {
        csv += `${i+1};"${p.nome}";"${p.marca}";${p.total_vendido};R$ ${Number(p.receita).toFixed(2).replace('.', ',')}\n`;
      });
      csv += "\n";
    }

    if (exportOptions.topFavoritados) {
      csv += "--- TOP 10 PERFUMES MAIS FAVORITADOS ---\n";
      csv += "Posicao;Perfume;Marca;Total Favoritos\n";
      metrics.topFavoritados.forEach((p, i) => {
        csv += `${i+1};"${p.nome}";"${p.marca}";${p.total_favoritos}\n`;
      });
      csv += "\n";
    }

    if (exportOptions.pedidosRecentes) {
      csv += "--- ULTIMOS PEDIDOS ---\n";
      csv += "Pedido;Cliente;Valor;Status;Data\n";
      metrics.pedidosRecentes.forEach(p => {
        const dataStr = new Date(p.data).toLocaleDateString("pt-BR");
        csv += `${p.numero_pedido};"${p.cliente}";R$ ${Number(p.valor_total).toFixed(2).replace('.', ',')};${STATUS_LABELS[p.status] || p.status};${dataStr}\n`;
      });
      csv += "\n";
    }

    if (exportOptions.estoqueBaixo) {
      csv += "--- PRODUTOS COM ESTOQUE BAIXO ---\n";
      csv += "Perfume;Marca;Volume;Estoque;Preco\n";
      metrics.estoqueBaixo.forEach(p => {
        csv += `"${p.nome}";"${p.marca}";${p.volume_ml}ml;${p.estoque_qtd};R$ ${Number(p.preco).toFixed(2).replace('.', ',')}\n`;
      });
      csv += "\n";
    }

    if (exportOptions.produtosList) {
      csv += "--- CATALOGO DE PRODUTOS E ESTOQUE ---\n";
      csv += "ID;Produto;Marca;Ativo;Volume;Preco;Estoque\n";
      produtosList.forEach(p => {
        const variacoes = p.variacoes || [];
        variacoes.forEach(v => {
          csv += `${p.id};"${p.nome}";"${p.marca}";${p.ativo ? 'Ativo' : 'Inativo'};${v.volume_ml}ml;R$ ${Number(v.preco).toFixed(2).replace('.', ',')};${v.estoque_qtd}\n`;
        });
      });
      csv += "\n";
    }

    if (exportOptions.pedidosList) {
      csv += "--- LISTA GERAL DE PEDIDOS ---\n";
      csv += "Pedido;Cliente;Valor;Status;Pagamento;Data\n";
      pedidosList.forEach(p => {
        const dataStr = new Date(p.data).toLocaleDateString("pt-BR");
        csv += `${p.numero_pedido};"${p.cliente_nome}";R$ ${Number(p.valor_total).toFixed(2).replace('.', ',')};${STATUS_LABELS[p.status] || p.status};${p.forma_pagamento === 'CARTAO_CREDITO' ? 'Cartao' : 'PIX'};${dataStr}\n`;
      });
      csv += "\n";
    }

    if (exportOptions.statusLogs) {
      csv += "--- HISTORICO DE ALTERACOES DE STATUS (AUDITORIA) ---\n";
      csv += "Pedido;De;Para;Admin;Data\n";
      statusLogs.forEach(l => {
        const dataStr = new Date(l.data_alteracao).toLocaleDateString("pt-BR");
        csv += `${l.numero_pedido};${STATUS_LABELS[l.status_anterior] || l.status_anterior};${STATUS_LABELS[l.status_novo] || l.status_novo};"${l.admin_nome}";${dataStr}\n`;
      });
      csv += "\n";
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_essence_customizado_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Relatório CSV gerado com sucesso!", "success");
  }

  function gerarPDF() {
    setTimeout(() => {
      window.print();
    }, 150);
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
      window.dispatchEvent(new Event("produtosAtualizados"))
      showToast("Produto atualizado com sucesso!", "success")
    } catch (err) {
      showToast(err.response?.data?.error || "Erro ao salvar produto.", "error")
    } finally {
      setSalvandoProduto(null)
    }
  }

  async function toggleAtivo(produto) {
    setSalvandoProduto(produto.id)
    try {
      await api.put(`/products/${produto.id}`, { ativo: !produto.ativo })
      setProdutosList(prev => prev.map(p => p.id === produto.id ? { ...p, ativo: !p.ativo } : p))
      window.dispatchEvent(new Event("produtosAtualizados"))
      showToast(`Produto ${!produto.ativo ? 'ativado' : 'inativado'} com sucesso!`, "success")
    } catch (err) {
      showToast("Erro ao alterar status do produto.", "error")
    } finally {
      setSalvandoProduto(null)
    }
  }

  // Carregar pedidos (aba Pedidos ou ao abrir modal de exportação)
  useEffect(() => {
    if (!autorizado) return
    if (abaAtiva !== "pedidos" && !modalExportAberto) return
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
  }, [autorizado, abaAtiva, modalExportAberto])

  async function atualizarStatusPedido(pedidoId, novoStatus) {
    setSalvandoStatus(pedidoId)
    try {
      await api.patch(`/orders/admin/${pedidoId}/status`, { status: novoStatus })
      setPedidosList(prev => prev.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p))
      // Recarregar logs
      const resLogs = await api.get("/orders/admin/logs")
      setStatusLogs(resLogs.data)
      showToast(`Status do pedido atualizado para "${STATUS_LABELS[novoStatus] || novoStatus}"! E-mail de notificação enviado ao cliente com sucesso.`, "success")
    } catch (err) {
      showToast(err.response?.data?.error || "Erro ao atualizar status.", "error")
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
      showToast("Preencha todas as informações e selecione uma imagem.", "error")
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
    <section className="admin-page" style={{ position: 'relative' }}>
      <style>{`
        @keyframes fadeInOut {
          0% { transform: translate(-50%, -20px); opacity: 0; }
          15% { transform: translate(-50%, 0); opacity: 1; }
          85% { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, -20px); opacity: 0; }
        }
      `}</style>

      {/* Toast de Notificação Premium */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: toastType === 'success' ? '#f4fbf7' : '#fdf3f3',
          color: toastType === 'success' ? '#059669' : '#dc2626',
          border: `1px solid ${toastType === 'success' ? '#c2ebd9' : '#fca5a5'}`,
          padding: '12px 24px',
          borderRadius: '30px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          zIndex: 9999,
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '14px',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeInOut 3s forwards'
        }}>
          {toastType === 'success' ? '✓' : '✕'} {toastMessage}
        </div>
      )}
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
                    onClick={() => abrirModalExportar("csv")}
                    style={{ padding: '10px 15px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    📥 Exportar CSV
                  </button>
                  <button 
                    onClick={() => abrirModalExportar("pdf")}
                    style={{ padding: '10px 15px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    🖨️ Exportar PDF
                  </button>
                </div>

                {/* KPIs */}
                <div className="dash-kpis">
                  <div className="dash-kpi-card">
                    <InfoIcon 
                      titulo="Faturamento Total" 
                      descricao="Soma de todos os pagamentos recebidos com sucesso. Pedidos pendentes ou cancelados não são contabilizados neste valor." 
                      setInfoModalCard={setInfoModalCard} 
                    />
                    <span className="dash-kpi-icon">💰</span>
                    <div>
                      <p className="dash-kpi-label">Faturamento Total</p>
                      <p className="dash-kpi-value">{formatarReal(metrics.kpis.faturamento)}</p>
                    </div>
                  </div>
                  <div className="dash-kpi-card">
                    <InfoIcon 
                      titulo="Total de Pedidos" 
                      descricao="Número bruto de pedidos realizados na loja, incluindo todas as situações (pagos, pendentes, recusados)." 
                      setInfoModalCard={setInfoModalCard} 
                    />
                    <span className="dash-kpi-icon">📦</span>
                    <div>
                      <p className="dash-kpi-label">Total de Pedidos</p>
                      <p className="dash-kpi-value">{metrics.kpis.totalPedidos}</p>
                    </div>
                  </div>
                  <div className="dash-kpi-card">
                    <InfoIcon 
                      titulo="Ticket Médio" 
                      descricao="Valor médio gasto por cada cliente por pedido pago. Calculado dividindo o faturamento total pelo número de pedidos pagos." 
                      setInfoModalCard={setInfoModalCard} 
                    />
                    <span className="dash-kpi-icon">🎯</span>
                    <div>
                      <p className="dash-kpi-label">Ticket Médio</p>
                      <p className="dash-kpi-value">{formatarReal(metrics.kpis.ticketMedio)}</p>
                    </div>
                  </div>
                  <div className="dash-kpi-card">
                    <InfoIcon 
                      titulo="Clientes Cadastrados" 
                      descricao="Quantidade total de usuários registrados no sistema com o perfil CLIENTE (exclui administradores)." 
                      setInfoModalCard={setInfoModalCard} 
                    />
                    <span className="dash-kpi-icon">👥</span>
                    <div>
                      <p className="dash-kpi-label">Clientes Cadastrados</p>
                      <p className="dash-kpi-value">{metrics.kpis.totalClientes}</p>
                    </div>
                  </div>
                  <div className="dash-kpi-card">
                    <InfoIcon 
                      titulo="Perfumes no Catálogo" 
                      descricao="Soma de produtos que estão com o status ATIVO na loja para os clientes poderem comprar." 
                      setInfoModalCard={setInfoModalCard} 
                    />
                    <span className="dash-kpi-icon">🧴</span>
                    <div>
                      <p className="dash-kpi-label">Perfumes no Catálogo</p>
                      <p className="dash-kpi-value">{metrics.kpis.totalProdutos}</p>
                    </div>
                  </div>
                  <div className="dash-kpi-card">
                    <InfoIcon 
                      titulo="Itens em Estoque" 
                      descricao="Contagem de todas as variações unitárias e volumes de ML que temos disponíveis fisicamente em nosso estoque." 
                      setInfoModalCard={setInfoModalCard} 
                    />
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
                    <InfoIcon 
                      titulo="Faturamento por Mês" 
                      descricao="Gráfico que apresenta a curva de faturamento separada mensalmente para análise de crescimento." 
                      setInfoModalCard={setInfoModalCard} 
                    />
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
                    <InfoIcon 
                      titulo="Status dos Pedidos" 
                      descricao="Gráfico de rosca evidenciando a distribuição atual dos pedidos: pagos, recusados e aguardando processamento." 
                      setInfoModalCard={setInfoModalCard} 
                    />
                    <h3>Status dos Pedidos</h3>
                    {statusData && statusData.labels.length > 0 ? (
                      <Doughnut data={statusData} options={{
                        responsive: true,
                        plugins: { legend: { position: "bottom", labels: { padding: 15, usePointStyle: true } } }
                      }} />
                    ) : <p className="dash-empty">Nenhum pedido encontrado.</p>}
                  </div>

                  <div className="dash-chart-card">
                    <InfoIcon 
                      titulo="Top Categorias Vendidas" 
                      descricao="Mede quais categorias (Casual, Elegante, Esportivo...) geram maior engajamento e quantidade de vendas." 
                      setInfoModalCard={setInfoModalCard} 
                    />
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
                    <InfoIcon 
                      titulo="Top 10 Perfumes Mais Vendidos" 
                      descricao="Tabela ranqueada dos 10 perfumes com maior faturamento e unidades vendidas, os verdadeiros carros-chefes da loja." 
                      setInfoModalCard={setInfoModalCard} 
                    />
                    <h3>🏆 Top 10 Perfumes Mais Vendidos</h3>
                    {metrics.topVendidos.length > 0 ? (
                      <>
                        <table className="dash-table admin-desktop-only">
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

                        <div className="dash-mobile-list admin-mobile-only">
                          {metrics.topVendidos.map((p, i) => (
                            <div key={i} className="dash-mobile-card">
                              <div className="dash-mobile-card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span className={`dash-mobile-rank-badge rank-${i + 1}`}>
                                    {i + 1}
                                  </span>
                                  <div>
                                    <div className="dash-mobile-card-title">{p.nome}</div>
                                    <div className="dash-mobile-card-subtitle">{p.marca}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="dash-mobile-card-row">
                                <span className="dash-mobile-card-label">Vendidos</span>
                                <span className="dash-mobile-card-value">{p.total_vendido}</span>
                              </div>
                              <div className="dash-mobile-card-row">
                                <span className="dash-mobile-card-label">Receita</span>
                                <span className="dash-mobile-card-value">{formatarReal(p.receita)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : <p className="dash-empty">Nenhuma venda registrada.</p>}
                  </div>

                  {/* Top Favoritados */}
                  <div className="dash-table-card">
                    <InfoIcon 
                      titulo="Top 10 Perfumes Mais Favoritados" 
                      descricao="Tabela ranqueada dos 10 perfumes mais curtidos pelos usuários, ajudando a traçar tendências para marketing ou promoções." 
                      setInfoModalCard={setInfoModalCard} 
                    />
                    <h3>❤️ Top 10 Perfumes Mais Favoritados</h3>
                    {metrics.topFavoritados.length > 0 ? (
                      <>
                        <table className="dash-table admin-desktop-only">
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

                        <div className="dash-mobile-list admin-mobile-only">
                          {metrics.topFavoritados.map((p, i) => (
                            <div key={i} className="dash-mobile-card">
                              <div className="dash-mobile-card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span className={`dash-mobile-rank-badge rank-${i + 1}`}>
                                    {i + 1}
                                  </span>
                                  <div>
                                    <div className="dash-mobile-card-title">{p.nome}</div>
                                    <div className="dash-mobile-card-subtitle">{p.marca}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="dash-mobile-card-row">
                                <span className="dash-mobile-card-label">Favoritos</span>
                                <span className="dash-mobile-card-value">{p.total_favoritos} ❤️</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : <p className="dash-empty">Nenhum favorito registrado.</p>}
                  </div>

                  {/* Pedidos Recentes */}
                  <div className="dash-table-card dash-table-full">
                    <h3>🕐 Pedidos Recentes</h3>
                    {metrics.pedidosRecentes.length > 0 ? (
                      <>
                        <table className="dash-table admin-desktop-only">
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

                        <div className="dash-mobile-list admin-mobile-only">
                          {metrics.pedidosRecentes.map((p, i) => (
                            <div key={i} className="dash-mobile-card">
                              <div className="dash-mobile-card-header">
                                <span className="dash-mobile-card-title">Pedido: #{p.numero_pedido}</span>
                                <span className="dash-status-badge" style={{ backgroundColor: STATUS_COLORS[p.status] || "#999" }}>
                                  {STATUS_LABELS[p.status] || p.status}
                                </span>
                              </div>
                              <div className="dash-mobile-card-row">
                                <span className="dash-mobile-card-label">Cliente</span>
                                <span className="dash-mobile-card-value">{p.cliente}</span>
                              </div>
                              <div className="dash-mobile-card-row">
                                <span className="dash-mobile-card-label">Valor</span>
                                <span className="dash-mobile-card-value">{formatarReal(p.valor_total)}</span>
                              </div>
                              <div className="dash-mobile-card-row">
                                <span className="dash-mobile-card-label">Pagamento</span>
                                <span className="dash-mobile-card-value">{p.forma_pagamento === "CARTAO_CREDITO" ? "Cartão" : "PIX"}</span>
                              </div>
                              <div className="dash-mobile-card-row">
                                <span className="dash-mobile-card-label">Data</span>
                                <span className="dash-mobile-card-value" style={{ fontSize: '12px' }}>{formatarData(p.data)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : <p className="dash-empty">Nenhum pedido encontrado.</p>}
                  </div>

                  {/* Estoque Baixo */}
                  <div className="dash-table-card dash-table-full">
                    <h3>⚠️ Produtos com Estoque Baixo (≤ 5 unidades)</h3>
                    {metrics.estoqueBaixo.length > 0 ? (
                      <>
                        <table className="dash-table admin-desktop-only">
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

                        <div className="dash-mobile-list admin-mobile-only">
                          {metrics.estoqueBaixo.map((p, i) => (
                            <div key={i} className={`dash-mobile-card ${p.estoque_qtd === 0 ? "dash-row-danger" : "dash-row-warn"}`} style={{ borderLeft: `5px solid ${p.estoque_qtd === 0 ? "#ef4444" : "#f59e0b"}` }}>
                              <div className="dash-mobile-card-header">
                                <div>
                                  <div className="dash-mobile-card-title">{p.nome}</div>
                                  <div className="dash-mobile-card-subtitle">{p.marca}</div>
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', backgroundColor: p.estoque_qtd === 0 ? '#fee2e2' : '#fef3c7', color: p.estoque_qtd === 0 ? '#ef4444' : '#b45309' }}>
                                  {p.estoque_qtd} un
                                </span>
                              </div>
                              <div className="dash-mobile-card-row">
                                <span className="dash-mobile-card-label">Volume</span>
                                <span className="dash-mobile-card-value">{p.volume_ml}ml</span>
                              </div>
                              <div className="dash-mobile-card-row">
                                <span className="dash-mobile-card-label">Preço</span>
                                <span className="dash-mobile-card-value">{formatarReal(p.preco)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : <p className="dash-empty" style={{ color: "#059669" }}>✅ Todo estoque acima de 5 unidades!</p>}
                  </div>
                </div>

                {/* Log de alterações de status */}
                {metrics.ultimosLogs && metrics.ultimosLogs.length > 0 && (
                  <div className="dash-card" style={{ gridColumn: '1 / -1' }}>
                    <h3 className="dash-card-title">📜 Últimas Alterações de Status</h3>
                    <table className="dash-table admin-desktop-only">
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

                    <div className="dash-mobile-list admin-mobile-only">
                      {metrics.ultimosLogs.map((log, i) => (
                        <div key={i} className="dash-mobile-card">
                          <div className="dash-mobile-card-header">
                            <span className="dash-mobile-card-title">Pedido: #{log.numero_pedido}</span>
                            <span style={{ fontSize: '11px', color: '#666' }}>{formatarData(log.data_alteracao)}</span>
                          </div>
                          <div className="dash-mobile-card-row">
                            <span className="dash-mobile-card-label">Alteração</span>
                            <span className="dash-mobile-card-value">
                              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', backgroundColor: (STATUS_COLORS[log.status_anterior] || '#999') + '22', color: STATUS_COLORS[log.status_anterior] || '#999' }}>
                                {STATUS_LABELS[log.status_anterior] || log.status_anterior}
                              </span>
                              <span style={{ margin: '0 6px', color: '#999' }}>→</span>
                              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', backgroundColor: (STATUS_COLORS[log.status_novo] || '#999') + '22', color: STATUS_COLORS[log.status_novo] || '#999' }}>
                                {STATUS_LABELS[log.status_novo] || log.status_novo}
                              </span>
                            </span>
                          </div>
                          <div className="dash-mobile-card-row">
                            <span className="dash-mobile-card-label">Responsável</span>
                            <span className="dash-mobile-card-value">{log.admin_nome}</span>
                          </div>
                        </div>
                      ))}
                    </div>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }} className="no-print">
              <button 
                onClick={() => abrirModalExportar("csv")}
                style={{ padding: '10px 15px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                📥 Exportar CSV
              </button>
              <button 
                onClick={() => abrirModalExportar("pdf")}
                style={{ padding: '10px 15px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🖨️ Exportar PDF
              </button>
            </div>
            {produtosLoading ? (
              <p className="dash-empty">Carregando produtos...</p>
            ) : produtosList.length === 0 ? (
              <p className="dash-empty">Nenhum produto encontrado.</p>
            ) : (
              <div className="dash-table-wrap">
                {/* Versão Desktop */}
                <table className="dash-table admin-desktop-only">
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

                {/* Versão Mobile */}
                <div className="dash-mobile-list admin-mobile-only">
                  {produtosList.map(p => {
                    const edits = produtosEditados[p.id] || {}
                    const variacoes = p.variacoes || []
                    const temEdicao = !!produtosEditados[p.id]

                    return (
                      <div key={p.id} className="dash-mobile-card" style={{ opacity: p.ativo === false || p.ativo === 0 ? 0.7 : 1 }}>
                        <div className="dash-mobile-card-header">
                          <span className="dash-mobile-card-title">ID: #{p.id}</span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                          </div>
                        </div>

                        <div>
                          <div className="dash-mobile-card-title" style={{ fontSize: '15px' }}>{p.nome}</div>
                          <div className="dash-mobile-card-subtitle">{p.marca}</div>
                        </div>

                        {variacoes.length > 0 ? (
                          <div className="dash-mobile-variations-list">
                            {variacoes.map((v) => (
                              <div key={v.id} className="dash-mobile-variation-item">
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#96305a' }}>
                                  Volume: {v.volume_ml}ml
                                </div>
                                <div className="dash-mobile-inputs">
                                  <div className="dash-mobile-input-group">
                                    <label>Preço (R$)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      defaultValue={Number(v.preco).toFixed(2)}
                                      onChange={(e) => handleVariacaoEdit(p.id, v.id, 'preco', Number(e.target.value))}
                                    />
                                  </div>
                                  <div className="dash-mobile-input-group">
                                    <label>Estoque</label>
                                    <input
                                      type="number"
                                      defaultValue={v.estoque_qtd}
                                      onChange={(e) => handleVariacaoEdit(p.id, v.id, 'estoque_qtd', Number(e.target.value))}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
                            <div className="dash-mobile-card-row">
                              <span className="dash-mobile-card-label">Preço</span>
                              <span className="dash-mobile-card-value">{formatarReal(p.preco)}</span>
                            </div>
                            <div className="dash-mobile-card-row">
                              <span className="dash-mobile-card-label">Estoque</span>
                              <span className="dash-mobile-card-value">{p.estoque_qtd}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== ABA PEDIDOS (US19) ========== */}
        {abaAtiva === "pedidos" && (
          <div className="dash-content">
            <h2 className="dash-section-title">Gerenciar Pedidos</h2>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }} className="no-print">
              <button 
                onClick={() => abrirModalExportar("csv")}
                style={{ padding: '10px 15px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                📥 Exportar CSV
              </button>
              <button 
                onClick={() => abrirModalExportar("pdf")}
                style={{ padding: '10px 15px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🖨️ Exportar PDF
              </button>
            </div>
            {pedidosLoading ? (
              <p className="dash-empty">Carregando pedidos...</p>
            ) : pedidosList.length === 0 ? (
              <p className="dash-empty">Nenhum pedido encontrado.</p>
            ) : (
              <div className="dash-table-wrap">
                {/* Versão Desktop */}
                <table className="dash-table admin-desktop-only">
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

                {/* Versão Mobile */}
                <div className="dash-mobile-list admin-mobile-only">
                  {pedidosList.map(pedido => (
                    <div key={pedido.id} className="dash-mobile-card">
                      <div className="dash-mobile-card-header">
                        <span className="dash-mobile-card-title">Pedido: #{pedido.numero_pedido}</span>
                        <span style={{
                          display: 'inline-block', padding: '4px 10px', borderRadius: '12px',
                          fontSize: '11px', fontWeight: 'bold',
                          backgroundColor: STATUS_COLORS[pedido.status] + '22',
                          color: STATUS_COLORS[pedido.status],
                          border: `1px solid ${STATUS_COLORS[pedido.status]}`
                        }}>
                          {STATUS_LABELS[pedido.status] || pedido.status}
                        </span>
                      </div>

                      <div className="dash-mobile-card-row">
                        <span className="dash-mobile-card-label">Cliente</span>
                        <span className="dash-mobile-card-value" style={{ textAlign: 'right' }}>
                          <strong>{pedido.cliente_nome}</strong> <br />
                          <small style={{ color: '#888', fontWeight: 'normal' }}>{pedido.cliente_email}</small>
                        </span>
                      </div>

                      <div className="dash-mobile-card-row">
                        <span className="dash-mobile-card-label">Valor Total</span>
                        <span className="dash-mobile-card-value">{formatarReal(pedido.valor_total)}</span>
                      </div>

                      <div className="dash-mobile-card-row">
                        <span className="dash-mobile-card-label">Pagamento</span>
                        <span className="dash-mobile-card-value">{pedido.forma_pagamento === 'CARTAO_CREDITO' ? 'Cartão' : 'PIX'}</span>
                      </div>

                      <div className="dash-mobile-card-row">
                        <span className="dash-mobile-card-label">Data</span>
                        <span className="dash-mobile-card-value">{formatarData(pedido.data)}</span>
                      </div>

                      <div style={{ borderTop: '1px solid #f9f0f3', paddingTop: '10px', marginTop: '5px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#96305a', marginBottom: '6px' }}>
                          ALTERAR STATUS:
                        </div>
                        {pedido.status === 'ENTREGUE' || pedido.status === 'CANCELADO' ? (
                          <span style={{ fontSize: '12px', color: '#999', fontWeight: 'bold' }}>Finalizado</span>
                        ) : (
                          <select
                            value={pedido.status}
                            disabled={salvandoStatus === pedido.id}
                            onChange={(e) => atualizarStatusPedido(pedido.id, e.target.value)}
                            style={{
                              padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd',
                              fontSize: '13px', cursor: 'pointer', width: '100%',
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Log de Auditoria */}
            {statusLogs.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h3 className="dash-section-title" style={{ fontSize: '16px' }}>📜 Histórico de Alterações</h3>
                <div className="dash-table-wrap" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table className="dash-table admin-desktop-only">
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

                  <div className="dash-mobile-list admin-mobile-only">
                    {statusLogs.map(log => (
                      <div key={log.id} className="dash-mobile-card">
                        <div className="dash-mobile-card-header">
                          <span className="dash-mobile-card-title">Pedido: #{log.numero_pedido}</span>
                          <span style={{ fontSize: '11px', color: '#666' }}>{formatarData(log.data_alteracao)}</span>
                        </div>
                        <div className="dash-mobile-card-row">
                          <span className="dash-mobile-card-label">Alteração</span>
                          <span className="dash-mobile-card-value">
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', backgroundColor: (STATUS_COLORS[log.status_anterior] || '#999') + '22', color: STATUS_COLORS[log.status_anterior] || '#999' }}>
                              {STATUS_LABELS[log.status_anterior] || log.status_anterior}
                            </span>
                            <span style={{ margin: '0 6px', color: '#999' }}>→</span>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', backgroundColor: (STATUS_COLORS[log.status_novo] || '#999') + '22', color: STATUS_COLORS[log.status_novo] || '#999' }}>
                              {STATUS_LABELS[log.status_novo] || log.status_novo}
                            </span>
                          </span>
                        </div>
                        <div className="dash-mobile-card-row">
                          <span className="dash-mobile-card-label">Responsável</span>
                          <span className="dash-mobile-card-value">{log.admin_nome}</span>
                        </div>
                      </div>
                    ))}
                  </div>
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

      {/* Container Exclusivo para Impressão PDF */}
      {metrics && (
        <div className="print-only-report">
          <h1>Relatório Essence Perfumaria</h1>
          <div className="print-report-meta">
            Gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")} | Canal Administrativo
          </div>

          {exportOptions.indicadores && (
            <div className="print-section">
              <h2>Métricas e Indicadores Gerais</h2>
              <div className="print-kpi-grid">
                <div className="print-kpi-card">
                  <strong>Faturamento Total</strong>
                  {formatarReal(metrics.kpis.faturamento)}
                </div>
                <div className="print-kpi-card">
                  <strong>Total de Pedidos</strong>
                  {metrics.kpis.totalPedidos}
                </div>
                <div className="print-kpi-card">
                  <strong>Ticket Médio</strong>
                  {formatarReal(metrics.kpis.ticketMedio)}
                </div>
                <div className="print-kpi-card">
                  <strong>Clientes Cadastrados</strong>
                  {metrics.kpis.totalClientes}
                </div>
                <div className="print-kpi-card">
                  <strong>Produtos Cadastrados</strong>
                  {metrics.kpis.totalProdutos}
                </div>
                <div className="print-kpi-card">
                  <strong>Estoque Total (Físico)</strong>
                  {metrics.kpis.totalEstoque}
                </div>
              </div>
            </div>
          )}

          {exportOptions.vendasMes && vendasPorMesData && (
            <div className="print-section print-chart-section">
              <h2>Faturamento por Mês</h2>
              <div className="print-chart-container" style={{ maxWidth: '600px', margin: '0 auto', height: '300px', position: 'relative' }}>
                <Bar data={vendasPorMesData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, ticks: { callback: v => `R$${v}` } } }
                }} />
              </div>
            </div>
          )}

          {exportOptions.statusPedidos && statusData && (
            <div className="print-section print-chart-section">
              <h2>Status dos Pedidos</h2>
              <div className="print-chart-container" style={{ maxWidth: '350px', margin: '0 auto', height: '250px', position: 'relative' }}>
                <Doughnut data={statusData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom", labels: { padding: 10, usePointStyle: true } } }
                }} />
              </div>
            </div>
          )}

          {exportOptions.topCategorias && topCategoriasData && (
            <div className="print-section print-chart-section">
              <h2>Top Categorias Vendidas</h2>
              <div className="print-chart-container" style={{ maxWidth: '600px', margin: '0 auto', height: '300px', position: 'relative' }}>
                <Bar data={topCategoriasData} options={{
                  indexAxis: "y", responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { x: { beginAtZero: true } }
                }} />
              </div>
            </div>
          )}

          {exportOptions.topVendidos && (
            <div className="print-section">
              <h2>Top 10 Perfumes Mais Vendidos</h2>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Ranking</th>
                    <th>Perfume</th>
                    <th>Marca</th>
                    <th>Unidades Vendidas</th>
                    <th>Receita Bruta</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topVendidos.map((p, i) => (
                    <tr key={i}>
                      <td>{i + 1}º</td>
                      <td>{p.nome}</td>
                      <td>{p.marca}</td>
                      <td>{p.total_vendido}</td>
                      <td>{formatarReal(p.receita)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {exportOptions.topFavoritados && (
            <div className="print-section">
              <h2>Top 10 Perfumes Mais Favoritados</h2>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Ranking</th>
                    <th>Perfume</th>
                    <th>Marca</th>
                    <th>Total Favoritos</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topFavoritados.map((p, i) => (
                    <tr key={i}>
                      <td>{i + 1}º</td>
                      <td>{p.nome}</td>
                      <td>{p.marca}</td>
                      <td>{p.total_favoritos} ❤️</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {exportOptions.pedidosRecentes && (
            <div className="print-section">
              <h2>Últimos Pedidos Recebidos</h2>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Forma de Pagamento</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.pedidosRecentes.map((p, i) => (
                    <tr key={i}>
                      <td>{p.numero_pedido}</td>
                      <td>{p.cliente}</td>
                      <td>{formatarReal(p.valor_total)}</td>
                      <td>{STATUS_LABELS[p.status] || p.status}</td>
                      <td>{p.forma_pagamento === 'CARTAO_CREDITO' ? 'Cartão' : 'PIX'}</td>
                      <td>{formatarData(p.data)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {exportOptions.estoqueBaixo && (
            <div className="print-section">
              <h2>Alerta de Estoque Crítico (≤ 5 un)</h2>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Perfume</th>
                    <th>Marca</th>
                    <th>Volume</th>
                    <th>Quantidade Disponível</th>
                    <th>Preço Unitário</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.estoqueBaixo.map((p, i) => (
                    <tr key={i} style={{ color: p.estoque_qtd === 0 ? '#ef4444' : '#b45309' }}>
                      <td>{p.nome}</td>
                      <td>{p.marca}</td>
                      <td>{p.volume_ml}ml</td>
                      <td>{p.estoque_qtd === 0 ? 'SEM ESTOQUE' : `${p.estoque_qtd} un`}</td>
                      <td>{formatarReal(p.preco)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {exportOptions.produtosList && (
            <div className="print-section">
              <h2>Catálogo Completo de Perfumes</h2>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Perfume</th>
                    <th>Marca</th>
                    <th>Status</th>
                    <th>Volume</th>
                    <th>Preço</th>
                    <th>Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosList.map(p => {
                    const variacoes = p.variacoes || []
                    return variacoes.map((v, idx) => (
                      <tr key={`${p.id}-${v.id}`} style={{ opacity: p.ativo ? 1 : 0.5 }}>
                        {idx === 0 && (
                          <>
                            <td rowSpan={variacoes.length}>{p.id}</td>
                            <td rowSpan={variacoes.length}>{p.nome}</td>
                            <td rowSpan={variacoes.length}>{p.marca}</td>
                            <td rowSpan={variacoes.length}>{p.ativo ? 'Ativo' : 'Inativo'}</td>
                          </>
                        )}
                        <td>{v.volume_ml}ml</td>
                        <td>{formatarReal(v.preco)}</td>
                        <td>{v.estoque_qtd} un</td>
                      </tr>
                    ))
                  })}
                </tbody>
              </table>
            </div>
          )}

          {exportOptions.pedidosList && (
            <div className="print-section">
              <h2>Relação Geral de Pedidos</h2>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cliente</th>
                    <th>E-mail</th>
                    <th>Valor Total</th>
                    <th>Pagamento</th>
                    <th>Status</th>
                    <th>Data de Criação</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosList.map(pedido => (
                    <tr key={pedido.id}>
                      <td>{pedido.numero_pedido}</td>
                      <td>{pedido.cliente_nome}</td>
                      <td>{pedido.cliente_email}</td>
                      <td>{formatarReal(pedido.valor_total)}</td>
                      <td>{pedido.forma_pagamento === 'CARTAO_CREDITO' ? 'Cartão' : 'PIX'}</td>
                      <td>{STATUS_LABELS[pedido.status] || pedido.status}</td>
                      <td>{formatarData(pedido.data)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {exportOptions.statusLogs && (
            <div className="print-section">
              <h2>Histórico de Auditoria de Status</h2>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Status Anterior</th>
                    <th>Novo Status</th>
                    <th>Administrador</th>
                    <th>Data/Hora da Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {statusLogs.map((log, i) => (
                    <tr key={i}>
                      <td>{log.numero_pedido}</td>
                      <td>{STATUS_LABELS[log.status_anterior] || log.status_anterior}</td>
                      <td>{STATUS_LABELS[log.status_novo] || log.status_novo}</td>
                      <td>{log.admin_nome}</td>
                      <td>{formatarData(log.data_alteracao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Exportação Premium Customizável */}
      {modalExportAberto && (
        <div className="export-modal-overlay">
          <div className="export-modal-content">
            <button className="export-modal-close" onClick={() => setModalExportAberto(false)}>
              &times;
            </button>
            <h2>Configurar Exportação ({exportFormat.toUpperCase()})</h2>
            <p className="export-modal-subtitle">
              Selecione quais seções e abas você deseja incluir no seu relatório. As opções são cumulativas.
            </p>

            <div className="export-modal-sections">
              {/* Grupo Dashboard */}
              <div className="export-group-card">
                <h3>📊 Aba Dashboard</h3>
                <div className="export-bulk-actions">
                  <button className="export-bulk-btn" onClick={() => setBulkOptions("dashboard", true)}>
                    Marcar Tudo
                  </button>
                  <button className="export-bulk-btn" onClick={() => setBulkOptions("dashboard", false)}>
                    Limpar
                  </button>
                </div>
                <div className="export-checkbox-list">
                  <label className="export-checkbox-label">
                    <input
                      type="checkbox"
                      checked={exportOptions.indicadores}
                      onChange={() => toggleExportOption("indicadores")}
                    />
                    <span>Indicadores Gerais (KPIs)</span>
                  </label>
                  {exportFormat === "pdf" && (
                    <>
                      <label className="export-checkbox-label">
                        <input
                          type="checkbox"
                          checked={exportOptions.vendasMes}
                          onChange={() => toggleExportOption("vendasMes")}
                        />
                        <span>Gráfico Faturamento Mensal</span>
                      </label>
                      <label className="export-checkbox-label">
                        <input
                          type="checkbox"
                          checked={exportOptions.statusPedidos}
                          onChange={() => toggleExportOption("statusPedidos")}
                        />
                        <span>Gráfico Status dos Pedidos</span>
                      </label>
                      <label className="export-checkbox-label">
                        <input
                          type="checkbox"
                          checked={exportOptions.topCategorias}
                          onChange={() => toggleExportOption("topCategorias")}
                        />
                        <span>Gráfico Categorias Mais Vendidas</span>
                      </label>
                    </>
                  )}
                  <label className="export-checkbox-label">
                    <input
                      type="checkbox"
                      checked={exportOptions.topVendidos}
                      onChange={() => toggleExportOption("topVendidos")}
                    />
                    <span>Top 10 Vendidos</span>
                  </label>
                  <label className="export-checkbox-label">
                    <input
                      type="checkbox"
                      checked={exportOptions.topFavoritados}
                      onChange={() => toggleExportOption("topFavoritados")}
                    />
                    <span>Top 10 Favoritados</span>
                  </label>
                  <label className="export-checkbox-label">
                    <input
                      type="checkbox"
                      checked={exportOptions.pedidosRecentes}
                      onChange={() => toggleExportOption("pedidosRecentes")}
                    />
                    <span>Pedidos Recentes</span>
                  </label>
                  <label className="export-checkbox-label">
                    <input
                      type="checkbox"
                      checked={exportOptions.estoqueBaixo}
                      onChange={() => toggleExportOption("estoqueBaixo")}
                    />
                    <span>Alerta de Estoque Baixo</span>
                  </label>
                </div>
              </div>

              {/* Grupo Produtos */}
              <div className="export-group-card">
                <h3>🧴 Aba Produtos</h3>
                <div className="export-bulk-actions">
                  <button className="export-bulk-btn" onClick={() => setBulkOptions("produtos", true)}>
                    Marcar Tudo
                  </button>
                  <button className="export-bulk-btn" onClick={() => setBulkOptions("produtos", false)}>
                    Limpar
                  </button>
                </div>
                <div className="export-checkbox-list">
                  <label className="export-checkbox-label">
                    <input
                      type="checkbox"
                      checked={exportOptions.produtosList}
                      onChange={() => toggleExportOption("produtosList")}
                    />
                    <span>Lista Geral de Produtos</span>
                  </label>
                </div>
              </div>

              {/* Grupo Pedidos */}
              <div className="export-group-card">
                <h3>📋 Aba Pedidos</h3>
                <div className="export-bulk-actions">
                  <button className="export-bulk-btn" onClick={() => setBulkOptions("pedidos", true)}>
                    Marcar Tudo
                  </button>
                  <button className="export-bulk-btn" onClick={() => setBulkOptions("pedidos", false)}>
                    Limpar
                  </button>
                </div>
                <div className="export-checkbox-list">
                  <label className="export-checkbox-label">
                    <input
                      type="checkbox"
                      checked={exportOptions.pedidosList}
                      onChange={() => toggleExportOption("pedidosList")}
                    />
                    <span>Lista de Pedidos Gerais</span>
                  </label>
                  <label className="export-checkbox-label">
                    <input
                      type="checkbox"
                      checked={exportOptions.statusLogs}
                      onChange={() => toggleExportOption("statusLogs")}
                    />
                    <span>Log de Auditoria de Status</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="export-modal-actions">
              <button className="export-btn-cancel" onClick={() => setModalExportAberto(false)}>
                Cancelar
              </button>
              <button
                className="export-btn-submit"
                onClick={processarExportacao}
                disabled={
                  !Object.values(exportOptions).some(Boolean) ||
                  (exportOptions.produtosList && produtosLoading) ||
                  ((exportOptions.pedidosList || exportOptions.statusLogs) && pedidosLoading)
                }
              >
                {(exportOptions.produtosList && produtosLoading) || ((exportOptions.pedidosList || exportOptions.statusLogs) && pedidosLoading) ? (
                  "Carregando dados..."
                ) : (
                  exportFormat === "csv" ? "📥 Baixar Relatório CSV" : "🖨️ Imprimir / Gerar PDF"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Modal de Informação (Botão i) === */}
      {infoModalCard && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '12px', padding: '30px', width: '90%', maxWidth: '400px',
            textAlign: 'center', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', fontFamily: "'Times New Roman', Times, serif",
            position: 'relative'
          }}>
            <button 
              onClick={() => setInfoModalCard(null)}
              style={{
                position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none',
                fontSize: '20px', cursor: 'pointer', color: '#555'
              }}
            >
              ✕
            </button>
            <div style={{ fontSize: '40px', color: '#8c2b53', marginBottom: '15px' }}>i</div>
            <h2 style={{ color: '#000', margin: '0 0 15px 0', fontSize: '22px' }}>{infoModalCard.titulo}</h2>
            <p style={{ color: '#555', fontSize: '16px', marginBottom: '30px', lineHeight: '1.5' }}>
              {infoModalCard.descricao}
            </p>
            <button 
              onClick={() => setInfoModalCard(null)}
              style={{
                padding: '10px 20px', borderRadius: '25px', border: 'none', width: '100%',
                backgroundColor: '#8c2b53', color: '#fff', cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              ENTENDI
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default Admin