const db = require('../config/database');

const reviewController = {

  // Criar ou atualizar avaliação (1 por usuário/produto)
  async createReview(req, res) {
    const usuario_id = req.user.id;
    const { produto_id, nota, comentario } = req.body;

    if (!produto_id || !nota || nota < 1 || nota > 5) {
      return res.status(400).json({ error: 'Nota deve ser entre 1 e 5.' });
    }

    try {
      // Verificar se o usuário comprou este produto
      const [compras] = await db.query(`
        SELECT v.id FROM vendas v
        JOIN itens_venda iv ON iv.venda_id = v.id
        JOIN produto_variacoes pv ON iv.variacao_id = pv.id
        WHERE v.usuario_id = ? AND pv.produto_id = ? AND v.status IN ('PAGO','PROCESSANDO','ENVIADO','ENTREGUE')
        LIMIT 1
      `, [usuario_id, produto_id]);

      if (compras.length === 0) {
        return res.status(403).json({ error: 'Você só pode avaliar produtos que já comprou.' });
      }

      // Inserir ou atualizar (UNIQUE KEY impede duplicata)
      await db.query(`
        INSERT INTO avaliacoes (produto_id, usuario_id, nota, comentario)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE nota = VALUES(nota), comentario = VALUES(comentario), data_avaliacao = NOW()
      `, [produto_id, usuario_id, nota, comentario || null]);

      return res.status(201).json({ message: 'Avaliação registrada com sucesso!' });
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      return res.status(500).json({ error: 'Erro ao registrar avaliação.' });
    }
  },

  // Listar avaliações de um produto (público)
  async getProductReviews(req, res) {
    const { produto_id } = req.params;
    try {
      const [avaliacoes] = await db.query(`
        SELECT a.id, a.nota, a.comentario, a.data_avaliacao,
               u.nome AS usuario_nome
        FROM avaliacoes a
        JOIN usuarios u ON a.usuario_id = u.id
        WHERE a.produto_id = ?
        ORDER BY a.data_avaliacao DESC
      `, [produto_id]);

      // Média
      const [media] = await db.query(`
        SELECT AVG(nota) AS media, COUNT(*) AS total
        FROM avaliacoes WHERE produto_id = ?
      `, [produto_id]);

      return res.status(200).json({
        avaliacoes,
        media: media[0].media ? Number(Number(media[0].media).toFixed(1)) : 0,
        total: media[0].total
      });
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      return res.status(500).json({ error: 'Erro ao buscar avaliações.' });
    }
  },

  // Verificar se o usuário pode avaliar (comprou o produto?)
  async canReview(req, res) {
    const usuario_id = req.user.id;
    const { produto_id } = req.params;

    try {
      const [compras] = await db.query(`
        SELECT v.id FROM vendas v
        JOIN itens_venda iv ON iv.venda_id = v.id
        JOIN produto_variacoes pv ON iv.variacao_id = pv.id
        WHERE v.usuario_id = ? AND pv.produto_id = ? AND v.status IN ('PAGO','PROCESSANDO','ENVIADO','ENTREGUE')
        LIMIT 1
      `, [usuario_id, produto_id]);

      const [jaAvaliou] = await db.query(
        'SELECT id, nota, comentario FROM avaliacoes WHERE usuario_id = ? AND produto_id = ?',
        [usuario_id, produto_id]
      );

      return res.status(200).json({
        podeAvaliar: compras.length > 0,
        jaAvaliou: jaAvaliou.length > 0,
        avaliacaoExistente: jaAvaliou[0] || null
      });
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return res.status(500).json({ error: 'Erro ao verificar permissão.' });
    }
  }
};

module.exports = reviewController;
