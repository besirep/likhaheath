const router  = require('express').Router();
const ctrl    = require('../controllers/patientController');
const verify  = require('../middleware/auth');
const { requireNotDoctor } = require('../middleware/auth');

router.get('/',           verify,                        ctrl.getAll);
router.post('/',          verify, requireNotDoctor,      ctrl.create);       // Doctors blocked
router.get('/:id',        verify,                        ctrl.getOne);
router.put('/:id',        verify,                        ctrl.update);
router.delete('/:id',     verify,                        ctrl.remove);
router.post('/:id/visit', verify, requireNotDoctor,      ctrl.createVisit);  // Doctors blocked
router.get('/:id/visits', verify,                        ctrl.getVisits);    // all visit history

module.exports = router;

