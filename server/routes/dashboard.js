const router = require('express').Router();
const ctrl   = require('../controllers/dashboardController');
const verify = require('../middleware/auth');

router.get('/stats',  verify, ctrl.getStats);
router.get('/recent', verify, ctrl.getRecent);

module.exports = router;
