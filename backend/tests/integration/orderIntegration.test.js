process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const db = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

describe('Integração: Rota Admin de Pedidos', () => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_inseguro';
  let tokenCliente;
  let tokenAdmin;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    tokenCliente = jwt.sign({ id: 10, tipo_perfil: 'CLIENTE' }, secret);
    tokenAdmin = jwt.sign({ id: 2, nome: 'Admin Master', tipo_perfil: 'ADMIN' }, secret);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('PATCH /api/orders/admin/:id/status - Deve retornar 401 caso não seja fornecido Token', async () => {
    const response = await request(app)
      .patch('/api/orders/admin/1/status')
      .send({ status: 'ENVIADO' });

    expect(response.status).toBe(401);
  });

  test('PATCH /api/orders/admin/:id/status - Deve retornar 403 se o usuário logado for um CLIENTE (não admin)', async () => {
    const response = await request(app)
      .patch('/api/orders/admin/1/status')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ status: 'ENVIADO' });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Acesso negado');
  });

  test('PATCH /api/orders/admin/:id/status - Deve permitir acesso a usuário ADMIN e atualizar com sucesso', async () => {
    db.query.mockResolvedValueOnce([[{ id: 1, status: 'PAGO' }]]); // SELECT pedido existente
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Mock do UPDATE
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Mock do log de auditoria

    const response = await request(app)
      .patch('/api/orders/admin/1/status')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: 'ENVIADO' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Status atualizado: PAGO → ENVIADO');
  });
});
