const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { leadCreate, leadUpdate, leadStageUpdate } = require('../../validators/dto');
const ctrl = require('./lead.controller');

const router = Router();

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(leadCreate), ctrl.create);
router.patch('/:id', validate(leadUpdate), ctrl.update);
router.delete('/:id', authorize('admin', 'manager'), ctrl.remove);
router.patch('/:id/stage', validate(leadStageUpdate), ctrl.stageTransition);
router.patch('/:id/assign', authorize('admin', 'manager'), ctrl.assign);

module.exports = router;
