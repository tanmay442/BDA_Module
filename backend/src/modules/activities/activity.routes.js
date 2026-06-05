const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { activityCreate } = require('../../validators/dto');
const ctrl = require('./activity.controller');

const router = Router();

router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', validate(activityCreate), ctrl.create);

module.exports = router;
