const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { register, collectDefaultMetrics, Counter, Histogram, Gauge } = require('prom-client');
const { initializeDatabase, getPool } = require('./db/postgres');
const restaurantRoutes = require('./routes/restaurants');

const app = express();
const PORT = process.env.RESTAURANT_SERVICE_PORT || 3001;

// Collect default metrics
collectDefaultMetrics({ prefix: 'restaurant_service_' });

// Custom metrics
const restaurantQueriesTotal = new Counter({
  name: 'restaurant_queries_total',
  help: 'Total number of restaurant queries',
  labelNames: ['query_type', 'status']
});

const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const availableTablesTotal = new Gauge({
  name: 'available_tables_total',
  help: 'Total number of available tables',
  labelNames: ['restaurant_id']
});

// Make metrics available globally
global.metrics = {
  restaurantQueriesTotal,
  dbQueryDuration,
  availableTablesTotal
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Health check endpoints
app.get('/health', async (req, res) => {
  const pool = getPool();
  let dbHealthy = false;
  
  try {
    const result = await pool.query('SELECT 1');
    dbHealthy = result.rowCount === 1;
  } catch (error) {
    console.error('Database health check failed:', error.message);
  }

  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    service: 'restaurant-service',
    database: dbHealthy ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/ready', async (req, res) => {
  const pool = getPool();
  let ready = false;
  
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM restaurants');
    ready = true;
  } catch (error) {
    console.error('Readiness check failed:', error.message);
  }

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    service: 'restaurant-service',
    timestamp: new Date().toISOString()
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Routes
app.use('/api/v1/restaurants', restaurantRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Restaurant Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      ready: '/ready',
      metrics: '/metrics',
      restaurants: '/api/v1/restaurants'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🍽️  Restaurant Service listening on port ${PORT}`);
      console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
      console.log(`❤️  Health check at http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        const pool = getPool();
        pool.end(() => {
          console.log('Database connections closed');
          process.exit(0);
        });
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
