const addressController = require('../../src/controllers/addressController');
const db = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

describe('addressController.getAddresses', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: { id: 1 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve listar endereços salvos com sucesso (200)', async () => {
    const mockEnderecos = [{ id: 1, titulo: 'Casa', cep: '12345-678', principal: 1 }];
    db.query.mockResolvedValueOnce([mockEnderecos]);

    await addressController.getAddresses(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockEnderecos);
  });
});

describe('addressController.addAddress', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 1 },
      body: { titulo: 'Trabalho', cep: '87654-321', principal: false },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve marcar como principal se for o primeiro endereço cadastrado', async () => {
    // 1. SELECT existing -> vazio
    db.query.mockResolvedValueOnce([[]]);
    // 2. INSERT -> insertId = 10
    db.query.mockResolvedValueOnce([{ insertId: 10 }]);
    // 3. SELECT newAddress
    db.query.mockResolvedValueOnce([[{ id: 10, titulo: 'Trabalho', principal: 1 }]]);

    await addressController.addAddress(req, res);

    expect(req.body.principal).toBe(true);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Deve remover principal dos outros se cadastrar um endereço principal novo', async () => {
    req.body.principal = true;

    // 1. UPDATE outros principal = FALSE
    db.query.mockResolvedValueOnce([{ affectedRows: 2 }]);
    // 2. INSERT -> insertId = 11
    db.query.mockResolvedValueOnce([{ insertId: 11 }]);
    // 3. SELECT newAddress
    db.query.mockResolvedValueOnce([[{ id: 11, titulo: 'Trabalho', principal: 1 }]]);

    await addressController.addAddress(req, res);

    expect(db.query).toHaveBeenCalledWith("UPDATE enderecos SET principal = FALSE WHERE usuario_id = ?", [1]);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('addressController.updateAddress', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 1 },
      params: { id: 10 },
      body: { titulo: 'Casa Atualizado', principal: true },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar 404 se o endereço não pertencer ao usuário', async () => {
    db.query.mockResolvedValueOnce([[]]); // SELECT validation vazio

    await addressController.updateAddress(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Endereço não encontrado.' });
  });

  test('Deve atualizar endereço e retornar 200', async () => {
    // 1. SELECT validation -> pertence
    db.query.mockResolvedValueOnce([[{ id: 10 }]]);
    // 2. UPDATE outros (como é principal)
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    // 3. UPDATE endereço
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    // 4. SELECT updated
    db.query.mockResolvedValueOnce([[{ id: 10, titulo: 'Casa Atualizado' }]]);

    await addressController.updateAddress(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Endereço atualizado!' }));
  });
});

describe('addressController.deleteAddress', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 1 },
      params: { id: 10 }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('Deve retornar 404 se tentar deletar endereço não pertencente ao usuário', async () => {
    db.query.mockResolvedValueOnce([[]]); // SELECT validation vazio

    await addressController.deleteAddress(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('Deve deletar endereço e retornar 200', async () => {
    // 1. SELECT validation -> pertence
    db.query.mockResolvedValueOnce([[{ id: 10 }]]);
    // 2. DELETE
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await addressController.deleteAddress(req, res);

    expect(db.query).toHaveBeenCalledWith("DELETE FROM enderecos WHERE id = ?", [10]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Endereço removido com sucesso." });
  });
});
