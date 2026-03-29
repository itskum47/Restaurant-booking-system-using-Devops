const { Pool } = require('pg');

let pool;

function createPool() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  } else {
    pool = new Pool({
      host: process.env.POSTGRES_HOST || 'postgres',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB || 'restaurant_db',
      user: process.env.POSTGRES_USER || 'admin',
      password: process.env.POSTGRES_PASSWORD || 'postgres_pass',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  pool.on('error', (err) => {
    console.error('Unexpected auth-db error:', err);
  });

  return pool;
}

function getPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

async function initializeAuthDatabase() {
  const db = getPool();

  await db.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'diner',
      avatar_url TEXT,
      dine_credits INTEGER DEFAULT 100,
      membership_tier VARCHAR(50) DEFAULT 'standard',
      total_bookings INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS credits_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_code VARCHAR(100) NOT NULL,
      amount INTEGER NOT NULL,
      note TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await db.query('CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits_transactions(user_id);');
  await db.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
}

module.exports = {
  getPool,
  initializeAuthDatabase,
};
