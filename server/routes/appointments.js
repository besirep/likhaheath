const router = require('express').Router();
const ctrl   = require('../controllers/appointmentController');
const verify = require('../middleware/auth');

router.get('/today', verify, ctrl.getToday);
router.get('/',      verify, ctrl.getAll);
router.post('/',     verify, ctrl.create);
router.get('/:id',   verify, ctrl.getOne);
router.put('/:id',   verify, ctrl.update);
router.delete('/:id',verify, ctrl.remove);

module.exports = router;
