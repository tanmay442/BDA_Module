const express = require('express');
const dashboard = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

router.get('/summary', authenticate, dashboard.summary);

module.exports = router;
