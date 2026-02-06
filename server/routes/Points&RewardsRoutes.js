const express = require('express');
const router = express.Router();
const { createRewardSystem, getAllRewardSystems } = require('../controllers/Points&RewardsController');

// If you have authentication middleware, add it here
const { authMiddleware } = require('../middleware/auth');

router.post('/create', authMiddleware, createRewardSystem);
router.get('/', getAllRewardSystems);

module.exports = router;