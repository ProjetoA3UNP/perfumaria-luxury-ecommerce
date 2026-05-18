const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middlewares/authMiddleware');

// Observe que TODAS as rotas abaixo do app.use('/api/cart') 
// exigirão passar por este authMiddleware no app.js, garantindo que o req.user exista.

// Rota de GET /api/cart
router.get('/', cartController.getCart);

// Rota de POST /api/cart/add
router.post('/add', cartController.addItem);

// Rota de DELETE /api/cart/remove/:variacao_id
router.delete('/remove/:variacao_id', cartController.removeItem);

// Rota de PUT /api/cart/update/:variacao_id (Atualização exata de quantidade)
router.put('/update/:variacao_id', cartController.updateItemQuantity);

module.exports = router;
