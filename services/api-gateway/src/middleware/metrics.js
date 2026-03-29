const { Counter, Histogram, Gauge } = require('prom-client');

// Custom Prometheus metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Middleware to collect metrics
const metricsMiddleware = (req, res, next) => {
  // Skip metrics collection for metrics endpoint itself
  if (req.path === '/metrics') {
    return next();
  }

  const start = Date.now();
  
  // Increment active connections
  activeConnections.inc();

  // Store original end function
  const originalEnd = res.end;

  // Override end function to collect metrics
  res.end = function(...args) {
    // Calculate duration
    const duration = (Date.now() - start) / 1000;

    // Normalize route for metrics (remove IDs, etc.)
    const route = normalizeRoute(req.path);

    // Record metrics
    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode
    });

    httpRequestDuration.observe({
      method: req.method,
      route: route,
      status_code: res.statusCode
    }, duration);

    // Decrement active connections
    activeConnections.dec();

    // Call original end function
    originalEnd.apply(res, args);
  };

  next();
};

// Helper function to normalize routes for metrics
function normalizeRoute(path) {
  // Replace UUIDs with :id
  path = path.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id');
  
  // Replace numeric IDs with :id
  path = path.replace(/\/\d+/g, '/:id');
  
  // Limit length
  if (path.length > 100) {
    path = path.substring(0, 100) + '...';
  }

  return path || '/';
}

module.exports = {
  metricsMiddleware,
  customMetrics: {
    httpRequestsTotal,
    httpRequestDuration,
    activeConnections
  }
};
