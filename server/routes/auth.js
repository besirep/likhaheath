const router = require('express').Router();
const { login, me, changePassword, resetPassword } = require('../controllers/authController');
const verify = require('../middleware/auth');

router.post('/login', login);
router.post('/reset-password', resetPassword);
router.get('/me', verify, me);
router.put('/change-password', verify, changePassword);

module.exports = router;
