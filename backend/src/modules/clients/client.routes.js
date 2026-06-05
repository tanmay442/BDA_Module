const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { clientCreate } = require('../../validators/dto');
const { authorize } = require('../../middleware/auth');
const ctrl = require('./client.controller');

const router = Router();

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', authorize('admin', 'manager'), validate(clientCreate), ctrl.create);

module.exports = router;
