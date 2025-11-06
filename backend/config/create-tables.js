const pool = require('./database');

async function createTables() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create shipments table with the exact Arabic fields your employer requested
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        movement_date DATE NOT NULL,
        movement_type VARCHAR(100),
        customs_agent VARCHAR(255),
        client_name VARCHAR(255),
        permit_number VARCHAR(100),
        driver_name VARCHAR(255),
        vehicle_number VARCHAR(100),
        invoice_number VARCHAR(100),
        container_number VARCHAR(100),
        unloading_date DATE,
        delivery_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    pool.end();
  }
}

createTables();
