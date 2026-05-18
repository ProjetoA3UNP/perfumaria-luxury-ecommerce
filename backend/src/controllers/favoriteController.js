const db = require('../config/database');

const favoriteController = {
  // Adiciona aos favoritos
  async addFavorite(req, res) {
    const { produto_id } = req.body;
    const usuario_id = req.user.id;

    try {
      await db.query("INSERT INTO favoritos (usuario_id, produto_id) VALUES (?, ?)", [usuario_id, produto_id]);
      return res.status(201).json({ message: "Adicionado aos favoritos." });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(200).json({ message: "Já estava nos favoritos." });
      }
      console.error(error);
      return res.status(500).json({ error: "Erro ao favoritar produto." });
    }
  },

  // Remove dos favoritos
  async removeFavorite(req, res) {
    const { produto_id } = req.params;
    const usuario_id = req.user.id;

    try {
      await db.query("DELETE FROM favoritos WHERE usuario_id = ? AND produto_id = ?", [usuario_id, produto_id]);
      return res.status(200).json({ message: "Removido dos favoritos." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao remover favorito." });
    }
  },

  // Lista favoritos
  async getFavorites(req, res) {
    const usuario_id = req.user.id;

    try {
      const [rows] = await db.query(`
        SELECT 
          p.id, 
          p.nome, 
          (SELECT MIN(preco) FROM produto_variacoes WHERE produto_id = p.id) AS preco,
          (SELECT volume_ml FROM produto_variacoes WHERE produto_id = p.id ORDER BY preco ASC LIMIT 1) AS volume_ml,
          (SELECT url FROM imagens_produto WHERE produto_id = p.id AND principal = TRUE LIMIT 1) AS imagem,
          p.descricao,
          m.nome AS marca
        FROM favoritos f
        JOIN produtos p ON f.produto_id = p.id
        LEFT JOIN marcas m ON p.marca_id = m.id
        WHERE f.usuario_id = ?
      `, [usuario_id]);

      return res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao buscar lista de favoritos." });
    }
  }
};

module.exports = favoriteController;
