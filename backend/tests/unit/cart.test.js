const cartController = require('../../src/controllers/cartController');
const db = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

describe('cartController.addItem', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 5 },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar 404 se a variação de produto não for encontrada ou estiver inativa', async () => {
    req.body = { variacao_id: 1, quantidade: 1 };
    db.query.mockResolvedValueOnce([[]]); // Variação vazia

    await cartController.addItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Variação de produto não encontrada ou inativa.' });
  });

  test('Deve retornar 400 se a quantidade solicitada exceder o estoque disponível', async () => {
    req.body = { variacao_id: 1, quantidade: 10 };
    db.query.mockResolvedValueOnce([[{ id: 1, estoque_qtd: 5, nome: 'Perfume A', volume_ml: 100 }]]);

    await cartController.addItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Quantidade excede o estoque. Só temos 5 unidades do Perfume A (100ml).'
    });
  });

  test('Deve criar um carrinho caso o usuário não possua um e inserir o item', async () => {
    req.body = { variacao_id: 1, quantidade: 2 };
    
    // 1. SELECT variacao
    db.query.mockResolvedValueOnce([[{ id: 1, estoque_qtd: 10, nome: 'Perfume A', volume_ml: 100 }]]);
    // 2. SELECT carrinho (vazio)
    db.query.mockResolvedValueOnce([[]]);
    // 3. INSERT carrinho (cria novo)
    db.query.mockResolvedValueOnce([{ insertId: 42 }]);
    // 4. SELECT itens_carrinho (vazio)
    db.query.mockResolvedValueOnce([[]]);
    // 5. INSERT itens_carrinho
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await cartController.addItem(req, res);

    expect(db.query).toHaveBeenCalledWith('INSERT INTO carrinho (usuario_id) VALUES (?)', [5]);
    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO itens_carrinho (carrinho_id, variacao_id, quantidade) VALUES (?, ?, ?)',
      [42, 1, 2]
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Item adicionado ao carrinho com sucesso!' });
  });

  test('Deve somar a quantidade caso o item já esteja na sacola', async () => {
    req.body = { variacao_id: 1, quantidade: 2 };

    // 1. SELECT variacao
    db.query.mockResolvedValueOnce([[{ id: 1, estoque_qtd: 10, nome: 'Perfume A', volume_ml: 100 }]]);
    // 2. SELECT carrinho (existe, id = 42)
    db.query.mockResolvedValueOnce([[{ id: 42 }]]);
    // 3. SELECT itens_carrinho (já existe, quantidade = 3)
    db.query.mockResolvedValueOnce([[{ quantidade: 3 }]]);
    // 4. UPDATE itens_carrinho (quantidade atualizada para 5)
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await cartController.addItem(req, res);

    expect(db.query).toHaveBeenCalledWith(
      'UPDATE itens_carrinho SET quantidade = ? WHERE carrinho_id = ? AND variacao_id = ?',
      [5, 42, 1]
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Item adicionado ao carrinho com sucesso!' });
  });

  test('Deve retornar 400 se a soma da quantidade atual com a solicitada exceder o estoque', async () => {
    req.body = { variacao_id: 1, quantidade: 4 };

    // 1. SELECT variacao (estoque = 5)
    db.query.mockResolvedValueOnce([[{ id: 1, estoque_qtd: 5, nome: 'Perfume A', volume_ml: 100 }]]);
    // 2. SELECT carrinho (existe, id = 42)
    db.query.mockResolvedValueOnce([[{ id: 42 }]]);
    // 3. SELECT itens_carrinho (já existe, quantidade = 3)
    db.query.mockResolvedValueOnce([[{ quantidade: 3 }]]); // Soma: 3 + 4 = 7, excede o estoque de 5

    await cartController.addItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Adicionar mais deste item excede o limite do estoque.' });
  });
});

describe('cartController.updateItemQuantity', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { variacao_id: 1 },
      body: {},
      user: { id: 5 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar 400 se a quantidade atualizada for <= 0', async () => {
    req.body.quantidade = 0;
    await cartController.updateItemQuantity(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'A quantidade deve ser maior que zero.' });
  });

  test('Deve retornar 400 se a nova quantidade exceder o estoque da variacao', async () => {
    req.body.quantidade = 15;
    // SELECT estoque da variacao (estoque = 10)
    db.query.mockResolvedValueOnce([[{ estoque_qtd: 10 }]]);

    await cartController.updateItemQuantity(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Quantidade desejada excede o estoque atual.' });
  });

  test('Deve atualizar a quantidade com sucesso', async () => {
    req.body.quantidade = 5;
    // SELECT estoque da variacao (estoque = 10)
    db.query.mockResolvedValueOnce([[{ estoque_qtd: 10 }]]);
    // UPDATE itens_carrinho
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await cartController.updateItemQuantity(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Quantidade atualizada no carrinho.' });
  });
});
