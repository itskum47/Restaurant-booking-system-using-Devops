/**
 * Email handler for sending notifications
 * Integrates with nodemailer for real email sending
 */

const { sendBookingConfirmation, sendBookingReminder } = require('../emailService');

const EMAIL_FROM = process.env.NOTIFICATION_EMAIL_FROM || 'noreply@dine.ai';

async function sendBookingConfirmationEmail(bookingData) {
  try {
    // Extract booking details
    const email = bookingData.email ||  bookingData.guest_email;
    const guestName = bookingData.guest_name || bookingData.name || 'Guest';
    
    const booking = {
      bookingId: bookingData.booking_id || bookingData._id || bookingData.id || 'N/A',
      restaurantName: bookingData.restaurant_name || bookingData.restaurantName || 'The Restaurant',
      date: bookingData.date || new Date().toISOString().split('T')[0],
      time: bookingData.time || '7:00 PM',
      partySize: bookingData.party_size || bookingData.partySize || 1,
      location: bookingData.location || 'Manhattan, NY',
    };

    console.log('\n' + '='.repeat(70));
    console.log('📧 SENDING BOOKING CONFIRMATION EMAIL');
    console.log('='.repeat(70));
    console.log(`To: ${email}`);
    console.log(`Guest: ${guestName}`);
    console.log(`Restaurant: ${booking.restaurantName}`);
    console.log(`Booking ID: ${booking.bookingId}`);
    console.log('-'.repeat(70));

    // Send real email using emailService
    const result = await sendBookingConfirmation(email, guestName, booking);

    if (result.success) {
      console.log(`✅ Email sent successfully (Message ID: ${result.messageId})`);
    } else {
      console.log(`⚠️  Email sending failed: ${result.error}`);
    }

    console.log('='.repeat(70) + '\n');

    return {
      success: result.success,
      type: 'booking_confirmation',
      booking_id: booking.bookingId,
      email: email,
      messageId: result.messageId || null,
      error: result.error || null,
    };
  } catch (error) {
    console.error('❌ Error in sendBookingConfirmationEmail:', error);
    return {
      success: false,
      type: 'booking_confirmation',
      error: error.message,
    };
  }
}

async function sendBookingCancellationEmail(booking) {
  console.log('\n' + '='.repeat(70));
  console.log('📧 BOOKING CANCELLATION EMAIL');
  console.log('='.repeat(70));
  console.log(`Booking ID: ${booking._id || booking.id}`);
  console.log(`Restaurant: ${booking.restaurant_name}`);
  console.log(`Status: CANCELLED ❌`);
  console.log('-'.repeat(70));

  // TODO: Implement cancellation email sending

  return {
    success: true,
    type: 'booking_cancellation',
    booking_id: booking._id || booking.id
  };
}

async function sendBookingReminderEmail(booking) {
  console.log('\n' + '='.repeat(70));
  console.log('📧 BOOKING REMINDER EMAIL');
  console.log('='.repeat(70));
  console.log(`Booking ID: ${booking._id || booking.id}`);
  console.log(`Restaurant: ${booking.restaurant_name}`);
  console.log('-'.repeat(70));

  // TODO: Implement reminder email sending using sendBookingReminder from emailService

  return {
    success: true,
    type: 'booking_reminder',
    booking_id: booking._id || booking.id
  };
}

module.exports = {
  sendBookingConfirmation: sendBookingConfirmationEmail,
  sendBookingCancellation: sendBookingCancellationEmail,
  sendBookingReminder: sendBookingReminderEmail
};
