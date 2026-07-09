const router = require('express').Router();
const ctrl   = require('../controllers/medicalRecordController');
const verify = require('../middleware/auth');

router.get('/',               verify, ctrl.getAll);
router.post('/',              verify, ctrl.create);
router.get('/patient/:id',    verify, ctrl.getByPatient);
router.get('/:id',            verify, ctrl.getOne);

module.exports = router;
