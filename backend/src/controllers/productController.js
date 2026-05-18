const db = require('../config/database');

const productController = {
  // 1. Injetor Automático ("Seed") para evitar erro de Forign Key (Categorias, Marcas e Famílias)
  async seedDependencies(req, res) {
    try {
      console.log('🌱 Iniciando injeção de dependências...');
      
      await db.query(`INSERT IGNORE INTO categorias (id, nome) VALUES (1, 'Alta Perfumaria'), (2, 'Nicho')`);
      await db.query(`INSERT IGNORE INTO marcas (id, nome) VALUES (1, 'Chanel'), (2, 'Tom Ford')`);
      await db.query(`INSERT IGNORE INTO familias_olfativas (id, nome) VALUES (1, 'Amadeirado Escuro'), (2, 'Floral Branco')`);
      
      return res.status(200).json({ message: "Dependências Base injetadas! Categorias, Marcas e Famílias prontas para uso." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao injetar dependências." });
    }
  },

  async getMenuFilters(req, res) {
    try {
      const [categorias] = await db.query('SELECT nome FROM categorias ORDER BY nome ASC');
      const [marcas] = await db.query('SELECT nome FROM marcas ORDER BY nome ASC');
      const [familias] = await db.query('SELECT nome FROM familias_olfativas ORDER BY nome ASC');
      
      return res.status(200).json({
        categorias: categorias.map(c => c.nome),
        marcas: marcas.map(m => m.nome),
        familias: familias.map(f => f.nome)
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao buscar filtros do menu" });
    }
  },

  // 2. US17: Criar Perfume (Uso de TRANSAÇÃO SQL para consistência)
  async createProduct(req, res) {
    const { 
      nome, 
      marca_id, 
      categoria_id, 
      familia_olfativa_id, 
      preco, 
      estoque_qtd, 
      descricao, 
      ingredientes, 
      ocasiao_ideal,
      // Dados da "Tabela Filha" (Notas Olfativas)
      topo, 
      coracao, 
      base 
    } = req.body;

    const connection = await db.getConnection(); // Pegamos uma conexão única do Pool

    try {
      // Inicia a transação (Se der erro em Produtos ou em Notas, o BD dá Rollback em tudo)
      await connection.beginTransaction();

      // 1. Salvar o Produto (sem preço e estoque base)
      const [productResult] = await connection.query(
        `INSERT INTO produtos 
         (nome, marca_id, categoria_id, familia_olfativa_id, descricao, ingredientes, ocasiao_ideal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nome, marca_id, categoria_id, familia_olfativa_id, descricao, ingredientes, ocasiao_ideal]
      );

      const produto_id = productResult.insertId;

      // 1.5 Salvar a variação inicial
      await connection.query(
        `INSERT INTO produto_variacoes (produto_id, volume_ml, preco, estoque_qtd) VALUES (?, ?, ?, ?)`,
        [produto_id, 100, preco, estoque_qtd] // Assume 100ml como default para produtos criados via admin simples
      );

      // 2. Salvar as Notas Olfativas vinculadas ao ID gerado
      if (topo || coracao || base) {
        await connection.query(
          `INSERT INTO notas_olfativas (produto_id, topo, coracao, base) VALUES (?, ?, ?, ?)`,
          [produto_id, topo, coracao, base]
        );
      }

      await connection.commit(); // Efetiva a transação

      return res.status(201).json({
        message: "Perfume cadastrado com sucesso!",
        produto_id: produto_id
      });

    } catch (error) {
      await connection.rollback(); // Desfaz alterações se der erro
      console.error("Erro SQL no Módulo Produtos: ", error);
      return res.status(500).json({ error: "Erro ao cadastrar o Perfume. Verifique se o marca_id/categoria_id existem." });
    } finally {
      connection.release(); // Devolve a conexão pro Pool liberar memória!
    }
  },

  // 3. US06: Listar Produtos (Buscando o JOIN Relacional Completo)
  async getProducts(req, res) {
    try {
      const [rows] = await db.query(`
        SELECT 
          p.id, 
          p.nome, 
          (SELECT MIN(preco) FROM produto_variacoes WHERE produto_id = p.id) AS preco, 
          (SELECT SUM(estoque_qtd) FROM produto_variacoes WHERE produto_id = p.id) AS estoque_qtd, 
          (SELECT id FROM produto_variacoes WHERE produto_id = p.id ORDER BY preco ASC LIMIT 1) AS variacao_id, 
          (SELECT volume_ml FROM produto_variacoes WHERE produto_id = p.id ORDER BY preco ASC LIMIT 1) AS volume_ml, 
          p.descricao,
          m.nome AS marca, 
          c.nome AS categoria,
          f.nome AS familia_olfativa,
          n.topo, 
          n.coracao, 
          n.base,
          (SELECT url FROM imagens_produto ip WHERE ip.produto_id = p.id AND ip.principal = 1 LIMIT 1) AS imagem
        FROM produtos p
        LEFT JOIN marcas m ON p.marca_id = m.id
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN familias_olfativas f ON p.familia_olfativa_id = f.id
        LEFT JOIN notas_olfativas n ON p.id = n.produto_id
        WHERE p.ativo = TRUE
        ORDER BY p.id DESC
      `);

      return res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao consultar o catálogo de perfumes." });
    }
  },

  // 4. Buscar Produto Específico pelo ID
  async getProductById(req, res) {
    const { id } = req.params;
    try {
      const [rows] = await db.query(`
        SELECT 
          p.id, p.nome, p.descricao, p.ingredientes, p.ocasiao_ideal,
          m.nome AS marca, c.nome AS categoria, f.nome AS familia_olfativa,
          n.topo, n.coracao, n.base,
          (SELECT url FROM imagens_produto ip WHERE ip.produto_id = p.id AND ip.principal = 1 LIMIT 1) AS imagem
        FROM produtos p
        LEFT JOIN marcas m ON p.marca_id = m.id
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN familias_olfativas f ON p.familia_olfativa_id = f.id
        LEFT JOIN notas_olfativas n ON p.id = n.produto_id
        WHERE p.id = ? AND p.ativo = TRUE
      `, [id]);

      if (rows.length === 0) return res.status(404).json({ error: "Perfume não encontrado." });

      const [variacoes] = await db.query(
        `SELECT id, volume_ml, preco, estoque_qtd FROM produto_variacoes WHERE produto_id = ? AND ativo = TRUE ORDER BY volume_ml ASC`, 
        [id]
      );

      const product = rows[0];
      product.variacoes = variacoes;

      return res.status(200).json(product);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao consultar perfume." });
    }
  }
};

module.exports = productController;
