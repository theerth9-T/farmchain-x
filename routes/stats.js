const express = require('express');
const { getGlobalStats } = require('../controllers/stats');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin', 'regulator'), getGlobalStats);

module.exports = router;
