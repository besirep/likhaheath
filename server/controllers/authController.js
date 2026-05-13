const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// POST /api/auth/login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });

  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.password_hash, u.role, u.is_active,
              u.staff_id, u.last_login,
              s.first_name, s.last_name, s.suffix, s.position
       FROM users u
       LEFT JOIN staff s ON u.staff_id = s.id
       WHERE u.username = ? AND u.is_active = 1`,
      [username]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: 'Invalid credentials.' });

    const user  = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials.' });

    // Update last_login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const suffixPart = user.suffix ? ` ${user.suffix}` : '';
    const fullName   = user.first_name
      ? `${user.first_name} ${user.last_name}${suffixPart}`
      : user.username;

    const payload = {
      id:       user.id,
      username: user.username,
      role:     user.role,
      fullName,
      staffId:  user.staff_id,
      position: user.position,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    res.json({ token, user: payload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.role, u.staff_id, u.last_login,
              s.first_name, s.last_name, s.position
       FROM users u
       LEFT JOIN staff s ON u.staff_id = s.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
