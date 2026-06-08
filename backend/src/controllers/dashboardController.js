const db = require('../config/database');

const dashboardController = {

  async getMetrics(req, res) {
    try {
      // Executar todas as queries em paralelo para performance
      const [
        [faturamentoRows],
        [totalPedidosRows],
        [ticketMedioRows],
        [totalClientesRows],
        [totalProdutosRows],
        [totalEstoqueRows],
        [vendasPorMesRows],
        [statusPedidosRows],
        [topCategoriasRows],
        [topVendidosRows],
        [topFavoritadosRows],
        [pedidosRecentesRows],
        [estoqueBaixoRows],
        [ultimosLogsRows],
      ] = await Promise.all([

        // === KPIs ===
        db.query(`SELECT COALESCE(SUM(valor_total), 0) AS faturamento FROM vendas WHERE status IN ('PAGO','PROCESSANDO','ENVIADO','ENTREGUE')`),
        db.query(`SELECT COUNT(*) AS total FROM vendas`),
        db.query(`SELECT COALESCE(AVG(valor_total), 0) AS ticket_medio FROM vendas WHERE status IN ('PAGO','PROCESSANDO','ENVIADO','ENTREGUE')`),
        db.query(`SELECT COUNT(*) AS total FROM usuarios WHERE tipo_perfil = 'CLIENTE'`),
        db.query(`SELECT COUNT(*) AS total FROM produtos WHERE ativo = TRUE`),
        db.query(`SELECT COALESCE(SUM(estoque_qtd), 0) AS total FROM produto_variacoes`),

        // === Gráficos ===
        // Vendas por mês (últimos 12 meses)
        db.query(`
          SELECT 
            DATE_FORMAT(data, '%Y-%m') AS mes,
            COUNT(*) AS quantidade,
            COALESCE(SUM(valor_total), 0) AS faturamento
          FROM vendas 
          WHERE data >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
          GROUP BY DATE_FORMAT(data, '%Y-%m')
          ORDER BY mes ASC
        `),

        // Status dos pedidos
        db.query(`
          SELECT status, COUNT(*) AS quantidade 
          FROM vendas 
          GROUP BY status
        `),

        // Top 5 categorias mais vendidas
        db.query(`
          SELECT c.nome AS categoria, SUM(iv.quantidade) AS total_vendido
          FROM itens_venda iv
          JOIN produto_variacoes pv ON iv.variacao_id = pv.id
          JOIN produtos p ON pv.produto_id = p.id
          JOIN categorias c ON p.categoria_id = c.id
          GROUP BY c.id, c.nome
          ORDER BY total_vendido DESC
          LIMIT 5
        `),

        // === Tabelas ===
        // Top 10 produtos mais vendidos
        db.query(`
          SELECT p.nome, m.nome AS marca, SUM(iv.quantidade) AS total_vendido, SUM(iv.quantidade * iv.preco_unitario) AS receita
          FROM itens_venda iv
          JOIN produto_variacoes pv ON iv.variacao_id = pv.id
          JOIN produtos p ON pv.produto_id = p.id
          JOIN marcas m ON p.marca_id = m.id
          GROUP BY p.id, p.nome, m.nome
          ORDER BY total_vendido DESC
          LIMIT 10
        `),

        // Top 10 produtos mais favoritados
        db.query(`
          SELECT p.nome, m.nome AS marca, COUNT(f.id) AS total_favoritos
          FROM favoritos f
          JOIN produtos p ON f.produto_id = p.id
          JOIN marcas m ON p.marca_id = m.id
          GROUP BY p.id, p.nome, m.nome
          ORDER BY total_favoritos DESC
          LIMIT 10
        `),

        // Últimos 10 pedidos
        db.query(`
          SELECT v.numero_pedido, u.nome AS cliente, v.valor_total, v.status, v.data, v.forma_pagamento
          FROM vendas v
          JOIN usuarios u ON v.usuario_id = u.id
          ORDER BY v.data DESC
          LIMIT 10
        `),

        // Produtos com estoque baixo (≤ 5 unidades)
        db.query(`
          SELECT p.nome, m.nome AS marca, pv.volume_ml, pv.estoque_qtd, pv.preco
          FROM produto_variacoes pv
          JOIN produtos p ON pv.produto_id = p.id
          JOIN marcas m ON p.marca_id = m.id
          WHERE pv.estoque_qtd <= 5 AND pv.ativo = TRUE
          ORDER BY pv.estoque_qtd ASC
          LIMIT 15
        `),

        // Últimos 10 logs de alteração de status (auditoria)
        db.query(`
          SELECT l.status_anterior, l.status_novo, l.admin_nome, l.data_alteracao, v.numero_pedido
          FROM log_status_pedidos l
          JOIN vendas v ON l.venda_id = v.id
          ORDER BY l.data_alteracao DESC
          LIMIT 10
        `),
      ]);

      return res.status(200).json({
        kpis: {
          faturamento: Number(faturamentoRows[0].faturamento),
          totalPedidos: totalPedidosRows[0].total,
          ticketMedio: Number(ticketMedioRows[0].ticket_medio),
          totalClientes: totalClientesRows[0].total,
          totalProdutos: totalProdutosRows[0].total,
          totalEstoque: Number(totalEstoqueRows[0].total),
        },
        vendasPorMes: vendasPorMesRows,
        statusPedidos: statusPedidosRows,
        topCategorias: topCategoriasRows,
        topVendidos: topVendidosRows,
        topFavoritados: topFavoritadosRows,
        pedidosRecentes: pedidosRecentesRows,
        estoqueBaixo: estoqueBaixoRows,
        ultimosLogs: ultimosLogsRows,
      });

    } catch (error) {
      console.error('Erro ao buscar métricas do dashboard:', error);
      return res.status(500).json({ error: 'Erro ao carregar métricas.' });
    }
  }
};

module.exports = dashboardController;
