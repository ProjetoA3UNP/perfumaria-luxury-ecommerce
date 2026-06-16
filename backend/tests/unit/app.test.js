process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

// Como as rotas carregam controllers que podem ter dependências complexas (ex: stripe), 
// e o foco aqui é testar o /health e /test-db do app.js, a injeção do express por cima é tranquila
// pois o supertest inicializa o app isoladamente.

describe('App Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    test('Deve retornar status 200 e json de saude', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', service: 'essence-api' });
    });
  });

  describe('GET /test-db', () => {
    test('Deve retornar tabelas se conectado com sucesso', async () => {
      const mockTables = [{ Tables_in_db: 'produtos' }];
      db.query.mockResolvedValueOnce([mockTables]);

      const res = await request(app).get('/test-db');
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('Banco Conectado! ✅');
      expect(res.body.tabelas_no_banco).toEqual(mockTables);
    });

    test('Deve retornar 500 se o banco falhar', async () => {
      db.query.mockRejectedValueOnce(new Error('DB falhou'));

      const res = await request(app).get('/test-db');
      
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Ocorreu um erro ao conectar no MySQL.');
    });
  });
});
