const jwt = require('jsonwebtoken');

/**
 * Verifies the JWT token on every protected route.
 * Attaches decoded payload to req.user = { id, username, role }.
 */
module.exports = function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, role }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Middleware: blocks users with the 'Doctor' role.
 * Must be used AFTER verifyToken so req.user is populated.
 * Returns HTTP 403 if a doctor tries to access the route.
 */
module.exports.requireNotDoctor = function requireNotDoctor(req, res, next) {
  if (req.user && req.user.role === 'Doctor') {
    return res.status(403).json({ error: 'Doctors are not authorised to register patients.' });
  }
  next();
};
