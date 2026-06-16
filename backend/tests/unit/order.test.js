process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
const orderController = require('../../src/controllers/orderController');
const db = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

jest.mock('stripe', () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        client_secret: 'pi_mock_secret_123',
      }),
    },
  }));
});

describe('orderController.getMyOrders', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: { id: 5 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar o histórico de pedidos do usuário com itens', async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 10, numero_pedido: 'PED-001', valor_total: 850, forma_pagamento: 'PIX', status: 'PAGO', data: '2026-06-09' }]])
      .mockResolvedValueOnce([[{ quantidade: 1, preco_unitario: 850, produto_nome: 'Sauvage', volume_ml: 100, imagem: '/products/sauvage.jpg' }]]);

    await orderController.getMyOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data).toHaveLength(1);
    expect(data[0].itens).toHaveLength(1);
    expect(data[0].itens[0].produto_nome).toBe('Sauvage');
  });

  test('Deve retornar array vazio se o usuário não tiver pedidos', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await orderController.getMyOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('Deve retornar 500 se houver erro no banco', async () => {
    db.query.mockRejectedValueOnce(new Error('DB Error'));

    await orderController.getMyOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao buscar histórico de pedidos.' });
  });
});

describe('orderController.getAllOrders (Admin)', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar todos os pedidos do sistema', async () => {
    const mockVendas = [
      { id: 1, numero_pedido: 'PED-001', valor_total: 850, status: 'PAGO', cliente_nome: 'João' },
      { id: 2, numero_pedido: 'PED-002', valor_total: 1200, status: 'ENVIADO', cliente_nome: 'Maria' },
    ];
    db.query.mockResolvedValueOnce([mockVendas]);

    await orderController.getAllOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockVendas);
  });

  test('Deve retornar 500 se houver erro no banco', async () => {
    db.query.mockRejectedValueOnce(new Error('DB Error'));

    await orderController.getAllOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao buscar pedidos.' });
  });
});

describe('orderController.getOrderLogs', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar logs sem filtro de venda_id', async () => {
    const mockLogs = [{ id: 1, status_anterior: 'PAGO', status_novo: 'ENVIADO', numero_pedido: 'PED-001' }];
    db.query.mockResolvedValueOnce([mockLogs]);

    await orderController.getOrderLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockLogs);
  });

  test('Deve filtrar logs por venda_id quando informado', async () => {
    req.query.venda_id = 5;
    db.query.mockResolvedValueOnce([[{ id: 1, venda_id: 5, status_anterior: 'PAGO', status_novo: 'PROCESSANDO' }]]);

    await orderController.getOrderLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE l.venda_id = ?'), [5]);
  });

  test('Deve retornar 500 se houver erro no banco', async () => {
    db.query.mockRejectedValueOnce(new Error('DB Error'));

    await orderController.getOrderLogs(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao buscar histórico de alterações.' });
  });
});

