const crypto = require('crypto');

function correlationIdMiddleware(req, res, next) {
  const incoming = req.headers['x-correlation-id'];
  const correlationId = incoming && String(incoming).trim().length > 0
    ? String(incoming)
    : crypto.randomUUID();

  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  next();
}

module.exports = correlationIdMiddleware;
