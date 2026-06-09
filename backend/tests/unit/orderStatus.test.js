process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
const orderController = require('../../src/controllers/orderController');
const db = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

describe('orderController.updateOrderStatus', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { id: 1 },
      body: {},
      user: { id: 2, nome: 'Admin Tester' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar 400 se o status for inválido ou não fornecido', async () => {
    req.body.status = 'STATUS_INVALIDO';
    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Status inválido'),
    }));
  });

  test('Deve retornar 404 se o pedido não existir', async () => {
    req.body.status = 'ENVIADO';
    db.query.mockResolvedValueOnce([[]]); // Pedido não encontrado

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Pedido não encontrado.' });
  });

  test('Deve retornar 200 e mensagem se o status atual já for igual ao novo status', async () => {
    req.body.status = 'PAGO';
    db.query.mockResolvedValueOnce([[{ id: 1, status: 'PAGO' }]]); // Status atual é PAGO

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Status já está nesse valor.' });
  });

  test('Deve retornar 400 se o status atual for ENTREGUE (bloqueio de estado final)', async () => {
    req.body.status = 'CANCELADO';
    db.query.mockResolvedValueOnce([[{ id: 1, status: 'ENTREGUE' }]]);

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Pedido já entregue não pode ter status alterado.' });
  });

  test('Deve retornar 400 se o status atual for CANCELADO (bloqueio de estado final)', async () => {
    req.body.status = 'ENVIADO';
    db.query.mockResolvedValueOnce([[{ id: 1, status: 'CANCELADO' }]]);

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Pedido cancelado não pode ter status alterado.' });
  });

  test('Deve atualizar status e registrar log de auditoria ao mudar de PAGO para ENVIADO', async () => {
    req.body.status = 'ENVIADO';
    db.query.mockResolvedValueOnce([[{ id: 1, status: 'PAGO' }]]); // Status atual
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Mock do UPDATE
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Mock do INSERT log

    await orderController.updateOrderStatus(req, res);

    expect(db.query).toHaveBeenCalledWith('UPDATE vendas SET status = ? WHERE id = ?', ['ENVIADO', 1]);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO log_status_pedidos'),
      [1, 'PAGO', 'ENVIADO', 2, 'Admin Tester']
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Status atualizado: PAGO → ENVIADO' });
  });
});
