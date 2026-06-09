process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const db = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

describe('Integração: Rota de Cupons', () => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_inseguro';
  let tokenCliente;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    tokenCliente = jwt.sign({ id: 10, tipo_perfil: 'CLIENTE' }, secret);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/coupons/validate - Deve retornar 401 caso não seja fornecido Token', async () => {
    const response = await request(app)
      .post('/api/coupons/validate')
      .send({ codigo: 'DESC10' });

    expect(response.status).toBe(401);
  });

  test('POST /api/coupons/validate - Deve permitir validação com token e retornar desconto do cupom', async () => {
    const validadeFutura = new Date();
    validadeFutura.setDate(validadeFutura.getDate() + 5);

    db.query.mockResolvedValueOnce([[
      { id: 1, codigo: 'DESC10', desconto_percentual: 10, desconto_valor: null, validade: validadeFutura.toISOString(), ativo: 1 }
    ]]);

    const response = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ codigo: 'DESC10' });

    expect(response.status).toBe(200);
    expect(response.body.desconto_percentual).toBe(10);
    expect(response.body.message).toBe('Cupom válido!');
  });
});
