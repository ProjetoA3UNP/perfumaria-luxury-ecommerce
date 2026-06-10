const dashboardController = require('../../src/controllers/dashboardController');
const db = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

describe('dashboardController.getMetrics', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar todas as métricas do dashboard com status 200', async () => {
    // Mock de todas as 14 queries paralelas do Promise.all
    db.query
      // KPIs
      .mockResolvedValueOnce([[{ faturamento: 150000 }]])         // faturamento
      .mockResolvedValueOnce([[{ total: 42 }]])                    // totalPedidos
      .mockResolvedValueOnce([[{ ticket_medio: 3571 }]])           // ticketMedio
      .mockResolvedValueOnce([[{ total: 120 }]])                   // totalClientes
      .mockResolvedValueOnce([[{ total: 17 }]])                    // totalProdutos
      .mockResolvedValueOnce([[{ total: 500 }]])                   // totalEstoque
      // Gráficos
      .mockResolvedValueOnce([[{ mes: '2026-05', quantidade: 10, faturamento: 50000 }]])  // vendasPorMes
      .mockResolvedValueOnce([[{ status: 'PAGO', quantidade: 20 }, { status: 'ENVIADO', quantidade: 15 }]])  // statusPedidos
      .mockResolvedValueOnce([[{ categoria: 'Nicho', total_vendido: 30 }]])  // topCategorias
      // Tabelas
      .mockResolvedValueOnce([[{ nome: 'Sauvage', marca: 'Dior', total_vendido: 15, receita: 11250 }]])  // topVendidos
      .mockResolvedValueOnce([[{ nome: 'Aventus', marca: 'Creed', total_favoritos: 8 }]])  // topFavoritados
      .mockResolvedValueOnce([[{ numero_pedido: 'PED-001', cliente: 'João', valor_total: 850, status: 'PAGO', data: '2026-06-09', forma_pagamento: 'PIX' }]])  // pedidosRecentes
      .mockResolvedValueOnce([[{ nome: 'Oud Wood', marca: 'Tom Ford', volume_ml: 100, estoque_qtd: 2, preco: 2490 }]])  // estoqueBaixo
      .mockResolvedValueOnce([[{ status_anterior: 'PAGO', status_novo: 'ENVIADO', admin_nome: 'Admin', data_alteracao: '2026-06-09', numero_pedido: 'PED-001' }]]);  // ultimosLogs

    await dashboardController.getMetrics(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const responseData = res.json.mock.calls[0][0];

    // Validar KPIs
    expect(responseData.kpis.faturamento).toBe(150000);
    expect(responseData.kpis.totalPedidos).toBe(42);
    expect(responseData.kpis.ticketMedio).toBe(3571);
    expect(responseData.kpis.totalClientes).toBe(120);
    expect(responseData.kpis.totalProdutos).toBe(17);
    expect(responseData.kpis.totalEstoque).toBe(500);

    // Validar estrutura dos arrays
    expect(responseData.vendasPorMes).toHaveLength(1);
    expect(responseData.statusPedidos).toHaveLength(2);
    expect(responseData.topCategorias).toHaveLength(1);
    expect(responseData.topVendidos).toHaveLength(1);
    expect(responseData.topFavoritados).toHaveLength(1);
    expect(responseData.pedidosRecentes).toHaveLength(1);
    expect(responseData.estoqueBaixo).toHaveLength(1);
    expect(responseData.ultimosLogs).toHaveLength(1);
  });

  test('Deve retornar 500 se houver erro no banco de dados', async () => {
    db.query.mockRejectedValueOnce(new Error('DB Connection Lost'));

    await dashboardController.getMetrics(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao carregar métricas.' });
  });

  test('Deve converter corretamente valores numéricos com Number()', async () => {
    db.query
      .mockResolvedValueOnce([[{ faturamento: '99999.50' }]])  // String vinda do MySQL
      .mockResolvedValueOnce([[{ total: 5 }]])
      .mockResolvedValueOnce([[{ ticket_medio: '19999.90' }]])
      .mockResolvedValueOnce([[{ total: 3 }]])
      .mockResolvedValueOnce([[{ total: 10 }]])
      .mockResolvedValueOnce([[{ total: '250' }]])  // String
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]]);

    await dashboardController.getMetrics(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.kpis.faturamento).toBe(99999.5);
    expect(data.kpis.totalEstoque).toBe(250);
    expect(typeof data.kpis.ticketMedio).toBe('number');
  });
});
