const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Módulo Auxiliar (US Extra)
router.post('/seed', productController.seedDependencies);
router.get('/menu-filters', productController.getMenuFilters);

// [CLIENTE / US06] Lista todos os produtos com suas notas olfativas, categorias e marcas
router.get('/', productController.getProducts);

// [ADMIN / US17] Adiciona um novo perfume ao catálogo — requer autenticação + perfil admin
router.post('/', authMiddleware, adminMiddleware, productController.createProduct);

// [ADMIN / US18] Editar produto existente — requer autenticação + perfil admin
router.put('/:id', authMiddleware, adminMiddleware, productController.updateProduct);

// [CLIENTE] Rota Dinâmica Única
router.get('/:id', productController.getProductById);

module.exports = router;
