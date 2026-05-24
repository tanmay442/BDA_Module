const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl = require('./lead.controller');

const router = Router();

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.delete('/:id', authorize('admin', 'manager'), ctrl.remove);
router.patch('/:id/stage', ctrl.stageTransition);

module.exports = router;
