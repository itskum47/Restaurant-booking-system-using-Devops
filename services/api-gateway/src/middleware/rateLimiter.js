const rateLimit = require('express-rate-limit');
const { Counter } = require('prom-client');

// Prometheus metric for rate limit exceeded
const rateLimitExceeded = new Counter({
  name: 'rate_limit_exceeded_total',
  help: 'Total number of requests that exceeded rate limit',
  labelNames: ['ip']
});

const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    // Increment Prometheus counter
    rateLimitExceeded.inc({ ip: req.ip });
    
    console.warn(`⚠️  Rate limit exceeded for IP: ${req.ip}`);
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: 60
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks and metrics
    return req.path === '/health' || req.path === '/ready' || req.path === '/metrics';
  }
});

module.exports = rateLimiter;
