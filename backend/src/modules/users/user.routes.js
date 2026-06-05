const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl = require('./user.controller');

const router = Router();

router.use(authenticate);

router.get('/me', ctrl.me);
router.patch('/me/onboard', ctrl.onboard);
router.get('/', ctrl.list);
router.get('/:id', authorize('admin', 'manager'), ctrl.getById);
router.get('/:id/report', ctrl.report);
router.patch('/:id/role', authorize('admin'), ctrl.updateRole);

module.exports = router;
