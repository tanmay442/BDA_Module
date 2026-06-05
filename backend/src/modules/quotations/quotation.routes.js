const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { quotationCreate, quotationUpdate } = require('../../validators/dto');
const ctrl = require('./quotation.controller');

const router = Router();

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(quotationCreate), ctrl.create);
router.patch('/:id', validate(quotationUpdate), ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/:id/pdf', ctrl.generatePdf);

module.exports = router;
