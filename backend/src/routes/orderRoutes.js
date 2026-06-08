const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Lista histórico de pedidos do usuário logado
router.get('/', orderController.getMyOrders);

// Passo 1: React pede ao backend para criar o PaymentIntent → recebe o clientSecret
router.post('/create-payment-intent', orderController.createPaymentIntent);

// Passo 2: Após Stripe aprovar, React manda salvar o pedido definitivo
router.post('/checkout', orderController.checkout);

// [ADMIN / US19] Listar todos os pedidos
router.get('/admin/all', adminMiddleware, orderController.getAllOrders);

// [ADMIN / US19] Atualizar status de um pedido
router.patch('/admin/:id/status', adminMiddleware, orderController.updateOrderStatus);

// [ADMIN] Histórico de alterações de status (auditoria)
router.get('/admin/logs', adminMiddleware, orderController.getOrderLogs);

module.exports = router;
