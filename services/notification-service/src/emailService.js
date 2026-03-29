const nodemailer = require('nodemailer');

// Initialize nodemailer transporter
// For production, use: SendGrid, Gmail with App Password, or AWS SES
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: process.env.SMTP_PORT || 465,
  auth: {
    user: process.env.SMTP_USER || 'user',
    pass: process.env.SMTP_PASS || 'pass',
  },
});

// Beautiful HTML email template for booking confirmation
const bookingConfirmationTemplate = (booking) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0A0A0B;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #F5F0E8;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      padding: 40px 0 30px;
      border-bottom: 1px solid rgba(201,168,76,0.3);
      background: linear-gradient(135deg, rgba(201,168,76,0.05), transparent);
    }
    .logo {
      color: #C9A84C;
      font-size: 32px;
      letter-spacing: 4px;
      font-weight: 300;
      font-family: Georgia, serif;
      margin: 0;
    }
    .tagline {
      color: #9A9490;
      font-size: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 8px 0 0;
    }
    .booking-card {
      background: #18181C;
      border: 1px solid rgba(201,168,76,0.2);
      border-radius: 12px;
      padding: 32px;
      margin: 32px 0;
    }
    .restaurant-name {
      font-family: Georgia, serif;
      font-size: 28px;
      font-weight: 300;
      color: #C9A84C;
      margin: 0 0 24px;
      letter-spacing: 1px;
    }
    .booking-id {
      font-family: 'Courier New', monospace;
      color: #C9A84C;
      font-size: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 24px;
      opacity: 0.8;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    .detail-item {
      border-left: 2px solid rgba(201,168,76,0.3);
      padding-left: 16px;
    }
    .detail-label {
      color: #9A9490;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      display: block;
    }
    .detail-value {
      color: #F5F0E8;
      font-size: 16px;
      font-weight: 500;
    }
    .cta-button {
      display: block;
      background: linear-gradient(135deg, #C9A84C, #E8C97A);
      color: #0A0A0B;
      text-align: center;
      padding: 16px 32px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 24px 0;
      font-size: 13px;
      transition: all 0.3s ease;
    }
    .note {
      background: rgba(201,168,76,0.05);
      border-left: 4px solid #C9A84C;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
      font-size: 14px;
      color: #9A9490;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      color: #4A4845;
      font-size: 12px;
      margin-top: 40px;
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 24px;
    }
    .social-links {
      margin-top: 12px;
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .social-links a {
      color: #C9A84C;
      text-decoration: none;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">◆ DINE.AI</h1>
      <p class="tagline">The Intelligent Dining Concierge</p>
    </div>

    <p style="color: #F5F0E8; font-size: 16px; margin: 24px 0;">
      Hi <strong>${booking.guestName}</strong>,
    </p>

    <p style="color: #9A9490; font-size: 14px; line-height: 1.6; margin: 16px 0;">
      Your reservation is confirmed! We're excited to host you at ${booking.restaurantName}. Below are your booking details.
    </p>

    <div class="booking-card">
      <h2 class="restaurant-name">${booking.restaurantName}</h2>
      <div class="booking-id">Booking #${booking.bookingId}</div>
      
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">📅 Date</span>
          <span class="detail-value">${booking.date}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">⏰ Time</span>
          <span class="detail-value">${booking.time}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">👥 Guests</span>
          <span class="detail-value">${booking.partySize} ${booking.partySize === 1 ? 'person' : 'people'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">📍 Location</span>
          <span class="detail-value">${booking.location || 'Manhattan, NY'}</span>
        </div>
      </div>
    </div>

    <a href="${process.env.FRONTEND_URL || 'https://dine.ai'}/bookings" class="cta-button">
      View My Reservations
    </a>

    <div class="note">
      <strong>✓ Cancellation Policy:</strong> You can cancel or modify your reservation up to 24 hours before your booking. Cancellations within 24 hours may incur a charge.
    </div>

    <p style="color: #9A9490; font-size: 13px; line-height: 1.6;">
      <strong>Need to make changes?</strong> Visit your DINE.AI account or contact us directly. We're here to help ensure your dining experience is perfect.
    </p>

    <div class="footer">
      <p style="margin: 0;">© 2026 DINE.AI – The Intelligent Dining Concierge</p>
      <div class="social-links">
        <a href="https://twitter.com/dineai">Twitter</a>
        <a href="https://instagram.com/dineai">Instagram</a>
        <a href="https://dine.ai/help">Help Center</a>
      </div>
      <p style="margin: 12px 0 0; font-size: 11px;">
        You're receiving this because you made a reservation on DINE.AI
      </p>
    </div>
  </div>
</body>
</html>
`;

// Booking confirmation email
async function sendBookingConfirmation(userEmail, guestName, booking) {
  try {
    const mailOptions = {
      from: '"DINE.AI Concierge" <noreply@dine.ai>',
      to: userEmail,
      subject: `✦ Reservation Confirmed — ${booking.restaurantName}`,
      html: bookingConfirmationTemplate({
        ...booking,
        guestName,
      }),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
    return { success: false, error: error.message };
  }
}

// Booking reminder email (send 24 hours before)
const reminderTemplate = (booking) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #0A0A0B; color: #F5F0E8; font-family: sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px; }
    .header { border-bottom: 1px solid rgba(201,168,76,0.2); padding-bottom: 20px; margin-bottom: 30px; }
    .highlight { color: #C9A84C; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; color: #C9A84C;">Quick Reminder</h1>
    </div>
    <p>Hi,</p>
    <p>Your dinner at <span class="highlight">${booking.restaurantName}</span> is coming up <span class="highlight">tomorrow at ${booking.time}</span>!</p>
    <p>📋 Booking #${booking.bookingId}</p>
    <p>We can't wait to host you. If you need to make any changes, please contact us.</p>
    <p>Enjoy your evening,<br>DINE.AI Team</p>
  </div>
</body>
</html>
`;

async function sendBookingReminder(userEmail, booking) {
  try {
    const mailOptions = {
      from: '"DINE.AI Concierge" <noreply@dine.ai>',
      to: userEmail,
      subject: `⏰ Reminder: Your reservation at ${booking.restaurantName} is tomorrow!`,
      html: reminderTemplate(booking),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Reminder email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendBookingConfirmation,
  sendBookingReminder,
  transporter,
};
