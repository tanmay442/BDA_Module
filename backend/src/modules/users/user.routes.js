const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/auth');
const { sensitiveLimiter } = require('../../middleware/rateLimit');
const ctrl = require('./user.controller');

const router = Router();

router.use(authenticate);

router.get('/me', ctrl.me);
router.patch('/me/onboard', ctrl.onboard);
router.get('/', ctrl.list);
router.get('/:id', authorize('admin', 'manager'), ctrl.getById);
router.patch('/:id/role', sensitiveLimiter, authorize('admin'), ctrl.updateRole);

module.exports = router;
