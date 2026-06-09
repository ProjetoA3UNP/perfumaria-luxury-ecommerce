const reviewController = require('../../src/controllers/reviewController');
const db = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

describe('reviewController.createReview', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 10 },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar 400 se produto_id for nulo ou nota for invalida', async () => {
    req.body = { produto_id: null, nota: 6, comentario: 'Excelente' };
    await reviewController.createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Nota deve ser entre 1 e 5.' });
  });

  test('Deve retornar 403 se o cliente não tiver comprado o produto', async () => {
    req.body = { produto_id: 1, nota: 5, comentario: 'Muito cheiroso' };
    // db.query mock para compras retornado vazio
    db.query.mockResolvedValueOnce([[]]);

    await reviewController.createReview(req, res);

    expect(db.query).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Você só pode avaliar produtos que já comprou.' });
  });

  test('Deve retornar 201 e salvar a avaliacao se o cliente ja comprou o produto', async () => {
    req.body = { produto_id: 1, nota: 4, comentario: 'Fixação incrível' };
    // db.query mock para compras retornando uma venda
    db.query.mockResolvedValueOnce([[{ id: 99 }]]);
    // db.query mock para a inserção
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await reviewController.createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Avaliação registrada com sucesso!' });
  });
});
