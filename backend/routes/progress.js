const express = require('express');
const router = express.Router();
const { getSummary, getCharts } = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, getSummary);
router.get('/charts', protect, getCharts);

module.exports = router;
