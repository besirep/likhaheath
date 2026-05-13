const router = require('express').Router();
const ctrl   = require('../controllers/patientController');
const verify = require('../middleware/auth');

router.get('/',           verify, ctrl.getAll);
router.post('/',          verify, ctrl.create);
router.get('/:id',        verify, ctrl.getOne);
router.put('/:id',        verify, ctrl.update);
router.delete('/:id',     verify, ctrl.remove);
router.post('/:id/visit', verify, ctrl.createVisit);   // queue returning patient

module.exports = router;
