const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Módulo Auxiliar (US Extra)
router.post('/seed', productController.seedDependencies);
router.get('/menu-filters', productController.getMenuFilters);

// [CLIENTE / US06] Lista todos os produtos com suas notas olfativas, categorias e marcas
router.get('/', productController.getProducts);

// [ADMIN / US17] Adiciona um novo perfume ao catálogo e cadastra notas simultaneamente
// TODO na Sprint 4: Proteger essa rota usando authMiddleware
router.post('/', productController.createProduct);

// [CLIENTE] Rota Dinâmica Única
router.get('/:id', productController.getProductById);

module.exports = router;
