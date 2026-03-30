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
      `SELECT u.*, 
        d.first_name AS d_first, d.last_name AS d_last,
        s.first_name AS s_first, s.last_name AS s_last
       FROM users u
       LEFT JOIN doctors       d ON u.doctor_id = d.id
       LEFT JOIN medical_staff s ON u.staff_id  = s.id
       WHERE u.username = ? AND u.is_active = 1`,
      [username]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: 'Invalid credentials.' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials.' });

    // Update last_login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const fullName = user.d_first
      ? `${user.d_first} ${user.d_last}`
      : user.s_first
      ? `${user.s_first} ${user.s_last}`
      : user.username;

    const payload = {
      id:       user.id,
      username: user.username,
      role:     user.role,
      fullName,
      doctorId: user.doctor_id,
      staffId:  user.staff_id,
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
      'SELECT id, username, role, staff_id, doctor_id, last_login FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
