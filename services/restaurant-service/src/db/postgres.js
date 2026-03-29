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
    console.error('Unexpected database error:', err);
  });

  return pool;
}

function getPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

async function initializeDatabase() {
  const pool = getPool();
  
  console.log('📦 Initializing database...');
  
  try {
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        cuisine VARCHAR(100),
        city VARCHAR(100),
        address TEXT,
        rating DECIMAL(2,1),
        price_range VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
        capacity INTEGER NOT NULL,
        table_number INTEGER NOT NULL,
        UNIQUE(restaurant_id, table_number)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS availability (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time_slot TIME NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        UNIQUE(table_id, date, time_slot)
      );
    `);

    console.log('✅ Tables created successfully');

    // Check if we need to seed data
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM restaurants');
    const restaurantCount = parseInt(rows[0].count);

    if (restaurantCount === 0) {
      console.log('🌱 Seeding database with sample data...');
      await seedDatabase(pool);
      console.log('✅ Database seeded successfully');
    } else {
      console.log(`ℹ️  Database already contains ${restaurantCount} restaurants`);
    }

    return pool;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

async function seedDatabase(pool) {
  const restaurants = [
    {
      name: 'Bella Italia',
      cuisine: 'Italian',
      city: 'Downtown',
      address: '123 Main Street',
      rating: 4.5,
      price_range: '$$',
      tables: [
        { capacity: 2, count: 4 },
        { capacity: 4, count: 6 },
        { capacity: 6, count: 2 }
      ]
    },
    {
      name: 'Sushi Palace',
      cuisine: 'Japanese',
      city: 'Downtown',
      address: '456 Oak Avenue',
      rating: 4.7,
      price_range: '$$$',
      tables: [
        { capacity: 2, count: 8 },
        { capacity: 4, count: 4 },
        { capacity: 6, count: 1 }
      ]
    },
    {
      name: 'Le Bistro',
      cuisine: 'French',
      city: 'Uptown',
      address: '789 Elm Street',
      rating: 4.8,
      price_range: '$$$$',
      tables: [
        { capacity: 2, count: 6 },
        { capacity: 4, count: 4 },
        { capacity: 6, count: 2 }
      ]
    },
    {
      name: 'Taco Fiesta',
      cuisine: 'Mexican',
      city: 'Midtown',
      address: '321 Pine Road',
      rating: 4.3,
      price_range: '$',
      tables: [
        { capacity: 2, count: 5 },
        { capacity: 4, count: 8 },
        { capacity: 6, count: 3 }
      ]
    },
    {
      name: 'Dragon Wok',
      cuisine: 'Chinese',
      city: 'Downtown',
      address: '654 Maple Drive',
      rating: 4.4,
      price_range: '$$',
      tables: [
        { capacity: 2, count: 4 },
        { capacity: 4, count: 6 },
        { capacity: 8, count: 2 }
      ]
    },
    {
      name: 'The Steakhouse',
      cuisine: 'American',
      city: 'Uptown',
      address: '987 Cedar Lane',
      rating: 4.6,
      price_range: '$$$',
      tables: [
        { capacity: 2, count: 3 },
        { capacity: 4, count: 5 },
        { capacity: 6, count: 2 }
      ]
    },
    {
      name: 'Spice of India',
      cuisine: 'Indian',
      city: 'Midtown',
      address: '147 Birch Avenue',
      rating: 4.5,
      price_range: '$$',
      tables: [
        { capacity: 2, count: 6 },
        { capacity: 4, count: 4 },
        { capacity: 6, count: 2 }
      ]
    },
    {
      name: 'Mediterranean Breeze',
      cuisine: 'Mediterranean',
      city: 'Downtown',
      address: '258 Willow Street',
      rating: 4.4,
      price_range: '$$',
      tables: [
        { capacity: 2, count: 5 },
        { capacity: 4, count: 5 },
        { capacity: 6, count: 2 }
      ]
    },
    {
      name: 'Thai Orchid',
      cuisine: 'Thai',
      city: 'Uptown',
      address: '369 Spruce Road',
      rating: 4.6,
      price_range: '$$',
      tables: [
        { capacity: 2, count: 4 },
        { capacity: 4, count: 6 },
        { capacity: 6, count: 1 }
      ]
    },
    {
      name: 'Seoul Kitchen',
      cuisine: 'Korean',
      city: 'Midtown',
      address: '741 Ash Boulevard',
      rating: 4.7,
      price_range: '$$',
      tables: [
        { capacity: 2, count: 4 },
        { capacity: 4, count: 5 },
        { capacity: 6, count: 2 }
      ]
    }
  ];

  for (const restaurant of restaurants) {
    // Insert restaurant
    const restaurantResult = await pool.query(
      `INSERT INTO restaurants (name, cuisine, city, address, rating, price_range)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [restaurant.name, restaurant.cuisine, restaurant.city, restaurant.address, restaurant.rating, restaurant.price_range]
    );

    const restaurantId = restaurantResult.rows[0].id;

    // Insert tables
    let tableNumber = 1;
    for (const tableConfig of restaurant.tables) {
      for (let i = 0; i < tableConfig.count; i++) {
        const tableResult = await pool.query(
          `INSERT INTO tables (restaurant_id, capacity, table_number)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [restaurantId, tableConfig.capacity, tableNumber++]
        );

        const tableId = tableResult.rows[0].id;

        // Create availability for next 14 days
        const timeSlots = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];
        
        for (let day = 0; day < 14; day++) {
          const date = new Date();
          date.setDate(date.getDate() + day);
          const dateStr = date.toISOString().split('T')[0];

          for (const timeSlot of timeSlots) {
            await pool.query(
              `INSERT INTO availability (table_id, date, time_slot, is_available)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (table_id, date, time_slot) DO NOTHING`,
              [tableId, dateStr, timeSlot, true]
            );
          }
        }
      }
    }

    console.log(`✅ Seeded restaurant: ${restaurant.name}`);
  }
}

module.exports = {
  getPool,
  initializeDatabase
};
