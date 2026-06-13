const router = require('express').Router();
const ctrl   = require('../controllers/queueController');
const verify = require('../middleware/auth');

router.get('/',          verify, ctrl.getToday);
router.get('/next',      verify, ctrl.getNext);
router.patch('/:id/status', verify, ctrl.updateStatus);
router.patch('/:id/doctor', verify, ctrl.updateDoctor);

router.patch('/:id/vitals', verify, ctrl.updateVitals);
router.delete('/:id', verify, ctrl.remove);

module.exports = router;
