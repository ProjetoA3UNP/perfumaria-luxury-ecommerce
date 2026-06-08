const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

// [PÚBLICO] Listar avaliações de um produto
router.get('/:produto_id', reviewController.getProductReviews);

// [CLIENTE / US11] Criar avaliação (requer login + ter comprado)
router.post('/', authMiddleware, reviewController.createReview);

module.exports = router;
