const db = require('../config/database');

const cartController = {
  // US12: Adicionar ou Atualizar Item na Sacola
  async addItem(req, res) {
    const { variacao_id, quantidade } = req.body;
    const usuario_id = req.user.id; // Vem direto do Token Assinado!

    try {
      // 1. Regra US20: O perfume existe no estoque nessa quantidade?
      const [variacao] = await db.query(
        "SELECT v.id, v.estoque_qtd, p.nome, v.volume_ml FROM produto_variacoes v JOIN produtos p ON v.produto_id = p.id WHERE v.id = ? AND v.ativo = TRUE AND p.ativo = TRUE", 
        [variacao_id]
      );

      if (variacao.length === 0) {
        return res.status(404).json({ error: "Variação de produto não encontrada ou inativa." });
      }

      if (quantidade > variacao[0].estoque_qtd) {
        return res.status(400).json({ 
          error: `Quantidade excede o estoque. Só temos ${variacao[0].estoque_qtd} unidades do ${variacao[0].nome} (${variacao[0].volume_ml}ml).` 
        });
      }

      // 2. Busca ou Cria o Carrinho para este usuário (Session)
      let [carrinho] = await db.query("SELECT id FROM carrinho WHERE usuario_id = ?", [usuario_id]);
      let carrinho_id;

      if (carrinho.length === 0) {
        const [novoCarrinho] = await db.query("INSERT INTO carrinho (usuario_id) VALUES (?)", [usuario_id]);
        carrinho_id = novoCarrinho.insertId;
      } else {
        carrinho_id = carrinho[0].id;
      }

      // 3. Adicionar ou Somar o Item na Sacola (Upsert Logic)
      const [itensCart] = await db.query(
        "SELECT quantidade FROM itens_carrinho WHERE carrinho_id = ? AND variacao_id = ?",
        [carrinho_id, variacao_id]
      );

      if (itensCart.length > 0) {
        // Já tem na sacola? Verifica se a SOMA não estoura o estoque
        const nova_qtd = itensCart[0].quantidade + quantidade;
        
        if(nova_qtd > variacao[0].estoque_qtd) {
            return res.status(400).json({ error: "Adicionar mais deste item excede o limite do estoque." });
        }

        await db.query(
          "UPDATE itens_carrinho SET quantidade = ? WHERE carrinho_id = ? AND variacao_id = ?",
          [nova_qtd, carrinho_id, variacao_id]
        );
      } else {
         // Não tem na sacola? Insere novo!
        await db.query(
          "INSERT INTO itens_carrinho (carrinho_id, variacao_id, quantidade) VALUES (?, ?, ?)",
          [carrinho_id, variacao_id, quantidade]
        );
      }

      return res.status(200).json({ message: "Item adicionado ao carrinho com sucesso!" });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro interno ao gerenciar sacola." });
    }
  },

  // US12: Listar itens da sacola do usuário
  async getCart(req, res) {
    const usuario_id = req.user.id; // Pego pela segurança JWT

    try {
      const [rows] = await db.query(`
        SELECT 
          i.id AS item_carrinho_id,
          v.id AS variacao_id,
          p.id AS produto_id,
          p.nome AS produto_nome,
          v.volume_ml,
          v.preco AS preco_unitario,
          i.quantidade,
          (v.preco * i.quantidade) AS subtotal,
          (SELECT url FROM imagens_produto ip WHERE ip.produto_id = p.id AND ip.principal = 1 LIMIT 1) AS imagem
        FROM carrinho c
        JOIN itens_carrinho i ON c.id = i.carrinho_id
        JOIN produto_variacoes v ON i.variacao_id = v.id
        JOIN produtos p ON v.produto_id = p.id
        WHERE c.usuario_id = ?
      `, [usuario_id]);

      // Calcula o valor total via Javascript rápido e devolve completo
      const valor_total_carrinho = rows.reduce((acc, curr) => acc + Number(curr.subtotal), 0);

      return res.status(200).json({
        itens: rows,
        total: valor_total_carrinho
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao buscar a sacola do cliente." });
    }
  },

  // US12: Remover item específico da sacola
  async removeItem(req, res) {
    const { variacao_id } = req.params;
    const usuario_id = req.user.id;

    try {
      await db.query(`
        DELETE i FROM itens_carrinho i
        JOIN carrinho c ON i.carrinho_id = c.id
        WHERE c.usuario_id = ? AND i.variacao_id = ?
      `, [usuario_id, variacao_id]);

      return res.status(200).json({ message: "Item removido com sucesso." });
    } catch(error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao remover item do carrinho." });
    }
  },

  // US12: Atualizar quantidade de um item na sacola (Botões + e -)
  async updateItemQuantity(req, res) {
    const { variacao_id } = req.params;
    const { quantidade } = req.body;
    const usuario_id = req.user.id;

    if (quantidade <= 0) {
      return res.status(400).json({ error: "A quantidade deve ser maior que zero." });
    }

    try {
      // Verifica se o produto existe e tem estoque
      const [variacao] = await db.query("SELECT estoque_qtd FROM produto_variacoes WHERE id = ? AND ativo = TRUE", [variacao_id]);
      
      if (variacao.length === 0) return res.status(404).json({ error: "Variação não encontrada." });
      if (quantidade > variacao[0].estoque_qtd) return res.status(400).json({ error: "Quantidade desejada excede o estoque atual." });

      // Atualiza garantindo segurança do dono do carrinho via JOIN
      await db.query(`
        UPDATE itens_carrinho i
        JOIN carrinho c ON i.carrinho_id = c.id
        SET i.quantidade = ?
        WHERE c.usuario_id = ? AND i.variacao_id = ?
      `, [quantidade, usuario_id, variacao_id]);

      return res.status(200).json({ message: "Quantidade atualizada no carrinho." });
    } catch(err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao atualizar carrinho." });
    }
  }
};

module.exports = cartController;
