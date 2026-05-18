const db = require('../config/database');

const addressController = {
  // Buscar os endereços do usuário
  async getAddresses(req, res) {
    const usuario_id = req.user.id;
    try {
      const [rows] = await db.query(
        "SELECT id, titulo, cep, bairro, rua, numero, complemento, principal FROM enderecos WHERE usuario_id = ? ORDER BY principal DESC, id DESC",
        [usuario_id]
      );
      return res.status(200).json(rows);
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
      return res.status(500).json({ error: "Erro ao buscar endereços salvos." });
    }
  },

  // Criar novo endereço
  async addAddress(req, res) {
    const usuario_id = req.user.id;
    const { titulo, cep, bairro, rua, numero, complemento, principal } = req.body;

    try {
      // Se este endereço está sendo marcado como principal, tira o principal dos outros
      if (principal) {
        await db.query("UPDATE enderecos SET principal = FALSE WHERE usuario_id = ?", [usuario_id]);
      } else {
        // Se for o primeiro endereço do usuário, forçamos como principal
        const [existing] = await db.query("SELECT id FROM enderecos WHERE usuario_id = ?", [usuario_id]);
        if (existing.length === 0) {
          req.body.principal = true;
        }
      }

      const [result] = await db.query(
        `INSERT INTO enderecos (usuario_id, titulo, cep, bairro, rua, numero, complemento, principal) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [usuario_id, titulo, cep, bairro, rua, numero, complemento, principal || false]
      );

      const [newAddress] = await db.query("SELECT * FROM enderecos WHERE id = ?", [result.insertId]);

      return res.status(201).json({
        message: "Endereço cadastrado com sucesso!",
        address: newAddress[0]
      });

    } catch (error) {
      console.error("Erro ao cadastrar endereço:", error);
      return res.status(500).json({ error: "Erro ao cadastrar o endereço." });
    }
  },

  async updateAddress(req, res) {
    const usuario_id = req.user.id;
    const { id } = req.params;
    const { titulo, cep, bairro, rua, numero, complemento, principal } = req.body;
    try {
      // Verifica se pertence ao usuário
      const [rows] = await db.query("SELECT id FROM enderecos WHERE id = ? AND usuario_id = ?", [id, usuario_id]);
      if (rows.length === 0) return res.status(404).json({ error: "Endereço não encontrado." });

      if (principal) {
        await db.query("UPDATE enderecos SET principal = FALSE WHERE usuario_id = ?", [usuario_id]);
      }
      await db.query(
        "UPDATE enderecos SET titulo=?, cep=?, bairro=?, rua=?, numero=?, complemento=?, principal=? WHERE id=?",
        [titulo, cep, bairro, rua, numero, complemento, principal || false, id]
      );
      const [updated] = await db.query("SELECT * FROM enderecos WHERE id = ?", [id]);
      return res.status(200).json({ message: "Endereço atualizado!", address: updated[0] });
    } catch (error) {
      console.error("Erro ao atualizar endereço:", error);
      return res.status(500).json({ error: "Erro ao atualizar o endereço." });
    }
  },

  async deleteAddress(req, res) {
    const usuario_id = req.user.id;
    const { id } = req.params;
    try {
      const [rows] = await db.query("SELECT id FROM enderecos WHERE id = ? AND usuario_id = ?", [id, usuario_id]);
      if (rows.length === 0) return res.status(404).json({ error: "Endereço não encontrado." });
      await db.query("DELETE FROM enderecos WHERE id = ?", [id]);
      return res.status(200).json({ message: "Endereço removido com sucesso." });
    } catch (error) {
      console.error("Erro ao remover endereço:", error);
      return res.status(500).json({ error: "Erro ao remover o endereço." });
    }
  }
};

module.exports = addressController;
