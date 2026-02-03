const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");  // FIXED PATH!
const { authMiddleware, requireRole, ROLES } = require("../middleware/auth");

const router = express.Router();

// ============================================
// LOGIN
// POST /api/auth/login
// ============================================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" });
  }

  try {
    // 1. Find user
    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }

    const user = result.rows[0];

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }

    // 3. Create token (include role!)
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'operator'
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" } // 8 hours for a workday
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'operator'
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ============================================
// GET CURRENT USER
// GET /api/auth/me
// ============================================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, name, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ============================================
// REGISTER NEW USER (Manager Only)
// POST /api/auth/register
// ============================================
router.post("/register", authMiddleware, requireRole(ROLES.MANAGER), async (req, res) => {
  const { email, password, name, role } = req.body;

  // Validation
  if (!email || !password || !name) {
    return res.status(400).json({ error: "جميع الحقول مطلوبة" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
  }

  const validRoles = ['manager', 'operator', 'accountant'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ error: "الدور غير صالح" });
  }

  try {
    // Check if email exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role",
      [email.toLowerCase().trim(), passwordHash, name, role || 'operator']
    );

    res.status(201).json({
      success: true,
      message: "تم إنشاء المستخدم بنجاح",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ============================================
// CHANGE PASSWORD
// POST /api/auth/change-password
// ============================================
router.post("/change-password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "كلمة المرور الحالية والجديدة مطلوبتان" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" });
  }

  try {
    // Get current password
    const result = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // Update
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [newHash, req.user.id]
    );

    res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

module.exports = router;