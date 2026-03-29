const express = require('express');
const { createClient } = require('redis');
const { register, collectDefaultMetrics, Counter, Histogram } = require('prom-client');
const emailHandler = require('./handlers/email');

const app = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3003;

// Collect default metrics
collectDefaultMetrics({ prefix: 'notification_service_' });

// Custom metrics
const notificationsSentTotal = new Counter({
  name: 'notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['type', 'status']
});

const notificationProcessingDuration = new Histogram({
  name: 'notification_processing_duration_seconds',
  help: 'Notification processing duration in seconds',
  labelNames: ['type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
});

// Redis client
let redisClient;
let redisSubscriber;

// Middleware
app.use(express.json());

// Health check endpoints
app.get('/health', (req, res) => {
  const redisHealthy = redisClient?.isReady || false;
  
  res.status(redisHealthy ? 200 : 503).json({
    status: redisHealthy ? 'healthy' : 'unhealthy',
    service: 'notification-service',
    redis: redisHealthy ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/ready', (req, res) => {
  const ready = redisClient?.isReady || false;
  
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    service: 'notification-service',
    timestamp: new Date().toISOString()
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Webhook endpoint for AlertManager
app.post('/alerts', express.json(), (req, res) => {
  console.log('📢 Received alert from AlertManager:', JSON.stringify(req.body, null, 2));
  
  // In a real system, you would process and send alerts
  // For now, just log them
  
  notificationsSentTotal.labels('alert', 'success').inc();
  
  res.status(200).json({
    message: 'Alert received',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Notification Service',
    version: '1.0.0',
    status: 'running',
    redis_connected: redisClient?.isReady || false,
    endpoints: {
      health: '/health',
      ready: '/ready',
      metrics: '/metrics',
      alerts: '/alerts',
      'send-booking-confirmation': '/send-booking-confirmation'
    }
  });
});

// Booking confirmation endpoint
app.post('/send-booking-confirmation', express.json(), async (req, res) => {
  try {
    const { email, guest_name, booking } = req.body;
    
    if (!email || !booking) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const startTime = Date.now();
    
    // Send email using emailService
    const result = await emailHandler.sendBookingConfirmation({
      email,
      guest_name: guest_name || 'Guest',
      ...booking
    });
    
    const duration = (Date.now() - startTime) / 1000;
    notificationProcessingDuration.labels('booking_confirmation').observe(duration);
    
    if (result.success) {
      notificationsSentTotal.labels('booking_confirmation', 'success').inc();
      res.status(200).json({
        message: 'Booking confirmation email sent',
        messageId: result.messageId
      });
    } else {
      notificationsSentTotal.labels('booking_confirmation', 'error').inc();
      res.status(500).json({
        error: 'Failed to send email',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    notificationsSentTotal.labels('booking_confirmation', 'error').inc();
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Initialize Redis and start server
async function startServer() {
  const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
  
  console.log(`📦 Connecting to Redis: ${redisUrl}`);
  
  try {
    // Create Redis client for pub/sub
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Too many Redis reconnection attempts');
            return new Error('Too many retries');
          }
          return retries * 1000; // Exponential backoff
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('🔄 Redis client connecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis client ready');
    });

    await redisClient.connect();

    // Create subscriber client
    redisSubscriber = redisClient.duplicate();
    await redisSubscriber.connect();

    // Subscribe to booking events
    await redisSubscriber.subscribe('booking-events', async (message) => {
      const startTime = Date.now();
      
      try {
        const event = JSON.parse(message);
        console.log(`📨 Received event: ${event.type}`);
        
        // Handle different event types
        switch (event.type) {
          case 'booking.created':
            await emailHandler.sendBookingConfirmation(event.data);
            notificationsSentTotal.labels('booking_confirmation', 'success').inc();
            break;
            
          case 'booking.cancelled':
            await emailHandler.sendBookingCancellation(event.data);
            notificationsSentTotal.labels('booking_cancellation', 'success').inc();
            break;
            
          default:
            console.log(`⚠️  Unknown event type: ${event.type}`);
        }
        
        const duration = (Date.now() - startTime) / 1000;
        notificationProcessingDuration.labels(event.type).observe(duration);
        
      } catch (error) {
        console.error('❌ Error processing event:', error);
        notificationsSentTotal.labels('unknown', 'error').inc();
      }
    });

    console.log('✅ Subscribed to booking-events channel');

    // Start Express server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`📧 Notification Service listening on port ${PORT}`);
      console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
      console.log(`❤️  Health check at http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      
      server.close(() => {
        console.log('HTTP server closed');
      });

      if (redisSubscriber) {
        await redisSubscriber.quit();
        console.log('Redis subscriber closed');
      }

      if (redisClient) {
        await redisClient.quit();
        console.log('Redis client closed');
      }

      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
