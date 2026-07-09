const router = require('express').Router();
const { login, me, changePassword, resetPassword, verifyPassword, forgotPassword, verifyOtp } = require('../controllers/authController');
const verify = require('../middleware/auth');

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.get('/me', verify, me);
router.put('/change-password', verify, changePassword);
router.post('/verify-password', verify, verifyPassword);

module.exports = router;
