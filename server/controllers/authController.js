const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
const { logAudit } = require('../helpers/auditLogger');
const { sendSMS } = require('../helpers/smsHelper');

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

    // Log the login event
    if (user.staff_id) {
      await logAudit(
        user.staff_id, 
        'LOGIN', 
        { username: user.username, role: user.role, ip: req.ip }, 
        req.ip
      );
    }

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

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  try {
    const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Incorrect current password.' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required.' });

  try {
    const [users] = await db.query(
      `SELECT u.id, s.contact_number 
       FROM users u 
       JOIN staff s ON u.staff_id = s.id 
       WHERE u.username = ?`, 
      [username]
    );

    if (users.length === 0) return res.status(404).json({ error: 'User not found.' });

    const user = users[0];
    if (!user.contact_number) {
      return res.status(422).json({ error: 'No contact number associated with this account. Please contact an administrator.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert OTP to DB
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, otp, expires_at) 
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
      [user.id, otp]
    );

    // Send SMS
    const message = `Your LikhaHealth password reset OTP is ${otp}. It will expire in 10 minutes. Do not share this code.`;
    await sendSMS({ phone: user.contact_number, message, patient_id: null, appointment_id: null });

    // Return masked phone number
    const masked = user.contact_number.substring(0, 4) + '****' + user.contact_number.substring(user.contact_number.length - 3);
    res.json({ message: 'OTP sent successfully', maskedPhone: masked });

  } catch (err) {
    console.error('[Auth] forgotPassword error:', err);
    res.status(500).json({ error: 'An error occurred while generating OTP.' });
  }
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  const { username, otp } = req.body;
  if (!username || !otp) return res.status(400).json({ error: 'Username and OTP are required.' });

  try {
    const [users] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found.' });
    const userId = users[0].id;

    const [tokens] = await db.query(
      `SELECT * FROM password_reset_tokens 
       WHERE user_id = ? AND otp = ? AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [userId, otp]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    // Generate temporary reset token (JWT)
    const resetToken = jwt.sign({ resetUserId: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    
    res.json({ message: 'OTP verified', resetToken });
  } catch (err) {
    console.error('[Auth] verifyOtp error:', err);
    res.status(500).json({ error: 'An error occurred while verifying OTP.' });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { newPassword, resetToken } = req.body;
  if (!newPassword || !resetToken) {
    return res.status(400).json({ error: 'New password and reset token are required.' });
  }

  try {
    // Verify reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (!decoded.resetUserId) throw new Error('Invalid token');

    const userId = decoded.resetUserId;

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    // Delete all OTPs for this user
    await db.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);

    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Reset session expired. Please request a new OTP.' });
    }
    console.error('[Auth] resetPassword error:', err);
    res.status(500).json({ error: 'An error occurred while resetting the password.' });
  }
};

// POST /api/auth/verify-password
exports.verifyPassword = async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  try {
    const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect password.' });

    res.json({ success: true, message: 'Password verified.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
