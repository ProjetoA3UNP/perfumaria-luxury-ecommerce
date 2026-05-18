const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const authMiddleware = require('../middlewares/authMiddleware');

// Mapeia /api/auth/register para a função register
router.post('/register', authController.register);

// Mapeia /api/auth/login para a função login
router.post('/login', authController.login);

// Mapeia /api/auth/me para buscar os dados do perfil logado
router.get('/me', authMiddleware, authController.getMe);

// Mapeia PUT /api/auth/me para atualizar dados do perfil
router.put('/me', authMiddleware, authController.updateMe);

module.exports = router;
