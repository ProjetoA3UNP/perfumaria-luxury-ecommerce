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
      const incluirInativos = req.query.all === 'true';
      const [rows] = await db.query(`
        SELECT 
          p.id, 
          p.nome, 
          p.ativo,
          (SELECT MIN(preco) FROM produto_variacoes WHERE produto_id = p.id) AS preco, 
          (SELECT SUM(estoque_qtd) FROM produto_variacoes WHERE produto_id = p.id) AS estoque_qtd, 
          (SELECT id FROM produto_variacoes WHERE produto_id = p.id ORDER BY preco ASC LIMIT 1) AS variacao_id, 
          (SELECT volume_ml FROM produto_variacoes WHERE produto_id = p.id ORDER BY preco ASC LIMIT 1) AS volume_ml, 
          (SELECT estoque_qtd FROM produto_variacoes WHERE produto_id = p.id ORDER BY preco ASC LIMIT 1) AS variacao_estoque,
          (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'volume_ml', volume_ml, 'preco', preco, 'estoque_qtd', estoque_qtd)) FROM (SELECT * FROM produto_variacoes WHERE produto_id = p.id AND ativo = TRUE ORDER BY preco ASC) as sub) AS variacoes,
          p.descricao,
          p.ocasiao_ideal,
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
        ${incluirInativos ? '' : 'WHERE p.ativo = TRUE'}
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
      const incluirInativos = req.query.all === 'true';
      const [rows] = await db.query(`
        SELECT 
          p.id, p.nome, p.descricao, p.ingredientes, p.ocasiao_ideal, p.ativo,
          m.nome AS marca, c.nome AS categoria, f.nome AS familia_olfativa,
          n.topo, n.coracao, n.base,
          (SELECT url FROM imagens_produto ip WHERE ip.produto_id = p.id AND ip.principal = 1 LIMIT 1) AS imagem
        FROM produtos p
        LEFT JOIN marcas m ON p.marca_id = m.id
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN familias_olfativas f ON p.familia_olfativa_id = f.id
        LEFT JOIN notas_olfativas n ON p.id = n.produto_id
        WHERE p.id = ? ${incluirInativos ? '' : 'AND p.ativo = TRUE'}
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
  },

  // 5. US18: Editar Produto (atualizar info, preço, estoque, ativar/desativar)
  async updateProduct(req, res) {
    const { id } = req.params;
    const { nome, descricao, ingredientes, ocasiao_ideal, ativo, variacoes } = req.body;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Atualizar dados do produto
      const campos = [];
      const valores = [];

      if (nome !== undefined) { campos.push('nome = ?'); valores.push(nome); }
      if (descricao !== undefined) { campos.push('descricao = ?'); valores.push(descricao); }
      if (ingredientes !== undefined) { campos.push('ingredientes = ?'); valores.push(ingredientes); }
      if (ocasiao_ideal !== undefined) { campos.push('ocasiao_ideal = ?'); valores.push(ocasiao_ideal); }
      if (ativo !== undefined) { campos.push('ativo = ?'); valores.push(ativo ? 1 : 0); }

      if (campos.length > 0) {
        valores.push(id);
        await connection.query(
          `UPDATE produtos SET ${campos.join(', ')} WHERE id = ?`,
          valores
        );
      }

      // 2. Atualizar variações (preço e estoque)
      if (variacoes && Array.isArray(variacoes)) {
        for (const v of variacoes) {
          if (v.id && (v.preco !== undefined || v.estoque_qtd !== undefined)) {
            const vCampos = [];
            const vValores = [];
            if (v.preco !== undefined) { vCampos.push('preco = ?'); vValores.push(v.preco); }
            if (v.estoque_qtd !== undefined) { vCampos.push('estoque_qtd = ?'); vValores.push(v.estoque_qtd); }
            vValores.push(v.id);
            await connection.query(
              `UPDATE produto_variacoes SET ${vCampos.join(', ')} WHERE id = ? AND produto_id = ${id}`,
              vValores
            );
          }
        }
      }

      await connection.commit();
      return res.status(200).json({ message: 'Produto atualizado com sucesso!' });

    } catch (error) {
      await connection.rollback();
      console.error('Erro ao atualizar produto:', error);
      return res.status(500).json({ error: 'Erro ao atualizar produto.' });
    } finally {
      connection.release();
    }
  }
};

module.exports = productController;
