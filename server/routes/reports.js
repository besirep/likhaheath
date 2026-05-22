const router = require('express').Router();
const ctrl   = require('../controllers/reportsController');
const verify = require('../middleware/auth');

router.get('/', verify, ctrl.getWeekly);

module.exports = router;
