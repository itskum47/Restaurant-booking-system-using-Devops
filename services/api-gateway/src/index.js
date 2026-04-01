const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { register, collectDefaultMetrics } = require('prom-client');
const authMiddleware = require('./middleware/auth');
const requireRole = require('./middleware/requireRole');
const rateLimiter = require('./middleware/rateLimiter');
const { metricsMiddleware, customMetrics } = require('./middleware/metrics');
const { initializeAuthDatabase } = require('./db/postgres');
const authRoutes = require('./routes/auth');
const proxyRoutes = require('./routes/proxy');
const publicLlmRoutes = require('./routes/publicLlm');

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ prefix: 'api_gateway_' });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Metrics middleware (must be before routes)
app.use(metricsMiddleware);

// Health check endpoints (no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/ready', (req, res) => {
  // Check if downstream services are reachable
  const services = {
    aiService: process.env.AI_SERVICE_URL || 'http://ai-service:8001',
    restaurantService: process.env.RESTAURANT_SERVICE_URL || 'http://restaurant-service:3001',
    bookingService: process.env.BOOKING_SERVICE_URL || 'http://booking-service:8002'
  };

  res.status(200).json({
    status: 'ready',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    downstreamServices: services
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Apply rate limiting to all API routes
app.use('/api', rateLimiter);

// Auth routes (no JWT required for /register and /login)
app.use('/api/auth', authRoutes);

// Public LLM route (no JWT required)
app.use('/api/public', publicLlmRoutes);

// Apply JWT authentication to remaining API routes
app.use('/api', authMiddleware);

// Enforce owner role for owner dashboard APIs
app.use('/api/v1/dashboard', requireRole(['restaurant_owner']));

// Proxy routes to downstream services
app.use('/api', proxyRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Restaurant Booking API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      ready: '/ready',
      metrics: '/metrics',
      api: '/api/*'
    }
  });
});

// 404 handler
app.use((req, res) => {
  customMetrics.httpRequestsTotal.inc({
    method: req.method,
    route: 'not_found',
    status_code: 404
  });
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  customMetrics.httpRequestsTotal.inc({
    method: req.method,
    route: req.path,
    status_code: 500
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

let server;

async function startServer() {
  try {
    await initializeAuthDatabase();
    console.log('✅ Auth database initialized');

    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 API Gateway listening on port ${PORT}`);
      console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
      console.log(`❤️  Health check at http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start API gateway:', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
// openapi swagger
