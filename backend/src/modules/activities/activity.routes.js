const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const ctrl = require('./activity.controller');

const router = Router();

router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', ctrl.create);

module.exports = router;
