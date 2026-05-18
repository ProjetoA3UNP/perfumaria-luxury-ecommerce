const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

// Mock (Dublê) do Banco de Dados para os Testes Unitários não sujarem seu banco de verdade
jest.mock('../src/config/database', () => ({
  query: jest.fn()
}));

// Esconde as mensagens de erro em vermelho do termial durante os testes forçados
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('API Módulo de Autenticação AV3', () => {

  const payload_valido = {
    nome: "Tester Silva",
    email: "tester@essence.com",
    cpf: "00000000000",
    senha: "password#123",
    data_nascimento: "1990-01-01"
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  // TESTE 1 (Validação de Email)
  it('Deve rejeitar registro de usuário com e-mail em formato inválido', async () => {
    const payload_invalido = { ...payload_valido, email: 'tester_sem_arroba.com' };
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(payload_invalido);
      
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('e-mail em formato válido');
  });

  // TESTE 2 (Validação de Senha Longa)
  it('Deve rejeitar registro de usuário com senha menor que 8 caracteres', async () => {
    const payload_invalido = { ...payload_valido, senha: '123' };
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(payload_invalido);
      
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('mínimo 8 caracteres');
  });

  // TESTE 3 (Cadastro Bem-Sucedido - Fluxo de Sucesso)
  it('Deve criar o usuário perfeitamente quando os dados estão válidos', async () => {
    // Finge que o banco respondeu que e-mail/cpf ainda NÃO existem
    db.query.mockResolvedValueOnce([[]]); 
    // Finge a resposta do INSERT gerando o ID 99 pro usuário
    db.query.mockResolvedValueOnce([{ insertId: 99 }]); 
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(payload_valido);
      
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Usuário cadastrado com sucesso!');
    expect(response.body.userId).toBe(99);
  });

  // TESTE 4 (Regra de Negócio: Impede e-mails já existentes)
  it('Deve bloquear tentativa de registrar usuário que já existe no banco', async () => {
    // Finge que o banco achou um usuário com esse email na hora do SELECT
    db.query.mockResolvedValueOnce([[{ id: 99 }]]);
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(payload_valido);
      
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('E-mail ou CPF já cadastrado.');
  });

  // TESTE 5 (Login e Emissão de JWT)
  it('Deve realizar o login e retornar um TOKEN válido', async () => {
    const hashMocada = await bcrypt.hash(payload_valido.senha, 10);
    
    // Finge que a busca na tabela pegou o cara com a hash válida 
    db.query.mockResolvedValueOnce([[{ 
        id: 99, 
        nome: payload_valido.nome, 
        email: payload_valido.email, 
        tipo_perfil: 'CLIENTE',
        senha_hash: hashMocada
    }]]);
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: payload_valido.email, senha: payload_valido.senha });
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe(payload_valido.email);
  });
});
