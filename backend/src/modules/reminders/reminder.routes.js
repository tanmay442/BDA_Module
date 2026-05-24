const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const ctrl = require('./reminder.controller');

const router = Router();
router.use(authenticate);
router.get('/', ctrl.list);

module.exports = router;
