const express = require('express');
const router = express.Router();
const { getNutrition, logFood, getDailyLog, getNutritionSummary } = require('../controllers/nutritionController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNutrition);
router.post('/log', protect, logFood);
router.get('/log/today', protect, getDailyLog);
router.get('/summary', protect, getNutritionSummary);

module.exports = router;
