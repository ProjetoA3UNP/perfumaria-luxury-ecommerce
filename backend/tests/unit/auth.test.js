const authController = require('../../src/controllers/authController');
const db = require('../../src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('authController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('register', () => {
    test('Deve retornar 400 se o email for inválido', async () => {
      req.body = { email: 'invalido', senha: 'password123', cpf: '12345678901' };
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Por favor, forneça um e-mail em formato válido.' });
    });

    test('Deve retornar 400 se a senha for muito curta', async () => {
      req.body = { email: 'teste@teste.com', senha: '123', cpf: '12345678901' };
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Deve retornar 400 se o CPF não tiver 11 dígitos', async () => {
      req.body = { email: 'teste@teste.com', senha: 'password123', cpf: '123' };
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Deve retornar 409 se o email ou cpf já existirem', async () => {
      req.body = { email: 'teste@teste.com', senha: 'password123', cpf: '12345678901' };
      db.query.mockResolvedValueOnce([[{ id: 1 }]]); // already exists
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'E-mail ou CPF já cadastrado.' });
    });

    test('Deve retornar 500 em caso de erro no banco de dados', async () => {
      req.body = { email: 'teste@teste.com', senha: 'password123', cpf: '12345678901' };
      db.query.mockRejectedValueOnce(new Error('DB Error'));
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('Deve registrar um novo usuário com sucesso', async () => {
      req.body = { nome: 'João', email: 'joao@teste.com', senha: 'password123', cpf: '12345678901', data_nascimento: '1990-01-01' };
      db.query.mockResolvedValueOnce([[]]); // Not exists
      bcrypt.genSalt.mockResolvedValueOnce('salt');
      bcrypt.hash.mockResolvedValueOnce('hashedPassword');
      db.query.mockResolvedValueOnce([{ insertId: 42 }]); // Inserted

      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuário cadastrado com sucesso!', userId: 42 });
    });
  });

  describe('login', () => {
    test('Deve retornar 401 se credenciais não existirem no banco', async () => {
      req.body = { email: 'teste@teste.com', senha: 'password123' };
      db.query.mockResolvedValueOnce([[]]); // not found
      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Credenciais inválidas.' });
    });

    test('Deve retornar 401 se a senha for incorreta', async () => {
      req.body = { email: 'teste@teste.com', senha: 'password123' };
      db.query.mockResolvedValueOnce([[{ id: 1, senha_hash: 'hash' }]]); // user found
      bcrypt.compare.mockResolvedValueOnce(false); // bad password
      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Credenciais inválidas.' });
    });

    test('Deve retornar 500 se houver erro no banco', async () => {
      req.body = { email: 'teste@teste.com', senha: 'password123' };
      db.query.mockRejectedValueOnce(new Error('DB Error'));
      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('Deve fazer login com sucesso e retornar token', async () => {
      req.body = { email: 'teste@teste.com', senha: 'password123' };
      db.query.mockResolvedValueOnce([[{ id: 1, nome: 'João', email: 'teste@teste.com', senha_hash: 'hash', tipo_perfil: 'CLIENTE' }]]);
      bcrypt.compare.mockResolvedValueOnce(true); // good password
      jwt.sign.mockReturnValueOnce('fake-token');

      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].token).toBe('fake-token');
      expect(res.json.mock.calls[0][0].user.nome).toBe('João');
    });
  });

  describe('forgotPassword', () => {
    test('Deve retornar 400 se o email não for fornecido', async () => {
      req.body = { email: '' };
      await authController.forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'E-mail não fornecido.' });
    });

    test('Deve retornar 500 em caso de erro no banco', async () => {
      req.body = { email: 'teste@teste.com' };
      db.query.mockRejectedValueOnce(new Error('DB error'));
      await authController.forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('Deve retornar 200 de sucesso independente de encontrar o usuario ou nao', async () => {
      req.body = { email: 'teste@teste.com' };
      db.query.mockResolvedValueOnce([[]]);
      await authController.forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Se o e-mail estiver cadastrado, as instruções foram enviadas.' });
    });
  });

  describe('getMe', () => {
    test('Deve retornar 404 se o usuário não existir no banco', async () => {
      req.user = { id: 1 };
      db.query.mockResolvedValueOnce([[]]);
      await authController.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuário não encontrado.' });
    });

    test('Deve retornar 500 em erro de banco', async () => {
      req.user = { id: 1 };
      db.query.mockRejectedValueOnce(new Error('DB'));
      await authController.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('Deve retornar os dados do usuário com sucesso', async () => {
      req.user = { id: 1 };
      db.query.mockResolvedValueOnce([[{ id: 1, nome: 'Maria', tipo_perfil: 'CLIENTE' }]]);
      await authController.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].nome).toBe('Maria');
    });
  });
});

describe('authController.updateMe', () => {
  let req, res;
  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: { id: 5 }, body: { nome: 'Novo Nome', data_nascimento: '1990-01-01' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  test('Deve atualizar o perfil com sucesso', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Update
    db.query.mockResolvedValueOnce([[{ id: 5, nome: 'Novo Nome' }]]); // Select
    await authController.updateMe(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: 5, nome: 'Novo Nome' });
  });

  test('Deve retornar 500 em caso de erro no banco', async () => {
    db.query.mockRejectedValueOnce(new Error('DB Error'));
    await authController.updateMe(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao atualizar perfil.' });
  });
});
