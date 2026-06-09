const couponController = require('../../src/controllers/couponController');
const db = require('../../src/config/database');

// Mock do banco de dados
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

describe('couponController.validate', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar 400 se o código do cupom não for fornecido', async () => {
    req.body.codigo = '';
    await couponController.validate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Informe o código do cupom.' });
  });

  test('Deve retornar 404 se o cupom não existir no banco de dados', async () => {
    req.body.codigo = 'CUPOMINEXISTENTE';
    db.query.mockResolvedValueOnce([[]]); // Sem resultados

    await couponController.validate(req, res);

    expect(db.query).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cupom não encontrado.' });
  });

  test('Deve retornar 400 se o cupom estiver inativo', async () => {
    req.body.codigo = 'INATIVO10';
    db.query.mockResolvedValueOnce([[
      { id: 1, codigo: 'INATIVO10', desconto_percentual: 10, desconto_valor: null, validade: '2030-12-31', ativo: 0 }
    ]]);

    await couponController.validate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Este cupom está desativado.' });
  });

  test('Deve retornar 400 se o cupom estiver expirado', async () => {
    req.body.codigo = 'EXPIRADO10';
    db.query.mockResolvedValueOnce([[
      { id: 2, codigo: 'EXPIRADO10', desconto_percentual: 10, desconto_valor: null, validade: '2020-01-01', ativo: 1 }
    ]]);

    await couponController.validate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Este cupom está expirado.' });
  });

  test('Deve retornar 200 e informações do cupom caso seja válido', async () => {
    req.body.codigo = 'VALIDO10';
    const validadeFutura = new Date();
    validadeFutura.setDate(validadeFutura.getDate() + 10); // Expira em 10 dias

    db.query.mockResolvedValueOnce([[
      { id: 3, codigo: 'VALIDO10', desconto_percentual: 10, desconto_valor: null, validade: validadeFutura.toISOString(), ativo: 1 }
    ]]);

    await couponController.validate(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      id: 3,
      codigo: 'VALIDO10',
      desconto_percentual: 10,
      message: 'Cupom válido!'
    }));
  });
});
