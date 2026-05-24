const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const ctrl = require('./quotation.controller');

const router = Router();

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/:id/pdf', ctrl.generatePdf);

module.exports = router;
