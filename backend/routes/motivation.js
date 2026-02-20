const express = require('express');
const router = express.Router();
const { getMotivation, getAllQuotes } = require('../controllers/motivationController');

// Motivation is public (no auth required)
router.get('/', getMotivation);
router.get('/all', getAllQuotes);

module.exports = router;
