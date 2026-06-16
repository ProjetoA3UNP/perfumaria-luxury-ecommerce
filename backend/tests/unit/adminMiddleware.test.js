const adminMiddleware = require('../../src/middlewares/adminMiddleware');

describe('adminMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test('Deve retornar 401 se req.user não existir', () => {
    adminMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuário não autenticado." });
    expect(next).not.toHaveBeenCalled();
  });

  test('Deve retornar 403 se o usuário não for ADMIN', () => {
    req.user = { tipo_perfil: 'CLIENTE' };
    adminMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Acesso negado. Apenas administradores podem realizar esta ação." });
    expect(next).not.toHaveBeenCalled();
  });

  test('Deve chamar next() se o usuário for ADMIN', () => {
    req.user = { tipo_perfil: 'ADMIN' };
    adminMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
