const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');

router.post('/', favoriteController.addFavorite);
router.delete('/:produto_id', favoriteController.removeFavorite);
router.get('/', favoriteController.getFavorites);

module.exports = router;
