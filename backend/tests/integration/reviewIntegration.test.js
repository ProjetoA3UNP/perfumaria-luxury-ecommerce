process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const db = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

describe('Integração: Rota de Avaliações', () => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_inseguro';
  let tokenCliente;

  beforeAll(() => {
    // Esconde console.error intencional durante testes
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Gerar token mockado de cliente
    tokenCliente = jwt.sign({ id: 10, tipo_perfil: 'CLIENTE' }, secret);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/reviews/product/:produto_id - Deve buscar avaliações publicamente sem token', async () => {
    db.query.mockResolvedValueOnce([[
      { id: 1, nota: 5, comentario: 'Fragrância marcante', data_avaliacao: '2026-06-01', usuario_nome: 'João' }
    ]]); // SELECT avaliacoes
    db.query.mockResolvedValueOnce([[{ media: 5.0, total: 1 }]]); // SELECT media

    const response = await request(app).get('/api/reviews/1');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('avaliacoes');
    expect(response.body.media).toBe(5);
  });

  test('POST /api/reviews - Deve retornar 401 caso não seja fornecido Token JWT', async () => {
    const response = await request(app)
      .post('/api/reviews')
      .send({ produto_id: 1, nota: 5, comentario: 'Ótimo perfume' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Token não fornecido.');
  });

  test('POST /api/reviews - Deve retornar 403 se o cliente logado não comprou o produto', async () => {
    db.query.mockResolvedValueOnce([[]]); // Sem compras para o produto 1

    const response = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ produto_id: 1, nota: 5, comentario: 'Muito bom!' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Você só pode avaliar produtos que já comprou.');
  });

  test('POST /api/reviews - Deve retornar 201 e salvar avaliação para comprador logado', async () => {
    db.query.mockResolvedValueOnce([[{ id: 99 }]]); // Encontra a compra
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Mock do INSERT

    const response = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ produto_id: 1, nota: 5, comentario: 'Original e lacrado' });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Avaliação registrada com sucesso!');
  });
});
