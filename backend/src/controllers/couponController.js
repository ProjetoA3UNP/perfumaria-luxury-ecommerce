const db = require('../config/database');

const couponController = {

  // Validar cupom informado pelo cliente
  async validate(req, res) {
    const { codigo } = req.body;

    if (!codigo || codigo.trim() === '') {
      return res.status(400).json({ error: 'Informe o código do cupom.' });
    }

    try {
      const [rows] = await db.query(
        `SELECT id, codigo, desconto_percentual, desconto_valor, validade, ativo
         FROM cupons WHERE codigo = ?`,
        [codigo.trim().toUpperCase()]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Cupom não encontrado.' });
      }

      const cupom = rows[0];

      if (!cupom.ativo) {
        return res.status(400).json({ error: 'Este cupom está desativado.' });
      }

      if (new Date(cupom.validade) < new Date()) {
        return res.status(400).json({ error: 'Este cupom está expirado.' });
      }

      return res.status(200).json({
        id: cupom.id,
        codigo: cupom.codigo,
        desconto_percentual: cupom.desconto_percentual,
        desconto_valor: cupom.desconto_valor,
        validade: cupom.validade,
        message: 'Cupom válido!'
      });

    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      return res.status(500).json({ error: 'Erro ao validar cupom.' });
    }
  }
};

module.exports = couponController;
