const express = require('express');
const router = express.Router();
const { completeSession, getHistory } = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');

router.post('/complete', protect, completeSession);
router.get('/history', protect, getHistory);

module.exports = router;
