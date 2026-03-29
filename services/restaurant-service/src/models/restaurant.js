// Restaurant model schema (for reference)
// The actual database schema is created in db/postgres.js

module.exports = {
  // Restaurant table schema
  restaurant: {
    id: 'UUID (Primary Key)',
    name: 'VARCHAR(255) NOT NULL',
    cuisine: 'VARCHAR(100)',
    city: 'VARCHAR(100)',
    address: 'TEXT',
    rating: 'DECIMAL(2,1)',
    price_range: 'VARCHAR(10)', // $, $$, $$$, $$$$
    created_at: 'TIMESTAMP DEFAULT NOW()'
  },

  // Tables table schema
  table: {
    id: 'UUID (Primary Key)',
    restaurant_id: 'UUID (Foreign Key -> restaurants.id)',
    capacity: 'INTEGER NOT NULL',
    table_number: 'INTEGER NOT NULL'
  },

  // Availability table schema
  availability: {
    id: 'UUID (Primary Key)',
    table_id: 'UUID (Foreign Key -> tables.id)',
    date: 'DATE NOT NULL',
    time_slot: 'TIME NOT NULL',
    is_available: 'BOOLEAN DEFAULT TRUE'
  }
};
