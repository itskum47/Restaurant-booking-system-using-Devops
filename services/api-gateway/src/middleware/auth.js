const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dine-ai-secret-key';

const authMiddleware = (req, res, next) => {
  // Skip auth for health/metrics endpoints
  if (req.path === '/health' || req.path === '/ready' || req.path === '/metrics') {
    return next();
  }

  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    // For development, allow unauthenticated access
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  No auth token provided (development mode - allowing access)');
      return next();
    }
    
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No authorization token provided'
    });
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // For development, log error but allow access
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Invalid token (development mode - allowing access):', error.message);
      return next();
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
};

// Helper function to generate tokens (for testing)
const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

module.exports = authMiddleware;
module.exports.generateToken = generateToken;
