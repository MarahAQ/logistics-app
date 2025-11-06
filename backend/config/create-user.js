const pool = require('./database');
const bcrypt = require('bcryptjs');

async function createUser() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
      ['admin@logistics.com', hashedPassword, 'Admin User']
    );
    
    console.log('✅ User created successfully!');
    console.log('User ID:', result.rows[0].id);
    console.log('Email: admin@logistics.com');
    console.log('Password: password123');
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    pool.end();
  }
}

createUser();
