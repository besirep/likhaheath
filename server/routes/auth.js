const router = require('express').Router();
const { login, me, changePassword } = require('../controllers/authController');
const verify = require('../middleware/auth');

router.post('/login', login);
router.get('/me', verify, me);
router.put('/change-password', verify, changePassword);

module.exports = router;