describe('orderController.updateOrderStatus', () => {
  let req, res;
  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { id: 10 }, body: { status: 'ENVIADO' }, user: { id: 1, tipo_perfil: 'ADMIN' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  test('Deve retornar 400 se o status for inválido', async () => {
    req.body.status = 'STATUS_FALSO';
    await orderController.updateOrderStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('Deve retornar 404 se o pedido não existir', async () => {
    db.query.mockResolvedValueOnce([[]]);
    await orderController.updateOrderStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('Deve atualizar o status e salvar log', async () => {
    db.query.mockResolvedValueOnce([[{ id: 10, status: 'PAGO' }]]);
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Update
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Log
    await orderController.updateOrderStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Deve retornar 500 se houver erro no banco ao atualizar status', async () => {
    db.query.mockRejectedValueOnce(new Error('DB Error'));
    await orderController.updateOrderStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('orderController.createPaymentIntent', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: { id: 5 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar 400 se o carrinho não existir', async () => {
    db.query.mockResolvedValueOnce([[]]); // Carrinho não encontrado

    await orderController.createPaymentIntent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Carrinho não encontrado.' });
  });

  test('Deve retornar 400 se o carrinho estiver vazio', async () => {
    db.query.mockResolvedValueOnce([[{ id: 42 }]]); // Carrinho existe
    db.query.mockResolvedValueOnce([[]]); // Sem itens

    await orderController.createPaymentIntent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'O carrinho está vazio.' });
  });

  test('Deve criar o payment intent com sucesso e retornar 200', async () => {
    db.query.mockResolvedValueOnce([[{ id: 42 }]]); // Carrinho existe
    db.query.mockResolvedValueOnce([[{ variacao_id: 1, quantidade: 2, preco: 100, nome: 'Perfume' }]]); // Itens
    // Stripe mock já está configurado no topo do arquivo retornando 'pi_mock_secret_123'
    
    await orderController.createPaymentIntent(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      clientSecret: 'pi_mock_secret_123',
      amount: 20000 // 2 * 100 * 100 centavos
    });
  });

  test('Deve retornar 500 em caso de exceção', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));
    
    await orderController.createPaymentIntent(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('orderController.checkout', () => {
  let req, res, mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = {
      beginTransaction: jest.fn(),
      query: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };
    db.getConnection.mockResolvedValue(mockConnection);

    req = {
      user: { id: 5 },
      body: {
        endereco_id: 1,
        forma_pagamento: 'PIX',
        stripe_payment_id: 'pix_simulado',
        cupom_codigo: null,
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar erro se o carrinho não for encontrado', async () => {
    mockConnection.query.mockResolvedValueOnce([[]]); // Carrinho não encontrado

    await orderController.checkout(req, res);

    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockConnection.release).toHaveBeenCalled();
  });

  test('Deve retornar erro se o carrinho estiver vazio', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[{ id: 42 }]]) // Carrinho existe
      .mockResolvedValueOnce([[]]); // Sem itens

    await orderController.checkout(req, res);

    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('Deve retornar erro se estoque for insuficiente', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[{ id: 42 }]]) // Carrinho
      .mockResolvedValueOnce([[{ variacao_id: 1, quantidade: 5, preco: 850, estoque_qtd: 2 }]]); // Item com estoque insuficiente

    await orderController.checkout(req, res);

    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Produto sem estoque suficiente.' });
  });

  test('Deve processar checkout com sucesso (PIX, sem cupom)', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[{ id: 42 }]]) // Carrinho
      .mockResolvedValueOnce([[{ variacao_id: 1, quantidade: 1, preco: 850, estoque_qtd: 10 }]]) // Itens
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE estoque
      .mockResolvedValueOnce([{ insertId: 100 }]) // INSERT venda
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // INSERT itens_venda
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // DELETE itens_carrinho

    await orderController.checkout(req, res);

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    const data = res.json.mock.calls[0][0];
    expect(data.message).toBe('Pedido realizado com sucesso!');
    expect(data.numero_pedido).toMatch(/^PED-/);
    expect(data.valor_total).toBe(850);
  });

  test('Deve aplicar cupom percentual corretamente no checkout', async () => {
    req.body.cupom_codigo = 'DESC10';
    mockConnection.query
      .mockResolvedValueOnce([[{ id: 42 }]]) // Carrinho
      .mockResolvedValueOnce([[{ variacao_id: 1, quantidade: 1, preco: 1000, estoque_qtd: 10 }]]) // Itens (R$ 1000)
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE estoque
      .mockResolvedValueOnce([[{ id: 1, desconto_percentual: 10, desconto_valor: null, validade: '2027-12-31', ativo: 1 }]]) // Cupom DESC10
      .mockResolvedValueOnce([{ insertId: 101 }]) // INSERT venda
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // INSERT itens_venda
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // DELETE itens_carrinho

    await orderController.checkout(req, res);

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    const data = res.json.mock.calls[0][0];
    expect(data.valor_total).toBe(900); // 1000 - 10% = 900
  });

  test('Deve buscar endereço padrão quando endereco_id não é informado', async () => {
    req.body.endereco_id = null;
    mockConnection.query
      .mockResolvedValueOnce([[{ id: 42 }]]) // Carrinho
      .mockResolvedValueOnce([[{ variacao_id: 1, quantidade: 1, preco: 500, estoque_qtd: 10 }]]) // Itens
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE estoque
      .mockResolvedValueOnce([[{ id: 99 }]]) // SELECT endereço padrão
      .mockResolvedValueOnce([{ insertId: 102 }]) // INSERT venda
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // INSERT itens_venda
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // DELETE itens_carrinho

    await orderController.checkout(req, res);

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Deve retornar 500 se ocorrer exceção não mapeada', async () => {
    mockConnection.query.mockRejectedValueOnce(new Error('Unexpected DB Error'));
    await orderController.checkout(req, res);
    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unexpected DB Error' });
  });
});
