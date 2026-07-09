const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const verify = require('../middleware/auth');

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') return next();
  return res.status(403).json({ error: 'Admins only.' });
};

// Only Admins can view audit logs
router.get('/', verify, requireAdmin, auditController.getLogs);

module.exports = router;
