const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authController = {
  // US01: Cadastro de nova conta
  async register(req, res) {
    const { nome, email, cpf, senha, data_nascimento } = req.body;

    // VALIDAÇÕES AV3: Formato do email e Segurança da Senha
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: "Por favor, forneça um e-mail em formato válido." });
    }
    
    if (!senha || senha.length < 8) {
      return res.status(400).json({ error: "Por motivos de segurança, a senha deve ter no mínimo 8 caracteres." });
    }

    if (!cpf || cpf.length !== 11) {
      return res.status(400).json({ error: "O CPF do cliente deve conter exatamente 11 dígitos numéricos." });
    }

    try {
      // 1. Validação: Checar se e-mail ou CPF já existem
      const [existingUser] = await db.query(
        "SELECT id FROM usuarios WHERE email = ? OR cpf = ?",
        [email, cpf]
      );

      if (existingUser.length > 0) {
        return res.status(409).json({ error: "E-mail ou CPF já cadastrado." });
      }

      // 2. Hash da senha
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(senha, salt);

      // 3. Inserir no Banco de Dados
      const [result] = await db.query(
        `INSERT INTO usuarios (nome, email, cpf, senha_hash, data_nascimento) 
         VALUES (?, ?, ?, ?, ?)`,
        [nome, email, cpf, senhaHash, data_nascimento]
      );

      return res.status(201).json({
        message: "Usuário cadastrado com sucesso!",
        userId: result.insertId
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro interno no servidor ao cadastrar." });
    }
  },

  // US02: Login na plataforma
  async login(req, res) {
    const { email, senha } = req.body;

    try {
      const [users] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
      
      if (users.length === 0) {
        return res.status(401).json({ error: "Credenciais inválidas." });
      }

      const user = users[0];
      const isValidPassword = await bcrypt.compare(senha, user.senha_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: "Credenciais inválidas." });
      }

      // 3. Assinar o JWT Token
      const token = jwt.sign(
        { id: user.id, tipo_perfil: user.tipo_perfil },
        process.env.JWT_SECRET || 'fallback_secret_inseguro',
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        message: "Login bem-sucedido!",
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          tipo_perfil: user.tipo_perfil
        }
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao fazer login." });
    }
  },

  // Busca dados do próprio perfil
  async getMe(req, res) {
    try {
      const [users] = await db.query(
        "SELECT id, nome, email, cpf, data_nascimento, tipo_perfil, criado_em FROM usuarios WHERE id = ?", 
        [req.user.id]
      );
      
      if (users.length === 0) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      return res.status(200).json(users[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao buscar dados do perfil." });
    }
  },

  // Atualizar dados do perfil
  async updateMe(req, res) {
    const { nome, data_nascimento } = req.body;
    try {
      await db.query(
        "UPDATE usuarios SET nome = ?, data_nascimento = ? WHERE id = ?",
        [nome, data_nascimento || null, req.user.id]
      );
      const [updated] = await db.query(
        "SELECT id, nome, email, cpf, data_nascimento, tipo_perfil FROM usuarios WHERE id = ?",
        [req.user.id]
      );
      return res.status(200).json(updated[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao atualizar perfil." });
    }
  }
};

module.exports = authController;
