const router = require('express').Router();
const ctrl   = require('../controllers/staffController');
const verify = require('../middleware/auth');

router.get('/',    verify, ctrl.getAll);
router.post('/',   verify, ctrl.create);
router.get('/:id', verify, ctrl.getOne);
router.put('/:id', verify, ctrl.update);
router.patch('/:id/status', verify, ctrl.toggleStatus);

module.exports = router;
