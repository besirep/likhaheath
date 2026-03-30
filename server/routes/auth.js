const router = require('express').Router();
const { login, me } = require('../controllers/authController');
const verify = require('../middleware/auth');

router.post('/login', login);
router.get('/me', verify, me);

module.exports = router;
