const router = require('express').Router();
const ctrl   = require('../controllers/queueController');
const verify = require('../middleware/auth');

router.get('/',          verify, ctrl.getToday);
router.get('/next',      verify, ctrl.getNext);
router.patch('/:id/status', verify, ctrl.updateStatus);
router.patch('/:id/doctor', verify, ctrl.updateDoctor);

module.exports = router;
