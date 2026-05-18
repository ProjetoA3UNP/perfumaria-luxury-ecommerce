const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Lista histórico de pedidos do usuário logado
router.get('/', orderController.getMyOrders);

// Passo 1: React pede ao backend para criar o PaymentIntent → recebe o clientSecret
router.post('/create-payment-intent', orderController.createPaymentIntent);

// Passo 2: Após Stripe aprovar, React manda salvar o pedido definitivo
router.post('/checkout', orderController.checkout);

module.exports = router;
