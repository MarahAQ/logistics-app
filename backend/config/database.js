const { Pool } = require('pg');

let pool;

// Check if DATABASE_URL exists (Railway/Production)
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  console.log('Using DATABASE_URL for connection');
} else {
  // Local development
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'logistics_app',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
  });
  console.log('Using local database connection');
}

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('Database connected successfully!');
    release();
  }
});

module.exports = pool;
