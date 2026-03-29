const express = require('express');
const router = express.Router();
const { getPool } = require('../db/postgres');

// Get all restaurants with optional filters
router.get('/', async (req, res) => {
  const startTime = Date.now();
  const pool = getPool();

  try {
    const { cuisine, city, rating, available_date, price_range } = req.query;

    let query = 'SELECT * FROM restaurants WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (cuisine) {
      query += ` AND LOWER(cuisine) = LOWER($${paramCount})`;
      params.push(cuisine);
      paramCount++;
    }

    if (city) {
      query += ` AND LOWER(city) = LOWER($${paramCount})`;
      params.push(city);
      paramCount++;
    }

    if (rating) {
      query += ` AND rating >= $${paramCount}`;
      params.push(parseFloat(rating));
      paramCount++;
    }

    if (price_range) {
      query += ` AND price_range = $${paramCount}`;
      params.push(price_range);
      paramCount++;
    }

    query += ' ORDER BY rating DESC, name ASC';

    const result = await pool.query(query, params);

    // Record metrics
    const duration = (Date.now() - startTime) / 1000;
    global.metrics.restaurantQueriesTotal.labels('list', 'success').inc();
    global.metrics.dbQueryDuration.labels('select_restaurants').observe(duration);

    res.json({
      restaurants: result.rows,
      count: result.rows.length,
      filters: { cuisine, city, rating, available_date, price_range }
    });

  } catch (error) {
    console.error('Error fetching restaurants:', error);
    global.metrics.restaurantQueriesTotal.labels('list', 'error').inc();
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch restaurants'
    });
  }
});

// Get restaurant by ID
router.get('/:id', async (req, res) => {
  const startTime = Date.now();
  const pool = getPool();
  const { id } = req.params;

  try {
    // Get restaurant details
    const restaurantResult = await pool.query(
      'SELECT * FROM restaurants WHERE id = $1',
      [id]
    );

    if (restaurantResult.rows.length === 0) {
      global.metrics.restaurantQueriesTotal.labels('get', 'not_found').inc();
      return res.status(404).json({
        error: 'Not Found',
        message: 'Restaurant not found'
      });
    }

    const restaurant = restaurantResult.rows[0];

    // Get tables for this restaurant
    const tablesResult = await pool.query(
      'SELECT * FROM tables WHERE restaurant_id = $1 ORDER BY capacity, table_number',
      [id]
    );

    // Get available time slots for today and tomorrow
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const availabilityResult = await pool.query(
      `SELECT a.date, a.time_slot, t.capacity, COUNT(*) as available_count
       FROM availability a
       JOIN tables t ON a.table_id = t.id
       WHERE t.restaurant_id = $1 
         AND a.is_available = true
         AND a.date IN ($2, $3)
       GROUP BY a.date, a.time_slot, t.capacity
       ORDER BY a.date, a.time_slot, t.capacity`,
      [id, today, tomorrow]
    );

    // Record metrics
    const duration = (Date.now() - startTime) / 1000;
    global.metrics.restaurantQueriesTotal.labels('get', 'success').inc();
    global.metrics.dbQueryDuration.labels('select_restaurant_details').observe(duration);

    // Update available tables metric
    const totalAvailable = tablesResult.rows.length;
    global.metrics.availableTablesTotal.labels(id).set(totalAvailable);

    res.json({
      ...restaurant,
      tables: tablesResult.rows,
      availability: availabilityResult.rows
    });

  } catch (error) {
    console.error('Error fetching restaurant:', error);
    global.metrics.restaurantQueriesTotal.labels('get', 'error').inc();
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch restaurant details'
    });
  }
});

// Create restaurant (admin only - for demo purposes, no auth check)
router.post('/', async (req, res) => {
  const startTime = Date.now();
  const pool = getPool();

  try {
    const { name, cuisine, city, address, rating, price_range } = req.body;

    if (!name || !cuisine) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name and cuisine are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO restaurants (name, cuisine, city, address, rating, price_range)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, cuisine, city, address, rating || 0, price_range || '$$']
    );

    // Record metrics
    const duration = (Date.now() - startTime) / 1000;
    global.metrics.restaurantQueriesTotal.labels('create', 'success').inc();
    global.metrics.dbQueryDuration.labels('insert_restaurant').observe(duration);

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating restaurant:', error);
    global.metrics.restaurantQueriesTotal.labels('create', 'error').inc();
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create restaurant'
    });
  }
});

// Update restaurant availability
router.put('/:id/availability', async (req, res) => {
  const startTime = Date.now();
  const pool = getPool();
  const { id } = req.params;

  try {
    const { table_id, date, time_slot, is_available } = req.body;

    if (!table_id || !date || !time_slot || is_available === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'table_id, date, time_slot, and is_available are required'
      });
    }

    // Verify table belongs to restaurant
    const tableCheck = await pool.query(
      'SELECT * FROM tables WHERE id = $1 AND restaurant_id = $2',
      [table_id, id]
    );

    if (tableCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Table not found for this restaurant'
      });
    }

    // Update or insert availability
    const result = await pool.query(
      `INSERT INTO availability (table_id, date, time_slot, is_available)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (table_id, date, time_slot)
       DO UPDATE SET is_available = $4
       RETURNING *`,
      [table_id, date, time_slot, is_available]
    );

    // Record metrics
    const duration = (Date.now() - startTime) / 1000;
    global.metrics.restaurantQueriesTotal.labels('update_availability', 'success').inc();
    global.metrics.dbQueryDuration.labels('update_availability').observe(duration);

    res.json({
      message: 'Availability updated successfully',
      availability: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating availability:', error);
    global.metrics.restaurantQueriesTotal.labels('update_availability', 'error').inc();
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update availability'
    });
  }
});

// Get availability for specific restaurant and date
router.get('/:id/availability/:date', async (req, res) => {
  const startTime = Date.now();
  const pool = getPool();
  const { id, date } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
         a.time_slot,
         t.capacity,
         COUNT(*) FILTER (WHERE a.is_available = true) as available_count,
         COUNT(*) as total_count
       FROM availability a
       JOIN tables t ON a.table_id = t.id
       WHERE t.restaurant_id = $1 AND a.date = $2
       GROUP BY a.time_slot, t.capacity
       ORDER BY a.time_slot, t.capacity`,
      [id, date]
    );

    // Record metrics
    const duration = (Date.now() - startTime) / 1000;
    global.metrics.restaurantQueriesTotal.labels('availability', 'success').inc();
    global.metrics.dbQueryDuration.labels('select_availability').observe(duration);

    res.json({
      restaurant_id: id,
      date: date,
      slots: result.rows
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    global.metrics.restaurantQueriesTotal.labels('availability', 'error').inc();
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch availability'
    });
  }
});

module.exports = router;
