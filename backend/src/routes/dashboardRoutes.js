const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// [ADMIN] Métricas do Dashboard — requer autenticação + perfil admin
router.get('/', authMiddleware, adminMiddleware, dashboardController.getMetrics);

module.exports = router;
