const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const { Counter } = require('prom-client');

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const redisClient = new Redis(redisUrl, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

const globalRequests = parseInt(process.env.RATE_LIMIT_GLOBAL_RPS || '200', 10);
const perUserRequests = parseInt(process.env.RATE_LIMIT_USER_RPS || '60', 10);
const burstRequests = parseInt(process.env.RATE_LIMIT_BURST_RPS || '20', 10);
const abuseThreshold = parseInt(process.env.RATE_LIMIT_ABUSE_THRESHOLD || '10', 10);
const abuseBlockSeconds = parseInt(process.env.RATE_LIMIT_ABUSE_BLOCK_SECONDS || '900', 10);

const rateLimitExceeded = new Counter({
  name: 'rate_limit_exceeded_total',
  help: 'Total number of requests blocked by rate limiting',
  labelNames: ['scope'],
});

const limiterGlobal = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl_global',
  points: globalRequests,
  duration: 1,
});

const limiterPerUser = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl_user',
  points: perUserRequests,
  duration: 1,
});

const limiterBurst = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl_burst',
  points: burstRequests,
  duration: 1,
});

function resolveClientKey(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      try {
        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.userId || decoded.sub || decoded.id;
        if (userId) {
          return `user:${userId}`;
        }
      } catch (error) {
        // Ignore and fall back to IP-based limiting.
      }
    }
  }
  return `ip:${req.ip}`;
}

async function markViolation(key) {
  const abuseKey = `abuse:${key}`;
  const blockedKey = `blocked:${key}`;

  const violations = await redisClient.incr(abuseKey);
  if (violations === 1) {
    await redisClient.expire(abuseKey, 60);
  }

  if (violations >= abuseThreshold) {
    await redisClient.set(blockedKey, '1', 'EX', abuseBlockSeconds);
    return true;
  }

  return false;
}

async function isBlocked(key) {
  const blocked = await redisClient.get(`blocked:${key}`);
  return blocked === '1';
}

async function rateLimiter(req, res, next) {
  if (req.path === '/health' || req.path === '/ready' || req.path === '/metrics') {
    return next();
  }

  const clientKey = resolveClientKey(req);

  try {
    if (await isBlocked(clientKey)) {
      rateLimitExceeded.inc({ scope: 'abuse' });
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Temporarily blocked due to abusive traffic patterns.',
        retryAfter: abuseBlockSeconds,
      });
    }

    await limiterGlobal.consume('global');
    await limiterPerUser.consume(clientKey);
    await limiterBurst.consume(`${clientKey}:burst`);

    return next();
  } catch (error) {
    const blockedNow = await markViolation(clientKey);

    if (blockedNow) {
      rateLimitExceeded.inc({ scope: 'abuse' });
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Abuse detected. Access temporarily blocked.',
        retryAfter: abuseBlockSeconds,
      });
    }

    rateLimitExceeded.inc({ scope: 'rate' });

    const retryAfter = error?.msBeforeNext
      ? Math.ceil(error.msBeforeNext / 1000)
      : 1;

    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    });
  }
}

module.exports = rateLimiter;
