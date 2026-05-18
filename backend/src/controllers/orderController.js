const db = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const orderController = {

  // Listar histórico de pedidos do usuário logado
  async getMyOrders(req, res) {
    const usuario_id = req.user.id;
    try {
      const [vendas] = await db.query(`
        SELECT 
          v.id, v.numero_pedido, v.valor_total, v.forma_pagamento, v.status, v.data,
          e.rua, e.bairro, e.numero, e.cep, e.titulo AS endereco_titulo
        FROM vendas v
        LEFT JOIN enderecos e ON v.endereco_entrega_id = e.id
        WHERE v.usuario_id = ?
        ORDER BY v.data DESC
      `, [usuario_id]);

      const vendasComItens = await Promise.all(vendas.map(async (venda) => {
        const [itens] = await db.query(`
          SELECT 
            iv.quantidade, iv.preco_unitario,
            p.nome AS produto_nome,
            pv.volume_ml,
            (SELECT url FROM imagens_produto ip WHERE ip.produto_id = p.id AND ip.principal = 1 LIMIT 1) AS imagem
          FROM itens_venda iv
          JOIN produto_variacoes pv ON iv.variacao_id = pv.id
          JOIN produtos p ON pv.produto_id = p.id
          WHERE iv.venda_id = ?
        `, [venda.id]);
        return { ...venda, itens };
      }));

      return res.status(200).json(vendasComItens);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      return res.status(500).json({ error: 'Erro ao buscar histórico de pedidos.' });
    }
  },

  // Passo 1: Criar Payment Intent na Stripe e retornar o client_secret para o React
  async createPaymentIntent(req, res) {
    const usuario_id = req.user.id;

    try {
      // Busca o carrinho e os itens com o preço correto (via produto_variacoes)
      const [cartRows] = await db.query(`SELECT id FROM carrinho WHERE usuario_id = ?`, [usuario_id]);
      if (cartRows.length === 0) return res.status(400).json({ error: "Carrinho não encontrado." });
      const carrinho_id = cartRows[0].id;

      const [itens] = await db.query(`
        SELECT ic.variacao_id, ic.quantidade, pv.preco, p.nome
        FROM itens_carrinho ic
        JOIN produto_variacoes pv ON ic.variacao_id = pv.id
        JOIN produtos p ON pv.produto_id = p.id
        WHERE ic.carrinho_id = ?
      `, [carrinho_id]);

      if (itens.length === 0) return res.status(400).json({ error: "O carrinho está vazio." });

      // Calcula o total em centavos (Stripe exige centavos, sem decimais)
      let valor_total_centavos = 0;
      for (const item of itens) {
        valor_total_centavos += Math.round(Number(item.preco) * 100) * item.quantidade;
      }

      // Cria o Payment Intent na Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: valor_total_centavos,
        currency: 'brl',
        automatic_payment_methods: { enabled: true },
        metadata: { usuario_id: String(usuario_id) }
      });

      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        amount: valor_total_centavos
      });

    } catch (error) {
      console.error("Erro ao criar Payment Intent:", error);
      return res.status(500).json({ error: "Erro ao iniciar pagamento." });
    }
  },

  // Passo 2: Após confirmação da Stripe, salvar o pedido no banco
  async checkout(req, res) {
    const usuario_id = req.user.id;
    const { endereco_id, forma_pagamento, stripe_payment_id } = req.body;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Busca o carrinho
      const [cartRows] = await connection.query(`SELECT id FROM carrinho WHERE usuario_id = ?`, [usuario_id]);
      if (cartRows.length === 0) throw new Error("Carrinho não encontrado.");
      const carrinho_id = cartRows[0].id;

      // 2. Busca os itens com preço correto (via produto_variacoes - SKU)
      const [itens] = await connection.query(`
        SELECT ic.variacao_id, ic.quantidade, pv.preco, pv.estoque_qtd
        FROM itens_carrinho ic
        JOIN produto_variacoes pv ON ic.variacao_id = pv.id
        WHERE ic.carrinho_id = ?
      `, [carrinho_id]);

      if (itens.length === 0) throw new Error("O carrinho está vazio.");

      // 3. Verifica e reserva estoque
      for (const item of itens) {
        if (item.estoque_qtd < item.quantidade) {
          throw new Error("Produto sem estoque suficiente.");
        }
        await connection.query(
          `UPDATE produto_variacoes SET estoque_qtd = estoque_qtd - ? WHERE id = ?`,
          [item.quantidade, item.variacao_id]
        );
      }

      // 4. Calcula total
      let valor_total = 0;
      for (const item of itens) {
        valor_total += Number(item.preco) * item.quantidade;
      }

      // 5. Resolve o ID do endereço de entrega
      let endereco_entrega_id = endereco_id;
      if (!endereco_entrega_id) {
        // Se não veio, usa o endereço principal do usuário
        const [endReq] = await connection.query(
          `SELECT id FROM enderecos WHERE usuario_id = ? ORDER BY principal DESC, id DESC LIMIT 1`,
          [usuario_id]
        );
        if (endReq.length === 0) throw new Error("Nenhum endereço cadastrado.");
        endereco_entrega_id = endReq[0].id;
      }

      // 6. Cria a Venda
      const numero_pedido = "PED-" + Date.now().toString().slice(-6);
      const [vendaResult] = await connection.query(`
        INSERT INTO vendas (usuario_id, numero_pedido, valor_total, forma_pagamento, endereco_entrega_id, stripe_payment_id, status)
        VALUES (?, ?, ?, ?, ?, ?, 'PAGO')
      `, [usuario_id, numero_pedido, valor_total, forma_pagamento || 'CARTAO_CREDITO', endereco_entrega_id, stripe_payment_id || null]);

      const venda_id = vendaResult.insertId;

      // 7. Registra os itens da venda
      for (const item of itens) {
        await connection.query(`
          INSERT INTO itens_venda (venda_id, variacao_id, quantidade, preco_unitario)
          VALUES (?, ?, ?, ?)
        `, [venda_id, item.variacao_id, item.quantidade, item.preco]);
      }

      // 8. Esvazia o carrinho
      await connection.query(`DELETE FROM itens_carrinho WHERE carrinho_id = ?`, [carrinho_id]);

      await connection.commit();

      return res.status(201).json({
        message: "Pedido realizado com sucesso!",
        numero_pedido,
        valor_total
      });

    } catch (error) {
      await connection.rollback();
      console.error("Erro no checkout:", error);
      return res.status(400).json({ error: error.message || "Falha ao processar o checkout." });
    } finally {
      connection.release();
    }
  }
};

module.exports = orderController;
