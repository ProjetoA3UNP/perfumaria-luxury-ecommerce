const jwt = require('jsonwebtoken');
const authMiddleware = require('../../src/middlewares/authMiddleware');

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test('Deve retornar 401 se token não for fornecido', () => {
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token não fornecido." });
  });

  test('Deve retornar 401 se o token for inválido', () => {
    req.headers.authorization = 'Bearer token_invalido';
    jwt.verify = jest.fn().mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token inválido ou expirado." });
  });

  test('Deve chamar next() se o token for válido e pendurar o user no req', () => {
    req.headers.authorization = 'Bearer token_valido';
    jwt.verify = jest.fn().mockReturnValue({ id: 1, tipo_perfil: 'CLIENTE' });

    authMiddleware(req, res, next);
    expect(req.user).toEqual({ id: 1, tipo_perfil: 'CLIENTE' });
    expect(next).toHaveBeenCalled();
  });
});
