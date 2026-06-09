const favoriteController = require('../../src/controllers/favoriteController');
const db = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

describe('favoriteController.addFavorite', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 1 },
      body: { produto_id: 10 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve adicionar aos favoritos com sucesso (201)', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await favoriteController.addFavorite(req, res);

    expect(db.query).toHaveBeenCalledWith(
      "INSERT INTO favoritos (usuario_id, produto_id) VALUES (?, ?)",
      [1, 10]
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: "Adicionado aos favoritos." });
  });

  test('Deve retornar 200 se o produto já estava nos favoritos (ER_DUP_ENTRY)', async () => {
    const error = new Error('Duplicate Entry');
    error.code = 'ER_DUP_ENTRY';
    db.query.mockRejectedValueOnce(error);

    await favoriteController.addFavorite(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Já estava nos favoritos." });
  });

  test('Deve retornar 500 se houver erro no banco de dados', async () => {
    db.query.mockRejectedValueOnce(new Error('DB Error'));

    await favoriteController.addFavorite(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Erro ao favoritar produto." });
  });
});

describe('favoriteController.removeFavorite', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 1 },
      params: { produto_id: 10 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve remover dos favoritos com sucesso (200)', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await favoriteController.removeFavorite(req, res);

    expect(db.query).toHaveBeenCalledWith(
      "DELETE FROM favoritos WHERE usuario_id = ? AND produto_id = ?",
      [1, 10]
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Removido dos favoritos." });
  });
});

describe('favoriteController.getFavorites', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 1 }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve listar os favoritos com sucesso (200)', async () => {
    const listaMock = [{ id: 10, nome: 'Perfume Top', preco: 100, volume_ml: 50 }];
    db.query.mockResolvedValueOnce([listaMock]);

    await favoriteController.getFavorites(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(listaMock);
  });
});
