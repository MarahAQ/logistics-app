/**
 * Script to create test users
 * Run: node scripts/createTestUser.js
 */

const bcrypt = require("bcryptjs");
const pool = require("../config/database");  

async function createTestUsers() {
  const users = [
    {
      email: "Hammoudeh@jericho.com",
      password: "123456",
      name: "حمودة",
      role: "manager"
    },
    {
      email: "operator@jericho.com",
      password: "123456",
      name: "هالة",
      role: "operator"
    },
    {
      email: "accountant@jericho.com",
      password: "123456",
      name: "محمد",
      role: "accountant"
    }
  ];



  console.log("\n🚀 Creating test users...\n");

  for (const user of users) {
    try {
      // Check if exists
      const existing = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [user.email]
      );

      if (existing.rows.length > 0) {
        console.log(`⚠️  ${user.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(user.password, salt);

      // Insert
      const result = await pool.query(
        "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role",
        [user.email, hash, user.name, user.role]
      );

      console.log(`✅ Created: ${result.rows[0].email} (${result.rows[0].role})`);
    } catch (error) {
      console.error(`❌ Error creating ${user.email}:`, error.message);
    }
  }

  console.log("\n========================================");
  console.log("       TEST USERS CREATED");
  console.log("========================================");
  console.log("Password for all users: 123456");
  console.log("----------------------------------------");
  console.log("Manager:    Hammoudeh@jericho.com");
  console.log("Operator:   operator@jericho.com");
  console.log("Accountant: accountant@jericho.com");
  console.log("========================================\n");

  await pool.end();
  process.exit(0);
}

createTestUsers().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});