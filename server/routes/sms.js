const router = require('express').Router();
const ctrl   = require('../controllers/smsController');
const verify = require('../middleware/auth');

router.post('/send',         verify, ctrl.send);
router.get('/history',       verify, ctrl.getHistory);
router.get('/patient/:id',   verify, ctrl.getByPatient);

module.exports = router;
