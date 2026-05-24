const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const ctrl = require('./client.controller');

const router = Router();

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);

module.exports = router;
