const productController = require('../../src/controllers/productController');
const db = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

describe('productController.seedDependencies', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve injetar dependências com sucesso', async () => {
    db.query.mockResolvedValue([{ affectedRows: 1 }]);

    await productController.seedDependencies(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Dependências Base injetadas'),
    }));
  });

  test('Deve retornar 500 se o seed falhar', async () => {
    db.query.mockRejectedValueOnce(new Error('DB Error'));

    await productController.seedDependencies(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao injetar dependências.' });
  });
});

describe('productController.getMenuFilters', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar categorias, marcas e famílias como arrays de nomes', async () => {
    db.query
      .mockResolvedValueOnce([[{ nome: 'Alta Perfumaria' }, { nome: 'Nicho' }]])
      .mockResolvedValueOnce([[{ nome: 'Chanel' }, { nome: 'Dior' }]])
      .mockResolvedValueOnce([[{ nome: 'Amadeirado' }, { nome: 'Floral' }]]);

    await productController.getMenuFilters(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.categorias).toEqual(['Alta Perfumaria', 'Nicho']);
    expect(data.marcas).toEqual(['Chanel', 'Dior']);
    expect(data.familias).toEqual(['Amadeirado', 'Floral']);
  });

  test('Deve retornar 500 se houver erro no banco', async () => {
    db.query.mockRejectedValueOnce(new Error('DB Error'));

    await productController.getMenuFilters(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao buscar filtros do menu' });
  });
});

describe('productController.getProducts', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar lista de produtos ativos', async () => {
    const mockProdutos = [
      { id: 1, nome: 'Sauvage', marca: 'Dior', preco: 750, estoque_qtd: 50 },
      { id: 2, nome: 'Bleu de Chanel', marca: 'Chanel', preco: 850, estoque_qtd: 30 },
    ];
    db.query.mockResolvedValueOnce([mockProdutos]);

    await productController.getProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockProdutos);
  });

  test('Deve incluir inativos quando all=true', async () => {
    req.query.all = 'true';
    db.query.mockResolvedValueOnce([[{ id: 1, nome: 'Produto Inativo', ativo: false }]]);

    await productController.getProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    // Verifica se a query NÃO contém WHERE ativo (porque all=true)
    const queryUsada = db.query.mock.calls[0][0];
    expect(queryUsada).not.toContain('WHERE p.ativo = TRUE');
  });

  test('Deve retornar 500 se houver erro no banco', async () => {
    db.query.mockRejectedValueOnce(new Error('DB Error'));

    await productController.getProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao consultar o catálogo de perfumes.' });
  });
});

describe('productController.getProductById', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { id: 1 }, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar o produto com suas variações', async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 1, nome: 'Sauvage', marca: 'Dior', categoria: 'Designer' }]])
      .mockResolvedValueOnce([[{ id: 10, volume_ml: 60, preco: 750, estoque_qtd: 50 }, { id: 11, volume_ml: 100, preco: 1100, estoque_qtd: 50 }]]);

    await productController.getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.nome).toBe('Sauvage');
    expect(data.variacoes).toHaveLength(2);
  });

  test('Deve incluir produto inativo na busca por id se all=true', async () => {
    req.query.all = 'true';
    db.query.mockResolvedValueOnce([[{ id: 1, nome: 'Inativo' }]]); // select produto
    db.query.mockResolvedValueOnce([[]]); // select variacoes

    await productController.getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const queryUsada = db.query.mock.calls[0][0];
    expect(queryUsada).not.toContain('AND p.ativo = TRUE');
  });

  test('Deve retornar 404 se o produto não for encontrado', async () => {
    db.query.mockResolvedValueOnce([[]]);

    await productController.getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Perfume não encontrado.' });
  });

  test('Deve retornar 500 se houver erro no banco', async () => {
    db.query.mockRejectedValueOnce(new Error('DB Error'));

    await productController.getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao consultar perfume.' });
  });
});

describe('productController.createProduct', () => {
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
      body: {
        nome: 'Novo Perfume', marca_id: 1, categoria_id: 1, familia_olfativa_id: 1,
        preco: 500, estoque_qtd: 20, descricao: 'Desc', ingredientes: 'Ing', ocasiao_ideal: 'Noite',
        topo: 'Limão', coracao: 'Rosa', base: 'Sândalo',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve criar produto com notas olfativas e retornar 201', async () => {
    mockConnection.query
      .mockResolvedValueOnce([{ insertId: 99 }])  // INSERT produto
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // INSERT variação
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // INSERT notas

    await productController.createProduct(req, res);

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Perfume cadastrado com sucesso!',
      produto_id: 99,
    });
  });

  test('Deve criar produto sem notas olfativas se não informadas', async () => {
    req.body.topo = null;
    req.body.coracao = null;
    req.body.base = null;

    mockConnection.query
      .mockResolvedValueOnce([{ insertId: 100 }])  // INSERT produto
      .mockResolvedValueOnce([{ affectedRows: 1 }]);  // INSERT variação

    await productController.createProduct(req, res);

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.query).toHaveBeenCalledTimes(2); // Sem INSERT notas
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Deve fazer rollback e retornar 500 se o INSERT falhar', async () => {
    mockConnection.query.mockRejectedValueOnce(new Error('FK violation'));

    await productController.createProduct(req, res);

    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('productController.updateProduct', () => {
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

    req = { params: { id: 1 }, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve atualizar nome do produto com sucesso', async () => {
    req.body.nome = 'Novo Nome';
    mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await productController.updateProduct(req, res);

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Produto atualizado com sucesso!' });
  });

  test('Deve desativar produto (ativo = false)', async () => {
    req.body.ativo = false;
    mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await productController.updateProduct(req, res);

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.query).toHaveBeenCalledWith(
      expect.stringContaining('ativo = ?'),
      expect.arrayContaining([0, 1])
    );
  });

  test('Deve atualizar todos os campos do produto (branch coverage)', async () => {
    req.body = {
      descricao: 'D', ingredientes: 'I', ocasiao_ideal: 'O', ativo: true
    };
    mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await productController.updateProduct(req, res);
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.query).toHaveBeenCalledWith(
      expect.stringContaining('descricao = ?'),
      expect.any(Array)
    );
  });

  test('Deve atualizar variações de preço e estoque', async () => {
    req.body.variacoes = [{ id: 10, preco: 999, estoque_qtd: 50 }];
    mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE variação

    await productController.updateProduct(req, res);

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Deve atualizar variações passando apenas preco ou apenas estoque', async () => {
    req.body.variacoes = [
      { id: 10, preco: 999 },
      { id: 11, estoque_qtd: 50 }
    ];
    mockConnection.query.mockResolvedValue([{ affectedRows: 1 }]);
    await productController.updateProduct(req, res);
    expect(mockConnection.commit).toHaveBeenCalled();
  });

  test('Deve fazer rollback se o update falhar', async () => {
    req.body.nome = 'Teste';
    mockConnection.query.mockRejectedValueOnce(new Error('SQL Error'));

    await productController.updateProduct(req, res);

    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
